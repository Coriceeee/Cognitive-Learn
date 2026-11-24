/** Transport guards shared by the three Gemini endpoints. No credentials or payloads in diagnostics. */
export class GeminiTransportError extends Error {
  readonly code: 'NETWORK' | 'TIMEOUT' | 'REPLY_LIMIT' | 'INVALID_JSON';
  readonly stage: string;
  constructor(code: GeminiTransportError['code'], stage: string) {
    super(`${stage}: ${code}`);
    this.code = code; this.stage = stage;
  }
}
export function upstreamStage(url: string): string {
  const host = new URL(url).hostname;
  if (host === 'identitytoolkit.googleapis.com') return 'FIREBASE_AUTH';
  if (host === 'firestore.googleapis.com') return 'FIRESTORE_ROLE';
  return 'GEMINI_GENERATE';
}
export async function guardedJson(url: string, init: RequestInit, timeoutMs: number, maxBytes = 512 * 1024) {
  const stage = upstreamStage(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let raw = '', count = 0;
    if (reader) {
      try {
        for (;;) {
          const {done, value} = await reader.read();
          if (done) break;
          count += value.byteLength;
          if (count > maxBytes) {
            void reader.cancel().catch(() => {});
            throw new GeminiTransportError('REPLY_LIMIT', stage);
          }
          raw += decoder.decode(value, {stream:true});
        }
        raw += decoder.decode();
      } finally { reader.releaseLock(); }
    }
    let data: unknown = null;
    try { data = JSON.parse(raw); }
    catch { if (response.ok) throw new GeminiTransportError('INVALID_JSON', stage); }
    if (!response.ok) console.warn(`[CLA API] ${stage} HTTP ${response.status}`);
    return {status:response.status, ok:response.ok, data};
  } catch (error) {
    const fault = error instanceof GeminiTransportError ? error : new GeminiTransportError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK', stage);
    console.warn(`[CLA API] ${fault.stage} ${fault.code}`);
    throw fault;
  } finally { clearTimeout(timer); }
}
export function visibleGeminiText(parts: unknown): string {
  if (!Array.isArray(parts)) return '';
  return parts.filter(p => p && typeof p === 'object' && p.thought !== true && typeof p.text === 'string').map(p => p.text).join('\n').trim();
}
