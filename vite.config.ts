import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        target: 'es2022',
        sourcemap: true,
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1100,
        rollupOptions: {
            output: {
                manualChunks: {
                    maplibre: ['maplibre-gl'],
                    validation: ['zod'],
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/tests/setup.ts'],
        coverage: {
            reporter: ['text', 'html'],
        },
    },
});
