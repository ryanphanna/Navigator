import React, { useState, useMemo } from 'react';
import type { SavedJob, ResumeProfile, CustomSkill, TargetJob, ExperienceBlock } from '../../types';
import { tailorExperienceBlock, analyzeJobFit } from '../../services/geminiService';
import { Storage } from '../../services/storageService';
import { ScraperService } from '../../services/scraperService';
import { CoverLetterEditor } from './CoverLetterEditor';
import {
    Loader2, Sparkles, CheckCircle, AlertTriangle, XCircle,
    FileText, Copy, PenTool, ExternalLink,
    BookOpen, ShieldCheck, Plus, ThumbsUp, AlertCircle, ArrowLeft, UserPlus, Link as LinkIcon
} from 'lucide-react';

import { useToast } from '../../contexts/ToastContext';
import { DetailHeader } from '../../components/common/DetailHeader';
import { DetailTabs } from '../../components/common/DetailTabs';
import type { TabItem } from '../../components/common/DetailTabs';
import { DetailLayout } from '../../components/common/DetailLayout';

interface JobDetailProps {
    job: SavedJob;
    resumes: ResumeProfile[];
    onBack: () => void;
    onUpdateJob: (job: SavedJob) => void;
    userTier?: 'free' | 'pro' | 'admin' | 'tester';
    userSkills?: CustomSkill[];
    targetJobs?: TargetJob[];
    onAddSkill?: (skillName: string) => Promise<void>;
}

type Tab = 'analysis' | 'resume' | 'cover-letter' | 'job-post';

