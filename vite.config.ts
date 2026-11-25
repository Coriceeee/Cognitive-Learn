import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { claGeminiDevApi } from './tools/claGeminiDevApi.ts';
import { resolveLiveFirebaseDefines } from './tools/cla_vite_firebase_env.ts';

// Local serving defaults to the real Firebase project, even if an old
// package.json still starts Vite without --mode live. QA Emulator use requires
// the dedicated launcher (CLA_FIREBASE_QA=true), never a leftover VITE flag.
export default defineConfig(({ command }) => {
  const qaOptIn = process.env.CLA_FIREBASE_QA === 'true';
  const liveEnv = command === 'serve' && !qaOptIn
    ? loadEnv('live', process.cwd(), 'VITE_')
    : {};
  const firebaseDefines = resolveLiveFirebaseDefines(command, qaOptIn, liveEnv);

  return {
    plugins: [react(), claGeminiDevApi()],
    define: firebaseDefines,
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
  };
});
