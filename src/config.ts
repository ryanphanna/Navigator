import { z } from 'zod';

/**
 * Environment Variable Validation
 *
 * Validates required environment variables at application startup.
 * Fails fast with clear error messages if configuration is missing or invalid.
 *
 * Benefits:
 * - Catch config errors before runtime
 * - Clear error messages instead of "undefined is not a URL"
 * - Type-safe access to environment variables
 */

const envSchema = z.object({
  // Supabase Configuration (Required)
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL must be a valid URL')
    .min(1, 'VITE_SUPABASE_URL is required'),

  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'VITE_SUPABASE_ANON_KEY is required'),

  // Gemini API Key (Optional - users can bring their own)
  VITE_GEMINI_API_KEY: z
    .string()
    .optional(),

  // Development/Production Mode
  MODE: z.enum(['development', 'production', 'test']).optional(),
  DEV: z.boolean().optional(),
  PROD: z.boolean().optional(),
});

// Export the validated environment variables
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and export environment variables
 *
 * This runs immediately when the module is imported,
 * ensuring the app fails fast if configuration is wrong.
 */
function validateEnv(): Env {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors nicely
      const errorMessages = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join('.');
        return `  ❌ ${path}: ${err.message}`;
      });

      console.error('❌ Environment validation failed:\n');
      console.error(errorMessages.join('\n'));
      console.error('\n📝 Check your .env file or environment variables.');
      console.error('💡 Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY\n');

      throw new Error('Invalid environment configuration. See console for details.');
    }
    throw error;
  }
}

// Validate on module load
export const env = validateEnv();

// Also validate in production builds
if (import.meta.env.PROD) {
  console.log('✅ Environment variables validated successfully');
}
