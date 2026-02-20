import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScraperService } from './scraperService';

// Mock fetch globally
global.fetch = vi.fn();

describe('ScraperService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch jobs from targets concurrently and parse HTML', async () => {
        const mockHtml = `
            <html>
                <body>
                    <a href="https://career17.sapsf.com/sfcareer/jobreqcareer?jobId=123" class="job-link">Software Engineer (123)</a>
                    <span>Last Day to Apply: </b></span><span>2024-12-31</span>
                </body>
            </html>
        `;

        (global.fetch as any).mockResolvedValue({
            ok: true,
            text: async () => mockHtml
        });

        const jobs = await ScraperService.getFeed();

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(jobs).toHaveLength(1);
        expect(jobs[0].title).toBe('Software Engineer');
        expect(jobs[0].url).toContain('jobId=123');
        expect(jobs[0].company).toBe('Toronto Transit Commission');
    });

    it('should handle fetch errors gracefully', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        const jobs = await ScraperService.getFeed();

        expect(jobs).toHaveLength(0);
    });
});
