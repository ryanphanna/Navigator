/**
 * User-friendly error messages
 * Instead of showing technical errors, we show helpful messages
 */

export const ERROR_MESSAGES = {
  // API Key errors
  INVALID_API_KEY: "Invalid API key. Please check your settings and try again.",
  API_KEY_PERMISSION_DENIED: "API key doesn't have permission. Check your Google Cloud console.",
  API_KEY_WRONG_FORMAT: "API key format is incorrect. It should start with 'AI...'",

  // Quota errors
  DAILY_QUOTA_EXCEEDED: "You've reached your daily API limit. Try again tomorrow, or upgrade to JobFit Pro for unlimited access.",
  RATE_LIMIT_EXCEEDED: "Too many requests. The AI is busy right now - please wait a moment and try again.",

  // Network errors
  NETWORK_ERROR: "Connection issue. Check your internet and try again.",
  TIMEOUT_ERROR: "Request took too long. The server might be slow - try again in a moment.",

  // Scraping errors
  SCRAPE_FAILED: "Couldn't fetch the job posting. Try copying and pasting the job description instead.",
  SCRAPE_EMPTY: "The job posting appears to be empty or behind a login wall. Try copying the text manually.",
  SCRAPE_BLOCKED: "This website blocks automated access. Please copy and paste the job description.",

  // Authentication errors
  AUTH_INVALID_CREDENTIALS: "Invalid email or password. Please try again.",
  AUTH_USER_NOT_FOUND: "No account found with that email.",
  AUTH_EMAIL_IN_USE: "An account with this email already exists.",
  AUTH_WEAK_PASSWORD: "Password should be at least 6 characters.",
  AUTH_INVALID_INVITE: "Invalid or expired invite code. Need one? Join the waitlist!",

  // Generic errors
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
  SERVER_ERROR: "Server error. Our team has been notified. Please try again later.",
} as const;

/**
 * Converts technical error messages to user-friendly ones
 */
export function getUserFriendlyError(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;

  // Daily quota
  if (message.includes('DAILY_QUOTA_EXCEEDED') || message.includes('PerDay')) {
    return ERROR_MESSAGES.DAILY_QUOTA_EXCEEDED;
  }

  // Rate limiting
  if (message.includes('RATE_LIMIT_EXCEEDED') || message.includes('429') || message.includes('quota')) {
    return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (message.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // API key errors
  if (message.includes('403') || message.includes('permission')) {
    return ERROR_MESSAGES.API_KEY_PERMISSION_DENIED;
  }

  if (message.includes('400') || message.includes('invalid')) {
    return ERROR_MESSAGES.INVALID_API_KEY;
  }

  // Scraping errors
  if (message.includes('scrape') || message.includes('Scraped content is too short')) {
    return ERROR_MESSAGES.SCRAPE_EMPTY;
  }

  // Auth errors
  if (message.includes('Invalid login credentials')) {
    return ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
  }

  if (message.includes('User not found')) {
    return ERROR_MESSAGES.AUTH_USER_NOT_FOUND;
  }

  if (message.includes('already registered')) {
    return ERROR_MESSAGES.AUTH_EMAIL_IN_USE;
  }

  if (message.includes('Password should be')) {
    return ERROR_MESSAGES.AUTH_WEAK_PASSWORD;
  }

  if (message.includes('Invalid') && message.includes('invite')) {
    return ERROR_MESSAGES.AUTH_INVALID_INVITE;
  }

  // If no match, return the original message (it might already be friendly)
  // or a generic error if it looks too technical
  if (message.length > 100 || message.includes('Error:') || message.includes('at ')) {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  return message;
}

/**
 * Format retry message for display
 */
export function getRetryMessage(attempt: number, maxAttempts: number, delaySeconds: number): string {
  return `Too busy right now. Retrying (${attempt}/${maxAttempts}) in ${delaySeconds}s...`;
}
