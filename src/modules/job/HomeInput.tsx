import React, { useState, useEffect } from 'react';
import { AlertCircle, Link as LinkIcon, FileText, Plus, Bookmark, Loader2, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { LandingContent } from './LandingContent';
import { MarketingGrid } from './MarketingGrid';
import { ActionGrid } from './ActionGrid';
import { UsageIndicator } from './UsageIndicator';

import type { ResumeProfile, SavedJob, TargetJob } from '../../types';
import { Storage } from '../../services/storageService';
import type { User } from '@supabase/supabase-js';
import type { UsageStats } from '../../services/usageLimits';
import { STORAGE_KEYS } from '../../constants';


interface HomeInputProps {
    resumes: ResumeProfile[];
    onJobCreated: (job: SavedJob) => void;
    onTargetJobCreated: (goal: TargetJob) => void;
    onImportResume: (file: File) => Promise<void>;
    isParsing: boolean;
    importError: string | null;
    isAdmin?: boolean;
    isTester?: boolean;
    user: User | null;
    usageStats?: UsageStats;
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
        { text: "Own your", highlight: "Narrative" },
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
    isAdmin = false,
    isTester = false,
    user,
    usageStats,
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

    // ActionGrid handles its own card logic now
    const [activeHeadline, setActiveHeadline] = useState({ text: '', highlight: '' });

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
            // Persist the URL from the input field if we're submitting text (fallback scenario)
            // or if it was a direct URL submission
            const sourceUrl = input.type === 'url' ? input.content : (url.trim().startsWith('http') ? url.trim() : undefined);

            const newJob: SavedJob = {
                id: jobId,
                company: 'Analyzing...',
                position: 'New Opportunity',
                description: input.type === 'text' ? input.content : '',
                url: sourceUrl,
                resumeId: resumes[0]?.id || 'master',
                dateAdded: Date.now(),
                status: 'analyzing', // Start in analyzing state
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
        const trimmedUrl = url.trim();
        if (!trimmedUrl || isScrapingUrl) return;

        // Smart Detection: If it doesn't look like a URL and is substantial text, treat as manual input
        const isLikelyUrl = trimmedUrl.startsWith('http') || (trimmedUrl.includes('.') && !trimmedUrl.includes(' '));

        if (!isLikelyUrl && trimmedUrl.length > 50) {
            handleJobSubmission({ type: 'text', content: trimmedUrl });
            return;
        }

        setError(null);
        setIsScrapingUrl(true);

        try {
            const { ScraperService } = await import('../../services/scraperService');
            const text = await ScraperService.scrapeJobContent(trimmedUrl);
            handleJobSubmission({ type: 'text', content: text });
        } catch (err: any) {
            const msg = err.message;
            if (msg.includes("403") || msg.includes("Forbidden")) {
                setError("This site blocks automated access. Please paste the job description below:");
            } else if (msg.includes("timeout")) {
                setError("The connection timed out. Please paste the job description below:");
            } else {
                setError("Couldn't access that URL. Please paste the job description below:");
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
                {user && (
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
                )}

                {!isManualMode ? (
                    <>
                        {/* Mode Switcher moved above the input for cleaner card layout */}
                        {/* Mode Switcher moved above the input for cleaner card layout */}
                        {user && mode === 'all' && (
                            <ActionGrid onNavigate={onNavigate} isAdmin={isAdmin} isTester={isTester} />
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
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                    {isTargetMode ? 'Your Destination' : 'Your Opening'}
                                                </div>
                                                {error && (
                                                    <span className="text-xs font-bold text-orange-500 flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Scrape Blocked
                                                    </span>
                                                )}
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

                                {/* Usage Indicator for Free Tier (not shown to admins) */}
                                {user && !isAdmin && (
                                    <UsageIndicator usageStats={usageStats} />
                                )}
                            </div>
                        )}


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

            {/* Bento Grid Features - Only for Non-Logged In Users (Extracted to MarketingGrid) */}
            {!user && <MarketingGrid />}

            {/* Additional Landing Content for Logged Out Users */}
            {!user && <LandingContent />}
        </div>
    );
};

export default HomeInput;
