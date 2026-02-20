
import { describe, it, expect } from 'vitest';
import { sanitizeLog } from '../sanitize.ts';

const MAX_LOG_LENGTH = 200;

describe('Gemini Proxy Security Fix Verification', () => {

    it('should sanitize newlines in logs', () => {
        const input = "Hello\nWorld\rTest";
        const sanitized = sanitizeLog(input);
        expect(sanitized).toBe("Hello World Test");
    });

    it('should sanitize tabs and other control characters', () => {
        const input = "Hello\tWorld\0Test\x08Back";
        const sanitized = sanitizeLog(input);
        expect(sanitized).toBe("Hello World Test Back");
    });

    it('should sanitize vertical tabs and form feeds', () => {
        const input = "Hello\vWorld\fTest";
        const sanitized = sanitizeLog(input);
        expect(sanitized).toBe("Hello World Test");
    });

    it('should truncate long strings (Fix Verified)', () => {
        const longString = "A".repeat(1000);
        const sanitized = sanitizeLog(longString);
        expect(sanitized.length).toBe(MAX_LOG_LENGTH + 3); // 200 + '...'
        expect(sanitized.endsWith('...')).toBe(true);
    });

    it('should not truncate short strings', () => {
        const shortString = "Short string";
        const sanitized = sanitizeLog(shortString);
        expect(sanitized).toBe("Short string");
    });
});
