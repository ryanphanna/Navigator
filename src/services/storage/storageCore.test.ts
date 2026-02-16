
import { describe, it, expect } from 'vitest';
import { areBlocksEqual } from './storageCore';

describe('areBlocksEqual (exported from storageCore)', () => {
    it('should correctly compare two equal blocks', () => {
        const a = { type: 'work', title: 'Developer', organization: 'Company A' };
        const b = { type: 'work', title: 'Developer', organization: 'Company A' };
        expect(areBlocksEqual(a, b)).toBe(true);
    });

    it('should correctly compare two different blocks', () => {
        const a = { type: 'work', title: 'Developer', organization: 'Company A' };
        const b = { type: 'work', title: 'Manager', organization: 'Company A' };
        expect(areBlocksEqual(a, b)).toBe(false);
    });
});
