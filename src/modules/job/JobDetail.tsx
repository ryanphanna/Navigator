import React from 'react';
import type { SavedJob, ResumeProfile, CustomSkill, TargetJob, ExperienceBlock } from '../../types';
import type { UserTier } from '../../types/app';
import { Storage } from '../../services/storageService';
import { CoverLetterEditor } from './CoverLetterEditor';
import {
    Loader2, Sparkles, CheckCircle, XCircle,
    FileText, Copy, PenTool, ExternalLink,
    BookOpen, ShieldCheck, AlertCircle, ArrowLeft, Link as LinkIcon
} from 'lucide-react';

import { useToast } from '../../contexts/ToastContext';
import { DetailHeader } from '../../components/common/DetailHeader';
import { useJobDetailLogic } from '../../hooks/useJobDetailLogic';
import { DetailTabs } from '../../components/common/DetailTabs';
import type { TabItem } from '../../components/common/DetailTabs';
import { DetailLayout } from '../../components/common/DetailLayout';

interface JobDetailProps {
    job: SavedJob;
    resumes: ResumeProfile[];
    onBack: () => void;
    onUpdateJob: (job: SavedJob) => void;
    userTier?: UserTier;
    userSkills?: CustomSkill[];
    targetJobs?: TargetJob[];
    onAddSkill?: (skillName: string) => Promise<void>;
    onAnalyzeJob?: (job: SavedJob) => Promise<SavedJob>;
}

type Tab = 'analysis' | 'resume' | 'cover-letter' | 'job-post';

