import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, Link as LinkIcon, FileText, Lock, Sparkles, Zap, Plus, Shield, PenTool, Bookmark, Loader2, TrendingUp } from 'lucide-react';

import type { ResumeProfile, SavedJob, TargetJob } from '../types';
import { Storage } from '../services/storageService';
import type { User } from '@supabase/supabase-js';
import { STORAGE_KEYS } from '../constants';


interface HomeInputProps {
    resumes: ResumeProfile[];
    onJobCreated: (job: SavedJob) => void;
    onTargetJobCreated: (goal: TargetJob) => void;
    onImportResume: (file: File) => Promise<void>;
    isParsing: boolean;
    importError: string | null;
    user: User | null;
    mode?: 'all' | 'apply' | 'goal';
    onNavigate?: (view: any) => void;
}

const HEADLINES = {
    all: [
        { text: "Optimize your", highlight: "Career" },
        { text: "Elevate your", highlight: "Potential" },
        { text: "Design your", highlight: "Path" },
        { text: "Scale your", highlight: "Ambition" }
    ],
    apply: [
        { text: "Land your", highlight: "Opening" },
        { text: "Ace the", highlight: "Application" },
        { text: "Master your", highlight: "Narrative" },
        { text: "Perfect your", highlight: "Fit" }
    ],
    goal: [
        { text: "Chart your", highlight: "Course" },
        { text: "Map your", highlight: "Growth" },
        { text: "Build your", highlight: "Roadmap" },
        { text: "Design your", highlight: "Future" }
    ]
};

