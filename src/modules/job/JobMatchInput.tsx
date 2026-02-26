import React, { useState, useEffect } from 'react';
import {
    Link as LinkIcon,
    FileText,
    Bookmark,
    Loader2,
    Plus,
    ArrowRight,
    TrendingUp,
    Sparkles,
} from 'lucide-react';
import { DropZone } from '../../components/common/DropZone';
import { NotificationBanner } from '../../components/common/NotificationBanner';
import { SharedPageLayout } from '../../components/common/SharedPageLayout';
import { EventService } from '../../services/eventService';
import { UsageIndicator } from './UsageIndicator';
import { useToast } from '../../contexts/ToastContext';
import { useHeadlines } from '../../hooks/useHeadlines';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

import type { SavedJob } from '../../types';
import { STORAGE_KEYS, TRACKING_EVENTS } from '../../constants';

import { useUser } from '../../contexts/UserContext';
import { useGlobalUI } from '../../contexts/GlobalUIContext';
import { useModal } from '../../contexts/ModalContext';
import { useJobContext } from './context/JobContext';
import { useResumeContext } from '../resume/context/ResumeContext';
import { useCoachContext } from '../career/context/CoachContext';

const JobMatchInput: React.FC = () => {
    const { user, isAdmin } = useUser();
    const { setView: onNavigate } = useGlobalUI();
    const { openModal } = useModal();
    const {
        handleJobCreated: onJobCreated,
        usageStats
    } = useJobContext();
    const {
        handleTargetJobCreated: onTargetJobCreated
    } = useCoachContext();
    const {
        resumes,
        handleImportResume: onImportResume,
        clearImportError: onClearError,
        isParsingResume: isParsing,
        importError
    } = useResumeContext();

    const onShowAuth = (feature?: any) => openModal('AUTH', feature ? { feature } : undefined);
    const mode: 'apply' | 'goal' = 'apply';
    const { showSuccess } = useToast();
    const [url, setUrl] = useState('');
    const [isTargetMode, setIsTargetMode] = useState(false);
    const [manualText, setManualText] = useState('');
    const [isManualMode, setIsManualMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isScrapingUrl, setIsScrapingUrl] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);


    const headlineCategory = isTargetMode ? 'goal' : 'apply';
    const activeHeadline = useHeadlines(headlineCategory);
    const lastUrlRef = React.useRef<string>('');

    const [showBookmarkletTip, setShowBookmarkletTip] = useState(() => {
        return !localStorage.getItem(STORAGE_KEYS.BOOKMARKLET_TIP_DISMISSED);
    });

    useEffect(() => {
        setError(null);
        setIsManualMode(false);
        setUrl('');
        setManualText('');
        setIsScrapingUrl(false);
        setIsAnalyzing(false);

        // Handle bookmarklet or external job URL params
        const params = new URLSearchParams(window.location.search);
        const jobUrl = params.get('job') || params.get('url');

        if (jobUrl) {
            // Clean up the URL (remove params once read)
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);

            setUrl(jobUrl);

            // If user is logged in, start scraping automatically
            if (user) {
                // Short delay to allow UI to settle
                setTimeout(() => {
                    const event = new Event('submit', { cancelable: true, bubbles: true });
                    document.querySelector('form')?.dispatchEvent(event);
                    // trigger internal handleUrlSubmit logic directly
                    const trimmedUrl = jobUrl.trim();
                    if (trimmedUrl) {
                        lastUrlRef.current = trimmedUrl;
                        setIsScrapingUrl(true);
                        import('../../services/scraperService').then(({ ScraperService }) => {
                            return ScraperService.scrapeJobContent(trimmedUrl);
                        }).then(text => {
                            handleJobSubmission({ type: 'text', content: text });
                        }).catch(err => {
                            const msg = err instanceof Error ? err.message : String(err);
                            setError(msg.includes("403") ? "This site blocks automated access. Please paste the job description below:" : "Error reaching URL. Please paste content below:");
                        }).finally(() => {
                            setIsScrapingUrl(false);
                        });
                    }
                }, 500);
            }
        }

        return () => {
            if (onClearError) onClearError();
        };
    }, [onClearError, user]);

    const processJobInBackground = async (input: { type: 'url' | 'text', content: string }) => {
        const jobId = crypto.randomUUID();

        if (isTargetMode) {
            onTargetJobCreated(input.content);
        } else {
            let potentialUrl = input.type === 'url' ? input.content : (lastUrlRef.current || url.trim());
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
                status: 'analyzing',
            };

            setIsAnalyzing(true);
            EventService.trackUsage(TRACKING_EVENTS.JOB_FIT);
            onJobCreated(newJob);

            setTimeout(() => {
                setIsAnalyzing(false);
                setIsManualMode(false);
                setUrl('');
                setManualText('');
            }, 3000);
        }

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
        const hasAcceptedPrivacy = localStorage.getItem(STORAGE_KEYS.PRIVACY_ACCEPTED);
        const isExistingUser = !!user || resumes.length > 0;

        if (!hasAcceptedPrivacy && !isExistingUser) {
            onNavigate?.('welcome');
            return;
        }

        processJobInBackground(input);
    };

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            onShowAuth?.();
            return;
        }

        const trimmedUrl = url.trim();
        lastUrlRef.current = trimmedUrl;

        if (!trimmedUrl || isScrapingUrl) return;

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
            setUrl('');
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

    return (
        <SharedPageLayout
            maxWidth="7xl"
            className="theme-job"
            spacing="compact"
        >
            <PageHeader
                variant="hero"
                title={activeHeadline.text}
                highlight={activeHeadline.highlight}
                className="mb-8"
                subtitle={isTargetMode
                    ? "Distill career paths into your personalized growth roadmap."
                    : "Tailor your resume for any opening with a single click."
                }
            />

            {!isManualMode ? (
                <div className="w-full max-w-7xl mx-auto mb-16 animate-in zoom-in-95 fade-in duration-500">
                    <form onSubmit={error ? (e) => { e.preventDefault(); handleJobSubmission({ type: 'text', content: url }); } : handleUrlSubmit}>
                        <Card variant="glass" className={`p-4 border-accent-primary/20 ${isAnalyzing ? 'border-accent-primary/50 shadow-accent-primary/20' : 'hover:border-accent-primary/30'}`} glow>
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 bg-accent-primary/10 text-accent-primary-hex`}>
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
                                            className="w-full bg-transparent border-none rounded-xl text-lg text-neutral-900 dark:text-white placeholder:text-neutral-500 focus:ring-0 focus:outline-none resize-none h-[60px] py-3 leading-relaxed"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (url.trim()) handleJobSubmission({ type: 'text', content: url });
                                                }
                                            }}
                                            autoFocus
                                        />
                                    ) : (
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => { setUrl(e.target.value); setError(null); }}
                                            placeholder={isScrapingUrl ? "Accessing job post..." : isAnalyzing ? "Analyzing job fit..." : isTargetMode ? "Enter your target role or destination..." : "Ready to find your match? Paste job URL..."}
                                            className="w-full bg-transparent border-none rounded-xl text-lg font-medium text-neutral-600 dark:text-neutral-300 placeholder:text-neutral-400 focus:ring-0 focus:outline-none"
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

                    {user && !isAdmin && <UsageIndicator usageStats={usageStats} />}
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="relative">
                        <textarea
                            className={`w-full h-64 p-4 text-sm bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all resize-none text-neutral-900 ${error ? 'border-red-300 focus:border-red-500' : 'border-neutral-200 focus:border-indigo-500'}`}
                            placeholder={isTargetMode ? "Where are you headed? Paste your target..." : "Paste the job description here..."}
                            value={manualText}
                            onChange={(e) => setManualText(e.target.value)}
                            onKeyDown={handleManualKeyDown}
                            autoFocus
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-neutral-400">Press Enter to analyze • Shift+Enter for new line</div>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                        <button onClick={() => { setIsManualMode(false); setError(null); }} className="text-sm text-neutral-500 font-bold px-4 py-2">Back to URL</button>
                        <button onClick={() => manualText.trim() && handleJobSubmission({ type: 'text', content: manualText })} disabled={!manualText.trim()} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-4 h-4" /> Analyze Job
                        </button>
                    </div>
                </div>
            )}

            {user && showBookmarkletTip && mode === 'apply' && (
                <NotificationBanner
                    icon={Bookmark}
                    theme="sky"
                    title="Save from anywhere"
                    description="Drag the button to your bookmarks bar to save jobs from any site."
                    className="max-w-xl mx-auto mt-8"
                    action={{
                        label: 'Save to Navigator',
                        icon: Plus,
                        href: `javascript:(function(){var url='${window.location.origin}/jobs?job='+encodeURIComponent(window.location.href); if(!window.open(url,'_blank')) { window.location.href=url; }})();`,
                    }}
                    onDismiss={() => {
                        setShowBookmarkletTip(false);
                        localStorage.setItem(STORAGE_KEYS.BOOKMARKLET_TIP_DISMISSED, 'true');
                    }}
                />
            )}

            {showResumePrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center relative">
                        <button onClick={() => { setShowResumePrompt(false); }} className="absolute top-4 right-4 text-neutral-400"><ArrowRight className="w-4 h-4 rotate-45" /></button>
                        <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><FileText className="w-8 h-8" /></div>
                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">One last step!</h2>
                        <p className="text-neutral-500 mb-8">To tailor your application for this job, we need your resume.</p>
                        <DropZone title="Upload Resume" onUpload={async (files) => files[0] && await onImportResume(files[0])} accept=".pdf,.txt" isLoading={isParsing} loadingText="Analyzing Resume..." error={importError} themeColor="indigo" className="w-full" variant="card" />
                    </div>
                </div>
            )}
        </SharedPageLayout>
    );
};

export default JobMatchInput;
