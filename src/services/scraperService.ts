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

        // Feed is now driven strictly by in-memory/DB items populated via Email Ingestion.
        // Legacy "subscriber" experiment targets (TTC) have been removed.
        return MOCK_TTC_JOBS;
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
