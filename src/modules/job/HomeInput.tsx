import React, { useState, useEffect } from 'react';
import {
    AlertCircle,
    Link as LinkIcon,
    FileText,
    Plus,
    Bookmark,
    Loader2,
    ArrowRight,
    TrendingUp,
    Sparkles,
} from 'lucide-react';
import { DropZone } from '../../components/common/DropZone';
import { NotificationBanner } from '../../components/common/NotificationBanner';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { FeatureGrid } from './FeatureGrid';
import { EventService } from '../../services/eventService';
import { UsageIndicator } from './UsageIndicator';
import { useToast } from '../../contexts/ToastContext';
import { useHeadlines } from '../../hooks/useHeadlines';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

import type { ResumeProfile, SavedJob } from '../../types';
import type { User } from '@supabase/supabase-js';
import type { UsageStats } from '../../services/usageLimits';
import { STORAGE_KEYS, TRACKING_EVENTS } from '../../constants';

interface HomeInputProps {
    resumes: ResumeProfile[];
    onJobCreated: (job: SavedJob) => void;
    onTargetJobCreated: (url: string) => void;
    onImportResume: (file: File) => Promise<void>;
    onClearError?: () => void;
    isParsing: boolean;
    importError: string | null;
    isAdmin?: boolean;
    isTester?: boolean;
    user: User | null;
    usageStats?: UsageStats;
    mode?: 'all' | 'apply' | 'goal' | 'home';
    onNavigate?: (view: string) => void;
    onShowAuth?: (feature?: any) => void;
    journey?: string;
    userTier?: string;
}