const HomeInput: React.FC<HomeInputProps> = ({
    resumes,
    onJobCreated,
    onTargetJobCreated,
    onImportResume,
    isParsing,
    importError,
    user,
    mode = 'all',
    onNavigate,
}) => {
    const [url, setUrl] = useState('');
    const [isTargetMode, setIsTargetMode] = useState(mode === 'goal'); // Toggle: Apply vs Goal
    const [manualText, setManualText] = useState('');
    const [isManualMode, setIsManualMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isScrapingUrl, setIsScrapingUrl] = useState(false);

    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [pendingJobInput, setPendingJobInput] = useState<{ type: 'url' | 'text', content: string } | null>(null);

    const [shuffledCards, setShuffledCards] = useState<number[]>([]);
    const [activeHeadline, setActiveHeadline] = useState({ text: '', highlight: '' });

    // Sync mode prop with internal state if it changes
    useEffect(() => {
        if (mode === 'apply') setIsTargetMode(false);
        if (mode === 'goal') setIsTargetMode(true);
    }, [mode]);


    useEffect(() => {
        // Initialize shuffled cards
        const originalOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        const shuffled = [...originalOrder].sort(() => Math.random() - 0.5);
        setShuffledCards(shuffled);
    }, []);

    useEffect(() => {
        // Select random headline base on mode
        const v = mode === 'all'
            ? HEADLINES.all
            : (isTargetMode ? HEADLINES.goal : HEADLINES.apply);
        const randomChoice = v[Math.floor(Math.random() * v.length)];
        setActiveHeadline(randomChoice);
    }, [mode, isTargetMode, HEADLINES.all, HEADLINES.apply, HEADLINES.goal]);

    const [showBookmarkletTip, setShowBookmarkletTip] = useState(() => {
        return !localStorage.getItem(STORAGE_KEYS.BOOKMARKLET_TIP_DISMISSED);
    });

    // Bookmarklet Ref to bypass React security check for javascript: URLs
    const bookmarkletRef = React.useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (bookmarkletRef.current) {
            const code = `javascript:(function(){window.location.href='${window.location.origin}/?job='+encodeURIComponent(window.location.href);})();`;
            bookmarkletRef.current.href = code;
        }
    }, []);

    // Bookmarklet Handler: Check for ?job= URL param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const jobParam = params.get('job');
        if (jobParam) {
            try {
                // Decode if it was encoded
                const decodedUrl = decodeURIComponent(jobParam);
                setUrl(decodedUrl);
            } catch (e) {
                console.error('Failed to decode job param', e);
            }
        }
    }, []);

    const processJobInBackground = async (input: { type: 'url' | 'text', content: string }) => {
        const jobId = crypto.randomUUID();

        if (isTargetMode) {
            const newTarget: TargetJob = {
                id: jobId,
                title: 'New Target Goal',
                description: input.type === 'text' ? input.content : '',
                dateAdded: Date.now(),
            };
            await Storage.saveTargetJob(newTarget);
            onTargetJobCreated(newTarget);
        } else {
            const newJob: SavedJob = {
                id: jobId,
                company: 'New Job',
                position: 'Analyzing...',
                description: input.type === 'text' ? input.content : '',
                url: input.type === 'url' ? input.content : undefined,
                resumeId: resumes[0]?.id || 'master',
                dateAdded: Date.now(),
                status: 'analyzing',
            };
            await Storage.addJob(newJob);
            onJobCreated(newJob);
        }

        setManualText('');
        setUrl('');
        setError(null);
        setIsTargetMode(false);
        if (isManualMode && input.type === 'text') {
            setIsManualMode(false);
        }
    };

    const handleJobSubmission = (input: { type: 'url' | 'text', content: string }) => {
        if (resumes.length === 0) {
            setPendingJobInput(input);
            setShowResumePrompt(true);
        } else {
            processJobInBackground(input);
        }
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim() || isScrapingUrl) return;

        setError(null);
        setIsScrapingUrl(true);

        try {
            const { ScraperService } = await import('../services/scraperService');
            const text = await ScraperService.scrapeJobContent(url);
            handleJobSubmission({ type: 'text', content: text });
        } catch (err: any) {
            const msg = err.message;
            if (msg.includes("403") || msg.includes("Forbidden")) {
                setError("This site is protected from automated access.");
            } else if (msg.includes("timeout")) {
                setError("The connection timed out. The site might be slow.");
            } else {
                setError("Couldn't access that URL automatically.");
            }
        } finally {
            setIsScrapingUrl(false);
        }
    };

    const handleManualKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!manualText.trim()) return;
            handleJobSubmission({ type: 'text', content: manualText });
        }
    };

    useEffect(() => {
        if (resumes.length > 0 && pendingJobInput && showResumePrompt) {
            setShowResumePrompt(false);
            processJobInBackground(pendingJobInput);
            setPendingJobInput(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumes, pendingJobInput, showResumePrompt]);

    return (
        <div className="flex flex-col items-center justify-start animate-in fade-in duration-700 relative min-h-[80vh] pt-16 pb-12">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000" />
            </div>

            <div className={`w-full ${mode === 'all' ? 'max-w-[1920px]' : 'max-w-4xl'} px-4 relative`}>
                <div className="text-center mb-10">
                    <h2 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
                        {activeHeadline.text} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient-x">{activeHeadline.highlight}</span>
                    </h2>
                    <p className="text-2xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl mx-auto">
                        {mode === 'all'
                            ? "Tailor your resume and write your cover letter in seconds."
                            : isTargetMode
                                ? "Distill career paths into your personalized growth roadmap."
                                : "Tailor your resume for any opening with a single click."
                        }
                    </p>
                </div>

                {!isManualMode ? (
                    <>
                        {/* Mode Switcher moved above the input for cleaner card layout */}
                        {/* Mode Switcher moved above the input for cleaner card layout */}
                        {mode === 'all' && (
                            <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1920px] mx-auto px-12">
                                    {/* Action Card 1: JobFit */}
                                    <button
                                        onClick={() => onNavigate?.('job-fit')}
                                        className="group relative bg-indigo-50/50 dark:bg-indigo-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-indigo-500/10 dark:border-indigo-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-700" />
                                        <div className="flex items-start justify-between relative z-10 mb-6">
                                            <div className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <div className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">JobFit</div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 relative z-10">Analyze Job</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                            Tailor your resume for any opening with a single click.
                                        </p>

                                        {/* Abstract Mini-Mockup: Score Circle */}
                                        <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent" />
                                            <div className="relative w-14 h-14 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
                                                    <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray="150.8" strokeDashoffset="30.16" className="text-indigo-500 group-hover:stroke-indigo-400 transition-colors" />
                                                </svg>
                                                <span className="absolute text-[10px] font-black text-slate-900 dark:text-white">98%</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                            <span>Get Hired</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </button>

                                    {/* Action Card 2: JobCoach */}
                                    <button
                                        onClick={() => onNavigate?.('coach-home')}
                                        className="group relative bg-emerald-50/50 dark:bg-emerald-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-emerald-500/10 dark:border-emerald-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
                                        <div className="flex items-start justify-between relative z-10 mb-6">
                                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Coach</div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 relative z-10">Career Roadmap</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                            Build your roadmap to land major target roles.
                                        </p>

                                        {/* Abstract Mini-Mockup: Roadmap Line */}
                                        <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center px-4 overflow-hidden">
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/5 to-transparent" />
                                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 relative rounded-full">
                                                <div className="absolute inset-y-0 left-0 w-2/3 bg-emerald-500 rounded-full group-hover:w-3/4 transition-all duration-1000" />
                                                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-full shadow-sm" />
                                                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-full shadow-sm" />
                                                <div className="absolute top-1/2 left-2/3 -translate-y-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-lg animate-pulse" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                            <span>Scale Up</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </button>

                                    {/* Action Card 3: Skills Arsenal */}
                                    <button
                                        onClick={() => onNavigate?.('skills')}
                                        className="group relative bg-amber-50/50 dark:bg-amber-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-amber-500/10 dark:border-amber-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-700" />
                                        <div className="flex items-start justify-between relative z-10 mb-6">
                                            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                                                <Zap className="w-6 h-6" />
                                            </div>
                                            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Base</div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 relative z-10">Skills Arsenal</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                            Identify and bridge your skill gaps with AI.
                                        </p>

                                        {/* Abstract Mini-Mockup: Skill Blocks */}
                                        <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex flex-col items-center justify-center gap-2 px-4 overflow-hidden">
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-amber-500/5 to-transparent" />
                                            <div className="flex gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600"><div className="w-4 h-1 bg-amber-500 rounded-full" /></div>
                                                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform"><Sparkles className="w-4 h-4 text-white" /></div>
                                                <div className="w-8 h-8 rounded-lg bg-amber-500/20" />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="w-12 h-2 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                                <div className="w-8 h-2 bg-amber-500/40 rounded-full" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                            <span>Audit Gaps</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </button>

                                    {/* Action Card 4: Resume Manager */}
                                    <button
                                        onClick={() => onNavigate?.('resumes')}
                                        className="group relative bg-rose-50/50 dark:bg-rose-500/5 backdrop-blur-xl rounded-[2.5rem] p-6 border border-rose-500/10 dark:border-rose-500/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 text-left overflow-hidden h-full flex flex-col"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all duration-700" />
                                        <div className="flex items-start justify-between relative z-10 mb-6">
                                            <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform duration-500">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Profiles</div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 relative z-10">Master Resumes</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 relative z-10 flex-grow">
                                            Store and edit your master profiles.
                                        </p>

                                        {/* Abstract Mini-Mockup: Stacked Documents */}
                                        <div className="relative h-20 bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-white/50 dark:border-slate-800/50 mb-4 flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-rose-500/5 to-transparent" />
                                            <div className="relative w-12 h-16 bg-white dark:bg-slate-900 rounded shadow-md border border-slate-200 dark:border-slate-800 transform -rotate-12 translate-x-2 translate-y-2 opacity-50" />
                                            <div className="relative w-12 h-16 bg-white dark:bg-slate-900 rounded shadow-lg border border-slate-200 dark:border-slate-800 group-hover:-translate-y-1 transition-transform" />
                                            <div className="absolute bottom-6 w-8 h-1 bg-rose-500/30 rounded-full" />
                                            <div className="absolute bottom-4 w-6 h-1 bg-rose-500/20 rounded-full" />
                                        </div>

                                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs group-hover:gap-3 transition-all relative z-10">
                                            <span>Manage All</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {mode !== 'all' && (
                            <div className="w-full max-w-3xl mx-auto animate-in zoom-in-95 fade-in duration-500">
                                <form onSubmit={error ? (e) => { e.preventDefault(); handleJobSubmission({ type: 'text', content: url }); } : handleUrlSubmit} className="relative group perspective-1000">
                                    <div className={`absolute -inset-1 rounded-[2.5rem] blur-xl transition-all duration-1000 ${error
                                        ? 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 opacity-75'
                                        : isScrapingUrl
                                            ? 'bg-gradient-to-r from-pink-500 via-indigo-500 to-violet-500 opacity-100 animate-pulse'
                                            : 'bg-gradient-to-r from-pink-500 via-indigo-500 to-violet-500 opacity-20 group-hover:opacity-100 animate-gradient-x'
                                        }`}></div>

                                    <div className={`relative bg-white dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800/30 rounded-[2.5rem] p-4 shadow-2xl flex flex-col md:flex-row items-center gap-4 transition-all duration-500 ease-in-out ${error ? 'min-h-[160px]' : 'min-h-[100px]'} group-hover:border-indigo-500/30 dark:group-hover:border-indigo-400/30`}>
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 ${isTargetMode ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
                                            {isScrapingUrl ? (
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            ) : (
                                                error ? <FileText className="h-8 w-8 text-orange-500" /> : <LinkIcon className="h-8 w-8 transition-colors" />
                                            )}
                                        </div>

                                        <div className="flex-1 w-full text-center md:text-left">
                                            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                {isTargetMode ? 'Your Destination' : 'Your Opening'}
                                            </div>

                                            {error ? (
                                                <textarea
                                                    value={url}
                                                    onChange={(e) => setUrl(e.target.value)}
                                                    placeholder="We couldn't access that URL. Please paste the job description here..."
                                                    className="w-full bg-transparent border-none rounded-xl text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none resize-none animate-in fade-in duration-300 min-h-[80px]"
                                                    autoFocus
                                                />
                                            ) : (
                                                <input
                                                    type="url"
                                                    value={url}
                                                    onChange={(e) => { setUrl(e.target.value); setError(null); }}
                                                    placeholder={isScrapingUrl
                                                        ? "Accessing job post..."
                                                        : isTargetMode
                                                            ? "Enter your target role or destination..."
                                                            : "Paste job URL to tailor your resume..."
                                                    }
                                                    className="w-full bg-transparent border-none rounded-xl text-lg font-medium text-slate-600 dark:text-slate-300 placeholder:text-slate-400 focus:ring-0 focus:outline-none transition-all duration-300"
                                                    autoFocus
                                                    disabled={isScrapingUrl}
                                                />
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!url.trim() || isScrapingUrl}
                                            className={`w-full md:w-auto px-8 py-5 rounded-2xl font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 ${isTargetMode
                                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                                }`}
                                        >
                                            {isScrapingUrl ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                isTargetMode ? <TrendingUp className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />
                                            )}
                                            <span>{isTargetMode ? 'Set Goal' : 'Analyze Job'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="mt-8 text-center animate-in fade-in duration-700">
                            {url.trim() && !isScrapingUrl && (
                                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                                    {isTargetMode
                                        ? "Build a roadmap for your next big move"
                                        : "Tailor documents for an active opening"
                                    }
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="relative">
                            <textarea
                                className={`w-full h-64 p-4 text-sm bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all resize-none ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-50/50' : 'border-slate-200 focus:border-indigo-500'}`}
                                placeholder={error
                                    ? "We couldn't scrape that URL. Please paste the full job description here..."
                                    : isTargetMode
                                        ? "Paste the description of your target outcome or destination here... Press ENTER to submit"
                                        : "Paste job description... Press ENTER to submit"
                                }
                                value={manualText}
                                onChange={(e) => setManualText(e.target.value)}
                                onKeyDown={handleManualKeyDown}
                                autoFocus
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-slate-400 pointer-events-none bg-white/80 px-2 py-1 rounded backdrop-blur-sm">
                                Press <strong>Enter</strong> to analyze • <strong>Shift+Enter</strong> for new line
                            </div>
                            {error && (
                                <div className="absolute top-4 right-4 text-red-500 animate-pulse">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <button
                                onClick={() => { setIsManualMode(false); setError(null); }}
                                className="text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold px-4 py-2 transition-colors"
                            >
                                Back to URL
                            </button>

                            <button
                                onClick={() => {
                                    if (!manualText.trim()) return;
                                    handleJobSubmission({ type: 'text', content: manualText });
                                }}
                                disabled={!manualText.trim()}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                <Sparkles className="w-4 h-4" />
                                Analyze Job
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center h-6">
                    {error && isManualMode && (
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    )}
                </div>
            </div>

            {/* Logged In User: Bookmarklet Tip */}
            {user && showBookmarkletTip && (
                <div className="w-full max-w-xl px-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 to-transparent pointer-events-none" />

                        <div className="flex items-center gap-4 relative z-10 flex-1">
                            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                                <Bookmark className="w-5 h-5" />
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                <strong className="font-semibold text-slate-900 dark:text-sky-100 block mb-0.5">Save from anywhere</strong>
                                Drag the button to your bookmarks bar to save jobs from any site.
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                            <a
                                href={`javascript:(function(){window.open('${window.location.origin}/?job='+encodeURIComponent(window.location.href),'_blank');})();`}
                                className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-sky-500 transition-colors cursor-grab active:cursor-grabbing hover:scale-105 whitespace-nowrap"
                                onClick={(e) => e.preventDefault()}
                                title="Drag me to your bookmarks bar!"
                            >
                                <Plus className="w-3 h-3" />
                                Save to JobFit
                            </a>
                            <button
                                onClick={() => {
                                    setShowBookmarkletTip(false);
                                    localStorage.setItem(STORAGE_KEYS.BOOKMARKLET_TIP_DISMISSED, 'true');
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                            >
                                <div className="sr-only">Dismiss</div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resume Upload Modal */}
            {showResumePrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center animate-in zoom-in-95 duration-200 relative">
                        <button
                            onClick={() => { setShowResumePrompt(false); setPendingJobInput(null); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
                        >
                            <ArrowRight className="w-4 h-4 rotate-45" />
                        </button>

                        <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-8 h-8" />
                        </div>

                        <h2 className="text-2xl font-bold text-slate-900 mb-2">One last step!</h2>
                        <p className="text-slate-500 mb-8">
                            To tailor your application for this job, we need your resume.
                        </p>

                        <label className={`
                            block w-full border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
                            ${isParsing
                                ? 'border-indigo-300 bg-indigo-50 cursor-wait'
                                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
                            }
                        `}>
                            <input
                                type="file"
                                accept=".pdf,.txt"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        onImportResume(e.target.files[0]);
                                    }
                                }}
                                disabled={isParsing}
                            />

                            {isParsing ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-medium text-indigo-600">Analyzing Resume...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-700">Upload PDF or Text</span>
                                    <span className="text-xs text-slate-400">We'll extract your experience blocks locally.</span>
                                </div>
                            )}
                        </label>

                        {importError && (
                            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2 text-rose-600 text-sm text-left">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <p>{importError}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bento Grid Features - Only for Non-Logged In Users */}
            {!user && shuffledCards.length > 0 && (
                <div className="mt-16 w-full max-w-[1600px] mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
                        {shuffledCards.map((index) => {
                            switch (index) {
                                case 0: return (
                                    /* Card 1: Speed (Flash) */
                                    <div key="card-1" className="bg-blue-50 dark:bg-slate-900 rounded-3xl p-8 border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:rotate-12 transition-transform">
                                            <Zap className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            JobFit Score
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                            Stop guessing. Get an instant 0-100 compatibility rating for any job description.
                                        </p>
                                        {/* Visual for Score */}
                                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-blue-100 dark:border-slate-800 shadow-sm flex items-center justify-center h-40">
                                            <div className="relative w-28 h-28 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                                                    <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="314.159" strokeDashoffset="6.28" className="text-blue-600 dark:text-blue-400 animate-[dash_1.5s_ease-in-out_forwards]" />
                                                </svg>
                                                <span className="absolute text-2xl font-black text-slate-900 dark:text-white">98<span className="text-xs text-blue-600">%</span></span>
                                            </div>
                                        </div>
                                    </div>
                                );
                                case 1: return (
                                    /* Card 2: Keyword Targeting */
                                    <div key="card-2" className="bg-violet-50 dark:bg-slate-900 rounded-3xl p-8 border border-violet-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                                        <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 group-hover:rotate-12 transition-transform">
                                            <Sparkles className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            Keyword Targeting
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                            Beat the ATS. We identify exactly which skills and keywords your resume is missing.
                                        </p>
                                        {/* Visual for Keywords */}
                                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-violet-100 dark:border-slate-800 shadow-sm space-y-3 h-40 overflow-hidden relative">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Detected Keywords</div>
                                            <div className="flex flex-wrap gap-2">
                                                {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Cloud Infrastructure'].map((s, i) => (
                                                    <span key={i} className={`px-2 py-1 rounded-md text-[10px] font-bold ${i < 3 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                                        {i < 3 ? '✓' : '+'} {s}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white dark:from-slate-950 to-transparent" />
                                        </div>
                                    </div>
                                );
                                case 2: return (
                                    /* Card 3: Privacy (Lock) */
                                    <div key="card-3" className="bg-emerald-50 dark:bg-slate-900 rounded-3xl p-8 border border-emerald-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:rotate-12 transition-transform">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            Private Vault
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                            Your data stays yours. Encrypted local storage that we can't access or train on.
                                        </p>
                                        {/* Visual for Privacy */}
                                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-emerald-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center h-40 gap-3 relative overflow-hidden">
                                            <div className="p-4 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full animate-pulse">
                                                <Shield className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">AES-256</span>
                                                <span className="text-[10px] text-emerald-600 font-bold">✓ Encrypted</span>
                                            </div>
                                            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-100/50 dark:bg-grid-slate-800/20 [mask-image:radial-gradient(white,transparent)]" />
                                        </div>
                                    </div>
                                );
                                case 3: return (
                                    /* Card 4: Tailored Cover Letters */
                                    <div key="card-4" className="bg-orange-50 dark:bg-slate-900 rounded-3xl p-8 border border-orange-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 group-hover:rotate-12 transition-transform">
                                            <PenTool className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            Smart Cover Letters
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                            Not just templates. We write unique, persuasive letters that cite your actual experience.
                                        </p>
                                        {/* Visual for Writing */}
                                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-orange-100 dark:border-slate-800 shadow-sm flex flex-col h-40 gap-3 overflow-hidden group-hover:border-orange-200 transition-colors">
                                            <div className="w-2/3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                            <div className="w-5/6 h-2 bg-orange-100/50 dark:bg-orange-800/30 rounded-full" />
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                            <div className="w-3/4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                        </div>
                                    </div>
                                );
                                case 4: return (
                                    /* Card 5: Professional Summary */
                                    <div key="card-5" className="bg-rose-50 dark:bg-slate-900 rounded-3xl p-8 border border-rose-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 group-hover:rotate-12 transition-transform">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            Tailored Summaries
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                            We rewrite your professional summary to perfection for every single application.
                                        </p>
                                        {/* Visual for Highlights */}
                                        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-40 flex flex-col justify-center">
                                            <div className="h-6 w-3/4 bg-white/20 rounded-md mb-2 flex items-center px-2">
                                                <div className="h-1.5 w-full bg-white/40 rounded-full"></div>
                                            </div>
                                            <div className="h-6 w-1/2 bg-white/40 rounded-md mb-2 flex items-center px-2">
                                                <div className="h-1.5 w-full bg-white/60 rounded-full"></div>
                                            </div>
                                            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                                        </div>
                                    </div>
                                );
                                case 5: return (
                                    /* Card 6: Bookmarklet (Informational) */
                                    <div key="card-6" className="bg-sky-50 dark:bg-slate-900 rounded-3xl p-8 border border-sky-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col ring-2 ring-transparent hover:ring-sky-500/20">
                                        <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400 mb-6 group-hover:rotate-12 transition-transform">
                                            <Bookmark className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            Save from Anywhere
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                            Found a job on LinkedIn or Indeed? Save it to JobFit with a single click.
                                        </p>
                                        {/* Visual for Bookmarklet Info */}
                                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-sky-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center h-40 gap-3 relative overflow-hidden">
                                            {/* Browser Bar Illustration */}
                                            <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-t-lg flex items-center px-3 gap-1.5 opacity-60">
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                            </div>
                                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 mb-2"></div>

                                            <div
                                                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg font-bold shadow-md text-sm z-10 opacity-70 cursor-default"
                                                title="Available after login"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Save to JobFit
                                            </div>

                                            <div className="absolute bottom-4 right-10 text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 -rotate-6">
                                                Bookmarks Bar
                                            </div>
                                        </div>
                                    </div>
                                );
                                case 6: return (
                                    /* Card 7: AI Career Coach (Gap Analysis) */
                                    <div key="card-7" className="bg-emerald-50 dark:bg-slate-900 rounded-3xl p-8 border border-emerald-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            AI Career Coach
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                            Identify the exact skills you need for your next level. Automated gap analysis across all your target roles.
                                        </p>
                                        {/* Visual for Gap Analysis */}
                                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-emerald-100 dark:border-slate-800 shadow-sm flex flex-col justify-center h-40 gap-3 group-hover:border-emerald-200 transition-colors relative overflow-hidden">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                                    <div className="h-2 w-12 bg-emerald-500 rounded-full"></div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="h-2 w-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                                    <div className="h-2 w-8 bg-emerald-300 rounded-full"></div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="h-2 w-16 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                                    <div className="h-2 w-10 bg-emerald-400 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 bg-emerald-50/10 dark:bg-emerald-900/5 flex items-center justify-center">
                                                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-emerald-100 dark:border-emerald-800 flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Analyzing Gaps...</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                                case 7: return (
                                    /* Card 8: Role Model Synthesis */
                                    <div key="card-8" className="bg-teal-50 dark:bg-slate-900 rounded-3xl p-8 border border-teal-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 group-hover:rotate-6 transition-transform">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            Role Model Synthesis
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                            Import LinkedIn profiles of people whose careers you admire. We synthesize their paths into your strategy.
                                        </p>
                                        {/* Visual for Role Models */}
                                        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-teal-100 dark:border-slate-800 shadow-sm flex items-center justify-around h-40 group-hover:border-teal-200 transition-colors relative overflow-hidden">
                                            <div className="flex flex-col items-center gap-2 opacity-40">
                                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                                <div className="h-1.5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 relative z-10 scale-110">
                                                <div className="w-12 h-12 bg-teal-500 text-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                                    <Plus className="w-6 h-6" />
                                                </div>
                                                <div className="h-2 w-16 bg-teal-100 dark:bg-teal-900/50 rounded-full"></div>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 opacity-40">
                                                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                                <div className="h-1.5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                                            </div>
                                            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent"></div>
                                        </div>
                                    </div>
                                );
                                case 8: return (
                                    /* Card 9: 12-Month Roadmap */
                                    <div key="card-9" className="bg-emerald-50 dark:bg-slate-900 rounded-3xl p-8 border border-emerald-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:-translate-y-1 transition-transform">
                                            <ArrowRight className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                            12-Month Roadmap
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                            Transition from "Applying" to "Building". Get a month-by-month execution plan to land your target role.
                                        </p>
                                        {/* Visual for Roadmap */}
                                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-40 flex flex-col justify-center group-hover:brightness-110 transition-all">
                                            <div className="space-y-3 relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold">1</div>
                                                    <div className="h-2 flex-grow bg-white/30 rounded-full overflow-hidden">
                                                        <div className="h-full w-full bg-white animate-[shimmer_2s_infinite]"></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold">2</div>
                                                    <div className="h-2 flex-grow bg-white/20 rounded-full"></div>
                                                </div>
                                                <div className="flex items-center gap-3 opacity-60">
                                                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px] font-bold">3</div>
                                                    <div className="h-2 flex-grow bg-white/10 rounded-full"></div>
                                                </div>
                                            </div>
                                            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                        </div>
                                    </div>
                                );
                                default: return null;
                            }
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeInput;
