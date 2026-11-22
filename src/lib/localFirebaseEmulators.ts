/**
 * Explicit development-only Firebase emulator switch.
 *
 * Fail closed when QA mode is requested but the browser, Vite mode or Firebase
 * identity is unsafe. Nothing in this module grants Firestore access: normal
 * Auth, consent and candidate Rules continue to apply in the emulator.
 */
export type LocalFirebaseEmulatorInput = {
  enabled: string | boolean | undefined;
  mode: string;
  hostname: string;
  protocol: string;
  projectId: string | undefined;
  apiKey: string | undefined;
  authDomain: string | undefined;
};

export type LocalFirebaseEmulatorConfig = {
  projectId: 'demo-cla-mvp';
  host: '127.0.0.1';
  authPort: 9099;
  firestorePort: 8080;
};

const QA_PROJECT = 'demo-cla-mvp';
const QA_KEY = 'fake-api-key';
const QA_DOMAIN = 'demo-cla-mvp.firebaseapp.com';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export function resolveLocalFirebaseEmulators(input: LocalFirebaseEmulatorInput): LocalFirebaseEmulatorConfig | null {
  const requested = input.enabled;
  if (requested === undefined || requested === '' || requested === false || requested === 'false') return null;
  if (requested !== true && requested !== 'true') {
    throw new Error('CLA Firebase QA: VITE_USE_FIREBASE_EMULATORS must be exactly true or false.');
  }
  if (input.mode !== 'development' || input.protocol !== 'http:' || !LOCAL_HOSTS.has(input.hostname)) {
    throw new Error('CLA Firebase QA: emulators are allowed only on an HTTP loopback development origin.');
  }
  if (input.projectId !== QA_PROJECT || input.apiKey !== QA_KEY || input.authDomain !== QA_DOMAIN) {
    throw new Error('CLA Firebase QA: refusing a non-demo or mismatched Firebase identity.');
  }
  return { projectId: QA_PROJECT, host: '127.0.0.1', authPort: 9099, firestorePort: 8080 };
}
