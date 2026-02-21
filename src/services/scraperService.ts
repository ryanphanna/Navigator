import { supabase } from './supabase';
import type { JobFeedItem } from '../types';
import { CONTENT_VALIDATION } from '../constants';

// Mock/Fallback data (empty now that scraping works)
const MOCK_TTC_JOBS: JobFeedItem[] = [];

export const ScraperService = {
    async getFeed(): Promise<JobFeedItem[]> {
        if (import.meta.env.DEV) {
            console.log('Fetching live feed...');
        }

        // Define targets to scrape
        const targets = [
            { name: 'TTC', url: 'https://career17.sapsf.com/career?company=TTC', source: 'ttc' as const },
            // Additional targets can be added here
        ];

        // Fetch all targets in parallel
        const fetchPromises = targets.map(async (target) => {
            try {
                console.log(`[${target.name}] Fetching from ${target.url.substring(0, 50)}...`);

                // Direct fetch (TTC allows CORS)
                const response = await fetch(target.url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const html = await response.text();
                let jobs: JobFeedItem[] = [];

                if (target.source === 'ttc') {
                    // Simple HTML parsing for TTC (Ported from Edge Function logic)
                    const linkRegex = /<a\s+[^>]*href=["'](https:\/\/career17\.sapsf\.com\/sfcareer\/jobreqcareer\?[^"']+)["'][^>]*>([^<]+)<\/a>/gi;
                    const dateRegex = /Last Day to Apply:\s*<\/b><\/span><span[^>]*>([^<]+)<\/span>/gi;

                    let match;
                    const jobData: { url: string; title: string }[] = [];
                    const dates: string[] = [];

                    // Extract all job links
                    while ((match = linkRegex.exec(html)) !== null) {
                        const jobUrl = match[1];
                        let title = match[2].trim();
                        // Remove job ID in parentheses if present
                        title = title.replace(/\s*\(\d+\)\s*$/, '');
                        jobData.push({ url: jobUrl, title });
                    }

                    // Extract all dates
                    let dateMatch;
                    while ((dateMatch = dateRegex.exec(html)) !== null) {
                        dates.push(dateMatch[1].trim());
                    }

                    // Combine jobs with dates
                    jobs = jobData.map((job, index) => ({
                        id: `${target.source}-${btoa(job.url).substring(0, 10)}`, // Generate stable ID from URL
                        title: job.title,
                        company: 'Toronto Transit Commission',
                        location: 'Toronto, ON',
                        url: job.url,
                        postedDate: dates[index] || new Date().toISOString(),
                        source: target.source,
                        sourceType: 'scraper' as const,
                        isNew: true
                    }));
                }

                return jobs;
            } catch (error) {
                console.error(`Error fetching ${target.name}:`, error);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        const feed = results.flat();

        return feed.length > 0 ? feed : MOCK_TTC_JOBS;
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

            if (!data?.text || data.text.length < CONTENT_VALIDATION.MIN_SCRAPED_TEXT_LENGTH) {
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
