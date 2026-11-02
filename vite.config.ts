import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// CLA already lazy-loads page routes. Split only heavy dependency families
// instead of creating one large vendor bundle for every route.
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase',
              test: /node_modules[\\/](?:@firebase|firebase)[\\/]/,
              entriesAware: true,
              maxSize: 300_000,
              priority: 20,
            },
            {
              name: 'charts',
              test: /node_modules[\\/](?:recharts|react-is|d3-[^\\/]+)[\\/]/,
              entriesAware: true,
              maxSize: 300_000,
              priority: 15,
            },
            {
              name: 'icons',
              test: /node_modules[\\/]lucide-react[\\/]/,
              entriesAware: true,
              maxSize: 250_000,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
