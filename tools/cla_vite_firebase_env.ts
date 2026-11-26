/**
 * Fail-closed Firebase environment selection for local Vite servers.
 * The normal dev server always uses the real LIVE Firebase Web App config.
 * QA Emulator mode is available only through the dedicated launcher, which
 * sets CLA_FIREBASE_QA=true before Vite starts.
 */
const EXPECTED_PROJECT = 'cognitive-learn-ai';
const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

export function resolveLiveFirebaseDefines(
  command: string,
  qaOptIn: boolean,
  liveEnv: Record<string, string>,
): Record<string, string> {
  if (command !== 'serve' || qaOptIn) return {};

  const projectId = liveEnv.VITE_FIREBASE_PROJECT_ID?.trim();
  const apiKey = liveEnv.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = liveEnv.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const appId = liveEnv.VITE_FIREBASE_APP_ID?.trim();

  if (projectId !== EXPECTED_PROJECT) {
    throw new Error(
      'CLA Firebase LIVE: không tìm thấy VITE_FIREBASE_PROJECT_ID=cognitive-learn-ai trong cấu hình LIVE. Hãy kiểm tra .env.live.local; không dùng .env.development.local.',
    );
  }
  if (!apiKey || !/^AIza[0-9A-Za-z_-]{20,}$/.test(apiKey)) {
    throw new Error(
      'CLA Firebase LIVE: VITE_FIREBASE_API_KEY đang thiếu hoặc không phải Web API key Firebase hợp lệ. Hãy lấy Web API key của Web App cognitive-learn-ai và đặt trong .env.live.local. Không gửi key vào chat.',
    );
  }
  if (!authDomain || !appId) {
    throw new Error(
      'CLA Firebase LIVE: thiếu VITE_FIREBASE_AUTH_DOMAIN hoặc VITE_FIREBASE_APP_ID trong .env.live.local.',
    );
  }

  const defines: Record<string, string> = {};
  for (const key of FIREBASE_ENV_KEYS) {
    defines[`import.meta.env.${key}`] = JSON.stringify(liveEnv[key]?.trim() ?? '');
  }
  // A stale .env.local / .env.development.local or PowerShell override must
  // never silently reconnect the ordinary development server to an emulator.
  defines['import.meta.env.VITE_USE_FIREBASE_EMULATORS'] = JSON.stringify('false');
  return defines;
}
