import React, { useState, useEffect } from 'react';
import { Storage } from '../../services/storageService';
import { useJobDetailLogic } from './hooks/useJobDetailLogic';
import { RESUME_TAILORING } from '../../constants';
import { CoverLetterEditor } from './CoverLetterEditor';
import { motion } from 'framer-motion';
import {
    Loader2, Sparkles, CheckCircle, XCircle,
    FileText, Copy, PenTool, ExternalLink,
    BookOpen, AlertCircle, ArrowLeft, Link as LinkIcon,
    Undo2, Wand2, Building, Target
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

import { useToast } from '../../contexts/ToastContext';
import { DetailHeader } from '../../components/common/DetailHeader';
import { DetailTabs, type TabItem } from '../../components/common/DetailTabs';
import { DetailLayout } from '../../components/common/DetailLayout';

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

    if (job.status === 'analyzing' && !job.description) {
        return (
            <div className="theme-job flex flex-col items-center justify-center h-full min-h-[60vh] animate-in fade-in duration-500 bg-white dark:bg-neutral-900">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-xl border border-accent-primary/10 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-accent-primary-hex animate-spin" />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-6 tracking-tight">Analyzing Job Match</h3>

                <div className="w-full max-w-md space-y-3 mb-8">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                        <span>{job.progressMessage || analysisProgress || "Starting analysis..."}</span>
                        <span>{job.progress || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent-primary-hex rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                            style={{ width: `${Math.max(5, job.progress || 5)}%` }}
                        >
                            <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] -translate-x-full" />
                        </div>
                    </div>
                </div>
                <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
                    Go back
                </Button>
            </div>
        );
    }

    if (!analysis || job.status === 'error') {
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
                        <Card variant="glass" className="bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-950/10 dark:to-red-950/10 border-orange-200 dark:border-orange-800/30 p-6 flex flex-col justify-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-1 tracking-tight">Manual Input Required</h2>
                                    <p className="text-neutral-700 dark:text-neutral-300 text-sm font-medium leading-relaxed">The website blocked extraction. Please paste the job description below.</p>
                                </div>
                            </div>
                        </Card>

                        <Card variant="glass" className="p-6 flex flex-col justify-center">
                            <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 mb-3">Job Posting URL</h3>
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
                        <label className="block text-sm font-black uppercase tracking-widest text-neutral-400 mb-4">Job Description</label>
                        <textarea
                            className="w-full h-64 p-5 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-4 focus:ring-accent-primary/10 focus:border-accent-primary-hex text-sm leading-relaxed transition-all resize-none text-neutral-900 dark:text-white font-medium"
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                            autoFocus
                            placeholder="Paste the full job description here..."
                        />
                        <div className="flex justify-between items-center pt-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{manualText.length} characters</span>
                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={onBack}>Cancel</Button>
                                <Button
                                    variant="accent"
                                    onClick={handleManualRetry}
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
        if (!score) return 'Analysis Needed';
        if (score >= 90) return 'Exceptional Match';
        if (score >= 80) return 'Strong Match';
        if (score >= 70) return 'Good Match';
        if (score >= 60) return 'Fair Match';
        return 'Low Match';
    };

    const tabs: TabItem[] = [
        { id: 'analysis', label: 'Analysis', icon: Sparkles },
        { id: 'resume', label: 'Tailored Resume', icon: FileText },
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
        <Card variant="glass" className="p-6">
            {job.status === 'analyzing' ? (
                <div className="animate-pulse space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3"></div>
                        <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4"></div>
                    </div>
                    <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full w-full"></div>
                    <div className="pt-4 space-y-2">
                        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2"></div>
                        <div className="h-16 bg-neutral-50 dark:bg-neutral-900 rounded"></div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Match Analysis</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${(analysis?.compatibilityScore || 0) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20' :
                            (analysis?.compatibilityScore || 0) >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20' :
                                'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20'
                            }`}>
                            {getScoreLabel(analysis?.compatibilityScore)}
                        </div>
                    </div>
                    <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-6">
                        <div
                            className="h-full rounded-full transition-all duration-1000 bg-accent-primary-hex"
                            style={{ width: `${analysis?.compatibilityScore || 0}%` }}
                        />
                    </div>
                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800/50">
                        <h3 className="font-black text-neutral-900 dark:text-white mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-accent-primary-hex">
                            <Sparkles className="w-3.5 h-3.5" /> Professional Insight
                        </h3>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl border border-neutral-100 dark:border-neutral-700">
                            {analysis?.reasoning || "Analysis needed"}
                        </p>
                    </div>
                </>
            )}
        </Card>
    );

    const ResumeSidebar: React.FC = () => (
        <Card variant="glass" className="p-6">
            {job.status === 'analyzing' ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-12 bg-neutral-50 dark:bg-neutral-900 rounded"></div>
                        <div className="h-12 bg-neutral-50 dark:bg-neutral-900 rounded"></div>
                    </div>
                </div>
            ) : (
                <>
                    <h4 className="font-black text-accent-primary-hex mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" /> Tailoring Strategy
                    </h4>
                    <div className="space-y-3">
                        {(analysis?.resumeTailoringInstructions || analysis?.tailoringInstructions || [])
                            .slice(0, 3).map((instruction: string, idx: number) => (
                                <div key={idx} className="flex gap-3 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl border border-neutral-100 dark:border-neutral-700">
                                    <span className="font-black text-neutral-400 text-[10px] mt-0.5">0{idx + 1}</span>
                                    <span className="text-xs font-semibold">{instruction}</span>
                                </div>
                            ))}
                        {(!analysis?.resumeTailoringInstructions && !analysis?.tailoringInstructions) && (
                            <div className="text-xs text-neutral-500 italic">No specific tailoring instructions available.</div>
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
                        {analysis.distilledJob.aiBanReason && (
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
        <div className="theme-job bg-white dark:bg-neutral-900 h-full flex flex-col">
            <DetailHeader
                title={analysis?.distilledJob?.roleTitle || job.position || 'Job Detail'}
                subtitle={`${analysis?.distilledJob?.companyName || job.company || 'Unknown Company'}`}
                onBack={onBack}
                actions={actionsMenu}
                icon={Building}
            />
            <DetailTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as any)}
            />

            <DetailLayout
                sidebar={activeTab === 'analysis' ? matchSidebar : activeTab === 'resume' ? <ResumeSidebar /> : null}
            >
                {(activeTab === 'analysis' || activeTab === 'resume') && <ProhibitionAlert />}
                {activeTab === 'analysis' && (
                    <div className="space-y-6">
                        <Card variant="glass" className="p-8">
                            {job.status === 'analyzing' ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4 mb-6"></div>
                                    <div className="flex gap-2">
                                        <div className="h-8 bg-neutral-50 dark:bg-neutral-800 rounded w-24"></div>
                                        <div className="h-8 bg-neutral-50 dark:bg-neutral-800 rounded w-32"></div>
                                    </div>
                                    <div className="mt-8 flex flex-col items-center justify-center py-6 gap-3">
                                        <div className="w-full max-w-[240px] space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-accent-primary-hex">
                                                <span>{job.progressMessage || "Analyzing..."}</span>
                                                <span>{job.progress || 0}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-accent-primary/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-primary-hex rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                                                    style={{ width: `${Math.max(5, job.progress || 5)}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] -translate-x-full" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-accent-primary-hex mb-6 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Key Competencies
                                    </h4>
                                    <div className="flex flex-wrap gap-2.5">
                                        {(analysis?.distilledJob?.keySkills || []).map((skill: string, i: number) => (
                                            <span key={i} className="text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 px-4 py-2 rounded-xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Card>

                        {job.status === 'analyzing' ? (
                            <Card variant="glass" className="p-8 animate-pulse">
                                <div className="h-5 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4 mb-6"></div>
                                <div className="space-y-3">
                                    <div className="h-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl"></div>
                                    <div className="h-12 bg-neutral-50 dark:bg-neutral-800 rounded-xl"></div>
                                </div>
                            </Card>
                        ) : (
                            analysis?.distilledJob?.requiredSkills && analysis.distilledJob.requiredSkills.length > 0 && (
                                <Card variant="glass" className="p-8">
                                    <h4 className="font-black text-accent-primary-hex mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                                        <Target className="w-4 h-4" /> Priority Skill Gaps
                                    </h4>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {analysis.distilledJob.requiredSkills.map((req: { name: string; level: 'learning' | 'comfortable' | 'expert' }, i: number) => {
                                            const mySkill = userSkills.find(s => s.name.toLowerCase().includes(req.name.toLowerCase()));
                                            const levels: Record<string, number> = { learning: 1, comfortable: 2, expert: 3 };
                                            const isMatch = mySkill && levels[mySkill.proficiency] >= levels[req.level];
                                            return (
                                                <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 rounded-2xl shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl ${isMatch ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                                                            {isMatch ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        </div>
                                                        <span className="text-sm font-black text-neutral-900 dark:text-white">{req.name}</span>
                                                    </div>
                                                    {mySkill && <span className="text-[10px] font-black uppercase text-accent-primary-hex bg-accent-primary/5 px-2 py-0.5 rounded-lg">{mySkill.proficiency}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            ))}

                        <Card variant="glass" className="p-8">
                            <h4 className="font-black text-accent-primary-hex mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                                <BookOpen className="w-4 h-4" /> Core Responsibilities
                            </h4>
                            <ul className="space-y-4">
                                {(analysis?.distilledJob?.coreResponsibilities || []).map((resp: string, i: number) => (
                                    <li key={i} className="flex gap-4 text-neutral-700 dark:text-neutral-300 text-sm font-medium leading-relaxed">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary/30 mt-2 shrink-0" />
                                        {resp}
                                    </li>
                                ))}
                                {job.status === 'analyzing' && (
                                    <li className="animate-pulse flex gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 mt-2 shrink-0" />
                                        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4"></div>
                                    </li>
                                )}
                            </ul>
                        </Card>
                    </div>
                )}

                {activeTab === 'job-post' && (
                    <Card variant="glass" className="p-8">
                        <h4 className="flex items-center gap-2 font-black text-accent-primary-hex mb-8 uppercase text-[10px] tracking-widest">
                            <FileText className="w-4 h-4" />
                            {analysis?.cleanedDescription ? 'Job Description (AI Cleaned)' : 'Original Job Post'}
                        </h4>
                        <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans font-medium bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                            {analysis?.cleanedDescription || job.description}
                        </div>
                    </Card>
                )}

                {activeTab === 'resume' && (
                    <div className="space-y-6">
                        {/* Tailored Summary Section */}
                        {userTier !== 'free' && (
                            <Card variant="glass" className="overflow-hidden">
                                <div className="border-b border-neutral-100 dark:border-neutral-800/50 p-6 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/30">
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="w-4 h-4 text-indigo-500" />
                                        <h3 className="font-black text-neutral-900 dark:text-white text-[10px] uppercase tracking-widest">Tailored Summary</h3>
                                    </div>
                                    <Button
                                        onClick={handleGenerateSummary}
                                        disabled={generatingSummary}
                                        variant="accent"
                                        size="xs"
                                        icon={generatingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    >
                                        {job.tailoredSummary ? 'Regenerate' : 'Generate Summary'}
                                    </Button>
                                </div>
                                {job.tailoredSummary ? (
                                    <div className="p-8">
                                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">{job.tailoredSummary}</p>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(job.tailoredSummary || ''); showSuccess('Summary copied!'); }}
                                            className="mt-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-accent-primary-hex flex items-center gap-2 transition-all"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> Copy Summary
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-8">
                                        <p className="text-xs text-neutral-500 italic">Generate a professional summary tailored to this specific role.</p>
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Experience Blocks */}
                        <Card variant="glass" className="overflow-hidden">
                            <div className="border-b border-neutral-100 dark:border-neutral-800/50 p-6 flex flex-col sm:flex-row justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/30 gap-4">
                                <h3 className="font-black text-neutral-900 dark:text-white text-[10px] uppercase tracking-widest">Experience Blocks</h3>
                                <div className="flex items-center gap-3">
                                    {userTier !== 'free' && (
                                        <Button
                                            onClick={() => {
                                                const blocks = bestResume?.blocks.filter((b: ExperienceBlock) => analysis?.recommendedBlockIds ? analysis.recommendedBlockIds.includes(b.id) : b.isVisible) || [];
                                                handleBulkTailor(blocks);
                                            }}
                                            disabled={!!bulkTailoringProgress || !!tailoringBlockId}
                                            variant="secondary"
                                            size="sm"
                                            icon={bulkTailoringProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        >
                                            {bulkTailoringProgress ? `Tailoring ${bulkTailoringProgress.current}/${bulkTailoringProgress.total}` : 'Tailor All'}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleCopyResume}
                                        disabled={generating}
                                        variant="accent"
                                        size="sm"
                                        icon={generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                                    >
                                        {generating ? 'Processing...' : 'Copy Full Resume'}
                                    </Button>
                                </div>
                            </div>
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                                {bestResume?.blocks
                                    .filter((b: ExperienceBlock) => analysis?.recommendedBlockIds ? analysis.recommendedBlockIds.includes(b.id) : b.isVisible)
                                    .map((block: ExperienceBlock) => {
                                        const tailoredBullets = job.tailoredResumes?.[block.id];
                                        const isTailoring = tailoringBlockId === block.id;
                                        return (
                                            <div key={block.id} className="p-8 hover:bg-neutral-50/30 dark:hover:bg-neutral-800/20 transition-all">
                                                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                                                    <div>
                                                        <h5 className="font-black text-neutral-900 dark:text-white text-base tracking-tight">{block.title}</h5>
                                                        <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">{block.organization} • {block.dateRange}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {tailoredBullets && (
                                                            <button
                                                                onClick={() => handleResetBlock(block.id)}
                                                                className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all"
                                                            >
                                                                <Undo2 className="w-3.5 h-3.5" />
                                                                Reset
                                                            </button>
                                                        )}
                                                        {userTier !== 'free' && (
                                                            <div className="flex flex-col items-end gap-1.5">
                                                                <Button
                                                                    onClick={() => handleHyperTailor(block)}
                                                                    disabled={isTailoring || !!bulkTailoringProgress || (job.tailorCounts?.[block.id] || 0) >= RESUME_TAILORING.MAX_TAILORS_PER_BLOCK}
                                                                    variant={tailoredBullets ? "secondary" : "accent"}
                                                                    size="xs"
                                                                    icon={isTailoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                                >
                                                                    {isTailoring ? 'Rewriting...' : tailoredBullets ? 'Retry Tailor' : 'Hyper-Tailor'}
                                                                </Button>
                                                                {job.tailorCounts?.[block.id] !== undefined && (job.tailorCounts?.[block.id] || 0) > 0 && (
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                                                        {job.tailorCounts[block.id]}/{RESUME_TAILORING.MAX_TAILORS_PER_BLOCK} uses
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    {tailoredBullets ? (
                                                        <div className="space-y-3">
                                                            {/* Original bullets with strikethrough */}
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-300">Original</span>
                                                                <ul className="space-y-1">
                                                                    {block.bullets.map((b: string, i: number) => (
                                                                        <li key={i} className="text-xs pl-4 border-l-2 border-neutral-200 text-neutral-400 line-through">{b}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                            {/* Tailored bullets */}
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-accent-primary-hex">Tailored Analysis</span>
                                                                <ul className="space-y-1.5">
                                                                    {tailoredBullets.map((b: string, i: number) => (
                                                                        <li key={i} className="text-xs pl-4 border-l-2 border-accent-primary-hex text-neutral-900 dark:text-neutral-200 font-bold leading-relaxed">{b}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <ul className="space-y-2.5">
                                                            {block.bullets.map((b: string, i: number) => (
                                                                <li key={i} className="text-xs pl-4 border-l-2 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">{b}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </Card>
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
    );
};

export default JobDetail;