const HomeInput: React.FC<HomeInputProps> = ({
    resumes,
    onJobCreated,
    onTargetJobCreated,
    onImportResume,
    onClearError,
    isParsing,
    importError,
    isAdmin = false,
    isTester = false,
    user,
    usageStats,
    mode = 'all',
    onNavigate,
    onShowAuth,
    journey = 'job-hunter',
    userTier = 'free',
}) => {
    const { showSuccess } = useToast();
    const [url, setUrl] = useState('');
    const [isTargetMode, setIsTargetMode] = useState(mode === 'goal'); // Toggle: Apply vs Goal
    const [manualText, setManualText] = useState('');
    const [isManualMode, setIsManualMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isScrapingUrl, setIsScrapingUrl] = useState(false);

    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [pendingJobInput, setPendingJobInput] = useState<{ type: 'url' | 'text', content: string } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);


    const headlineCategory = (mode === 'all' || mode === 'home')
        ? (journey === 'student' ? 'edu' : 'all')
        : (isTargetMode ? 'goal' : 'apply');

    const activeHeadline = useHeadlines(headlineCategory);

    // Ref to store the LAST URL attempted, so it persists even if we clear state for manual entry
    const lastUrlRef = React.useRef<string>('');

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

    // Reset state on mount to ensure fresh UI when navigating back
    useEffect(() => {
        setError(null);
        setIsManualMode(false);
        setUrl('');
        setManualText('');
        setIsScrapingUrl(false);
        setIsAnalyzing(false);

        return () => {
            if (onClearError) onClearError();
        };
    }, [onClearError]);

    // Bookmarklet Handler: Check for ?job= URL param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const jobParam = params.get('job');
        if (jobParam) {
            try {
                // Decode if it was encoded
                const decodedUrl = decodeURIComponent(jobParam);
                setUrl(decodedUrl);

                // Clear the param so it doesn't persist
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            } catch (e) {
                console.error('Failed to decode job param', e);
            }
        }
    }, []);

    const processJobInBackground = async (input: { type: 'url' | 'text', content: string }) => {
        const jobId = crypto.randomUUID();

        if (isTargetMode) {
            onTargetJobCreated(input.content);
        } else {
            // Persist the URL from the input field if we're submitting text (fallback scenario)
            // or if it was a direct URL submission. Fallback to ref if state was cleared.
            let potentialUrl = input.type === 'url' ? input.content : (lastUrlRef.current || url.trim());

            // If it doesn't start with http but looks like a domain, prepend https://
            if (potentialUrl && !potentialUrl.startsWith('http') && potentialUrl.includes('.') && !potentialUrl.includes(' ')) {
                potentialUrl = `https://${potentialUrl}`;
            }

            const sourceUrl = (potentialUrl && (potentialUrl.startsWith('http') || potentialUrl.includes('.')))
                ? potentialUrl
                : undefined;

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

            setIsAnalyzing(true);
            // Track real usage
            EventService.trackUsage(TRACKING_EVENTS.JOB_FIT);
            onJobCreated(newJob);

            setTimeout(() => {
                setIsAnalyzing(false);
                setIsManualMode(false);
                setUrl('');
                setManualText('');
            }, 3000);
        }

        // We clear these in the timeout now, but keeping them here for safety if target mode
        if (isTargetMode) {
            setManualText('');
            setUrl('');
        }
        setError(null);
        setIsTargetMode(false);
        if (isManualMode && input.type === 'text') {
            setIsManualMode(false);
        }
    };

    const handleJobSubmission = (input: { type: 'url' | 'text', content: string }) => {
        // Privacy Check: Only redirect brand new guest users
        const hasAcceptedPrivacy = localStorage.getItem(STORAGE_KEYS.PRIVACY_ACCEPTED);
        const isExistingUser = !!user || resumes.length > 0;

        if (!hasAcceptedPrivacy && !isExistingUser) {
            onNavigate?.('welcome');
            return;
        }

        // Defer Resume Support: Allow submission even without resume
        processJobInBackground(input);
    };



    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Defer auth: let guests type, but require sign-in to submit
        if (!user) {
            onShowAuth?.();
            return;
        }

        const trimmedUrl = url.trim();
        lastUrlRef.current = trimmedUrl; // Capture URL immediately

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
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setUrl(''); // Clear the URL so the textarea is ready for manual input
            if (msg.includes("403") || msg.includes("Forbidden")) {
                setError("This site blocks automated access. Please paste the job description below to continue:");
            } else if (msg.includes("timeout")) {
                setError("The connection timed out. Please paste the job description below to continue:");
            } else {
                setError("We couldn't reach that URL. Please paste the job description below to continue:");
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
            showSuccess("Job analysis started");
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
        <SharedPageLayout
            maxWidth={(mode === 'all' || mode === 'home') ? 'full' : '4xl'}
            className="relative theme-job"
            spacing="hero"
        >
            {/* Hero Background Elements */}
            {(mode === 'all' || mode === 'home') && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0">
                    <div className="absolute top-[-100px] left-1/4 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full animate-[pulse_8s_ease-in-out_infinite]" />
                    <div className="absolute top-[100px] right-1/4 w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full animate-[pulse_10s_ease-in-out_infinite_1s]" />
                </div>
            )}
            <PageHeader
                variant="hero"
                title={activeHeadline.text}
                highlight={activeHeadline.highlight}
                className="mb-8"
                subtitle={mode === 'all'
                    ? ""
                    : isTargetMode
                        ? "Distill career paths into your personalized growth roadmap."
                        : "Tailor your resume for any opening with a single click."
                }
            />


            {!isManualMode ? (
                <>
                    {/* Feature Grid first for everyone */}
                    {(mode === 'all' || mode === 'home') && (
                        <>
                            <FeatureGrid
                                user={user}
                                onNavigate={onNavigate}
                                onShowAuth={(feature) => onShowAuth?.(feature)}
                                isAdmin={isAdmin}
                                isTester={isTester}
                                userTier={userTier}
                                journey={journey}
                                className="mb-4"
                            />
                            <div className="flex justify-center mb-8 animate-in fade-in duration-700 delay-300">
                                <a
                                    href="/features"
                                    className="group flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                                >
                                    Explore all features
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </a>
                            </div>
                        </>
                    )}

                    {/* Action area: Input for everyone (auth deferred to submit) */}
                    {mode !== 'home' && (
                        <div className="w-full max-w-3xl mx-auto mb-16 animate-in zoom-in-95 fade-in duration-500">
                            <form onSubmit={error ? (e) => { e.preventDefault(); handleJobSubmission({ type: 'text', content: url }); } : handleUrlSubmit}>
                                <Card variant="glass" className={`p-4 border-accent-primary/20 ${isAnalyzing ? 'border-accent-primary/50 shadow-accent-primary/20' : 'hover:border-accent-primary/30'}`} glow>
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 ${isTargetMode ? 'bg-accent-primary/10 text-accent-primary-hex' : 'bg-accent-primary/10 text-accent-primary-hex'}`}>
                                            {isScrapingUrl ? (
                                                <Loader2 className="h-8 w-8 animate-spin" />
                                            ) : (
                                                error ? <FileText className="h-8 w-8 text-orange-500" /> : <LinkIcon className="h-8 w-8 transition-colors" />
                                            )}
                                        </div>

                                        <div className="flex-1 w-full text-center md:text-left flex flex-col justify-center min-h-[60px]">
                                            {error ? (
                                                <textarea
                                                    value={url}
                                                    onChange={(e) => setUrl(e.target.value)}
                                                    placeholder="Paste full job description..."
                                                    className="w-full bg-transparent border-none rounded-xl text-lg text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:ring-0 focus:outline-none resize-none animate-in fade-in duration-300 py-3 leading-relaxed h-[60px]"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            if (url.trim()) {
                                                                handleJobSubmission({ type: 'text', content: url });
                                                            }
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <input
                                                    type="url"
                                                    value={url}
                                                    onChange={(e) => { setUrl(e.target.value); setError(null); }}
                                                    placeholder={isScrapingUrl
                                                        ? "Accessing job post..."
                                                        : isAnalyzing
                                                            ? "Analyzing job fit..."
                                                            : isTargetMode
                                                                ? "Enter your target role or destination..."
                                                                : "Ready to find your match? Paste job URL..."
                                                    }
                                                    className="w-full bg-transparent border-none rounded-xl text-lg font-medium text-neutral-600 dark:text-neutral-300 placeholder:text-neutral-400 focus:ring-0 focus:outline-none transition-all duration-300"
                                                    autoFocus
                                                    disabled={isScrapingUrl}
                                                />
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={!url.trim() || isScrapingUrl || isAnalyzing}
                                            variant="accent"
                                            size="lg"
                                            loading={isScrapingUrl || isAnalyzing}
                                            icon={isTargetMode ? <TrendingUp className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                            className="w-full md:w-auto"
                                        >
                                            {isScrapingUrl ? 'Accessing...' : isAnalyzing ? 'Analyzing...' : error ? 'View Match' : isTargetMode ? 'Set goal' : 'View Match'}
                                        </Button>
                                    </div>
                                </Card>
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
                            className={`w-full h-64 p-4 text-sm bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all resize-none text-neutral-900 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-50/50' : 'border-neutral-200 focus:border-indigo-500'}`}
                            placeholder={error
                                ? "We couldn't scrape that URL. Please paste the full job description here..."
                                : isTargetMode
                                    ? "Where are you headed? Paste your target job description or career goal here..."
                                    : "Paste the job description here... (Press ENTER to analyze)"
                            }
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                            onKeyDown={handleManualKeyDown}
                            autoFocus
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-neutral-400 pointer-events-none bg-white/80 px-2 py-1 rounded backdrop-blur-sm">
                            Press <strong>Enter</strong> to analyze • <strong>Shift+Enter</strong> for new line
                        </div>
                        {error && (
                            <div className="absolute top-4 right-4 text-red-500 animate-pulse">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                        <button
                            onClick={() => { setIsManualMode(false); setError(null); }}
                            className="text-sm text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold px-4 py-2 transition-colors"
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

            {/* Logged In User: Bookmarklet Tip */}
            {
                user && showBookmarkletTip && mode === 'apply' && (
                    <NotificationBanner
                        icon={Bookmark}
                        theme="sky"
                        title="Save from anywhere"
                        description="Drag the button to your bookmarks bar to save jobs from any site."
                        className="max-w-xl mx-auto mt-8"
                        action={{
                            label: 'Save to Navigator',
                            icon: Plus,
                            href: `javascript:(function(){window.open('${window.location.origin}/?job='+encodeURIComponent(window.location.href),'_blank');})();`,
                            onClick: (e: any) => e.preventDefault(),
                        }}
                        onDismiss={() => {
                            setShowBookmarkletTip(false);
                            localStorage.setItem(STORAGE_KEYS.BOOKMARKLET_TIP_DISMISSED, 'true');
                        }}
                    />
                )
            }

            {/* Resume Upload Modal */}
            {
                showResumePrompt && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 text-center animate-in zoom-in-95 duration-200 relative">
                            <button
                                onClick={() => { setShowResumePrompt(false); setPendingJobInput(null); }}
                                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 p-1"
                            >
                                <ArrowRight className="w-4 h-4 rotate-45" />
                            </button>

                            <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-8 h-8" />
                            </div>

                            <h2 className="text-2xl font-bold text-neutral-900 mb-2">One last step!</h2>
                            <p className="text-neutral-500 mb-8">
                                To tailor your application for this job, we need your resume.
                            </p>

                            <DropZone
                                title="Upload Resume"
                                description="Upload your PDF or Text resume to tailor your application."
                                onUpload={async (files) => {
                                    if (files[0]) {
                                        await onImportResume(files[0]);
                                    }
                                }}
                                accept=".pdf,.txt"
                                isLoading={isParsing}
                                loadingText="Analyzing Resume..."
                                error={importError}
                                themeColor="indigo"
                                className="w-full"
                                variant="card"
                            />
                        </div>
                    </div>
                )
            }

        </SharedPageLayout>
    );
};


export default HomeInput;
