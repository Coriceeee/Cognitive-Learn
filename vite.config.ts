import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { claGeminiDevApi } from './tools/claGeminiDevApi.ts';
import { resolveLiveFirebaseDefines } from './tools/cla_vite_firebase_env.ts';

// Local serving defaults to the real Firebase project, even if an old
// package.json still starts Vite without --mode live. QA Emulator use requires
// the dedicated launcher (CLA_FIREBASE_QA=true), never a leftover VITE flag.
export default defineConfig(({ command }) => {
  // QA emulator opt-in is valid only for the local dev server, never for a production build.
  const qaOptIn = command === 'serve' && process.env.CLA_FIREBASE_QA === 'true';
  // Load and validate the exact LIVE environment for both local serving and production builds.
  // This prevents a wrong/missing project ID from being baked into Firebase Hosting assets.
  const liveEnv = !qaOptIn ? loadEnv('live', process.cwd(), 'VITE_') : {};
  const firebaseDefines = resolveLiveFirebaseDefines(command, qaOptIn, liveEnv);

  return {
    plugins: [react(), claGeminiDevApi()],
    define: {
      ...firebaseDefines,
      // Compile-time gate: stale VITE_* files cannot turn on Auth/Firestore emulators.
      __CLA_FIREBASE_QA__: JSON.stringify(qaOptIn),
    },
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
