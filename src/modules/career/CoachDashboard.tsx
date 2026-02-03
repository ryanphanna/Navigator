import React, { useState, useRef } from 'react';
import {
    Users,
    TrendingUp,
    Plus,
    Target,
    Loader2,
    Trash2,
    CheckCircle2,
    Search,
    Calendar,
    Map,
    Link as LinkIcon,
    Sparkles
} from 'lucide-react';
import type { CustomSkill, RoleModelProfile, TargetJob } from '../../types';
import { ScraperService } from '../../services/scraperService';

interface CoachDashboardProps {
    userSkills: CustomSkill[];
    roleModels: RoleModelProfile[];
    targetJobs: TargetJob[];
    view: 'coach-home' | 'coach-role-models' | 'coach-gap-analysis';
    onAddRoleModel: (file: File) => Promise<void>;
    onAddTargetJob: (goal: TargetJob) => void;
    onDeleteRoleModel: (id: string) => Promise<void>;
    onRunGapAnalysis: (targetJobId: string) => Promise<void>;
    onGenerateRoadmap: (targetJobId: string) => Promise<void>;
    onToggleMilestone: (targetJobId: string, milestoneId: string) => Promise<void>;
    activeAnalysisIds?: Set<string>;
}

const COACH_HEADLINES = [
    { text: "Chart your", highlight: "Course" },
    { text: "Map your", highlight: "Growth" },
    { text: "Build your", highlight: "Roadmap" },
    { text: "Design your", highlight: "Future" },
    { text: "Scale your", highlight: "Impact" }
];

const COACH_MESSAGES = [
    "Reviewing your skills...",
    "Analyzing Role Model patterns...",
    "Identifying skill gaps...",
    "Brainstorming roadmap projects...",
    "Calculating professional trajectory...",
    "Consulting the AI knowledge base...",
    "Synthesizing your growth path..."
];

