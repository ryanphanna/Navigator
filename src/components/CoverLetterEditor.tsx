import React from 'react';
import type { SavedJob, ResumeProfile, JobAnalysis, TargetJob } from '../types';
import { Storage } from '../services/storageService';
import { generateCoverLetter, generateCoverLetterWithQuality, critiqueCoverLetter } from '../services/geminiService';
import { ANALYSIS_PROMPTS } from '../prompts/analysis';
import {
    Loader2, Sparkles, AlertCircle, PenTool, ThumbsUp, ThumbsDown,
    Copy, Check, CheckCircle, Settings, Users
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../contexts/ToastContext';

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
            const textToUse = localJob.description || `Role: ${analysis.distilledJob.roleTitle} at ${analysis.distilledJob.companyName}`;

            let finalContext = localJob.contextNotes;
            let instructions = analysis.tailoringInstructions;

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

                trajectoryContext = `I am currently pursuing a career pivot/growth path towards: ${mainGoal.title}. `;
                if (totalCount > 0) {
                    trajectoryContext += `I have completed ${completedCount} out of ${totalCount} milestones in my 12-month professional roadmap, including ${mainGoal.roadmap?.filter(m => m.status === 'completed').map(m => m.title).join(', ')}.`;
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
                    generateCoverLetter(textToUse, bestResume, instructions, finalContext, v, trajectoryContext)
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
                    coverLetterCritique: { score: result.score, decision: 'unknown' as any, feedback: [], strengths: [] },
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
            const textToUse = localJob.description || `Role: ${analysis.distilledJob.roleTitle} at ${analysis.distilledJob.companyName}`;
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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="space-y-6">
                {/* Header / Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <PenTool className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Cover Letter Draft</h3>
                                <p className="text-xs text-slate-500">AI-tailored to this specific role</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {localJob.coverLetter && (
                                <button
                                    onClick={() => handleCopy(localJob.coverLetter!)}
                                    className="text-xs font-medium px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm active:scale-95"
                                >
                                    {copiedState === 'cl' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedState === 'cl' ? 'Copied' : 'Copy Text'}
                                </button>
                            )}
                            {(!localJob.coverLetter || userTier !== 'free') && (
                                <button
                                    onClick={() => handleGenerateCoverLetter()}
                                    disabled={generating}
                                    className="text-xs font-medium px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    {generating ? (analysisProgress || 'Writing...') : localJob.coverLetter ? 'Regenerate' : 'Generate Draft'}
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
                                    <div key={i} className="flex flex-col space-y-4 p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-300 hover:border-indigo-300 transition-all group relative">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                                            Style Option {i + 1}
                                        </div>
                                        <div className="flex-1 text-sm text-slate-700 font-serif leading-relaxed line-clamp-[15]">
                                            {v.text}
                                        </div>
                                        <button
                                            onClick={() => handleSelectVariant(v)}
                                            className="w-full py-2.5 bg-white border border-slate-200 text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            Use This Style
                                        </button>
                                    </div>
                                ))}
                                <div className="md:col-span-2 text-center pt-4">
                                    <p className="text-xs text-slate-400 font-medium italic">
                                        Choose the draft that best fits your personal voice.
                                    </p>
                                </div>
                            </div>
                        ) : localJob.coverLetter ? (
                            <>
                                <div
                                    className="flex-1 text-slate-800 leading-relaxed font-serif whitespace-pre-wrap selection:bg-indigo-100 selection:text-indigo-900 outline-none focus:bg-slate-50 transition-colors rounded p-4 border border-transparent focus:border-indigo-100"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleEditCoverLetter(e.currentTarget.innerText)}
                                >
                                    {localJob.coverLetter}
                                </div>
                                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <div className="text-[10px] text-slate-400 font-mono">
                                        {localJob.promptVersion ? `Model: ${localJob.promptVersion}` : 'AI Generated'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 mr-2">Rate this output:</span>
                                        <button
                                            onClick={() => { Storage.submitFeedback(localJob.id, 1, 'cover_letter'); setRated(1); }}
                                            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${rated === 1 ? 'text-green-600 bg-green-50' : 'text-slate-400'}`}
                                            disabled={!!rated}
                                        >
                                            <ThumbsUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { Storage.submitFeedback(localJob.id, -1, 'cover_letter'); setRated(-1); }}
                                            className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${rated === -1 ? 'text-red-600 bg-red-50' : 'text-slate-400'}`}
                                            disabled={!!rated}
                                        >
                                            <ThumbsDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-60">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                    <PenTool className="w-10 h-10 text-slate-300" />
                                </div>
                                <div className="max-w-md">
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Draft Yet</h3>
                                    <p className="text-slate-500 mb-6">
                                        Generate a tailored cover letter customized for {analysis.distilledJob.companyName}.
                                    </p>
                                    <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                            Additional Context (Optional)
                                        </label>
                                        <textarea
                                            className="w-full h-20 p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 resize-none"
                                            placeholder="Add specific details not in your resume (e.g. 'I used their product in 2022...')"
                                            value={localJob.contextNotes || ''}
                                            onChange={(e) => handleUpdateContext(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar - Context & Critique */}
            <div className="mt-8 xl:mt-0 xl:absolute xl:left-[102%] xl:top-0 xl:w-80 space-y-6">
                {/* Context Card */}
                {localJob.coverLetter && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 xl:sticky xl:top-6 shadow-sm">
                        <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                            <Settings className="w-3 h-3" />
                            Context & Strategy
                        </h4>
                        <textarea
                            className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 mb-4"
                            rows={4}
                            placeholder="Add context here and Regenerate..."
                            value={localJob.contextNotes || ''}
                            onChange={(e) => handleUpdateContext(e.target.value)}
                        />
                        <div className="space-y-2">
                            {analysis.tailoringInstructions.slice(0, 3).map((instruction: string, idx: number) => (
                                <div key={idx} className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                                    {instruction}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Critique Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl xl:sticky xl:top-[300px]">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                        <h4 className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-indigo-400" />
                            Hiring Manager Review
                        </h4>
                    </div>

                    <div className="p-4">
                        {localJob.coverLetterCritique ? (
                            <div className="text-sm">
                                {typeof localJob.coverLetterCritique === 'string' ? (
                                    <div className="text-slate-300 text-xs">
                                        <ReactMarkdown>{localJob.coverLetterCritique}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-slate-400">Score</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-2xl font-bold ${localJob.coverLetterCritique.score >= 80 ? 'text-green-400' : localJob.coverLetterCritique.score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                    {localJob.coverLetterCritique.score}
                                                </span>
                                                <span className="text-xs text-slate-600">/100</span>
                                            </div>
                                        </div>

                                        <div className={`text-center py-1.5 rounded text-xs font-bold uppercase tracking-wider ${localJob.coverLetterCritique.decision === 'interview' ? 'bg-green-900/30 text-green-400' :
                                            localJob.coverLetterCritique.decision === 'maybe' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'
                                            }`}>
                                            {localJob.coverLetterCritique.decision === 'interview' ? 'Interview' : localJob.coverLetterCritique.decision === 'maybe' ? 'Maybe / On File' : 'Reject'}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">Feedback</div>
                                            <ul className="space-y-2">
                                                {localJob.coverLetterCritique.feedback.slice(0, 3).map((f: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-300 flex gap-2">
                                                        <span className="text-red-400">•</span> {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-xs text-slate-500 mb-4">
                                    Get a harsh critique from our AI persona to verify this letter before sending.
                                </p>
                                <button
                                    onClick={handleRunCritique}
                                    disabled={generating || !localJob.coverLetter}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {generating ? 'Reviewing...' : 'Run Critique'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
