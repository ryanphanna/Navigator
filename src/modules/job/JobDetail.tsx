import React, { useState, useEffect } from 'react';
import { Storage } from '../../services/storageService';
import { useJobDetailLogic } from './hooks/useJobDetailLogic';
import { RESUME_TAILORING } from '../../constants';
import { CoverLetterEditor } from './CoverLetterEditor';
import { motion } from 'framer-motion';
import {
    Loader2, Sparkles, XCircle,
    FileText, Copy, PenTool, ExternalLink,
    BookOpen, AlertCircle, ArrowLeft, Link as LinkIcon,
    Wand2, Target, MapPin, Hash,
    Search, ShieldCheck
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

import { useToast } from '../../contexts/ToastContext';
import { DetailHeader } from '../../components/common/DetailHeader';
import { DetailTabs, type TabItem } from '../../components/common/DetailTabs';
import { DetailLayout } from '../../components/common/DetailLayout';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { toTitleCase, toSentenceCase } from '../../utils/stringUtils';

// Types from their respective modules
import type { SavedJob } from './types';
import type { ExperienceBlock, ResumeProfile } from '../resume/types';
import type { CustomSkill } from '../skills/types';
import type { TargetJob } from '../../types/target';

interface JobDetailProps {
    job: SavedJob;
    onBack: () => void;
    onUpdateJob: (job: SavedJob) => void;
    onAnalyzeJob?: (job: SavedJob) => Promise<SavedJob>;
    userTier: 'free' | 'plus' | 'pro' | 'admin' | 'tester';
    userSkills: CustomSkill[];
    resumes: ResumeProfile[];
}

export const JobDetail: React.FC<JobDetailProps> = ({
    job,
    onBack,
    onUpdateJob,
    onAnalyzeJob,
    userTier,
    userSkills,
    resumes
}) => {
    const { showSuccess, showError } = useToast();
    const [targetJobs, setTargetJobs] = useState<TargetJob[]>([]);

    useEffect(() => {
        Storage.getTargetJobs().then(setTargetJobs);
    }, []);

    const {
        activeTab,
        setActiveTab,
        analysisProgress,
        tailoringBlockId,
        bulkTailoringProgress,
        generatingSummary,
        handleHyperTailor,
        handleBulkTailor,
        handleResetBlock,
        handleGenerateSummary,
        analysis,
        bestResume,
        manualText,
        setManualText,
        editUrl,
        setEditUrl,
        retrying,
        setRetrying,
        generating,
        setGenerating
    } = useJobDetailLogic({
        job,
        resumes,
        userSkills,
        onUpdateJob,
        showError,
        showSuccess,
        onAnalyzeJob
    });

    const handleCopyResume = async () => {
        setGenerating(true);
        try {
            const lines: string[] = [];
            lines.push(bestResume?.name || '');
            lines.push('');

            if (job.tailoredSummary) {
                lines.push('SUMMARY');
                lines.push(job.tailoredSummary);
                lines.push('');
            }

            lines.push('EXPERIENCE');
            bestResume?.blocks
                .filter((b: ExperienceBlock) => analysis?.recommendedBlockIds ? analysis.recommendedBlockIds.includes(b.id) : b.isVisible)
                .forEach((block: ExperienceBlock) => {
                    lines.push(`${block.title} | ${block.organization} | ${block.dateRange}`);
                    const bullets = job.tailoredResumes?.[block.id] || block.bullets;
                    bullets.forEach((bullet: string) => lines.push(`• ${bullet}`));
                    lines.push('');
                });

            await navigator.clipboard.writeText(lines.join('\n'));
            showSuccess('Resume copied to clipboard!');
        } catch {
            showError('Failed to copy resume');
        } finally {
            setGenerating(false);
        }
    };

    if (!job.analysis && job.status !== 'error') {
        return (
            <div className="theme-job flex flex-col items-center justify-center min-h-[80vh] px-6 relative overflow-hidden bg-white dark:bg-[#000000]">
                {/* Background ambient glows */}
                <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-accent-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent-secondary-hex/5 rounded-full blur-[120px] animate-pulse delay-1000" />

                <div className="relative w-full max-w-lg">
                    {/* Main Scanning Card Container */}
                    <Card variant="premium" className="p-8 text-center border-accent-primary/20 backdrop-blur-3xl">
                        {/* Scanning Animation Body */}
                        <div className="relative mx-auto w-32 h-40 mb-10 group">
                            {/* Document Icon Placeholder */}
                            <div className="absolute inset-0 border-2 border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col gap-2 p-3 overflow-hidden">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full" style={{ width: `${Math.random() * 40 + 60}%` }} />
                                ))}
                            </div>

                            {/* The Scanning Beam */}
                            <motion.div
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent-primary-hex to-transparent z-20 shadow-[0_0_15px_rgba(79,70,229,0.8)]"
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />

                            {/* Scanning Light Wash */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-b from-accent-primary-hex/20 to-transparent z-10"
                                animate={{ height: ["0%", "100%", "0%"], opacity: [0, 0.4, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />

                            <div className="absolute inset-0 flex items-center justify-center">
                                <Search className="w-12 h-12 text-accent-primary-hex animate-pulse" />
                            </div>
                        </div>

                        <h3 className="text-3xl font-black text-neutral-900 dark:text-white mb-3 tracking-tighter">
                            Synthesizing Analysis
                        </h3>
                        <p className="text-neutral-500 dark:text-neutral-400 font-bold text-sm mb-12 max-w-[280px] mx-auto leading-relaxed">
                            Our AI models are cross-referencing your experience with the job's core requirements.
                        </p>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end text-[10px] font-bold text-neutral-400">
                                <span className="text-accent-primary-hex animate-pulse">{job.progressMessage || analysisProgress || "Initializing engines..."}</span>
                                <span className="text-neutral-900 dark:text-white">{job.progress || 0}%</span>
                            </div>
                            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800/50 rounded-full p-1 overflow-hidden border border-neutral-200/50 dark:border-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-accent-primary-hex to-accent-secondary-hex rounded-full relative"
                                    initial={{ width: "2%" }}
                                    animate={{ width: `${Math.max(5, job.progress || 5)}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] -translate-x-full" />
                                </motion.div>
                            </div>
                        </div>
                    </Card>

                    {/* Floating Tech Badges */}
                    <div className="absolute -top-6 -right-6">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="bg-emerald-500 text-white text-[10px] font-bold px-4 py-2 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 border border-emerald-400/30"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Secure Vault Active
                        </motion.div>
                    </div>
                </div>

                <div className="mt-12">
                    <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack} className="font-bold text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                        Cancel analysis and go back
                    </Button>
                </div>
            </div >
        );
    }

    if (job.status === 'error') {
        const isExtractionError = !job.description || (job.progressMessage && (job.progressMessage.includes("blocked") || job.progressMessage.includes("extraction") || job.progressMessage.includes("Manual Input")));
        const isAiError = job.progressMessage && (job.progressMessage.includes("AI") || job.progressMessage.includes("quota") || job.progressMessage.includes("Too many"));

        const handleManualRetry = async () => {
            if (!manualText.trim()) return;
            setRetrying(true);
            try {
                const updatedJob: SavedJob = {
                    ...job,
                    status: 'analyzing',
                    description: manualText,
                    url: editUrl || job.url,
                };
                await Storage.updateJob(updatedJob);
                onUpdateJob(updatedJob);
                if (onAnalyzeJob) {
                    onAnalyzeJob(updatedJob).catch(e => {
                        showError(`Background analysis failed: ${(e as Error).message}`);
                    });
                }
            } catch (err) {
                showError(`Failed to update job: ${(err as Error).message}`);
            } finally {
                setRetrying(false);
            }
        };

        return (
            <div className="theme-job animate-in fade-in slide-in-from-right-4 duration-300 p-6 bg-white dark:bg-neutral-900 h-full overflow-y-auto">
                <div className="mb-6">
                    <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
                        Back to History
                    </Button>
                </div>

                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card variant="glass" className={`${isAiError ? 'bg-gradient-to-br from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/10 dark:to-violet-950/10 border-indigo-200 dark:border-indigo-800/30' : 'bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/10 dark:to-red-950/10 border-orange-200 dark:border-orange-800/30'} p-6 flex flex-col justify-center`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 ${isAiError ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'} rounded-xl flex items-center justify-center`}>
                                    {isAiError ? <Sparkles className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-1 tracking-tight">
                                        {isAiError ? 'AI Service Delay' : 'Manual Input Required'}
                                    </h2>
                                    <p className="text-neutral-700 dark:text-neutral-300 text-sm font-medium leading-relaxed">
                                        {job.progressMessage || (isExtractionError ? "The website blocked extraction. Please paste the job description below." : "Something went wrong. Please try again or paste details manually.")}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="p-6 flex flex-col justify-center">
                            <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-3">Job Posting URL</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    placeholder="Paste URL here..."
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:ring-4 focus:ring-accent-primary/10 focus:border-accent-primary-hex transition-all text-neutral-900 dark:text-white"
                                />
                                <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            </div>
                        </Card>
                    </div>

                    <Card variant="glass" className="p-8">
                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-4">Job Description</label>
                        <textarea
                            className="w-full h-64 p-5 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-4 focus:ring-accent-primary/10 focus:border-accent-primary-hex text-sm leading-relaxed transition-all resize-none text-neutral-900 dark:text-white font-medium"
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                            autoFocus
                            placeholder="Paste the full job description here..."
                        />
                        <div className="flex justify-between items-center pt-6">
                            <span className="text-[10px] font-bold text-neutral-400">{manualText.length} characters</span>
                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={onBack}>Cancel</Button>
                                <Button
                                    variant="accent"
                                    onClick={handleManualRetry}
                                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                                    disabled={!manualText.trim() || manualText.length < 100 || retrying}
                                    icon={retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                >
                                    {retrying ? 'Analyzing...' : 'Analyze Job Match'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    const getScoreLabel = (score?: number) => {
        if (score === undefined || score === null) return 'Analysis Needed';
        if (score >= 90) return 'Exceptional Match';
        if (score >= 80) return 'Strong Match';
        if (score >= 70) return 'Good Match';
        if (score >= 60) return 'Fair Match';
        return 'Low Match';
    };

    const tabs: TabItem[] = [
        { id: 'analysis', label: 'Analysis', icon: Sparkles },
        { id: 'resume', label: 'Resume', icon: FileText },
        { id: 'cover-letter', label: 'Cover Letter', icon: PenTool },
        { id: 'job-post', label: 'Job Posting', icon: BookOpen },
    ];

    const actionsMenu = (
        <div className="flex items-center gap-3">
            <select
                value={job.status}
                onChange={(e) => {
                    const updated = { ...job, status: e.target.value as SavedJob['status'] };
                    Storage.updateJob(updated);
                    onUpdateJob(updated);
                }}
                className="text-xs bg-neutral-50 dark:bg-neutral-800 rounded-xl px-4 py-2 font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 border-none focus:ring-4 focus:ring-accent-primary/10 transition-all cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
            </select>
            {job.url && (
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => window.open(job.url, '_blank')}
                />
            )}
        </div>
    );

    const matchSidebar = (
        <Card variant="premium" className="p-8 border-accent-primary/10 shadow-indigo-500/10">
            {job.status === 'analyzing' || analysisProgress ? (
                <div className="animate-pulse space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-1/3"></div>
                        <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded-2xl w-1/4"></div>
                    </div>
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full w-full"></div>
                    <div className="pt-6 space-y-3">
                        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-1/2"></div>
                        <div className="h-24 bg-neutral-50 dark:bg-neutral-900 rounded-3xl"></div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold text-neutral-400">Match Analysis</h3>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${(analysis?.compatibilityScore ?? -1) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-emerald-500/5' :
                            (analysis?.compatibilityScore ?? -1) >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shadow-amber-500/5' :
                                'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 shadow-rose-500/5'
                            }`}>
                            {analysisProgress ? 'Analyzing...' : getScoreLabel(analysis?.compatibilityScore)}
                        </div>
                    </div>

                    <div className="relative h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full p-0.5 border border-neutral-200/50 dark:border-white/5 mb-8">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${analysis?.compatibilityScore || 0}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-accent-primary-hex to-accent-secondary-hex relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                        </motion.div>
                    </div>

                    <div className="pt-8 border-t border-neutral-100 dark:border-neutral-800/50">
                        <h3 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 text-sm text-indigo-500 dark:text-indigo-400">
                            <Sparkles className="w-3.5 h-3.5" /> Professional Insight
                        </h3>
                        <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-bold bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-inner">
                            {toSentenceCase(analysis?.reasoning || "Analysis needed")}
                        </div>
                    </div>
                </>
            )}
        </Card>
    );

    const ResumeSidebar: React.FC = () => (
        <Card variant="premium" className="p-8 border-indigo-500/10 shadow-indigo-500/10">
            {job.status === 'analyzing' || analysisProgress ? (
                <div className="animate-pulse space-y-6">
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded-full w-1/2 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-16 bg-neutral-50 dark:bg-neutral-900 rounded-[1.5rem]"></div>
                        <div className="h-16 bg-neutral-50 dark:bg-neutral-900 rounded-[1.5rem]"></div>
                    </div>
                </div>
            ) : (
                <>
                    <h4 className="font-bold text-indigo-500 dark:text-indigo-400 mb-6 flex items-center gap-2 text-sm normal-case">
                        <Sparkles className="w-3.5 h-3.5" /> Strategic Alignment
                    </h4>
                    <div className="space-y-4">
                        {(analysis?.resumeTailoringInstructions || analysis?.tailoringInstructions || [])
                            .slice(0, 3).map((instruction: string, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex gap-4 text-sm text-neutral-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 p-6 rounded-[1.5rem] border border-neutral-100 dark:border-white/5 shadow-sm"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 mt-2 shrink-0" />
                                    <span className="text-xs font-bold leading-relaxed">{instruction}</span>
                                </motion.div>
                            ))}
                        {(!analysis?.resumeTailoringInstructions && !analysis?.tailoringInstructions) && (
                            <div className="text-xs text-neutral-500 italic py-4 text-center">No high-level strategy identified.</div>
                        )}
                    </div>
                </>
            )}
        </Card>
    );

    const ProhibitionAlert: React.FC = () => {
        if (!analysis?.distilledJob?.isAiBanned) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 flex gap-4 shadow-sm"
            >
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-amber-900 dark:text-amber-200 mb-1">AI Usage Highly Restricted</h3>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                        This job posting specifically prohibits the use of AI tools in applications.
                        {analysis?.distilledJob?.aiBanReason && (
                            <span className="block mt-2 italic opacity-80">
                                &ldquo;{analysis.distilledJob.aiBanReason}&rdquo;
                            </span>
                        )}
                    </p>
                    <div className="mt-3 flex gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/50 dark:bg-amber-900/50 px-2 py-0.5 rounded text-amber-900 dark:text-amber-200">
                            Safe Mode Active
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <SharedPageLayout className="theme-job" spacing="none" maxWidth="6xl">
            <div className="bg-white dark:bg-neutral-900 min-h-screen flex flex-col">
                <DetailHeader
                    title={
                        <div className="flex items-center gap-3">
                            <span className="text-neutral-500 dark:text-neutral-400 font-bold text-sm truncate max-w-[200px] md:max-w-md">
                                {toTitleCase(analysis?.distilledJob?.roleTitle || job.position || 'Job Detail')}
                            </span>
                        </div>
                    }
                    subtitle={
                        <div className="flex items-center flex-wrap gap-2 text-sm text-neutral-500 font-semibold">
                            <span>{toTitleCase(analysis?.distilledJob?.companyName || job.company || 'Unknown Company')}</span>
                            {analysis?.distilledJob?.location && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>{analysis.distilledJob.location}</span>
                                    </div>
                                </>
                            )}
                            {analysis?.distilledJob?.referenceCode && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                    <div className="flex items-center gap-1">
                                        <Hash className="w-3.5 h-3.5" />
                                        <span className="font-mono text-[10px] uppercase tracking-wider">{analysis.distilledJob.referenceCode}</span>
                                    </div>
                                </>
                            )}
                            {analysis?.distilledJob?.salaryRange && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{analysis.distilledJob.salaryRange}</span>
                                </>
                            )}
                        </div>
                    }
                    onBack={onBack}
                />
                <DetailTabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={(id) => setActiveTab(id as any)}
                    actions={actionsMenu}
                />

                <DetailLayout
                    sidebar={
                        activeTab === 'analysis' ? matchSidebar :
                            activeTab === 'resume' ? <ResumeSidebar /> :
                                activeTab === 'cover-letter' ? (
                                    <div className="space-y-6">
                                        {/* Strategy Card */}
                                        <Card variant="premium" className="p-8 border-indigo-500/10 shadow-indigo-500/10">
                                            <h4 className="font-bold text-indigo-500 dark:text-indigo-400 mb-6 flex items-center gap-2 text-sm normal-case">
                                                <Sparkles className="w-3.5 h-3.5" /> Refinement Strategy
                                            </h4>
                                            <div className="space-y-6">
                                                <div>
                                                    <div className="text-xs font-bold text-neutral-400 mb-3 uppercase tracking-widest">AI Comparison Logic</div>
                                                    <div className="space-y-3">
                                                        {(analysis?.coverLetterTailoringInstructions || analysis?.tailoringInstructions || [])
                                                            .slice(0, 3)
                                                            .map((instruction: string, idx: number) => (
                                                                <motion.div
                                                                    key={idx}
                                                                    initial={{ opacity: 0, x: 20 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ delay: idx * 0.1 }}
                                                                    className="flex gap-3 text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-100 dark:border-white/5 italic leading-relaxed"
                                                                >
                                                                    <span className="font-bold text-indigo-500/30">•</span>
                                                                    <span>{instruction.replace(/\[Block ID: .*?\]/g, '').trim()}</span>
                                                                </motion.div>
                                                            ))}
                                                        {(!analysis?.coverLetterTailoringInstructions && !analysis?.tailoringInstructions) && (
                                                            <div className="text-xs text-neutral-500 italic py-4 text-center">No strategy identified.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>

                                        {/* Blind Review Placeholder - Logic remains in Editor but we could move it if needed */}
                                    </div>
                                ) : null
                    }
                >
                    {(activeTab === 'analysis' || activeTab === 'resume' || activeTab === 'cover-letter') && <ProhibitionAlert />}

                    {activeTab === 'analysis' && (
                        <div className="space-y-8">
                            <div className="pb-8 border-b border-neutral-100 dark:border-white/5">
                                <h4 className="text-sm font-black text-indigo-500 dark:text-indigo-400 mb-6 flex items-center gap-2 normal-case">
                                    <Sparkles className="w-4 h-4" /> Key Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(analysis?.distilledJob?.keySkills || []).map((skill: string, i: number) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="text-xs font-bold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-accent-primary/30 transition-all cursor-default flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                                            {toTitleCase(skill)}
                                        </motion.span>
                                    ))}
                                    {(!analysis?.distilledJob?.keySkills || analysis.distilledJob.keySkills.length === 0) && (
                                        <span className="text-sm font-medium text-neutral-400 italic">No specific competencies extracted.</span>
                                    )}
                                </div>
                            </div>

                            {(analysis?.strengths?.length || 0) > 0 || (analysis?.weaknesses?.length || 0) > 0 ? (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Strengths */}
                                    <Card variant="glass" className="p-6 border-emerald-500/10 bg-emerald-500/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Core Strengths
                                        </h4>
                                        <div className="space-y-3">
                                            {analysis?.strengths?.map((s, i) => (
                                                <div key={i} className="flex gap-3 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    {/* Weaknesses */}
                                    <Card variant="glass" className="p-6 border-rose-500/10 bg-rose-500/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-3.5 h-3.5" /> Identified Gaps
                                        </h4>
                                        <div className="space-y-3">
                                            {analysis?.weaknesses?.map((w, i) => (
                                                <div key={i} className="flex gap-3 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                    <div className="w-1 h-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                                                    {w}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            ) : null}

                            {job.status === 'analyzing' || analysisProgress ? (
                                <Card variant="premium" className="p-6 animate-pulse border-accent-primary/10">
                                    <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded-full w-1/4 mb-10"></div>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="h-20 bg-neutral-50 dark:bg-neutral-800 rounded-[1.5rem]"></div>
                                        <div className="h-20 bg-neutral-50 dark:bg-neutral-800 rounded-[1.5rem]"></div>
                                    </div>
                                </Card>
                            ) : (
                                analysis?.distilledJob?.requiredSkills && analysis.distilledJob.requiredSkills.length > 0 && (
                                    <Card variant="premium" className="p-6 border-indigo-500/10 shadow-indigo-500/5">
                                        <h4 className="font-black text-indigo-500 dark:text-indigo-400 mb-6 flex items-center gap-2 text-sm normal-case">
                                            <Target className="w-4 h-4" /> Skill Match
                                        </h4>
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            {analysis.distilledJob.requiredSkills.map((req: { name: string; level: 'learning' | 'comfortable' | 'expert' }, i: number) => {
                                                const mySkill = userSkills.find(s => s.name.toLowerCase().includes(req.name.toLowerCase()));
                                                const levels: Record<string, number> = { learning: 1, comfortable: 2, expert: 3 };
                                                const isMatch = !!(mySkill && levels[mySkill.proficiency] >= levels[req.level]);
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="flex items-center justify-between p-6 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-100 dark:border-white/5 rounded-[1.5rem] shadow-sm hover:border-accent-primary/30 transition-all group"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${isMatch ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                                                                {isMatch ? <ShieldCheck className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-black text-neutral-900 dark:text-white block">{toTitleCase(req.name)}</span>
                                                                <span className="text-[9px] font-bold text-neutral-400">Required: {toTitleCase(req.level)}</span>
                                                            </div>
                                                        </div>
                                                        {mySkill && (
                                                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                                                                My Level: {toTitleCase(mySkill.proficiency)}
                                                            </span>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                ))}

                            <Card variant="glass" className="p-6 border-neutral-200/50 dark:border-white/5">
                                <h4 className="font-black text-indigo-500 dark:text-indigo-400 mb-6 flex items-center gap-2 text-sm normal-case">
                                    <BookOpen className="w-4 h-4" /> Core Responsibilities
                                </h4>
                                <div className="grid gap-4">
                                    {(analysis?.distilledJob?.coreResponsibilities || []).map((resp: string, i: number) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex gap-5 text-neutral-700 dark:text-neutral-300 text-sm font-bold leading-relaxed p-6 bg-neutral-50/50 dark:bg-neutral-800/40 rounded-[1.5rem] border border-neutral-50 dark:border-white/5"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 mt-2 shrink-0" />
                                            {toSentenceCase(resp)}
                                        </motion.div>
                                    ))}
                                    {job.status !== 'analyzing' && !analysisProgress && (!analysis?.distilledJob?.coreResponsibilities || analysis.distilledJob.coreResponsibilities.length === 0) && (
                                        <div className="text-sm font-medium text-neutral-400 italic text-center py-10">No core responsibilities extracted.</div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'job-post' && (
                        <Card variant="premium" className="p-8 border-accent-primary/10 shadow-indigo-500/5">
                            <h4 className="flex items-center gap-2 font-black text-accent-primary-hex mb-8 text-xs">
                                <FileText className="w-4 h-4" />
                                Job Description
                            </h4>
                            <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans font-medium bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                                {analysis?.cleanedDescription || job.description}
                            </div>
                        </Card>
                    )}

                    {activeTab === 'resume' && (
                        <div className="space-y-12 py-10 px-6 md:px-12 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                            {/* Tailored Summary Section */}
                            {userTier !== 'free' && (
                                <section>
                                    <div className="flex justify-between items-center mb-6 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                            <Wand2 className="w-3.5 h-3.5" /> Professional Summary
                                        </h3>
                                        <Button
                                            onClick={handleGenerateSummary}
                                            disabled={generatingSummary}
                                            variant="secondary"
                                            size="xs"
                                            className="text-[9px]"
                                            icon={generatingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        >
                                            {job.tailoredSummary ? 'Redraft' : 'Draft Tailored Summary'}
                                        </Button>
                                    </div>
                                    {job.tailoredSummary ? (
                                        <div className="relative group">
                                            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium italic border-l-2 border-indigo-500/20 pl-6 py-1">
                                                {job.tailoredSummary}
                                            </p>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(job.tailoredSummary || ''); showSuccess('Summary copied!'); }}
                                                className="mt-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-indigo-500 flex items-center gap-2 transition-all"
                                            >
                                                <Copy className="w-3 h-3" /> Copy optimized summary
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-neutral-400 italic">Generate a high-impact professional summary meticulously tailored for this role.</p>
                                    )}
                                </section>
                            )}

                            {/* Experience Section */}
                            <section>
                                <div className="flex justify-between items-center mb-8 border-b border-neutral-100 dark:border-neutral-800/50 pb-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Experience & Achievements</h3>
                                    <div className="flex items-center gap-2">
                                        {userTier !== 'free' && (
                                            <Button
                                                onClick={() => {
                                                    const blocks = bestResume?.blocks.filter((b: ExperienceBlock) => analysis?.recommendedBlockIds ? analysis.recommendedBlockIds.includes(b.id) : b.isVisible) || [];
                                                    handleBulkTailor(blocks);
                                                }}
                                                disabled={!!bulkTailoringProgress || !!tailoringBlockId}
                                                variant="secondary"
                                                size="xs"
                                                className="text-[9px]"
                                                icon={bulkTailoringProgress ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            >
                                                {bulkTailoringProgress ? `Tailoring ${bulkTailoringProgress.current}/${bulkTailoringProgress.total}` : 'Tailor All'}
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleCopyResume}
                                            disabled={generating}
                                            variant="secondary"
                                            size="xs"
                                            className="text-[9px]"
                                            icon={generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3" />}
                                        >
                                            Copy Full
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {bestResume?.blocks
                                        .filter((b: ExperienceBlock) => analysis?.recommendedBlockIds ? analysis.recommendedBlockIds.includes(b.id) : b.isVisible)
                                        .map((block: ExperienceBlock) => {
                                            const tailoredBullets = job.tailoredResumes?.[block.id];
                                            const isTailoring = tailoringBlockId === block.id;
                                            return (
                                                <div key={block.id} className="group relative">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="font-bold text-neutral-900 dark:text-white text-base tracking-tight">{block.title}</h4>
                                                            <div className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                                                                {block.organization} <span className="mx-2 text-neutral-300">•</span> {block.dateRange}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {tailoredBullets && (
                                                                <button
                                                                    onClick={() => handleResetBlock(block.id)}
                                                                    className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded-md transition-all"
                                                                    title="Reset to original"
                                                                >
                                                                    Reset
                                                                </button>
                                                            )}
                                                            {userTier !== 'free' && (
                                                                <Button
                                                                    onClick={() => handleHyperTailor(block)}
                                                                    disabled={isTailoring || !!bulkTailoringProgress || (job.tailorCounts?.[block.id] || 0) >= RESUME_TAILORING.MAX_TAILORS_PER_BLOCK}
                                                                    variant={tailoredBullets ? "secondary" : "accent"}
                                                                    size="xs"
                                                                    className="text-[9px] h-7"
                                                                    icon={isTailoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                >
                                                                    {isTailoring ? 'Rewriting' : tailoredBullets ? 'Retry' : 'Hyper-Tailor'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <ul className="space-y-3">
                                                        {(tailoredBullets || block.bullets).map((bullet: string, i: number) => (
                                                            <li
                                                                key={i}
                                                                className={`relative pl-6 text-sm leading-relaxed ${tailoredBullets ? 'text-neutral-800 dark:text-neutral-200 font-bold' : 'text-neutral-600 dark:text-neutral-400 font-medium'}`}
                                                            >
                                                                <div className={`absolute left-0 top-2 w-1.5 h-1.5 rounded-full ${tailoredBullets ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                                                                {bullet}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        })}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'cover-letter' && analysis && (
                        <CoverLetterEditor
                            job={job}
                            analysis={analysis}
                            bestResume={bestResume}
                            userTier={userTier}
                            targetJobs={targetJobs}
                            onJobUpdate={onUpdateJob}
                        />
                    )}
                </DetailLayout>
            </div>
        </SharedPageLayout>
    );
};

export default JobDetail;
