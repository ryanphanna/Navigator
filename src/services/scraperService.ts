import { supabase } from './supabase';
import type { JobFeedItem } from '../types';
import { CONTENT_VALIDATION } from '../constants';

export const ScraperService = {
    async getFeed(): Promise<JobFeedItem[]> {
        return [];
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

};
