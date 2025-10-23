/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    poweredByHeader: false,

    // Optimize production builds
    swcMinify: true,

    // Image optimization config
    images: {
        domains: [],
        formats: ['image/avif', 'image/webp'],
    },

    // Environment variables available to the browser
    env: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },

    // Experimental features
    experimental: {
        optimizePackageImports: ['echarts-for-react', 'echarts'],
    },
};

export default nextConfig;