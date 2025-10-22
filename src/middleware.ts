import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* In-memory rate limiter (use Redis in production) */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_CONFIG = {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    protectedPaths: ['/api'],
} as const;

/* Check if identifier has exceeded rate limit */
function isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const rateLimitData = rateLimitMap.get(identifier);

    if (!rateLimitData) {
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_CONFIG.windowMs,
        });
        return false;
    }

    if (now > rateLimitData.resetTime) {
        rateLimitMap.set(identifier, {
            count: 1,
            resetTime: now + RATE_LIMIT_CONFIG.windowMs,
        });
        return false;
    }

    rateLimitData.count++;

    return rateLimitData.count > RATE_LIMIT_CONFIG.maxRequests;
}

/* Cleanup expired rate limit entries (prevents memory leaks) */
function cleanupRateLimitMap(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Fix: Use Array.from() to avoid iterator issues with older TypeScript targets
    Array.from(rateLimitMap.entries()).forEach(([key, value]) => {
        if (now > value.resetTime) {
            keysToDelete.push(key);
        }
    });

    keysToDelete.forEach(key => rateLimitMap.delete(key));
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimitMap, 5 * 60 * 1000);
}

const PUBLIC_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/api/auth/login',
    '/api/auth/signup',
    '/api/health',
] as const;

const PROTECTED_ROUTES = [
    '/',
    '/dashboard',
    '/top-products',
    '/products',
    '/orders',
    '/notifications',
    '/profile',
] as const;

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/* Validate authentication from Zustand persisted cookie */
function isAuthenticated(request: NextRequest): boolean {
    const authCookie = request.cookies.get('auth-storage');

    if (!authCookie?.value) {
        return false;
    }

    try {
        const authData = JSON.parse(authCookie.value);
        return authData?.state?.isAuthenticated === true && authData?.state?.user !== null;
    } catch (error) {
        console.error('Auth cookie parse error:', error);
        return false;
    }
}

/* Main middleware: Rate limiting → Auth → Security headers */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Rate limiting for API routes
    const shouldCheckRateLimit = RATE_LIMIT_CONFIG.protectedPaths.some((path) =>
        pathname.startsWith(path)
    );

    if (shouldCheckRateLimit) {
        const identifier = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';

        if (isRateLimited(identifier)) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: 'Please slow down and try again later',
                    retryAfter: Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000),
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000)),
                        'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.maxRequests),
                        'X-RateLimit-Remaining': '0',
                    }
                }
            );
        }
    }

    // Authentication checks
    const isPublic = isPublicRoute(pathname);
    const isProtected = isProtectedRoute(pathname);
    const userIsAuthenticated = isAuthenticated(request);

    // Redirect authenticated users away from login/signup
    if (userIsAuthenticated && (pathname === '/login' || pathname === '/signup')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Redirect unauthenticated users to login with return URL
    if (isProtected && !userIsAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Add security headers
    const response = NextResponse.next();

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    );

    // CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers: response.headers });
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};