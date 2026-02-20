
const MAX_LOG_LENGTH = 200;

export const sanitizeLog = (val: unknown) => {
    // Replace all control characters (ASCII 0-31 and 127) with a space
    const str = String(val).replace(/[\x00-\x1F\x7F]/g, ' ');
    return str.length > MAX_LOG_LENGTH ? str.substring(0, MAX_LOG_LENGTH) + '...' : str;
};
