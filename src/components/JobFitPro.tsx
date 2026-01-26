import React, { useState, useEffect } from 'react';
import {
    Sparkles, Zap,
    Loader2, ExternalLink, RefreshCw
} from 'lucide-react';
import { ScraperService } from '../services/scraperService';
import { supabase } from '../services/supabase';
import { analyzeJobFit } from '../services/geminiService';
import type { JobFeedItem } from '../types';
import { PageLayout } from './common/PageLayout';

interface JobFitProProps {
    onBack?: () => void; // Optional now since we removed the button? Keeping for safety
    onDraftApplication: (url: string) => Promise<void>;
}

export const JobFitPro: React.FC<JobFitProProps> = ({ onDraftApplication }) => {
    const [feed, setFeed] = useState<JobFeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [filterHighMatch, setFilterHighMatch] = useState(false);
    const [filterClosingSoon, setFilterClosingSoon] = useState(false);
    const [sort, setSort] = useState<'date' | 'match'>('date');


    useEffect(() => {
        loadFeedWithCache();
    }, []);

    const loadFeedWithCache = async () => {
        const CACHE_KEY = 'jobfit_feed_cache';
        const CACHE_TIMESTAMP_KEY = 'jobfit_feed_timestamp';
        const ONE_DAY = 24 * 60 * 60 * 1000;

        // Check if we have cached data
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

        if (cachedData && cachedTimestamp) {
            const age = Date.now() - parseInt(cachedTimestamp);
            if (age < ONE_DAY) {
                // Use cached data
                console.log('Using cached feed data');
                setFeed(JSON.parse(cachedData));
                setLoading(false);
                return;
            }
        }

        // Fetch fresh data
        await loadFeed();
    };

    const loadFeed = async () => {
        setLoading(true);
        try {
            const data = await ScraperService.getFeed();
            setFeed(data);

            // Cache the raw feed data
            localStorage.setItem('jobfit_feed_cache', JSON.stringify(data));
            localStorage.setItem('jobfit_feed_timestamp', Date.now().toString());

            // Trigger background analysis
            setTimeout(() => analyzeJobsInBackground(data), 100);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const analyzeJobsInBackground = async (jobs: JobFeedItem[]) => {
        console.log('Starting background analysis...');

        // Get user's resume
        const { data: resumes } = await supabase
            .from('resumes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (!resumes || resumes.length === 0) {
            console.log('No resume found, skipping analysis');
            return;
        }

        const resume = resumes[0];

        // Check which jobs already have analysis in Supabase
        const jobUrls = jobs.map(j => j.url);
        const { data: existingJobs } = await supabase
            .from('jobs')
            .select('url, analysis')
            .in('url', jobUrls);



        // Analyze jobs that don't have cached analysis
        for (const job of jobs) {
            const existing = existingJobs?.find(j => j.url === job.url);

            if (existing?.analysis?.matchScore) {
                // Use cached match score
                setFeed(prevFeed => prevFeed.map(f =>
                    f.id === job.id ? { ...f, matchScore: existing.analysis.matchScore } : f
                ));
            } else {
                // Analyze new job
                await analyzeAndCacheJob(job, resume);
            }
        }

        console.log('Background analysis complete!');
    };

    const analyzeAndCacheJob = async (job: JobFeedItem, resume: any) => {
        try {
            // 1. Scrape Job Text
            const jobText = await ScraperService.scrapeJobText(job.url);
            if (!jobText) {
                console.warn(`Skipping analysis for ${job.title} - no text found`);
                return;
            }

            // 2. Analyze with Gemini
            const analysis = await analyzeJobFit(jobText, [resume]);

            // 3. Update UI with real score
            const matchScore = analysis.compatibilityScore;

            setFeed(prevFeed => prevFeed.map(f =>
                f.id === job.id ? { ...f, matchScore } : f
            ));

            // 4. Cache in Supabase
            await supabase.from('jobs').upsert({
                user_id: resume.user_id,
                job_title: job.title,
                company: job.company,
                url: job.url,
                analysis: analysis, // Store full analysis JSON
                status: 'analyzed'
            }, { onConflict: 'url' });

        } catch (error) {
            console.error(`Failed to analyze job ${job.title}:`, error);
        }
    };

    const handleAnalyze = async (jobId: string, url: string) => {
        setAnalyzingId(jobId);
        await onDraftApplication(url);
    };

    const getProcessedFeed = () => {
        let processed = [...feed];

        // Apply High Match filter
        if (filterHighMatch) {
            processed = processed.filter(job => (job.matchScore || 0) >= 85);
        }

        // Apply Closing Soon filter (within 7 days)
        if (filterClosingSoon) {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            processed = processed.filter(job => {
                const deadline = new Date(job.postedDate);
                return deadline <= sevenDaysFromNow;
            });
        }

        // Sort
        return processed.sort((a, b) => {
            if (sort === 'match') {
                return (b.matchScore || 0) - (a.matchScore || 0);
            }
            // date (newest first)
            return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        });
    };

    const displayFeed = getProcessedFeed();

    const headerActions = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setSort('date')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${sort === 'date'
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                >
                    Newest
                </button>
                <button
                    onClick={() => setSort('match')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${sort === 'match'
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                >
                    Best Fit
                </button>
            </div>

            <button
                onClick={loadFeed}
                disabled={loading}
                className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all disabled:opacity-50"
            >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );

    return (
        <PageLayout
            title="Job Feed"
            description="Live updates from City of Toronto & TTC. We specifically track student and co-op opportunities for you."
            icon={<Zap className="w-8 h-8 text-white" />}
            actions={headerActions}
        >
            {/* Filters Row */}
            <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    onClick={() => setFilterHighMatch(!filterHighMatch)}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border ${filterHighMatch
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                >
                    <Sparkles className={`w-4 h-4 ${filterHighMatch ? 'text-indigo-200' : 'text-slate-400'}`} />
                    High Match Only
                </button>
                <button
                    onClick={() => setFilterClosingSoon(!filterClosingSoon)}
                    className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border ${filterClosingSoon
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-orange-300 dark:hover:border-orange-700'
                        }`}
                >
                    <Zap className={`w-4 h-4 ${filterClosingSoon ? 'text-orange-200' : 'text-slate-400'}`} />
                    Closing Soon
                </button>
            </div>

            {/* Feed */}
            {loading && feed.length === 0 ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 h-40 animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {displayFeed.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No jobs found matching your filter.
                        </div>
                    )}
                    {displayFeed.map((job) => (
                        <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group relative overflow-hidden">
                            {job.isNew && (
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-4 py-2 rounded-bl-2xl shadow-sm z-10">
                                    NEW
                                </div>
                            )}

                            <div className="flex gap-4">
                                {/* Logo Placeholder */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-xl
                                    ${job.source === 'ttc' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}
                                `}>
                                    {job.source === 'ttc' ? 'T' : 'C'}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
                                                {job.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{job.company}</span>
                                                <span>•</span>
                                                <span>{job.location}</span>
                                                <span>•</span>
                                                <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {job.matchScore && (
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg text-sm font-bold border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-1 shrink-0 animate-in fade-in duration-300">
                                                <Sparkles className="w-3 h-3" />
                                                {job.matchScore}% Match
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex items-center gap-3">
                                        <button
                                            onClick={() => handleAnalyze(job.id, job.url)}
                                            disabled={analyzingId === job.id}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                                        >
                                            {analyzingId === job.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-4 h-4" />
                                                    Draft Application
                                                </>
                                            )}
                                        </button>
                                        <a
                                            href={job.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center gap-2"
                                        >
                                            <span>View</span>
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageLayout>
    );
};