const JobDetail: React.FC<JobDetailProps> = ({
    job,
    resumes,
    onBack,
    onUpdateJob,
    userTier = 'free',
    userSkills = [],
    targetJobs = [],
    onAnalyzeJob
}) => {
    const { showError, showSuccess } = useToast();
    const {
        activeTab,
        setActiveTab,
        analysisProgress,
        tailoringBlockId,
        handleHyperTailor,
        analysis,
        bestResume,
        manualText,
        setManualText,
        editUrl,
        setEditUrl,
        retrying,
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

    // Handle Escape Key (Back)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onBack();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack]);

    if (!job) return null;

    if (job.status === 'analyzing' && !job.description) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] animate-in fade-in duration-500">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">Analyzing Job Fit</h3>
                <div className="flex flex-col items-center gap-2 mb-8">
                    <p className="text-neutral-500 font-medium animate-pulse text-lg">
                        {analysisProgress || "Starting analysis..."}
                    </p>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-neutral-400 hover:text-neutral-600 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Go back
                </button>
            </div>
        );
    }

    if (!analysis || job.status === 'error') {
        const handleManualRetry = async () => {
            if (!manualText.trim()) return;
            setGenerating(true);
            try {
                // Optimistic update
                const updatedJob: SavedJob = {
                    ...job,
                    status: 'analyzing',
                    description: manualText,
                    url: editUrl || job.url,
                };

                // Save immediately so description is preserved and UI updates
                await Storage.updateJob(updatedJob);
                onUpdateJob(updatedJob);

                // Trigger background analysis if available
                if (onAnalyzeJob) {
                    onAnalyzeJob(updatedJob).catch(e => {
                        showError(`Background analysis failed: ${(e as Error).message}`);
                    });
                }
            } catch (e) {
                showError(`Failed to update job: ${(e as Error).message}`);
            } finally {
                setGenerating(false);
            }
        };

        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 p-6">
                <div className="flex items-center mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to History
                    </button>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-neutral-900 mb-1">Manual Input Required</h2>
                                    <p className="text-neutral-700 text-sm leading-relaxed">The website blocked extraction. Please paste the job description below.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
                            <h3 className="text-base font-semibold text-neutral-900 mb-3">Job Posting URL:</h3>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={editUrl}
                                    onChange={(e) => setEditUrl(e.target.value)}
                                    placeholder="Paste URL here..."
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all text-neutral-900"
                                />
                                <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                        <label className="block text-base font-semibold text-neutral-900 mb-3">Job Description:</label>
                        <textarea
                            className="w-full h-40 p-4 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-sm leading-relaxed transition-all resize-none text-neutral-900"
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-between items-center pt-4">
                            <span className="text-xs text-neutral-500">{manualText.length} characters</span>
                            <div className="flex gap-3">
                                <button onClick={onBack} className="px-4 py-2.5 text-neutral-600 hover:text-neutral-900 rounded-lg text-sm font-medium">Cancel</button>
                                <button
                                    onClick={handleManualRetry}
                                    disabled={!manualText.trim() || manualText.length < 100 || retrying}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2 hover:bg-indigo-700 shadow-lg"
                                >
                                    {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {retrying ? 'Analyzing...' : 'Analyze Job Fit'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleCopyResume = async () => {
        if (!analysis || !bestResume) return;
        setGenerating(true);
        try {
            const blocks = bestResume.blocks.filter(b => analysis.recommendedBlockIds ? analysis.recommendedBlockIds.includes(b.id) : b.isVisible);
            const formatBlock = (b: ExperienceBlock) => {
                const tailored = job.tailoredResumes?.[b.id];
                const content = tailored ? tailored.map(bullet => `- ${bullet}`).join('\n') : b.bullets.map(bullet => `- ${bullet}`).join('\n');
                return `**${b.title}** | ${b.organization}\n${b.dateRange}\n${content}`;
            };

            const resumeText = [
                `# ${bestResume.name}`,
                `\n## Professional Summary\n${analysis.distilledJob?.roleTitle ? `Targeting: ${analysis.distilledJob.roleTitle}` : ''}`,
                `\n## Core Competencies\n${analysis.distilledJob?.keySkills.join(' • ')}`,
                `\n## Experience\n${blocks.filter(b => b.type === 'work').map(formatBlock).join('\n\n')}`,
                `\n## Projects\n${blocks.filter(b => b.type === 'project').map(formatBlock).join('\n\n')}`,
                `\n## Education\n${blocks.filter(b => b.type === 'education').map(formatBlock).join('\n\n')}`,
            ].join('\n');

            await navigator.clipboard.writeText(resumeText);
            showSuccess("Resume copied to clipboard");
        } catch (e) {
            showError("Failed to copy resume: " + (e as Error).message);
        } finally {
            setGenerating(false);
        }
    };

    const getScoreColor = (score?: number) => {
        if (score === undefined) return 'text-neutral-400 bg-neutral-200';
        if (score >= 90) return 'text-red-600 bg-red-100 border-red-200';
        if (score >= 80) return 'text-orange-600 bg-orange-100 border-orange-200';
        if (score >= 70) return 'text-amber-600 bg-amber-100 border-amber-200';
        if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        return 'text-neutral-500 bg-neutral-100 border-neutral-200';
    };

    const getScoreLabel = (score?: number) => {
        if (score === undefined) return 'Unknown';
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Great';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Fair';
        return 'Low';
    };

    const tabs: TabItem[] = [
        { id: 'analysis', label: 'Analysis', icon: CheckCircle },
        { id: 'job-post', label: 'Job Post', icon: BookOpen },
        { id: 'resume', label: 'Resume', icon: FileText },
        { id: 'cover-letter', label: 'Cover Letter', icon: PenTool },
    ];

    const actionsMenu = (
        <div className="flex items-center gap-3">
            {job.url && (
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-lg">
                    <ExternalLink className="w-4 h-4" />
                </a>
            )}
            <select
                value={job.status}
                onChange={(e) => {
                    const updated = { ...job, status: e.target.value as SavedJob['status'] };
                    Storage.updateJob(updated);
                    onUpdateJob(updated);
                }}
                className="text-sm bg-neutral-50 rounded-lg px-3 py-2 font-medium text-neutral-600 border-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="new">New</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
            </select>
        </div>
    );

    const matchSidebar = (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
            {job.status === 'analyzing' ? (
                <div className="animate-pulse space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="h-4 bg-neutral-100 rounded w-1/3"></div>
                        <div className="h-6 bg-neutral-100 rounded w-1/4"></div>
                    </div>
                    <div className="h-3 bg-neutral-100 rounded-full w-full"></div>
                    <div className="pt-4 space-y-2">
                        <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                        <div className="h-16 bg-neutral-50 rounded"></div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-neutral-400">Match Accuracy</h3>
                        <div className="flex flex-col items-end">
                            <span className={`text-xl font-black px-2 py-0.5 rounded ${getScoreColor(analysis?.compatibilityScore)}`}>
                                {getScoreLabel(analysis?.compatibilityScore)}
                            </span>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden mb-6">
                        <div
                            className="h-full rounded-full transition-all duration-1000 bg-indigo-600"
                            style={{ width: `${analysis?.compatibilityScore || 0}%` }}
                        />
                    </div>
                    <div className="pt-6 border-t border-neutral-100">
                        <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2 text-sm">
                            <Sparkles className="w-3 h-3 text-indigo-500" /> Professional Insight
                        </h3>
                        <p className="text-xs text-neutral-700 leading-relaxed font-medium bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                            {analysis?.reasoning || "Analysis needed"}
                        </p>
                    </div>
                </>
            )}
        </div>
    );

    const ResumeSidebar: React.FC = () => (
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            {job.status === 'analyzing' ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-neutral-100 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-12 bg-neutral-50 rounded"></div>
                        <div className="h-12 bg-neutral-50 rounded"></div>
                        <div className="h-12 bg-neutral-50 rounded"></div>
                    </div>
                </div>
            ) : (
                <>
                    <h4 className="font-bold text-neutral-900 mb-4 flex items-center gap-2 text-sm">
                        <Sparkles className="w-3 h-3 text-indigo-500" /> Tailoring Strategy
                    </h4>
                    <div className="space-y-3">
                        {(analysis?.resumeTailoringInstructions || analysis?.tailoringInstructions || [])
                            .slice(0, 3).map((instruction: string, idx: number) => (
                                <div key={idx} className="flex gap-3 text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                                    <span className="font-bold text-neutral-400 text-xs mt-0.5">0{idx + 1}</span>
                                    <span className="text-xs font-medium">{instruction}</span>
                                </div>
                            ))}
                        {(!analysis?.resumeTailoringInstructions && !analysis?.tailoringInstructions) && (
                            <div className="text-xs text-neutral-500 italic">No specific tailoring instructions available.</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="bg-white h-full flex flex-col">
            <DetailHeader
                title={analysis.distilledJob?.roleTitle || job.position || 'Job Detail'}
                subtitle={`${analysis.distilledJob?.companyName || job.company || 'Unknown Company'}`}
                onBack={onBack}
                actions={actionsMenu}
            />
            <DetailTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as Tab)}
            />
            <DetailLayout sidebar={
                activeTab === 'analysis' ? matchSidebar :
                    activeTab === 'resume' ? <ResumeSidebar /> :
                        undefined
            }>
                {activeTab === 'analysis' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
                            {job.status === 'analyzing' ? (
                                <div className="animate-pulse space-y-4">
                                    <div className="h-5 bg-neutral-100 rounded w-1/4 mb-6"></div>
                                    <div className="flex gap-2">
                                        <div className="h-8 bg-neutral-50 rounded w-24"></div>
                                        <div className="h-8 bg-neutral-50 rounded w-32"></div>
                                        <div className="h-8 bg-neutral-50 rounded w-20"></div>
                                    </div>
                                    <div className="mt-8 flex items-center justify-center py-6 text-indigo-500 font-medium gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Analyzing requirements from description...
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-600" /> Key Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(analysis?.distilledJob?.keySkills || []).map((skill: string, i: number) => (
                                            <span key={i} className="text-sm font-medium text-neutral-700 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {job.status === 'analyzing' ? (
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200 animate-pulse">
                                <div className="h-5 bg-neutral-100 rounded w-1/4 mb-6"></div>
                                <div className="space-y-3">
                                    <div className="h-12 bg-neutral-50 rounded-xl"></div>
                                    <div className="h-12 bg-neutral-50 rounded-xl"></div>
                                    <div className="h-12 bg-neutral-50 rounded-xl"></div>
                                </div>
                            </div>
                        ) : (
                            analysis?.distilledJob?.requiredSkills && analysis.distilledJob.requiredSkills.length > 0 && (
                                <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
                                    <h4 className="font-bold text-neutral-900 mb-6 flex items-center gap-2 text-sm uppercase">
                                        <ShieldCheck className="w-4 h-4 text-indigo-600" /> Skill Gaps
                                    </h4>
                                    <div className="space-y-3">
                                        {analysis.distilledJob.requiredSkills.map((req: { name: string; level: 'learning' | 'comfortable' | 'expert' }, i: number) => {
                                            const mySkill = userSkills.find(s => s.name.toLowerCase().includes(req.name.toLowerCase()));
                                            const levels: Record<string, number> = { learning: 1, comfortable: 2, expert: 3 };
                                            const isMatch = mySkill && levels[mySkill.proficiency] >= levels[req.level];
                                            return (
                                                <div key={i} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-1.5 rounded-lg ${isMatch ? 'bg-emerald-100 text-emerald-600' : 'bg-neutral-200 text-neutral-400'}`}>
                                                            {isMatch ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        </div>
                                                        <span className="text-sm font-bold text-neutral-900">{req.name}</span>
                                                    </div>
                                                    {mySkill && <span className="text-[10px] font-black uppercase text-neutral-400">{mySkill.proficiency}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                        <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
                            <h4 className="font-bold text-neutral-900 mb-6 flex items-center gap-2 text-sm uppercase">
                                <CheckCircle className="w-4 h-4 text-indigo-600" /> Core Duties
                            </h4>
                            <ul className="space-y-3">
                                {(analysis?.distilledJob?.coreResponsibilities || []).map((resp: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-neutral-600 text-sm leading-relaxed">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2 shrink-0" />
                                        {resp}
                                    </li>
                                ))}
                                {job.status === 'analyzing' && (
                                    <li className="animate-pulse flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 mt-2 shrink-0" />
                                        <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'job-post' && (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
                        <h4 className="flex items-center gap-2 font-bold text-neutral-900 mb-6 uppercase text-sm">
                            <FileText className="w-4 h-4 text-neutral-400" />
                            {analysis.cleanedDescription ? 'Job Description (AI Cleaned)' : 'Original Job Post'}
                        </h4>
                        <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap font-sans">
                            {analysis.cleanedDescription || job.description}
                        </div>
                    </div>
                )}

                {activeTab === 'resume' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="border-b border-neutral-100 p-6 flex justify-between items-center">
                            <h3 className="font-semibold text-neutral-900">Experience Blocks</h3>
                            <button onClick={handleCopyResume} disabled={generating} className="text-xs font-medium px-4 py-2 bg-neutral-900 text-white rounded-lg flex items-center gap-2">
                                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                                {generating ? 'Processing...' : 'Copy Full Resume'}
                            </button>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {bestResume?.blocks
                                .filter(b => analysis?.recommendedBlockIds ? analysis.recommendedBlockIds.includes(b.id) : b.isVisible)
                                .map(block => {
                                    const tailoredBullets = job.tailoredResumes?.[block.id];
                                    const isTailoring = tailoringBlockId === block.id;
                                    return (
                                        <div key={block.id} className="p-6 hover:bg-neutral-50 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h5 className="font-medium text-neutral-900 text-sm">{block.title}</h5>
                                                    <div className="text-xs text-neutral-500 font-medium">{block.organization} | {block.dateRange}</div>
                                                </div>
                                                {!tailoredBullets && userTier !== 'free' && (
                                                    <button onClick={() => handleHyperTailor(block)} disabled={isTailoring} className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {isTailoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                        {isTailoring ? 'Rewriting...' : 'Hyper-Tailor'}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-3">
                                                <ul className="space-y-1.5">
                                                    {(tailoredBullets || block.bullets).map((b: string, i: number) => (
                                                        <li key={i} className={`text-xs pl-3 border-l-2 ${tailoredBullets ? 'text-indigo-900 border-indigo-400' : 'text-neutral-600 border-neutral-200'}`}>{b}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {activeTab === 'cover-letter' && analysis && (
                    <CoverLetterEditor
                        job={job}
                        analysis={analysis}
                        bestResume={bestResume}
                        userTier={userTier}
                        targetJobs={targetJobs || []}
                        onJobUpdate={onUpdateJob}
                    />
                )}
            </DetailLayout>
        </div>
    );
};

export default JobDetail;
