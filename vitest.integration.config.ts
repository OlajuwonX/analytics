import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Integration test configuration
 * Tests component interactions, data flow, and API integration
 */
export default defineConfig({
    plugins: [react()],
    test: {
        name: 'integration',
        environment: 'jsdom',
        setupFiles: ['./src/tests/setup.ts'],
        globals: true,
        css: true,
        // Integration tests can be slower
        testTimeout: 10000,
        include: ['src/tests/integration/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', '.next'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});