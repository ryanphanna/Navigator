// Helper to check if string is a strict IPv4 address (canonical format)
function isStrictIPv4(ip: string): boolean {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    for (const part of parts) {
        // Must be digits only
        if (!/^\d+$/.test(part)) return false;

        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0 || num > 255) return false;

        // Disallow leading zeros (unless it's just "0") to prevent octal interpretation confusion
        if (part.length > 1 && part.startsWith('0')) return false;
    }
    return true;
}

// Helper to check if an IP address is private
export function isPrivateIP(ip: string): boolean {
    // IPv6 logic (Check first to handle IPv4-mapped IPv6)
    if (ip.includes(':')) {
        const lower = ip.toLowerCase();

        // ::1 (Loopback)
        if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;

        // :: (Unspecified)
        if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;

        // fc00::/7 (Unique Local)
        if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

        // fe80::/10 (Link-local)
        if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;

        // IPv4-mapped IPv6 ::ffff:0:0/96
        if (lower.startsWith('::ffff:')) return true;

        // 64:ff9b::/96 (IPv4/IPv6 translation) - arguably public but often internal use
        // 2001:db8::/32 (Documentation)
        if (lower.startsWith('2001:db8:')) return true;

        return false;
    }

    // IPv4 logic
    if (ip.includes('.')) {
        // Basic format check
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4 || parts.some(isNaN)) return false;

        // 0.0.0.0/8 (Current network)
        if (parts[0] === 0) return true;

        // 10.0.0.0/8 (Private network)
        if (parts[0] === 10) return true;

        // 100.64.0.0/10 (Shared Address Space)
        if (parts[0] === 100 && (parts[1] >= 64 && parts[1] <= 127)) return true;

        // 127.0.0.0/8 (Loopback)
        if (parts[0] === 127) return true;

        // 169.254.0.0/16 (Link-local)
        if (parts[0] === 169 && parts[1] === 254) return true;

        // 172.16.0.0/12 (Private network)
        if (parts[0] === 172 && (parts[1] >= 16 && parts[1] <= 31)) return true;

        // 192.0.0.0/24 (IETF Protocol Assignments)
        if (parts[0] === 192 && parts[1] === 0 && parts[2] === 0) return true;

        // 192.0.2.0/24 (TEST-NET-1)
        if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2) return true;

        // 192.88.99.0/24 (6to4 Relay Anycast)
        if (parts[0] === 192 && parts[1] === 88 && parts[2] === 99) return true;

        // 192.168.0.0/16 (Private network)
        if (parts[0] === 192 && parts[1] === 168) return true;

        // 198.18.0.0/15 (Network Benchmark)
        if (parts[0] === 198 && (parts[1] >= 18 && parts[1] <= 19)) return true;

        // 198.51.100.0/24 (TEST-NET-2)
        if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100) return true;

        // 203.0.113.0/24 (TEST-NET-3)
        if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) return true;

        // 224.0.0.0/4 (Multicast)
        if (parts[0] >= 224 && parts[0] <= 239) return true;

        // 240.0.0.0/4 (Reserved)
        if (parts[0] >= 240) return true;

        // 255.255.255.255 (Broadcast)
        if (parts[0] === 255 && parts[1] === 255 && parts[2] === 255 && parts[3] === 255) return true;

        return false;
    }

    return false;
}

type DnsResolver = (hostname: string) => Promise<string[]>;

export const defaultDnsResolver: DnsResolver = async (hostname) => {
    // Check if Deno is available
    if (typeof (globalThis as any).Deno !== 'undefined') {
        const Deno = (globalThis as any).Deno;
        try {
            const ipv4 = await Deno.resolveDns(hostname, 'A');
            return ipv4;
        } catch (e) {
            // Only throw if strictly no records found, or handle AAAA if needed.
            // For now, let's assume we primarily care about IPv4 for this scraper or handle IPv6 if returned.
            // If Deno throws NotFound, maybe try AAAA?
            try {
                const ipv6 = await Deno.resolveDns(hostname, 'AAAA');
                return ipv6;
            } catch {
                throw e;
            }
        }
    }

    // Fallback for testing environments (Node/Bun)
    try {
        const dns = await import('node:dns/promises');
        try {
            return await dns.resolve4(hostname);
        } catch {
            try {
                return await dns.resolve6(hostname);
            } catch {
                // If both fail, throw error
                throw new Error('No DNS records found');
            }
        }
    } catch (e) {
        throw new Error('DNS resolution not available in this environment');
    }
};

export async function validateUrl(url: string, resolver: DnsResolver = defaultDnsResolver): Promise<void> {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new Error('Invalid URL');
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol: must be http or https');
    }

    let hostname = parsed.hostname;

    // Handle IPv6 literals in URL (wrapped in brackets)
    if (hostname.startsWith('[') && hostname.endsWith(']')) {
        const ip = hostname.slice(1, -1);
        if (isPrivateIP(ip)) {
            throw new Error(`Access to private IP ${ip} is denied`);
        }
        return;
    }

    // Check if hostname is a STRICT IPv4 address
    // We only skip DNS resolution if it's a strictly valid canonical IPv4.
    // Non-strict IPs (e.g. with leading zeros like 0127.0.0.1) are treated as domains
    // and must be resolved (or fail resolution) to prevent octal interpretation bypasses.
    if (isStrictIPv4(hostname)) {
        if (isPrivateIP(hostname)) {
            throw new Error(`Access to private IP ${hostname} is denied`);
        }
        return;
    }

    // Resolve hostname
    let ips: string[] = [];
    try {
        ips = await resolver(hostname);
    } catch (e) {
        throw new Error(`Failed to resolve hostname: ${hostname}`);
    }

    if (!ips || ips.length === 0) {
        throw new Error(`Failed to resolve hostname: ${hostname}`);
    }

    for (const ip of ips) {
        if (isPrivateIP(ip)) {
            throw new Error(`Access to private IP ${ip} is denied`);
        }
    }
}

export async function fetchSafe(inputUrl: string, options: RequestInit = {}): Promise<Response> {
    let currentUrl = inputUrl;
    let response: Response | null = null;
    const maxRedirects = 5;

    for (let i = 0; i < maxRedirects; i++) {
        // Validate URL (SSRF Prevention)
        await validateUrl(currentUrl);

        // Fetch with manual redirect
        // Note: We use 'manual' to intercept 3xx responses and validate the new location
        response = await fetch(currentUrl, {
            ...options,
            redirect: 'manual'
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('Location');

            // If no location header, we can't follow redirect, so return the 3xx response
            if (!location) {
                return response;
            }

            // Resolve relative URLs
            try {
                currentUrl = new URL(location, currentUrl).toString();
            } catch {
                throw new Error(`Invalid redirect URL: ${location}`);
            }

            // Consume/Cancel the response body to free resources before next fetch
            try {
                await response.body?.cancel();
            } catch {}

            continue;
        }

        return response;
    }

    throw new Error(`Too many redirects (max ${maxRedirects})`);
}
