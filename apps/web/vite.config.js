import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@app': path.resolve(__dirname, 'src'),
            '@ui-kit': path.resolve(__dirname, 'src/ui-kit')
        }
    },
    build: {
        rollupOptions: {
            external: ['@tanstack/react-query']
        }
    }
});