const JobDetail: React.FC<JobDetailProps> = ({ job, resumes, onBack, onUpdateJob, userTier = 'free', userSkills = [], targetJobs = [], onAddSkill }) => {
    // Changed from useLocalStorage to prevent sticky tabs across jobs
    const [activeTab, setActiveTab] = useState<Tab>('analysis');

    // Reset to analysis tab when job changes
    React.useEffect(() => {
        setActiveTab('analysis');
    }, [job.id]);
    const [generating, setGenerating] = useState(false);
    const { showError, showSuccess } = useToast();

    // Retry / Manual Entry State
    const [manualText, setManualText] = useState(job.description || '');
    const [editUrl, setEditUrl] = useState(job.url || '');
    const [retrying, setRetrying] = useState(false);

    // Hyper-Tailoring State
    const [tailoringBlock, setTailoringBlock] = useState<string | null>(null);
    const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);

    // Run analysis on mount if pending
    React.useEffect(() => {
        if (job.status === 'analyzing' && !job.analysis) {
            performAnalysis();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [job.id]);

    const performAnalysis = async () => {
        setAnalysisProgress("Preparing analysis...");
        try {
            let textToAnalyze = job.description || '';

            if (!textToAnalyze && job.url) {
                setAnalysisProgress("Extracting job details from URL...");
                try {
                    const scrapedText = await ScraperService.scrapeJobText(job.url);
                    if (scrapedText) {
                        textToAnalyze = scrapedText;
                        const jobWithText = { ...job, description: textToAnalyze };
                        onUpdateJob(jobWithText);
                    } else {
                        throw new Error("Could not extract text.");
                    }
                } catch (e) {
                    throw new Error("Failed to scrape URL: " + (e as Error).message);
                }
            }

            if (!textToAnalyze) {
                throw new Error("No job description found.");
            }

            setAnalysisProgress("Analyzing compatibility...");
            const result = await analyzeJobFit(
                textToAnalyze,
                resumes,
                userSkills,
                (msg) => setAnalysisProgress(msg)
            );

            const finalJob: SavedJob = {
                ...job,
                description: textToAnalyze,
                status: 'saved',
                analysis: result
            };

            Storage.updateJob(finalJob);
            onUpdateJob(finalJob);
            setAnalysisProgress(null);

        } catch (err) {
            console.error(err);
            const errorJob: SavedJob = {
                ...job,
                status: 'error' as const
            };
            onUpdateJob(errorJob);
            setAnalysisProgress(null);
            showError("Analysis failed: " + (err as Error).message);
        }
    };

    const analysis = job.analysis;

    const bestResume = useMemo(() => {
        if (!analysis) return resumes[0];
        return resumes.find(r => r.id === analysis.bestResumeProfileId) || resumes[0];
    }, [analysis, resumes]);

    // Handle Escape Key (Back)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onBack();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack]);

    if (job.status === 'analyzing' && !job.analysis) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] animate-in fade-in duration-500">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">Analyzing Job Fit</h3>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-neutral-500 font-medium animate-pulse text-lg">
                        {analysisProgress || "Starting analysis..."}
                    </p>
                    <p className="text-xs text-neutral-400">
                        This usually takes about 10-15 seconds
                    </p>
                </div>
            </div>
        );
    }

    if (!analysis || job.status === 'error') {
        const handleRetry = async () => {
            if (!manualText.trim()) return;
            setRetrying(true);
            try {
                const result = await analyzeJobFit(manualText, resumes, userSkills);
                const updatedJob: SavedJob = {
                    ...job,
                    status: 'saved',
                    description: manualText,
                    url: editUrl || job.url, // Save the edited URL
                    analysis: result
                };
                onUpdateJob(updatedJob);
            } catch (e) {
                console.error(e);
                showError(`Analysis failed: ${(e as Error).message}`);
            } finally {
                setRetrying(false);
            }
        };

        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 p-6">
                <div className="flex items-center mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to History
                    </button>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center">
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-neutral-900 mb-1">Couldn't auto-fill job details</h2>
                                    <p className="text-neutral-700 text-sm leading-relaxed">
                                        The website blocked automatic extraction. No problem—you can paste it manually instead.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center">
                            <h3 className="text-base font-semibold text-neutral-900 mb-3">Copy the job description:</h3>
                            <div className="space-y-3">
                                {job.url ? (
                                    <a
                                        href={job.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm"
                                    >
                                        Open Job Posting <ExternalLink className="w-4 h-4" />
                                    </a>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={editUrl}
                                            onChange={(e) => setEditUrl(e.target.value)}
                                            placeholder="Paste URL here (optional)..."
                                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                                            <LinkIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                        <label className="block text-base font-semibold text-neutral-900 mb-3">Paste it here:</label>
                        <textarea
                            className="w-full h-40 p-4 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 text-sm leading-relaxed transition-all resize-none"
                            value={manualText}
                            onChange={e => setManualText(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-between items-center pt-4">
                            <div className="text-xs text-neutral-500">
                                {manualText.length} characters
                            </div>
                            <div className="flex gap-3">
                                <button onClick={onBack} className="px-4 py-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                <button
                                    onClick={handleRetry}
                                    disabled={!manualText.trim() || manualText.length < 100 || retrying}
                                    className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
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
        if (!analysis || !analysis.bestResumeProfileId) return;
        setGenerating(true);
        try {
            if (!bestResume) throw new Error("Resume not found");
            const blocks = bestResume.blocks.filter(b => analysis.recommendedBlockIds ? analysis.recommendedBlockIds.includes(b.id) : b.isVisible);
            const formatBlock = (b: ExperienceBlock) => `**${b.title}** | ${b.organization}\n${b.dateRange}\n${b.bullets.map((bull: string) => `- ${bull}`).join('\n')}`;

            const resumeText = [
                `# ${bestResume.name}`,
                `[Email] | [Phone] | [LinkedIn]`,
                `\n## Professional Summary\n${analysis.distilledJob.roleTitle ? `Targeting: ${analysis.distilledJob.roleTitle}` : ''}`,
                `\n## Core Competencies`,
                `${analysis.distilledJob.keySkills.join(' • ')}`,
                `\n## Experience`,
                blocks.filter(b => b.type === 'work').map(formatBlock).join('\n\n'),
                `\n## Projects`,
                blocks.filter(b => b.type === 'project').map(formatBlock).join('\n\n'),
                `\n## Education`,
                blocks.filter(b => b.type === 'education').map(formatBlock).join('\n\n'),
            ].join('\n');

            await navigator.clipboard.writeText(resumeText);
            showSuccess("Resume copied to clipboard");
        } catch (e) {
            showError("Failed to generate resume: " + (e as Error).message);
        } finally {
            setGenerating(false);
        }
    };

    const handleHyperTailor = async (block: ExperienceBlock) => {
        if (userTier === 'free') return;
        setTailoringBlock(block.id);
        try {
            const textToUse = analysis.cleanedDescription || job.description || `Role: ${analysis.distilledJob.roleTitle}`;
            const instructions = analysis.resumeTailoringInstructions || analysis.tailoringInstructions || [];
            const newBullets = await tailorExperienceBlock(block, textToUse, instructions);
            const updatedJob = { ...job, tailoredResumes: { ...(job.tailoredResumes || {}), [block.id]: newBullets } };
            Storage.updateJob(updatedJob);
            onUpdateJob(updatedJob);
        } catch (e) {
            showError("Failed to rewrite bullets");
        } finally {
            setTailoringBlock(null);
        }
    };

    const getScoreColor = (score?: number) => {
        if (score === undefined) return 'text-neutral-400 bg-neutral-200';
        if (score >= 90) return 'text-red-600 bg-red-100 border-red-200';        // Hot (Excellent)
        if (score >= 80) return 'text-orange-600 bg-orange-100 border-orange-200'; // Warmer (Great)
        if (score >= 70) return 'text-amber-600 bg-amber-100 border-amber-200';   // Warm (Good)
        if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200'; // Mild (Fair)
        return 'text-neutral-500 bg-neutral-100 border-neutral-200';                   // Cold (Low)
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

    const actions = (
        <div className="flex items-center gap-3">
            {job.url && (
                <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 transition-colors rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-500 hover:text-indigo-600 border border-neutral-200"
                >
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
                className="text-sm border-none bg-neutral-50 rounded-lg px-3 py-2 font-medium text-neutral-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
                <option value="new">New</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
            </select>
        </div>
    );

    const sidebar = (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
            {analysis.compatibilityScore !== undefined ? (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-neutral-400">Compatibility</h3>
                        <div className="flex flex-col items-end">
                            <span className={`text-xl font-black px-2 py-0.5 rounded ${getScoreColor(analysis.compatibilityScore)}`}>
                                {getScoreLabel(analysis.compatibilityScore)}
                            </span>
                            {userTier !== 'free' && (
                                <span className="text-xs font-medium text-neutral-400 mt-1">
                                    {analysis.compatibilityScore}% Match
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden mb-6">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(analysis.compatibilityScore).split(' ')[1].replace('bg-', 'bg-')}`}
                            style={{
                                width: `${analysis.compatibilityScore}%`,
                                backgroundColor: analysis.compatibilityScore >= 90 ? '#dc2626' : // red-600
                                    analysis.compatibilityScore >= 80 ? '#ea580c' : // orange-600
                                        analysis.compatibilityScore >= 70 ? '#d97706' : // amber-600
                                            analysis.compatibilityScore >= 50 ? '#ca8a04' : // yellow-600
                                                '#64748b' // neutral-500
                            }}
                        />
                    </div>
                    {userTier === 'free' && (
                        <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-xs font-bold text-indigo-900 mb-1">Want the exact score?</h4>
                                <p className="text-xs text-indigo-700 mb-2">Upgrade to see the precise match percentage and analysis.</p>
                                <button className="text-[10px] uppercase font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded transition-colors">
                                    Upgrade to Pro
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="mt-6 pt-6 border-t border-neutral-100">
                        <h3 className="font-bold text-neutral-900 mb-4 flex items-center gap-2 text-sm">
                            <Sparkles className="w-3 h-3 text-indigo-500" /> AI compatibility Analysis
                        </h3>
                        <p className="text-xs text-neutral-700 leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-100 font-medium">
                            {analysis.reasoning}
                        </p>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 mb-2">Want a Match Score?</h3>
                    <p className="text-xs text-neutral-500 mb-4">
                        Upload your resume to see how well you fit this role and get tailored advice.
                    </p>
                    <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                        Add Resume
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white h-full flex flex-col">
            <DetailHeader
                title={analysis.distilledJob.roleTitle || job.position || 'Job Detail'}
                subtitle={`${analysis.distilledJob.companyName || job.company || 'Unknown Company'}${analysis.distilledJob.location ? ` • ${analysis.distilledJob.location}` : ''}`}
                onBack={onBack}
                actions={actions}
            />
            <DetailTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(id) => setActiveTab(id as Tab)}
            />
            <DetailLayout sidebar={
                activeTab === 'analysis' ? sidebar :
                    activeTab === 'resume' ? <ResumeSidebar analysis={analysis} /> :
                        undefined
            }>
                {activeTab === 'analysis' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
                            <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Required Skills
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.distilledJob.keySkills.map((skill, i) => (
                                    <span key={i} className="text-sm font-medium text-neutral-700 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {analysis.distilledJob.requiredSkills && analysis.distilledJob.requiredSkills.length > 0 && (
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
                                <h4 className="font-bold text-neutral-900 mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600" /> Gap Analysis
                                </h4>
                                <div className="space-y-4">
                                    {analysis.distilledJob.requiredSkills.map((req, i) => {
                                        const mySkill = userSkills.find(s => s.name.toLowerCase().includes(req.name.toLowerCase()));
                                        const levels: Record<string, number> = { learning: 1, comfortable: 2, expert: 3 };
                                        const isMatch = mySkill && levels[mySkill.proficiency] >= levels[req.level];
                                        const isUnderLevelled = mySkill && levels[mySkill.proficiency] < levels[req.level];

                                        return (
                                            <div key={i} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-100 rounded-2xl">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl ${isMatch ? 'bg-emerald-100 text-emerald-600' : isUnderLevelled ? 'bg-amber-100 text-amber-600' : 'bg-neutral-200 text-neutral-400'}`}>
                                                        {isMatch ? <CheckCircle className="w-5 h-5" /> : isUnderLevelled ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-neutral-900">{req.name}</div>
                                                        <div className="text-xs font-bold text-neutral-400">Required: {req.level}</div>
                                                    </div>
                                                </div>
                                                {mySkill ? (
                                                    <div className={`text-xs font-black uppercase tracking-widest ${isMatch ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {mySkill.proficiency} (You)
                                                    </div>
                                                ) : (
                                                    onAddSkill && (
                                                        <button onClick={() => onAddSkill(req.name)} className="text-[10px] font-bold uppercase p-1.5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center gap-1">
                                                            <Plus className="w-3 h-3" /> Add
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
                            <h4 className="font-bold text-neutral-900 mb-6 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-indigo-600" /> Core Responsibilities
                            </h4>
                            <ul className="space-y-4">
                                {analysis.distilledJob.coreResponsibilities.map((resp, i) => (
                                    <li key={i} className="flex gap-4 text-neutral-600 leading-relaxed text-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2 shrink-0" />
                                        {resp}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-emerald-50/50 rounded-xl p-6 border border-emerald-100">
                                <h4 className="text-sm font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                    <ThumbsUp className="w-4 h-4 text-emerald-600" /> Key Strengths
                                </h4>
                                <div className="space-y-2">
                                    {(analysis.strengths || []).map((s, i) => (
                                        <div key={i} className="text-xs text-emerald-800 bg-white/80 p-3 rounded-lg border border-emerald-100/50">
                                            {s}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-rose-50/50 rounded-xl p-6 border border-rose-100">
                                <h4 className="text-sm font-bold text-rose-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Focus Areas
                                </h4>
                                <div className="space-y-2">
                                    {(analysis.weaknesses || []).map((w, i) => (
                                        <div key={i} className="text-xs text-rose-800 bg-white/80 p-3 rounded-lg border border-rose-100/50">
                                            {w}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'job-post' && (
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
                        <h4 className="flex items-center gap-2 font-bold text-neutral-900 mb-6 uppercase text-sm">
                            <FileText className="w-4 h-4 text-neutral-400" /> Full Description
                        </h4>
                        <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap font-sans">
                            {job.description}
                        </div>
                    </div>
                )}

                {activeTab === 'resume' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                        <div className="border-b border-neutral-100 p-6 flex justify-between items-center">
                            <h3 className="font-semibold text-neutral-900">Experience Blocks</h3>
                            <button onClick={handleCopyResume} disabled={generating} className="text-xs font-medium px-4 py-2 bg-neutral-900 text-white rounded-lg flex items-center gap-2">
                                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                                {generating ? 'Assembling...' : 'Copy Full'}
                            </button>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {resumes.find(r => r.id === analysis.bestResumeProfileId)?.blocks
                                .filter(b => analysis.recommendedBlockIds?.includes(b.id))
                                .map(block => {
                                    const tailoredBullets = job.tailoredResumes?.[block.id];
                                    const isTailoring = tailoringBlock === block.id;
                                    return (
                                        <div key={block.id} className="p-6 hover:bg-neutral-50 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h5 className="font-medium text-neutral-900 text-sm">{block.title}</h5>
                                                    <div className="text-xs text-neutral-500 font-medium">{block.organization} | {block.dateRange}</div>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                {tailoredBullets ? (
                                                    <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
                                                        <ul className="space-y-1.5">
                                                            {tailoredBullets.map((b, i) => <li key={i} className="text-xs text-indigo-900 pl-3 border-l-2 border-indigo-400">{b}</li>)}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <ul className="space-y-1.5">
                                                        {block.bullets.map((b, i) => <li key={i} className="text-xs text-neutral-600 pl-3 border-l-2 border-neutral-200 group-hover:border-indigo-300 transition-colors">{b}</li>)}
                                                    </ul>
                                                )}
                                            </div>
                                            {!tailoredBullets && userTier !== 'free' && (
                                                <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100">
                                                    <button onClick={() => handleHyperTailor(block)} disabled={isTailoring} className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                                        {isTailoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                        {isTailoring ? 'Rewriting...' : 'Hyper-Tailor'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {activeTab === 'cover-letter' && (
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

const ResumeSidebar: React.FC<{ analysis: any }> = ({ analysis }) => (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <h4 className="font-bold text-neutral-900 mb-4 flex items-center gap-2 text-sm">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Tailoring Strategy
        </h4>
        <div className="space-y-3">
            {(analysis.resumeTailoringInstructions || analysis.tailoringInstructions || [])
                .slice(0, 3).map((instruction: string, idx: number) => (
                    <div key={idx} className="flex gap-3 text-sm text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                        <span className="font-bold text-neutral-400 text-xs mt-0.5">0{idx + 1}</span>
                        <span className="text-xs font-medium">{instruction}</span>
                    </div>
                ))}
        </div>
    </div>
);

export default JobDetail;
