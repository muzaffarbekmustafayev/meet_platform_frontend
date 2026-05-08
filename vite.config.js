import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            include: ['events', 'util', 'stream', 'buffer'],
            globals: { Buffer: true, global: true, process: true },
            protocolImports: true,
        }),
    ],

    base: '/',

    // simple-peer / socket.io expect a `global` symbol on the window
    define: {
        global: 'globalThis',
    },

    resolve: {
        alias: {
            // Some libs still try to import the node `events` module
            events: 'events',
        },
    },

    optimizeDeps: {
        include: ['simple-peer', 'socket.io-client', 'buffer'],
        esbuildOptions: {
            define: { global: 'globalThis' },
        },
    },

    build: {
        outDir: 'dist',
        target: 'es2020',
        sourcemap: false,
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                // Split heavy deps into their own chunks for better caching on Vercel's edge
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'webrtc': ['simple-peer', 'socket.io-client'],
                    'icons': ['lucide-react', 'react-icons'],
                },
            },
        },
    },

    server: {
        host: true,
        port: 5173,
    },

    preview: {
        host: true,
        port: 4173,
    },
});
