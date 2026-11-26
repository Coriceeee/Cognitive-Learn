#!/usr/bin/env node
import { createServer } from 'vite';

const qa = process.argv.includes('--qa');
if (qa) process.env.CLA_FIREBASE_QA = 'true';

const server = await createServer({
  mode: qa ? 'development' : 'live',
  server: { open: true },
});

await server.listen();
server.printUrls();
server.bindCLIShortcuts({ print: true });

const shutdown = async () => {
  await server.close();
  process.exit(0);
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

console.log(
  qa
    ? '[CLA] QA mode: local Firebase Emulators (demo project only).'
    : '[CLA] LIVE mode: Firebase cognitive-learn-ai; Emulator forcibly disabled.',
);
