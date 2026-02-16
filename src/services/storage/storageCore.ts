import { supabase } from '../supabase';
import { encryptionService } from '../encryptionService';

// Helper: Get User ID if logged in
export const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
};

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

    async ensureInit() {
        if (this.initialized) return;
        const seed = getVaultSeed();
        await encryptionService.init(seed);
        this.initialized = true;
    },

    async getSecure<T = unknown>(key: string): Promise<T | null> {
        await this.ensureInit();
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        // Migration/Compatibility check
        if (raw.startsWith('{') || raw.startsWith('[')) {
            console.log(`[Vault] Migrating legacy content for key: ${key}`);
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
