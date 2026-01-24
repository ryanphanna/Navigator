import { supabase } from './supabase';
import type { JobFeedItem } from '../types';

// Mock/Fallback data (empty now that scraping works)
const MOCK_TTC_JOBS: JobFeedItem[] = [];

export const ScraperService = {
    async getFeed(): Promise<JobFeedItem[]> {
        console.log('Fetching live feed...');
        const jobs: JobFeedItem[] = [];

        // Targets
        const targets = [
            { name: 'TTC (Early Talent)', url: 'https://www.ttc.ca/Jobs/Early-Talent/Early-Talent-Intern-Program/Intern-Opportunities', source: 'ttc' },
            { name: 'TTC (Regular)', url: 'https://career17.sapsf.com/career?company=TTCPRODUCTION', source: 'ttc-sap' }
        ];

        for (const target of targets) {
            try {
                let rawJobs: any[] = [];
                console.log(`[${target.name}] Fetching from ${target.url.substring(0, 50)}...`);

                // Direct fetch (TTC allows CORS)
                const response = await fetch(target.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                // Special handling for TTC Early Talent (uses Sitecore API)
                if (target.source === 'ttc' && target.url.includes('Early-Talent')) {
                    console.log(`[${target.name}] Fetching from TTC Sitecore API...`);

                    // Use the real API endpoint that the page calls via JavaScript
                    const apiUrl = 'https://www.ttc.ca/sxa/search/results/?' + new URLSearchParams({
                        v: '{351C34F8-C6C4-4340-A9A7-DC1F6FD5B63B}',
                        s: '{3C4C0855-C6BA-4472-94BC-85D7EE74FF76}',
                        p: '50',
                        itemid: '{D6CA6A9B-19AA-408A-ACC4-E3B50A056A54}'
                    }).toString();

                    const apiResponse = await fetch(apiUrl);
                    if (!apiResponse.ok) throw new Error(`API returned ${apiResponse.status}`);

                    const apiData = await apiResponse.json();
                    console.log(`[${target.name}] API returned ${apiData.Results?.length || 0} jobs`);

                    // Parse each job from the HTML in the Results
                    rawJobs = (apiData.Results || []).map((result: any) => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(result.Html, 'text/html');

                        const link = doc.querySelector('a[href*="career17.sapsf.com"]');
                        const title = link?.textContent?.trim().replace(/\s*\(\d+\)\s*$/, '') || 'Unknown Role';
                        const url = link?.getAttribute('href') || '';

                        return {
                            title,
                            url,
                            company: 'Toronto Transit Commission',
                            location: 'Toronto, ON',
                            postedDate: null
                        };
                    }).filter((job: any) => job.url); // Only include jobs with valid URLs

                    console.log(`[${target.name}] Created ${rawJobs.length} job objects`);
                } else {
                    // For other pages, skip for now (SAP SuccessFactors needs JavaScript)
                    console.log(`[${target.name}] Skipping - requires JavaScript rendering`);
                    rawJobs = [];
                }

                // Normalize - use URL hash as stable ID to prevent duplicates
                const normalized: JobFeedItem[] = rawJobs.map((job: any) => {
                    // Create a simple hash from the URL for stable IDs
                    const urlHash = job.url.split('').reduce((acc: number, char: string) => {
                        return ((acc << 5) - acc) + char.charCodeAt(0);
                    }, 0);

                    return {
                        id: `${target.source}-${Math.abs(urlHash)}`,
                        title: job.title || 'Unknown Role',
                        company: job.company || target.name,
                        location: job.location || 'Toronto, ON',
                        url: job.url,
                        postedDate: job.postedDate || new Date().toISOString(),
                        // matchScore: only set after actual analysis, not mock data
                        source: (target.source === 'ttc' || target.source === 'toronto') ? target.source : 'other',
                        isNew: true
                    };
                });

                jobs.push(...normalized);

            } catch (err) {
                console.error(`Failed to scrape ${target.name}:`, err);
            }
        }

        if (jobs.length === 0) {
            console.warn('All scrapers failed, returning mock data.');
            return MOCK_TTC_JOBS;
        }

        return jobs;
    },

    async scrapeJobContent(targetUrl: string): Promise<string> {
        // Use Supabase Edge Function for secure, server-side scraping
        try {
            const { data, error } = await supabase.functions.invoke('scrape-jobs', {
                body: { url: targetUrl, mode: 'text' }
            });

            if (error) {
                console.error("Edge function error:", error);
                throw new Error(`Failed to scrape job content: ${error.message || 'Unknown error'}`);
            }

            if (!data?.text || data.text.length < 50) {
                throw new Error("Scraped content is too short or empty. The job posting may not be accessible.");
            }

            return data.text;
        } catch (error) {
            console.error("Job scraping failed:", error);
            throw error instanceof Error ? error : new Error("Failed to scrape job content");
        }
    },

    scrapeJobText: async (url: string): Promise<string> => {
        try {
            return await ScraperService.scrapeJobContent(url);
        } catch (error) {
            console.error(`Failed to scrape text for ${url}:`, error);
            return "";
        }
    }
};
