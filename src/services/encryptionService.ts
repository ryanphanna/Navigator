/**
 * EncryptionService
 * 
 * Provides client-side AES-256-GCM encryption for the "Privacy Vault".
 * Uses the Web Crypto API to ensure data remains secure on-device.
 */

const ENCRYPTION_ALGO = 'AES-GCM';
const KEY_DERIVATION_ALGO = 'PBKDF2';
const ITERATIONS = 100000;
const SALT_SIZE = 16;
const IV_SIZE = 12;

class EncryptionService {
    private key: CryptoKey | null = null;
    private salt: Uint8Array | null = null;

    /**
     * Initializes the service with a user-specific secret or device identifier.
     * In a full E2EE setup, this would be a user-provided password.
     * For V1, we'll use a stable device-bound string combined with a local salt.
     */
    async init(secretSeed: string): Promise<void> {
        // 1. Check for existing salt in localStorage
        const storedSalt = localStorage.getItem('jobfit_vault_salt');
        if (storedSalt) {
            this.salt = new Uint8Array(storedSalt.split(',').map(Number));
        } else {
            // New vault: generate and store salt
            this.salt = window.crypto.getRandomValues(new Uint8Array(SALT_SIZE));
            localStorage.setItem('jobfit_vault_salt', this.salt.toString());
        }

        // 2. Derive Key from secretSeed + Salt
        const encoder = new TextEncoder();
        const baseKey = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(secretSeed),
            KEY_DERIVATION_ALGO,
            false,
            ['deriveKey']
        );

        this.key = await window.crypto.subtle.deriveKey(
            {
                name: KEY_DERIVATION_ALGO,
                salt: this.salt as BufferSource,
                iterations: ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            { name: ENCRYPTION_ALGO, length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypts a string of data.
     * Returns a Base64 string containing: [iv]:[ciphertext]
     */
    async encrypt(plainText: string): Promise<string> {
        if (!this.key) throw new Error("Encryption key not initialized");

        const encoder = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(IV_SIZE));

        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: ENCRYPTION_ALGO, iv },
            this.key,
            encoder.encode(plainText)
        );

        // Package as Base64 for storage
        const ivBase64 = btoa(String.fromCharCode(...iv));
        const contentBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedContent)));

        return `${ivBase64}:${contentBase64}`;
    }

    /**
     * Decrypts a previously encrypted Base64 string.
     */
    async decrypt(vaultData: string): Promise<string> {
        if (!this.key) throw new Error("Encryption key not initialized");

        const [ivBase64, contentBase64] = vaultData.split(':');
        if (!ivBase64 || !contentBase64) throw new Error("Invalid vault data format");

        const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
        const ciphertext = new Uint8Array(atob(contentBase64).split('').map(c => c.charCodeAt(0)));

        try {
            const decryptedContent = await window.crypto.subtle.decrypt(
                { name: ENCRYPTION_ALGO, iv },
                this.key,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedContent);
        } catch {
            console.error("Decryption failed. Data may be corrupted or key is incorrect.");
            throw new Error("Vault access denied");
        }
    }
}

export const encryptionService = new EncryptionService();
