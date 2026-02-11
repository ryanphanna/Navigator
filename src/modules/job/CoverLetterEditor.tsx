import React from 'react';
import type { SavedJob, ResumeProfile, JobAnalysis, TargetJob } from '../../types';
import { Storage } from '../../services/storageService';
import { generateCoverLetter, generateCoverLetterWithQuality, critiqueCoverLetter } from '../../services/geminiService';
import { ANALYSIS_PROMPTS } from '../../prompts/analysis';
import {
    Loader2, Sparkles, AlertCircle, PenTool, ThumbsUp, ThumbsDown,
    Copy, Check, CheckCircle, Users
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../../contexts/ToastContext';

interface CoverLetterEditorProps {
    job: SavedJob;
    analysis: JobAnalysis;
    bestResume: ResumeProfile;
    userTier: 'free' | 'pro' | 'admin' | 'tester';
    targetJobs: TargetJob[];
    onJobUpdate: (job: SavedJob) => void;
}

export const CoverLetterEditor: React.FC<CoverLetterEditorProps> = ({
    job,
    analysis,
    bestResume,
    userTier,
    targetJobs,
    onJobUpdate
}) => {
    const [generating, setGenerating] = React.useState(false);
    const [showContextInput, setShowContextInput] = React.useState(false);

    const [copiedState, setCopiedState] = React.useState<'cl' | null>(null);
    const [rated, setRated] = React.useState<1 | -1 | null>(null);
    const [analysisProgress, setAnalysisProgress] = React.useState<string | null>(null);
    const [comparisonVersions, setComparisonVersions] = React.useState<{ text: string; promptVersion: string }[] | null>(null);
    const [localJob, setLocalJob] = React.useState(job);
    const { showError } = useToast();

    // Sync with parent when job prop changes
    React.useEffect(() => {
        setLocalJob(job);
    }, [job]);

    const handleCopy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedState('cl');
        setTimeout(() => setCopiedState(null), 2000);
    };

    const handleUpdateContext = (value: string) => {
        const updated = { ...localJob, contextNotes: value };
        setLocalJob(updated);
        Storage.updateJob(updated);
        onJobUpdate(updated);
    };

    const handleGenerateCoverLetter = async (critiqueContext?: string) => {
        setGenerating(true);
        setAnalysisProgress("Generating cover letter...");
        try {
            const textToUse = analysis.cleanedDescription || localJob.description || `Role: ${analysis.distilledJob.roleTitle} at ${analysis.distilledJob.companyName} `;

            let finalContext = localJob.contextNotes;
            let instructions = analysis.coverLetterTailoringInstructions || analysis.tailoringInstructions || [];

            if (critiqueContext) {
                finalContext = critiqueContext;
                instructions = [...instructions, "CRITIQUE_FIX"];
            } else if (localJob.contextNotes) {
                finalContext = localJob.contextNotes;
            }

            // Trajectory Context
            let trajectoryContext = '';
            if (targetJobs.length > 0) {
                const mainGoal = targetJobs[0]; // Assume first one for now, or could find best match
                const completedCount = mainGoal.roadmap?.filter(m => m.status === 'completed').length || 0;
                const totalCount = mainGoal.roadmap?.length || 0;

                trajectoryContext = `I am currently pursuing a career pivot / growth path towards: ${mainGoal.title}.`;
                if (totalCount > 0) {
                    trajectoryContext += `I have completed ${completedCount} out of ${totalCount} milestones in my 12 - month professional roadmap, including ${mainGoal.roadmap?.filter(m => m.status === 'completed').map(m => m.title).join(', ')}.`;
                }
            }

            // TODO: Check if Pro user (hardcoded to true for now)
            const isPro = true;

            // Draft Comparison Logic: 10% chance to show two options side-by-side
            const isComparisonTriggered = !critiqueContext && Math.random() < 0.1;

            if (isComparisonTriggered) {
                setAnalysisProgress("Generating stylistic variants...");
                const variants = Object.keys(ANALYSIS_PROMPTS.COVER_LETTER.VARIANTS).slice(0, 2); // Pick first two

                const results = await Promise.all(variants.map(v =>
                    generateCoverLetter(textToUse, bestResume, instructions || [], finalContext, v, trajectoryContext)
                ));

                setComparisonVersions(results);
                return;
            }

            if (isPro) {
                const result = await generateCoverLetterWithQuality(
                    textToUse,
                    bestResume,
                    instructions,
                    finalContext,
                    (msg) => setAnalysisProgress(msg),
                    trajectoryContext
                );

                const updated = {
                    ...localJob,
                    coverLetter: result.text,
                    initialCoverLetter: result.text,
                    promptVersion: result.promptVersion,
                    coverLetterCritique: { score: result.score, decision: 'maybe' as const, feedback: [], strengths: [] },
                };

                Storage.updateJob(updated);
                setLocalJob(updated);
                onJobUpdate(updated);

                console.log(`[Pro] Cover letter generated with quality score: ${result.score}/100 (${result.attempts} attempts)`);
            } else {
                const { text: letter, promptVersion } = await generateCoverLetter(
                    textToUse,
                    bestResume,
                    instructions,
                    finalContext,
                    undefined,
                    trajectoryContext
                );

                const updated = {
                    ...localJob,
                    coverLetter: letter,
                    initialCoverLetter: letter,
                    promptVersion: promptVersion,
                    coverLetterCritique: undefined
                };

                Storage.updateJob(updated);
                setLocalJob(updated);
                onJobUpdate(updated);
            }
        } catch (e) {
            console.error(e);
            showError(`Failed to generate cover letter: ${(e as Error).message}`);
        } finally {
            setGenerating(false);
            setAnalysisProgress(null);
        }
    };

    const handleSelectVariant = (variant: { text: string; promptVersion: string }) => {
        const other = comparisonVersions?.find(v => v.promptVersion !== variant.promptVersion);

        const updated = {
            ...localJob,
            coverLetter: variant.text,
            initialCoverLetter: variant.text,
            promptVersion: variant.promptVersion
        };

        Storage.updateJob(updated);
        setLocalJob(updated);
        onJobUpdate(updated);
        setComparisonVersions(null);

        // Specific A/B log
        Storage.submitFeedback(localJob.id, 1, `ab_test_pick:${variant.promptVersion}_vs_${other?.promptVersion || 'none'}`);
    };

    const handleRunCritique = async () => {
        setGenerating(true);
        try {
            const textToUse = analysis.cleanedDescription || localJob.description || `Role: ${analysis.distilledJob.roleTitle} at ${analysis.distilledJob.companyName}`;
            const critique = await critiqueCoverLetter(textToUse, localJob.coverLetter!);

            const updated = { ...localJob, coverLetterCritique: critique };
            Storage.updateJob(updated);
            setLocalJob(updated);
            onJobUpdate(updated);
        } catch (e) {
            showError("Failed to critique letter: " + (e as Error).message);
        } finally {
            setGenerating(false);
        }
    };

    const handleEditCoverLetter = (newText: string) => {
        if (newText !== localJob.coverLetter) {
            const updated = { ...localJob, coverLetter: newText };
            setLocalJob(updated);
            Storage.updateJob(updated);
            onJobUpdate(updated);
        }
    };

    // Auto-Generate on Mount if no letter exists
    React.useEffect(() => {
        if (!localJob.coverLetter && !generating && !localJob.coverLetterCritique) {
            console.log("Auto-generating cover letter draft...");
            handleGenerateCoverLetter();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Header / Controls */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <PenTool className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-neutral-900">Cover Letter Draft</h3>
                                    <p className="text-xs text-neutral-500">AI-tailored to this specific role</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {localJob.coverLetter && (
                                    <button
                                        onClick={() => handleCopy(localJob.coverLetter!)}
                                        className="text-xs font-medium px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2 shadow-sm active:scale-95"
                                    >
                                        {copiedState === 'cl' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedState === 'cl' ? 'Copied' : 'Copy Text'}
                                    </button>
                                )}
                                {(!localJob.coverLetter || userTier !== 'free') && (
                                    <button
                                        onClick={() => {
                                            if (localJob.coverLetter) {
                                                setShowContextInput(true);
                                            } else {
                                                handleGenerateCoverLetter();
                                            }
                                        }}
                                        disabled={generating}
                                        className="text-xs font-medium px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        {generating ? (analysisProgress || 'Writing...') : localJob.coverLetter ? 'Refine Draft' : 'Generate Draft'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quality Badge (Pro Feature) */}
                        {localJob.coverLetter && typeof localJob.coverLetterCritique === 'object' && localJob.coverLetterCritique?.score && (
                            <div className={`px-6 py-3 border-b ${localJob.coverLetterCritique.score >= 80 ? 'bg-green-50/50 border-green-100' :
                                localJob.coverLetterCritique.score >= 70 ? 'bg-blue-50/50 border-blue-100' :
                                    'bg-amber-50/50 border-amber-100'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {localJob.coverLetterCritique.score >= 80 ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-green-900">Interview-Ready</span>
                                            </>
                                        ) : localJob.coverLetterCritique.score >= 70 ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm font-medium text-blue-900">Strong</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 text-amber-600" />
                                                <span className="text-sm font-medium text-amber-900">Ready to Review</span>
                                            </>
                                        )}
                                    </div>
                                    {localJob.coverLetterCritique.score < 70 && (
                                        <span className="text-xs text-amber-700 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Consider reviewing carefully before sending
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Editor / Content Area */}
                        <div className="p-8 min-h-[500px] flex flex-col">
                            {comparisonVersions ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                                    {comparisonVersions.map((v, i) => (
                                        <div key={i} className="flex flex-col space-y-4 p-6 bg-neutral-50/50 rounded-xl border border-dashed border-neutral-300 hover:border-indigo-300 transition-all group relative">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white border border-neutral-200 rounded-full text-xs font-bold text-neutral-400 shadow-sm">
                                                Style Option {i + 1}
                                            </div>
                                            <div className="flex-1 text-sm text-neutral-700 font-serif leading-relaxed line-clamp-[15]">
                                                {v.text}
                                            </div>
                                            <button
                                                onClick={() => handleSelectVariant(v)}
                                                className="w-full py-2.5 bg-white border border-neutral-200 text-neutral-900 rounded-lg text-xs font-bold hover:bg-neutral-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                Use This Style
                                            </button>
                                        </div>
                                    ))}
                                    <div className="md:col-span-2 text-center pt-4">
                                        <p className="text-xs text-neutral-400 font-medium italic">
                                            Choose the draft that best fits your personal voice.
                                        </p>
                                    </div>
                                </div>
                            ) : localJob.coverLetter ? (
                                <>
                                    <div
                                        className="flex-1 text-neutral-800 leading-relaxed font-serif whitespace-pre-wrap selection:bg-indigo-100 selection:text-indigo-900 outline-none focus:bg-neutral-50 transition-colors rounded p-4 border border-transparent focus:border-indigo-100"
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleEditCoverLetter(e.currentTarget.innerText)}
                                    >
                                        {localJob.coverLetter}
                                    </div>
                                    <div className="mt-8 pt-4 border-t border-neutral-100 flex justify-between items-center">
                                        <div className="text-[10px] text-neutral-400 font-mono">
                                            Tailored by Job Fit AI
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-neutral-400 mr-2">Rate this output:</span>
                                            <button
                                                onClick={() => { Storage.submitFeedback(localJob.id, 1, 'cover_letter'); setRated(1); }}
                                                className={`p-1.5 rounded hover:bg-neutral-100 transition-colors ${rated === 1 ? 'text-green-600 bg-green-50' : 'text-neutral-400'}`}
                                                disabled={!!rated}
                                            >
                                                <ThumbsUp className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { Storage.submitFeedback(localJob.id, -1, 'cover_letter'); setRated(-1); }}
                                                className={`p-1.5 rounded hover:bg-neutral-100 transition-colors ${rated === -1 ? 'text-red-600 bg-red-50' : 'text-neutral-400'}`}
                                                disabled={!!rated}
                                            >
                                                <ThumbsDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                                    <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center">
                                        {generating ? <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /> : <PenTool className="w-10 h-10 text-neutral-300" />}
                                    </div>
                                    <div className="max-w-md">
                                        <h3 className="text-lg font-medium text-neutral-900 mb-2">{generating ? 'Writing your first draft...' : 'No Draft Yet'}</h3>
                                        <p className="text-neutral-500 mb-6">
                                            {generating ? 'Analyzing requirements and matching to your experience.' : `Generate a tailored cover letter customized for ${analysis.distilledJob.companyName}.`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6 hidden lg:block">
                    <div className="sticky top-20 space-y-6">
                        {/* Context Card */}
                        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                                <h4 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                    Refinement Strategy
                                </h4>
                            </div>

                            <div className="p-6 space-y-6">
                                {showContextInput || !localJob.coverLetter ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex justify-between">
                                                <span>Personal Context</span>
                                                {localJob.coverLetter && (
                                                    <button onClick={() => setShowContextInput(false)} className="text-indigo-600 hover:text-indigo-700">Cancel</button>
                                                )}
                                            </div>
                                            <textarea
                                                className="w-full text-xs p-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-neutral-400 resize-none font-sans leading-relaxed"
                                                rows={4}
                                                placeholder="Add specific details (e.g. 'I used their product in 2022...')"
                                                value={localJob.contextNotes || ''}
                                                onChange={(e) => handleUpdateContext(e.target.value)}
                                                autoFocus={showContextInput}
                                            />
                                        </div>

                                        <button
                                            onClick={() => {
                                                handleGenerateCoverLetter();
                                                setShowContextInput(false);
                                            }}
                                            disabled={generating}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
                                        >
                                            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                            {localJob.coverLetter ? 'Regenerate Draft' : 'Generate Draft'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">AI Comparison Logic</div>
                                            <div className="space-y-3">
                                                {(analysis.coverLetterTailoringInstructions || analysis.tailoringInstructions || [])
                                                    .slice(0, 3)
                                                    .map((instruction: string, idx: number) => (
                                                        <div key={idx} className="flex gap-3 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100 italic leading-relaxed">
                                                            <span className="font-bold text-neutral-300">•</span>
                                                            <span>{instruction.replace(/\[Block ID: .*?\]/g, '').trim()}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowContextInput(true)}
                                            className="w-full py-2.5 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-xs font-bold hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <PenTool className="w-3.5 h-3.5" />
                                            Add Personal Context
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Blind Review Card (Only visible if letter exists) */}
                        {localJob.coverLetter && (
                            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                                    <h4 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
                                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                                        Blind Review
                                    </h4>
                                </div>

                                <div className="p-6">
                                    {localJob.coverLetterCritique ? (
                                        <div className="text-sm">
                                            {typeof localJob.coverLetterCritique === 'string' ? (
                                                <div className="text-neutral-600 text-xs leading-relaxed">
                                                    <ReactMarkdown>{localJob.coverLetterCritique}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Strength Score</span>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className={`text-3xl font-black ${localJob.coverLetterCritique.score >= 80 ? 'text-emerald-600' : localJob.coverLetterCritique.score >= 60 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                                                {localJob.coverLetterCritique.score}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-neutral-400">/100</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                                            <Sparkles className="w-3 h-3 text-indigo-500" /> Improvement Tips
                                                        </div>
                                                        <ul className="space-y-2">
                                                            {localJob.coverLetterCritique.feedback.slice(0, 3).map((f: string, i: number) => (
                                                                <li key={i} className="text-[11px] leading-relaxed text-neutral-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/30 flex gap-2">
                                                                    <span className="text-amber-500 font-bold">•</span> {f}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <button
                                                        onClick={handleRunCritique}
                                                        disabled={generating}
                                                        className="w-full py-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
                                                    >
                                                        {generating ? 'Reviewing...' : 'Re-run Blind Review'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-100">
                                                <Users className="w-6 h-6 text-neutral-300" />
                                            </div>
                                            <p className="text-[11px] text-neutral-500 mb-6 leading-relaxed px-2">
                                                Get an honest critique from our AI hiring persona to verify this letter before sending.
                                            </p>
                                            <button
                                                onClick={handleRunCritique}
                                                // disabled check removed since card is hidden if no letter
                                                disabled={generating}
                                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20 active:scale-95"
                                            >
                                                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Run Blind Review'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile/Small Sidebar (Mobile Only) */}
            <div className="lg:hidden space-y-6">
                {/* Add Mobile-specific versions if needed, or simply render standard cards without sticky */}
            </div>
        </div>
    );
};
