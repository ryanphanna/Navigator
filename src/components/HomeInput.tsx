import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, Link as LinkIcon, FileText, CheckCircle, Lock, Sparkles, Zap, Check, Plus, Shield, PenTool, Bookmark } from 'lucide-react';
import { ScraperService } from '../services/scraperService';
import { analyzeJobFit } from '../services/geminiService';
import type { ResumeProfile, SavedJob } from '../types';
import { Storage } from '../services/storageService';
import type { User } from '@supabase/supabase-js';
import { getUserFriendlyError } from '../utils/errorMessages';


interface HomeInputProps {
    resumes: ResumeProfile[];
    onJobCreated: (job: SavedJob) => void;
    onJobUpdated: (job: SavedJob) => void;
    onImportResume: (file: File) => Promise<void>;
    isParsing: boolean;
    importError: string | null;
    user: User | null;
}

const HomeInput: React.FC<HomeInputProps> = ({
    resumes,
    onJobCreated,
    onJobUpdated,
    onImportResume,
    isParsing,
    importError,
    user,
}) => {
    const [url, setUrl] = useState('');
    const [manualText, setManualText] = useState('');
    const [isManualMode, setIsManualMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [pendingJobInput, setPendingJobInput] = useState<{ type: 'url' | 'text', content: string } | null>(null);

    const [showBookmarkletTip, setShowBookmarkletTip] = useState(() => {
        return !localStorage.getItem('jobfit_bookmarklet_tip_dismissed');
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
                // Optional: Scroll to top? The input is already at the top.
            } catch (e) {
                console.error('Failed to decode job param', e);
            }
        }
    }, []);



    const processJobInBackground = async (input: { type: 'url' | 'text', content: string }) => {
        const jobId = crypto.randomUUID();

        // 1. Create the placeholder job immediately
        const newJob: SavedJob = {
            id: jobId,
            company: 'Analyzing...',
            position: 'Analyzing...',
            description: '',
            resumeId: resumes[0]?.id || 'master', // Default to first resume
            dateAdded: Date.now(),
            status: 'analyzing',
        };

        // 2. Add to state immediately
        await Storage.addJob(newJob);
        onJobCreated(newJob);
        setLastSubmittedId(jobId);

        // 3. Clear inputs immediately so user is unblocked
        setManualText('');
        setUrl('');
        setError(null);
        if (isManualMode && input.type === 'text') {
            setIsManualMode(false);
        }

        // 4. Run scraping and analysis in background
        try {
            let textToAnalyze = input.type === 'text' ? input.content : '';

            // If URL, we need to scrape first
            if (input.type === 'url') {
                try {
                    // Use the robust ScraperService (Edge Function)
                    textToAnalyze = await ScraperService.scrapeJobText(input.content);

                    if (!textToAnalyze) {
                        throw new Error("Could not extract text from this URL.");
                    }
                } catch (scrapeError) {
                    console.error("Scraping failed:", scrapeError);
                    const failedJob: SavedJob = { ...newJob, status: 'error', analysis: undefined };
                    onJobUpdated(failedJob);
                    return; // Stop processing
                }
            }

            const analysis = await analyzeJobFit(
                textToAnalyze,
                resumes,
                (message) => setStatusMessage(message)  // Show retry progress
            );

            setStatusMessage(null);  // Clear status after success

            const updatedJob: SavedJob = {
                ...newJob,
                description: textToAnalyze, // Save the text we successfully got
                status: 'analyzing',
                analysis: analysis
            };

            onJobUpdated(updatedJob);
        } catch (err) {
            setStatusMessage(null);
            const friendlyError = getUserFriendlyError(err as Error);
            setError(friendlyError);

            const failedJob: SavedJob = {
                ...newJob,
                status: 'error',
                analysis: undefined
            };
            onJobUpdated(failedJob);
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

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) return;
        handleJobSubmission({ type: 'url', content: url });
    };

    const handleManualKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!manualText.trim()) return;
            handleJobSubmission({ type: 'text', content: manualText });
        }
    };

    // Auto-resume processing if a resume is uploaded and we have pending input
    React.useEffect(() => {
        if (resumes.length > 0 && pendingJobInput && showResumePrompt) {
            // Slight delay to allow UI to settle/close modal nicely if needed, or just go immediately
            setShowResumePrompt(false);
            processJobInBackground(pendingJobInput);
            setPendingJobInput(null);
        }
    }, [resumes, pendingJobInput, showResumePrompt]);

    const switchToManual = () => {
        setError(null);
        setIsManualMode(true);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in duration-700 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full pointer-events-none -z-10">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob" />
                <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000" />
            </div>

            <div className="w-full max-w-xl px-4 relative">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-center text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                    Land your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient-x">dream job</span>
                </h2>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-10 text-lg leading-relaxed max-w-2xl mx-auto">
                    We'll tailor your resume and write your cover letter in seconds.
                </p>

                {!isManualMode ? (
                    <>
                        <form onSubmit={handleUrlSubmit} className="relative group perspective-1000">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-indigo-500 to-violet-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-focus-within:opacity-100"></div>
                            <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-xl">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none pl-2">
                                    <LinkIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Paste job URL here..."
                                    className="w-full pl-14 pr-16 py-4 bg-transparent border-none rounded-xl text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!url.trim()}
                                    className="absolute inset-y-2 right-2 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-0 disabled:translate-x-4 transition-all duration-300 font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    <span>Start</span>
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={switchToManual}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-slate-100"
                            >
                                <FileText className="w-4 h-4" />
                                Or paste text manually
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="relative">
                            <textarea
                                className={`w-full h-64 p-4 text-sm bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all resize-none ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-50/50' : 'border-slate-200 focus:border-indigo-500'}`}
                                placeholder={error ? "We couldn't scrape that URL. Please paste the full job description here..." : "Paste job description... Press ENTER to submit"}
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

                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => { setIsManualMode(false); setError(null); }}
                                className="text-sm text-slate-500 hover:text-slate-800 font-medium px-2"
                            >
                                Back to URL
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center h-6">
                    {statusMessage && (
                        <div className="flex items-center justify-center gap-2 text-sm text-amber-600 font-medium animate-in fade-in slide-in-from-bottom-2">
                            <Sparkles className="w-4 h-4 animate-spin" />
                            {statusMessage}
                        </div>
                    )}
                    {!statusMessage && lastSubmittedId && !manualText && !url && (
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle className="w-4 h-4" />
                            Job added to processing queue
                        </div>
                    )}
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
                                    localStorage.setItem('jobfit_bookmarklet_tip_dismissed', 'true');
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
            {!user && (
                <div className="mt-10 w-full max-w-[1600px] mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
                        {/* Card 1: Speed (Flash) */}
                        <div className="bg-blue-50 dark:bg-slate-900 rounded-3xl p-8 border border-blue-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
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
                            <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-blue-100 dark:border-slate-800 shadow-sm flex items-center justify-center h-40 relative overflow-hidden group-hover:border-blue-200 transition-colors">
                                <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/10"></div>

                                {/* Animated Circle */}
                                <div className="relative z-10 w-24 h-24 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        {/* Background Track */}
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-blue-100 dark:text-blue-900/30" />
                                        {/* Animated Progress */}
                                        <circle
                                            cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray="251.2"
                                            strokeDashoffset="251.2"
                                            className="text-blue-500 animate-[dash_3s_ease-in-out_infinite]"
                                            style={{ '--tw-animate-dash': '5' } as React.CSSProperties}
                                        />
                                        <style>{`
                                        @keyframes dash {
                                            0%, 100% { stroke-dashoffset: 251.2; }
                                            50% { stroke-dashoffset: 5; }
                                        }
                                    `}</style>
                                    </svg>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                                            98<span className="text-sm align-top">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Tailoring (Sparkles) */}
                        <div className="bg-violet-50 dark:bg-slate-900 rounded-3xl p-8 border border-violet-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                Keyword Targeting
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                Beat the ATS. We identify exactly which skills and keywords your resume is missing.
                            </p>
                            {/* Visual for Keywords */}
                            <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-violet-100 dark:border-slate-800 shadow-sm flex flex-col justify-center h-40 gap-3 group-hover:border-violet-200 transition-colors">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                    <Zap className="w-3 h-3 text-violet-400" /> Detected Keywords
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium flex items-center gap-1.5 border border-green-100 dark:border-green-800 animate-[pulse_2s_infinite]">
                                        <Check className="w-3 h-3" /> React
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm font-medium flex items-center gap-1.5 border border-green-100 dark:border-green-800 animate-[pulse_2s_infinite] delay-700">
                                        <Check className="w-3 h-3" /> TypeScript
                                    </span>
                                    <span className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-sm font-medium flex items-center gap-1.5 border border-rose-100 dark:border-rose-800 animate-[pulse_2s_infinite] delay-1000">
                                        <Plus className="w-3 h-3" /> Node.js
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Privacy (Lock) */}
                        <div className="bg-emerald-50 dark:bg-slate-900 rounded-3xl p-8 border border-emerald-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:rotate-y-180 transition-transform duration-700">
                                <Lock className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                Private Vault
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                Your data stays yours. Encrypted local storage that we can't access or train on.
                            </p>
                            {/* Visual for Privacy */}
                            <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-emerald-100 dark:border-slate-800 shadow-sm flex items-center justify-center h-40 group-hover:border-emerald-200 transition-colors overflow-hidden relative">
                                {/* Scanning Beam */}
                                <div className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-emerald-100/50 to-transparent skew-x-12 animate-[shimmer_2s_infinite] -translate-x-full"></div>

                                <div className="relative">
                                    <div className="absolute -inset-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-xl animate-pulse"></div>
                                    <Shield className="w-16 h-16 text-emerald-500 relative z-10" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                        <Lock className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="ml-6 relative z-10">
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">AES-256</div>
                                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full mt-1">
                                        <Check className="w-3 h-3" /> Encrypted
                                    </div>
                                </div>

                                <style>{`
                                @keyframes shimmer {
                                    100% { transform: translateX(200%); }
                                }
                             `}</style>
                            </div>
                        </div>

                        {/* --- Row 2 --- */}

                        {/* Card 4: Smart Cover Letters */}
                        <div className="bg-orange-50 dark:bg-slate-900 rounded-3xl p-8 border border-orange-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 group-hover:-rotate-12 transition-transform">
                                <PenTool className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                Smart Cover Letters
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                Not just templates. We write unique, persuasive letters that cite your actual experience.
                            </p>
                            {/* Visual for Cover Letter */}
                            <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-orange-100 dark:border-slate-800 shadow-sm flex flex-col justify-center h-40 relative overflow-hidden group-hover:border-orange-200 transition-colors">
                                <div className="space-y-3 relative z-10 px-2 opacity-50 blur-[0.5px]">
                                    <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                    <div className="h-2 w-5/6 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                    <div className="h-2 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                </div>
                                {/* Animated Pen */}
                                <div className="absolute right-8 bottom-8 text-orange-500 animate-[bounce_2s_infinite]">
                                    <PenTool className="w-8 h-8 filter drop-shadow-lg" />
                                </div>
                            </div>
                        </div>

                        {/* Card 5: Tailored Summaries */}
                        <div className="bg-pink-50 dark:bg-slate-900 rounded-3xl p-8 border border-pink-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 mb-6 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                                Tailored Summaries
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-grow">
                                We rewrite your professional summary to perfection for every single application.
                            </p>
                            {/* Visual for Summary */}
                            <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden h-40 flex items-center justify-center group-hover:brightness-110 transition-all">
                                <div className="text-center relative z-10">
                                    <div className="text-xs font-medium opacity-80 mb-1 uppercase tracking-widest">Re-Writing</div>
                                    <div className="text-lg font-bold">"Data-Driven PM..."</div>
                                </div>
                                {/* Floating particles */}
                                <div className="absolute inset-0">
                                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                                    <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping delay-300"></div>
                                </div>
                            </div>
                        </div>

                        {/* Card 6: Bookmarklet (Informational) */}
                        <div className="bg-sky-50 dark:bg-slate-900 rounded-3xl p-8 border border-sky-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group flex flex-col ring-2 ring-transparent hover:ring-sky-500/20">
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

                                <a
                                    ref={bookmarkletRef}
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg font-bold shadow-md text-sm z-10 hover:bg-sky-700 transition-colors cursor-grab active:cursor-grabbing"
                                    title="Drag me to your bookmarks bar"
                                >
                                    <Plus className="w-3 h-3" />
                                    Save to JobFit
                                </a>

                                <div className="absolute bottom-4 right-10 text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 -rotate-6">
                                    Bookmarks Bar
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CTA Section - Only for guests */}



        </div>
    );
};

export default HomeInput;
