import { supabase } from '../supabase';
import { encryptionService } from '../encryptionService';
import { STORAGE_KEYS } from '../../constants';

// Helper: Get User ID if logged in
export const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
};

// --- Private Vault (Encryption) Logic ---

const getVaultSeed = () => {
    let seed = localStorage.getItem(STORAGE_KEYS.VAULT_SEED);
    if (!seed) {
        seed = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEYS.VAULT_SEED, seed);
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

export const areBlocksEqual = (a: any, b: any) => {
    if (a.type !== b.type) return false;
    const normTitleA = (a.title || "").toLowerCase().trim();
    const normTitleB = (b.title || "").toLowerCase().trim();
    const normOrgA = (a.organization || "").toLowerCase().trim();
    const normOrgB = (b.organization || "").toLowerCase().trim();

    if (['work', 'education', 'project'].includes(a.type)) {
        return normTitleA === normTitleB && normOrgA === normOrgB;
    }
    if (a.type === 'skill') return normTitleA === normTitleB;
    if (a.type === 'summary') return true;
    return false;
};
