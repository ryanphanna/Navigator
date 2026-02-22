import React from 'react';
import type { SavedJob, ResumeProfile, JobAnalysis, TargetJob } from '../../types';
import { Storage } from '../../services/storageService';
import type { UserTier } from '../../types/app';
import { generateCoverLetter, generateCoverLetterWithQuality, critiqueCoverLetter } from '../../services/geminiService';
import { ANALYSIS_PROMPTS } from '../../prompts/analysis';
import { ArchetypeUtils } from '../../utils/archetypeUtils';
import {
    Loader2, Sparkles, AlertCircle, PenTool,
    Copy, Check, Users
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TRACKING_EVENTS } from '../../constants';
import { useToast } from '../../contexts/ToastContext';
import { EventService } from '../../services/eventService';
import { JobStorage } from '../../services/storage/jobStorage';
import { Card } from '../../components/ui/Card';
import { toTitleCase } from '../../utils/stringUtils';

interface CoverLetterEditorProps {
    job: SavedJob;
    analysis: JobAnalysis;
    bestResume: ResumeProfile | undefined;
    userTier: UserTier;
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
        if (!bestResume) {
            showError("Please upload a resume first.");
            return;
        }

        setGenerating(true);
        setAnalysisProgress("Generating cover letter...");
        try {
            const textToUse = analysis.cleanedDescription || localJob.description || `Role: ${toTitleCase(analysis.distilledJob.roleTitle)} at ${toTitleCase(analysis.distilledJob.companyName)} `;

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
                    trajectoryContext += ` I have completed ${completedCount} out of ${totalCount} milestones in my 12 - month professional roadmap, including ${mainGoal.roadmap?.filter(m => m.status === 'completed').map(m => m.title).join(', ')}.`;
                }
            }

            // Historical Application Pattern (Archetypes)
            const allJobs = await JobStorage.getJobs();
            const archetypes = ArchetypeUtils.calculateArchetypes(allJobs);
            if (archetypes.length > 0) {
                const archetypesContext = `My established application pattern shows I am primarily targeting: ${archetypes.map(a => a.name).join(', ')}.`;
                trajectoryContext = trajectoryContext ? `${trajectoryContext} ${archetypesContext}` : archetypesContext;
            }

            // Check eligibility for Agent Loop
            const isPro = ['pro', 'admin', 'tester'].includes(userTier);
            const canonicalTitle = analysis.distilledJob?.canonicalTitle;

            // Draft Comparison Logic: 10% chance for Pro users to see two options side-by-side
            const isComparisonTriggered = !critiqueContext && isPro && Math.random() < 0.1;

            if (isComparisonTriggered) {
                setAnalysisProgress("Generating stylistic variants...");
                const variants = Object.keys(ANALYSIS_PROMPTS.COVER_LETTER.VARIANTS).slice(0, 2); // Pick first two

                const results = await Promise.all(variants.map(v =>
                    generateCoverLetter(textToUse, bestResume, instructions || [], finalContext, v, trajectoryContext, localJob.id, canonicalTitle)
                ));

                setComparisonVersions(results);
                return;
            }

            if (isPro) {
                const result = await generateCoverLetterWithQuality(
                    textToUse,
                    bestResume,
                    instructions,
                    userTier,
                    finalContext,
                    (msg) => setAnalysisProgress(msg),
                    trajectoryContext,
                    localJob.id,
                    canonicalTitle
                );

                const updated = {
                    ...localJob,
                    coverLetter: result.text,
                    initialCoverLetter: result.text,
                    promptVersion: result.promptVersion,
                    coverLetterCritique: {
                        decision: result.decision as any,
                        feedback: [],
                        strengths: []
                    },
                };

                Storage.updateJob(updated);
                setLocalJob(updated);
                onJobUpdate(updated);
                EventService.trackUsage(TRACKING_EVENTS.COVER_LETTERS);

                console.log(`[Pro] Cover letter generated with decision: ${result.decision} (${result.attempts} attempts)`);
            } else {
                const { text: letter, promptVersion } = await generateCoverLetter(
                    textToUse,
                    bestResume,
                    instructions,
                    finalContext,
                    undefined,
                    trajectoryContext,
                    localJob.id,
                    canonicalTitle
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
                EventService.trackUsage(TRACKING_EVENTS.COVER_LETTERS);
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
            const textToUse = analysis.cleanedDescription || localJob.description || `Role: ${toTitleCase(analysis.distilledJob.roleTitle)} at ${toTitleCase(analysis.distilledJob.companyName)}`;
            const critique = await critiqueCoverLetter(textToUse, localJob.coverLetter!, localJob.id);

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
        if (!localJob.coverLetter && !generating && !localJob.coverLetterCritique && bestResume) {
            handleGenerateCoverLetter();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    if (!bestResume) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-neutral-50 dark:bg-neutral-800/20 rounded-[2.5rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-neutral-300" />
                </div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2 tracking-tight">Resume Required</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm text-center mb-10 font-medium leading-relaxed">
                    We need your resume to analyze your experience and tailor a high-impact cover letter for this specific role.
                </p>
                <button
                    onClick={() => window.location.href = '/resume'}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    Upload My Resume
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Controls */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-6 py-6 border-b border-neutral-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-neutral-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                            <PenTool className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-neutral-900 dark:text-white tracking-tight">Cover Letter Draft</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest mt-0.5">AI-tailored to this specific role</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {localJob.coverLetter && (
                            <button
                                onClick={() => handleCopy(localJob.coverLetter!)}
                                className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all flex items-center gap-2 shadow-sm active:scale-95"
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
                                className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 bg-neutral-900 dark:bg-indigo-600 text-white rounded-xl hover:bg-neutral-800 dark:hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                {generating ? (analysisProgress || 'Writing...') : localJob.coverLetter ? 'Refine Draft' : 'Generate Draft'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Safety Warning */}
                {analysis.distilledJob.isAiBanned && (
                    <div className="px-8 py-6 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl shrink-0">
                            <AlertCircle className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-900 dark:text-amber-200 mb-1">Employer AI Prohibition Detected</h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                                This job posting explicitly discourages or bans the use of AI/LLMs. Use this draft ONLY as a reference.
                            </p>
                        </div>
                    </div>
                )}

                {/* Quality Badge */}
                {localJob.coverLetter && typeof localJob.coverLetterCritique === 'object' && localJob.coverLetterCritique?.decision && (
                    <div className={`px-8 py-4 border-b dark:border-white/5 ${(localJob.coverLetterCritique.decision === 'Exceptional' || localJob.coverLetterCritique.decision === 'Strong') ? 'bg-emerald-50/50 dark:bg-emerald-500/5' :
                        localJob.coverLetterCritique.decision === 'Average' ? 'bg-blue-50/50 dark:bg-blue-500/5' :
                            'bg-amber-50/50 dark:bg-amber-500/5'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {(localJob.coverLetterCritique.decision === 'Exceptional' || localJob.coverLetterCritique.decision === 'Strong') ? (
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                )}
                                <span className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white">
                                    Candidate Match: {localJob.coverLetterCritique.decision}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Editor Area */}
                <div className="p-8 min-h-[600px] flex flex-col bg-white dark:bg-neutral-900">
                    {comparisonVersions ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 h-full">
                            {comparisonVersions.map((v, i) => (
                                <div key={i} className="flex flex-col space-y-6 p-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group relative">
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-400 shadow-sm">
                                        Style Option {i + 1}
                                    </div>
                                    <div className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 font-serif leading-relaxed line-clamp-[18]">
                                        {v.text}
                                    </div>
                                    <button
                                        onClick={() => handleSelectVariant(v)}
                                        className="w-full py-3.5 bg-neutral-900 dark:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Use This Style
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : localJob.coverLetter ? (
                        <>
                            <div
                                className="flex-1 text-neutral-800 dark:text-neutral-200 leading-relaxed font-serif text-base whitespace-pre-wrap selection:bg-indigo-100 dark:selection:bg-indigo-500/30 outline-none transition-colors border-none p-2"
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleEditCoverLetter(e.currentTarget.innerText)}
                                role="textbox"
                                aria-label="Cover Letter Content"
                                spellCheck={false}
                            >
                                {localJob.coverLetter}
                            </div>
                            <div className="mt-12 pt-8 border-t border-neutral-100 dark:border-white/5 flex justify-between items-center">
                                <div className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                                    Tailored by Navigator AI
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-20">
                            <div className="w-24 h-24 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center animate-pulse">
                                <PenTool className="w-10 h-10 text-neutral-300" />
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">Ready to Draft</h3>
                                <p className="text-neutral-500 dark:text-neutral-400 font-bold text-sm leading-relaxed">
                                    Generate an organic, narrative-driven cover letter meticulously tailored to this specific role and company.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Personal Context Section (Moved below editor) */}
            {showContextInput && (
                <Card variant="premium" className="p-8 border-indigo-500/10 animate-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-black text-neutral-900 dark:text-white flex items-center gap-2 text-sm tracking-tight uppercase tracking-widest">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            Add Personal Context
                        </h4>
                        <button onClick={() => setShowContextInput(false)} className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-indigo-500">Close</button>
                    </div>
                    <div className="space-y-6">
                        <textarea
                            className="w-full text-sm p-6 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-white/5 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-neutral-400 resize-none font-medium leading-relaxed"
                            rows={4}
                            placeholder="Add specific details (e.g. 'I used their product in 2022...', 'I'm a big fan of their mission...')"
                            value={localJob.contextNotes || ''}
                            onChange={(e) => handleUpdateContext(e.target.value)}
                            autoFocus
                        />
                        <button
                            onClick={() => {
                                handleGenerateCoverLetter();
                                setShowContextInput(false);
                            }}
                            disabled={generating}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95"
                        >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {localJob.coverLetter ? 'Refine Draft with Context' : 'Generate Draft'}
                        </button>
                    </div>
                </Card>
            )}

            {/* Blind Review Section (Moved below context) */}
            {localJob.coverLetter && (
                <Card variant="glass" className="p-8 border-neutral-200 dark:border-white/5">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="font-black text-neutral-900 dark:text-white flex items-center gap-3 text-sm tracking-tight">
                            <Users className="w-5 h-5 text-indigo-500" />
                            Blind AI Review
                        </h4>
                        {localJob.coverLetterCritique && (
                            <button
                                onClick={handleRunCritique}
                                disabled={generating}
                                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline"
                            >
                                Rerun Review
                            </button>
                        )}
                    </div>

                    {localJob.coverLetterCritique && typeof localJob.coverLetterCritique !== 'string' ? (
                        <div className="space-y-8">
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="p-6 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-100 dark:border-white/5 shadow-sm">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Hiring Decision</span>
                                    <span className={`text-2xl font-black ${((localJob.coverLetterCritique as any).decision === 'Exceptional' || (localJob.coverLetterCritique as any).decision === 'Strong') ? 'text-emerald-600 dark:text-emerald-400' :
                                        (localJob.coverLetterCritique as any).decision === 'Average' ? 'text-blue-600 dark:text-blue-400' :
                                            'text-rose-600 dark:text-rose-400'
                                        }`}>
                                        {(localJob.coverLetterCritique as any).decision}
                                    </span>
                                </div>
                                <div className="p-6 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-100 dark:border-white/5 shadow-sm">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Professionalism</span>
                                    <span className="text-2xl font-black text-neutral-900 dark:text-white">High Quality</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5" /> Performance Analysis
                                </span>
                                <div className="grid gap-3">
                                    {(localJob.coverLetterCritique as any).feedback.map((f: string, i: number) => (
                                        <div key={i} className="text-xs font-bold leading-relaxed text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-white/5 flex gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 mt-1.5 shrink-0" />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : localJob.coverLetterCritique && typeof localJob.coverLetterCritique === 'string' ? (
                        <div className="text-neutral-600 dark:text-neutral-400 text-xs leading-relaxed p-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-3xl">
                            <ReactMarkdown>{localJob.coverLetterCritique}</ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm mx-auto leading-relaxed">
                                Get an honest critique from our AI hiring persona to verify this letter before sending.
                            </p>
                            <button
                                onClick={handleRunCritique}
                                disabled={generating}
                                className="px-8 py-3.5 bg-neutral-900 dark:bg-neutral-800 text-white dark:text-neutral-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-neutral-700 transition-all shadow-lg active:scale-95"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Run Performance Review'}
                            </button>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};
