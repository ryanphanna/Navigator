import { supabase } from '../supabase';
import { encryptionService } from '../encryptionService';
import { Logger } from '../../utils/logger';

// Helper: Get User ID if logged in — cached for 30s to avoid repeated session reads
let cachedUserIdPromise: Promise<string | undefined> | null = null;

export const getUserId = async (): Promise<string | undefined> => {
    if (!cachedUserIdPromise) {
        cachedUserIdPromise = supabase.auth.getSession()
            .then(({ data: { session } }) => session?.user?.id);
        setTimeout(() => { cachedUserIdPromise = null; }, 30_000);
    }
    return cachedUserIdPromise;
};

// Call this on auth state changes to immediately invalidate the cache
export const invalidateUserIdCache = () => { cachedUserIdPromise = null; };

// --- Private Vault (Encryption) Logic ---

const getVaultSeed = () => {
    let seed = localStorage.getItem('jobfit_vault_seed');
    if (!seed) {
        seed = crypto.randomUUID();
        localStorage.setItem('jobfit_vault_seed', seed);
    }
    return seed;
};

export const Vault = {
    initialized: false,
    initPromise: null as Promise<void> | null,

    async ensureInit() {
        if (this.initialized) return;
        if (!this.initPromise) {
            this.initPromise = encryptionService.init(getVaultSeed()).then(() => {
                this.initialized = true;
            });
        }
        await this.initPromise;
    },

    async getSecure<T = unknown>(key: string): Promise<T | null> {
        await this.ensureInit();
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        // Migration/Compatibility check
        if (raw.startsWith('{') || raw.startsWith('[')) {
            Logger.log(`[Vault] Migrating legacy content for key: ${key}`);
            try {
                const data = JSON.parse(raw);
                await this.setSecure(key, data);
                return data;
            } catch {
                return null;
            }
        }

        try {
            const decrypted = await encryptionService.decrypt(raw);
            return JSON.parse(decrypted);
        } catch {
            console.error(`[Vault] Decryption failed for ${key}. Data may be corrupted.`);
            return null;
        }
    },

    async setSecure(key: string, data: unknown) {
        await this.ensureInit();
        const serialized = JSON.stringify(data);
        const encrypted = await encryptionService.encrypt(serialized);
        localStorage.setItem(key, encrypted);
    }
};

export { areBlocksEqual } from './blockUtils';