export const CoachDashboard: React.FC<CoachDashboardProps> = ({
    userSkills,
    roleModels,
    targetJobs,
    view,
    onAddRoleModel,
    onAddTargetJob,
    onDeleteRoleModel,
    onRunGapAnalysis,
    onGenerateRoadmap,
    onToggleMilestone,
    activeAnalysisIds = new Set()
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isTargetMode, setIsTargetMode] = useState(false);
    const [url, setUrl] = useState('');
    const [isScrapingUrl, setIsScrapingUrl] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeHeadline, setActiveHeadline] = useState({ text: 'Design your', highlight: 'Future' });
    const fileInputRef = useRef<HTMLInputElement>(null);


    React.useEffect(() => {
        const randomChoice = COACH_HEADLINES[Math.floor(Math.random() * COACH_HEADLINES.length)];
        setActiveHeadline(randomChoice);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await onAddRoleModel(file);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const handleRunAnalysis = async (targetJobId: string) => {
        await onRunGapAnalysis(targetJobId);
    };

    const handleGenerateRoadmap = async (targetJobId: string) => {
        await onGenerateRoadmap(targetJobId);
    };

    const handleTargetJobSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim() || isScrapingUrl) return;

        setIsScrapingUrl(true);
        setError(null);

        try {
            let jobDescription = url;

            // Simple URL detection
            if (url.startsWith('http')) {
                jobDescription = await ScraperService.scrapeJobContent(url);
            }

            const newGoal: TargetJob = {
                id: crypto.randomUUID(),
                title: 'New Dream Job',
                description: jobDescription,
                dateAdded: Date.now(),
            };

            await onAddTargetJob(newGoal);
            setUrl('');
        } catch (err) {
            console.error("Failed to add target job:", err);
            setError(err instanceof Error ? err.message : "Failed to save dream job");
        } finally {
            setIsScrapingUrl(false);
        }
    };


    const [coachMessageIndex, setCoachMessageIndex] = React.useState(0);

    React.useEffect(() => {
        if (activeAnalysisIds.size > 0) {
            const interval = setInterval(() => {
                setCoachMessageIndex(prev => (prev + 1) % COACH_MESSAGES.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [activeAnalysisIds.size, COACH_MESSAGES.length]);

    return (
        <div className="w-full relative px-4 sm:px-6 lg:px-8 py-0 animate-in fade-in duration-700">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
            />

            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
            </div>

            {view === 'coach-home' && (
                <div className="flex flex-col items-center justify-start animate-in fade-in duration-700 relative min-h-[80vh] pt-16 pb-12">
                    <div className="w-full max-w-4xl px-4 relative">
                        {/* Hero Section */}
                        <div className="text-center mb-10">
                            <h2 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
                                {activeHeadline.text} <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">{activeHeadline.highlight}</span>
                            </h2>
                            <p className="text-2xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl mx-auto">
                                Distill career paths into your personalized growth roadmap.
                            </p>
                        </div>

                        {/* Mode Selector */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                                <button
                                    onClick={() => setIsTargetMode(false)}
                                    className={`px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${!isTargetMode ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <Users className="w-4 h-4" />
                                    Emulate
                                </button>
                                <button
                                    onClick={() => setIsTargetMode(true)}
                                    className={`px-6 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${isTargetMode ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                >
                                    <Target className="w-4 h-4" />
                                    Destination
                                </button>
                            </div>
                        </div>

                        {/* High-Impact Input Area */}
                        <div className="w-full max-w-3xl mx-auto animate-in fade-in duration-1000 delay-200">
                            {!isTargetMode ? (
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                    <div className="relative bg-white dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-indigo-800/30 rounded-[2.5rem] p-4 shadow-2xl flex flex-col md:flex-row items-center gap-4 group-hover:border-indigo-500/30 transition-all duration-500">
                                        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center text-indigo-600 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            {isUploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <TrendingUp className="w-8 h-8" />}
                                        </div>

                                        <div className="flex-1 text-center md:text-left">
                                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Role Model</div>
                                            <div className="text-lg font-medium text-slate-600 dark:text-slate-300">
                                                {isUploading ? "Distilling career path patterns..." : "Upload a LinkedIn PDF to start"}
                                            </div>
                                        </div>

                                        <button
                                            onClick={triggerUpload}
                                            disabled={isUploading}
                                            className="w-full md:w-auto px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span>Add Profile</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleTargetJobSubmit} className="relative group">
                                    <div className={`absolute -inset-1 rounded-[2.5rem] blur-xl transition-all duration-1000 ${isScrapingUrl
                                        ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-100 animate-pulse'
                                        : 'bg-gradient-to-r from-indigo-500 to-violet-500 opacity-20 group-hover:opacity-100 transition-opacity'
                                        }`} />
                                    <div className="relative bg-white dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-indigo-800/30 rounded-[2.5rem] p-4 shadow-2xl flex flex-col md:flex-row items-center gap-4 group-hover:border-indigo-500/30 transition-all duration-500">
                                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                                            {isScrapingUrl ? (
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            ) : (
                                                <LinkIcon className="h-8 w-8" />
                                            )}
                                        </div>

                                        <div className="flex-1 w-full text-center md:text-left">
                                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                Dream Job
                                            </div>
                                            <input
                                                type="text"
                                                value={url}
                                                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                                                placeholder={isScrapingUrl ? "Analyzing job requirements..." : "Enter job URL or title..."}
                                                className="w-full bg-transparent border-none rounded-xl text-lg font-medium text-slate-600 dark:text-slate-300 placeholder:text-slate-400 focus:ring-0 focus:outline-none transition-all duration-300"
                                                autoFocus
                                                disabled={isScrapingUrl}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!url.trim() || isScrapingUrl}
                                            className="w-full md:w-auto px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isScrapingUrl ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                            <span>Set Goal</span>
                                        </button>
                                    </div>
                                    {error && (
                                        <p className="absolute -bottom-10 left-6 text-sm font-bold text-red-500 animate-in slide-in-from-top-2">
                                            {error}
                                        </p>
                                    )}
                                </form>
                            )}

                            {/* Stats Summary */}
                            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 animate-in fade-in duration-1000 delay-500">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{roleModels.length}</div>
                                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Profiles</div>
                                    </div>
                                </div>

                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{targetJobs.length}</div>
                                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Goals</div>
                                    </div>
                                </div>

                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-slate-900 dark:text-white leading-none">{userSkills.length}</div>
                                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Skills</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'coach-role-models' && (
                <div className="max-w-4xl mx-auto px-6 space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center border-2 border-indigo-500/20">
                                <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Role Models</h2>
                                <p className="text-slate-500 dark:text-slate-400">Manage the career paths you're analyzing.</p>
                            </div>
                        </div>
                        <button
                            onClick={triggerUpload}
                            disabled={isUploading}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2"
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {isUploading ? 'Parsing...' : 'Upload PDF'}
                        </button>
                    </div>

                    {roleModels.length === 0 ? (
                        <div className="text-center py-32 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Users className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Role Models Yet</h3>
                            <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest font-bold">Upload a LinkedIn PDF to distill path patterns</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roleModels.map(rm => (
                                <div key={rm.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={() => onDeleteRoleModel(rm.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{rm.name}</h4>
                                    <p className="text-sm text-indigo-600 font-medium mb-3">{rm.headline}</p>

                                    <div className="mb-4">
                                        <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Career Snapshot</div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                            {rm.careerSnapshot}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mt-auto">
                                        {rm.topSkills.slice(0, 4).map(skill => (
                                            <span key={skill} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {view === 'coach-gap-analysis' && (
                <div className="max-w-4xl mx-auto px-6 space-y-8 animate-in fade-in duration-500">
                    {/* Header matching Skills page style */}
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center border-2 border-indigo-500/20">
                                <Target className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Gap Analysis</h2>
                                <p className="text-slate-500 dark:text-slate-400">Compare your skills against your {roleModels.length} Role Models.</p>
                            </div>
                        </div>
                        <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Run Analysis
                        </button>
                    </div>

                    {/* Analysis Logic */}
                    {targetJobs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-8">
                            {targetJobs.map(tj => (
                                <div key={tj.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 mb-1">Target Goal</div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{tj.title}</h3>
                                        </div>
                                        {!tj.gapAnalysis ? (
                                            <button
                                                onClick={() => handleRunAnalysis(tj.id)}
                                                disabled={activeAnalysisIds.has(tj.id)}
                                                className="px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                                            >
                                                {activeAnalysisIds.has(tj.id) ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        {COACH_MESSAGES[coachMessageIndex]}
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingUp className="w-4 h-4" />
                                                        Start Analysis
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl">
                                                <CheckCircle2 className="w-5 h-5" />
                                                Analysis Complete
                                            </div>
                                        )}
                                    </div>

                                    {tj.gapAnalysis && (
                                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            {/* Career Trajectory */}
                                            <div>
                                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                    <Search className="w-5 h-5 text-indigo-500" />
                                                    The Path Gap
                                                </h4>
                                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                                    {tj.gapAnalysis.careerTrajectoryGap}
                                                </div>
                                            </div>

                                            {/* Skill Gaps */}
                                            <div>
                                                <h4 className="text-lg font-bold mb-6 flex items-center gap-2">
                                                    <Plus className="w-5 h-5 text-indigo-500" />
                                                    Priority Skill Gaps
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {tj.gapAnalysis.topSkillGaps.map((gap, idx) => (
                                                        <div key={idx} className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="font-bold text-slate-900 dark:text-white">{gap.skill}</div>
                                                                <div className="flex gap-0.5">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < gap.importance ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mb-6">{gap.gapDescription}</p>

                                                            <div className="mt-auto space-y-3">
                                                                <div className="text-[9px] uppercase tracking-widest font-black text-slate-400">Actionable Evidence</div>
                                                                {gap.actionableEvidence.map((action, aidx) => (
                                                                    <div key={aidx} className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-800/30">
                                                                        <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
                                                                            <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                                                            {action.task}
                                                                        </div>
                                                                        <div className="text-[10px] text-slate-400">Prove it: {action.metric}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                                <div>Estimated Bridge Time: <span className="text-indigo-500 font-bold">{tj.gapAnalysis.estimatedTimeToBridge}</span></div>
                                                <div>Generated {new Date(tj.gapAnalysis.dateGenerated).toLocaleDateString()}</div>
                                            </div>

                                            {/* Roadmap Section */}
                                            {!tj.roadmap ? (
                                                <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex flex-col items-center text-center gap-6">
                                                    <Map className="w-12 h-12 text-indigo-500" />
                                                    <div>
                                                        <h4 className="text-xl font-bold mb-2">Build your 12-Month Trajectory</h4>
                                                        <p className="text-slate-400 text-sm max-w-md mx-auto">
                                                            Ready to bridge these gaps? We'll sequence your actionable tasks into a step-by-step professional roadmap.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleGenerateRoadmap(tj.id)}
                                                        disabled={activeAnalysisIds.has(`${tj.id}-roadmap`)}
                                                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                                                    >
                                                        {activeAnalysisIds.has(`${tj.id}-roadmap`) ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                {COACH_MESSAGES[coachMessageIndex]}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Calendar className="w-4 h-4" />
                                                                Generate Roadmap
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xl font-bold flex items-center gap-2">
                                                            <Calendar className="w-6 h-6 text-indigo-500" />
                                                            12-Month Trajectory
                                                        </h4>
                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                                            Month {Math.max(...tj.roadmap.map(m => m.month))} Projected
                                                        </div>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700/30">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Progress</span>
                                                            <span className="text-sm font-black text-indigo-500">
                                                                {Math.round((tj.roadmap.filter(m => m.status === 'completed').length / tj.roadmap.length) * 100)}%
                                                            </span>
                                                        </div>
                                                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5" style={{ minWidth: '100px' }}>
                                                            <div
                                                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                                style={{ width: `${(tj.roadmap.filter(m => m.status === 'completed').length / tj.roadmap.length) * 100}%` }}
                                                            />
                                                        </div>
                                                        <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                                {tj.roadmap.filter(m => m.status === 'completed').length} Completed
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                                                {tj.roadmap.filter(m => m.status !== 'completed').length} Remaining
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {[...Array(12)].map((_, i) => {
                                                            const month = i + 1;
                                                            const monthMilestones = tj.roadmap?.filter(m => m.month === month) || [];
                                                            if (monthMilestones.length === 0) return null;

                                                            return (
                                                                <div key={month} className="p-4 rounded-3xl border border-indigo-500/30 bg-indigo-50/10">
                                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Month {month}</div>
                                                                    <div className="space-y-2">
                                                                        {monthMilestones.map(m => (
                                                                            <div
                                                                                key={m.id}
                                                                                onClick={() => onToggleMilestone(tj.id, m.id)}
                                                                                className={`p-3 rounded-2xl border transition-all cursor-pointer relative group overflow-hidden ${m.status === 'completed'
                                                                                    ? 'bg-indigo-500/10 border-indigo-500/30'
                                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                                                                                    }`}
                                                                            >
                                                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${m.status === 'completed' ? 'bg-indigo-500' :
                                                                                    m.type === 'project' ? 'bg-blue-500' :
                                                                                        m.type === 'certification' ? 'bg-violet-500' :
                                                                                            m.type === 'metric' ? 'bg-indigo-500' : 'bg-slate-400'
                                                                                    }`} />

                                                                                <div className="flex items-start justify-between gap-2">
                                                                                    <div className="flex-1">
                                                                                        <div className={`text-[11px] font-bold mb-1 line-clamp-1 ${m.status === 'completed' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                                                                                            {m.title}
                                                                                        </div>
                                                                                        <div className="text-[9px] text-slate-400 flex items-center gap-1">
                                                                                            <span className="capitalize">{m.type}</span>
                                                                                            <span>•</span>
                                                                                            <span>{m.linkedSkill}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    {m.status === 'completed' && (
                                                                                        <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                                                                                    )}
                                                                                </div>
                                                                                {m.status === 'completed' && (
                                                                                    <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-[1px] pointer-events-none" />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800">
                            <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Career Goals Defined</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">To run a Gap Analysis, you first need to define a target role or career goal on the home screen.</p>
                            <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 max-w-lg mx-auto text-left flex gap-4">
                                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-slate-900 dark:text-white">Pro Tip</div>
                                    <p className="text-xs text-slate-500 mt-1">Go to the Home screen, toggle to <strong>Goal</strong>, and paste a job description or write your target outcome.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

