import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../supabase";
import { getSecureItem, setSecureItem, removeSecureItem, migrateToSecureStorage } from "../../utils/secureStorage";
import { getUserFriendlyError, getRetryMessage } from "../../utils/errorMessages";
import { API_CONFIG, STORAGE_KEYS } from "../../constants";

export type RetryProgressCallback = (message: string, attempt: number, maxAttempts: number) => void;

let migrationDone = false;
const migrateApiKeyIfNeeded = async () => {
    if (!migrationDone) {
        await migrateToSecureStorage('gemini_api_key', STORAGE_KEYS.API_KEY);
        migrationDone = true;
    }
};

export const getApiKey = async (): Promise<string | null> => {
    await migrateApiKeyIfNeeded();
    return (await getSecureItem(STORAGE_KEYS.API_KEY)) || import.meta.env.VITE_API_KEY || null;
};

export const saveApiKey = async (key: string): Promise<void> => {
    await setSecureItem(STORAGE_KEYS.API_KEY, key);
};

export const clearApiKey = (): void => {
    removeSecureItem(STORAGE_KEYS.API_KEY);
};

export interface ModelParams {
    task: 'extraction' | 'analysis';
    generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
        responseMimeType?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema?: any;
    };
    model?: string; // Accepted for legacy/local key compatibility
}

export const getModel = async (params: ModelParams) => {
    const key = await getApiKey();

    if (key) {
        // Use local key if provided (User pays for their own usage)
        const genAI = new GoogleGenerativeAI(key);
        // If they have a key, we'll use the model they asked for, or default to Flash
        return genAI.getGenerativeModel({
            model: params.model || "gemini-2.0-flash",
            generationConfig: params.generationConfig
        });
    }

    return {
        generateContent: async (payload: { contents: { role: string; parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] }[] }) => {
            console.log(`Using Gemini Proxy (Edge Function) for ${params.task}...`);
            const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                body: {
                    payload: payload,
                    task: params.task,
                    generationConfig: params.generationConfig
                }
            });

            if (error) throw new Error(`Proxy Error: ${error.message}`);
            if (data?.error) throw new Error(`AI Error: ${data.error}`);

            return {
                response: {
                    text: () => data.text as string
                }
            };
        }
    };
};

export const logToSupabase = async (params: {
    event_type: string;
    model_name: string;
    prompt_text: string;
    response_text?: string;
    latency_ms?: number;
    status: 'success' | 'error';
    error_message?: string;
    metadata?: Record<string, unknown>;
    job_id?: string;
}) => {
    const redactContent = (text?: string) => {
        if (!text) return text;
        return text
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL_REDACTED]")
            .replace(/(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g, "[PHONE_REDACTED]");
    };

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        await supabase.from('logs').insert({
            user_id: userId,
            job_id: params.job_id,
            event_type: params.event_type,
            model_name: params.model_name,
            prompt_text: redactContent(params.prompt_text),
            response_text: redactContent(params.response_text),
            latency_ms: params.latency_ms,
            status: params.status,
            error_message: params.error_message,
            metadata: params.metadata || {}
        });

        const tokenUsage = (params.metadata?.token_usage as { totalTokens?: number })?.totalTokens || 0;
        supabase.rpc('track_usage', { p_tokens: tokenUsage }).then(({ error }) => {
            if (error) {
                // Silent fail in production
            }
        });

    } catch (err) {
        console.error("Failed to write log to Supabase:", err);
    }
};

export const callWithRetry = async <T>(
    fn: (executionMetadata: Record<string, unknown>) => Promise<T>,
    context: { event_type: string; prompt: string; model: string; metadata?: Record<string, unknown>; job_id?: string },
    retries: number = API_CONFIG.MAX_RETRIES,
    initialDelay = API_CONFIG.INITIAL_RETRY_DELAY_MS,
    onProgress?: RetryProgressCallback
): Promise<T> => {
    let currentDelay = initialDelay;
    const startTime = Date.now();

    for (let i = 0; i < retries; i++) {
        const executionMetadata: Record<string, unknown> = {};
        try {
            const result = await fn(executionMetadata);
            const latency = Date.now() - startTime;
            logToSupabase({
                event_type: context.event_type,
                model_name: context.model,
                prompt_text: context.prompt,
                response_text: typeof result === 'string' ? result : JSON.stringify(result),
                latency_ms: latency,
                status: 'success',
                metadata: { ...context.metadata, ...executionMetadata },
                job_id: context.job_id
            });
            return result;
        } catch (error: unknown) {
            const err = error as Error;
            // Log the full error to console for debugging "Connection issue"
            console.error("AI Service Error:", err);
            const errorMessage = err.message || '';
            const isDailyQuota = errorMessage.includes("PerDay");

            if (isDailyQuota) {
                logToSupabase({
                    event_type: context.event_type,
                    model_name: context.model,
                    prompt_text: context.prompt,
                    status: 'error',
                    error_message: errorMessage,
                    latency_ms: Date.now() - startTime,
                    job_id: context.job_id
                });
                throw new Error(getUserFriendlyError("DAILY_QUOTA_EXCEEDED"));
            }

            const isQuotaError = (
                errorMessage.includes("429") ||
                errorMessage.includes("Quota") ||
                errorMessage.includes("quota") ||
                errorMessage.includes("High traffic")
            );

            if (isQuotaError && i < retries - 1) {
                const delaySeconds = currentDelay / 1000;
                const retryMsg = getRetryMessage(i + 1, retries, delaySeconds);
                if (onProgress) onProgress(retryMsg, i + 1, retries);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay = currentDelay * 2;
            } else {
                logToSupabase({
                    event_type: context.event_type,
                    model_name: context.model,
                    prompt_text: context.prompt,
                    status: 'error',
                    error_message: errorMessage,
                    latency_ms: Date.now() - startTime,
                    metadata: { attempt: i + 1 },
                    job_id: context.job_id
                });
                if (isQuotaError) throw new Error(getUserFriendlyError("RATE_LIMIT_EXCEEDED"));
                throw new Error(getUserFriendlyError(err));
            }
        }
    }
    throw new Error("Request failed after multiple attempts. Please try again later.");
};

export const cleanJsonOutput = (text: string): string => {
    let cleaned = text.trim();
    const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
        cleaned = codeBlockMatch[1];
    } else {
        cleaned = cleaned.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
    }
    return cleaned.trim();
};
