/**
 * CP90: localhost-only, Vite development adapter for the existing reviewed
 * Vercel API handlers. No frontend API keys; no production routes changed.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin } from 'vite';

const API_PATHS: Record<string, string> = {
  '/api/gemini-chat': '/api/gemini-chat.ts',
  '/api/gemini-lumen': '/api/gemini-lumen.ts',
  '/api/gemini-admission-reader': '/api/gemini-admission-reader.ts',
};
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function localApiAddressAllowed(address: string | undefined, host: string | undefined, origin: string | undefined): boolean {
  const remote = address || '';
  const loopback = remote === '::1' || /^127\./.test(remote) || remote.startsWith('::ffff:127.');
  if (!loopback || !host) return false;
  let parsed: URL;
  try { parsed = new URL(`http://${host}`); } catch { return false; }
  if (!LOCAL_HOSTS.has(parsed.hostname)) return false;
  if (origin) {
    try {
      const o = new URL(origin);
      if (o.origin !== parsed.origin) return false;
    } catch { return false; }
  }
  return true;
}

export function geminiDevConfiguration(env: Record<string, string>, frontend: Record<string,string>): { ready: boolean; missing: string[]; model: string; projectMatch: boolean } {
  const required = ['GEMINI_API_KEY', 'FIREBASE_WEB_API_KEY', 'FIREBASE_PROJECT_ID'];
  const missing = required.filter(key => !env[key]?.trim());
  const project = env.FIREBASE_PROJECT_ID?.trim() || '';
  const front = frontend.VITE_FIREBASE_PROJECT_ID?.trim() || '';
  const projectMatch = Boolean(project && front && project === front && !project.startsWith('demo-'));
  if (!projectMatch) missing.push('Firebase backend phải khớp frontend LIVE (không dùng Emulator/demo)');
  if (frontend.VITE_USE_FIREBASE_EMULATORS === 'true') missing.push('Tắt Firebase Emulator trong phiên Gemini LIVE');
  if (env.FIREBASE_WEB_API_KEY?.startsWith('fake-')) missing.push('FIREBASE_WEB_API_KEY phải là Web API key Firebase thật');
  return { ready: missing.length === 0, missing, model: env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash', projectMatch };
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}

export function claGeminiDevApi(): Plugin {
  let mode = 'development';
  let root = process.cwd();
  return {
    name: 'cla-local-gemini-server-only',
    apply: 'serve',
    configResolved(config) { mode = config.mode; root = config.root; },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?', 1)[0];
        if (pathname !== '/api/cla-gemini-status' && !Object.prototype.hasOwnProperty.call(API_PATHS, pathname)) return next();
        if (!localApiAddressAllowed(req.socket.remoteAddress, req.headers.host, req.headers.origin)) {
          return json(res, 403, { ok:false, message:'API phát triển chỉ dành cho chính localhost, không cho truy cập từ mạng hoặc origin khác.' });
        }
        // No secrets are sent in the health response, logs or frontend bundle.
        const serverEnv = loadEnv('gemini', root, '');
        const frontendEnv = loadEnv(mode, root, 'VITE_');
        const checked = geminiDevConfiguration(serverEnv, frontendEnv);
        if (pathname === '/api/cla-gemini-status') {
          return json(res, 200, { ok: checked.ready, backend: 'Vite local API', configured: checked.ready, model: checked.model, missing: checked.missing });
        }
        if (!checked.ready) {
          return json(res, 503, { ok:false, message:'Gemini localhost chưa cấu hình đủ. Xem http://127.0.0.1:<port>/api/cla-gemini-status để biết mục nào còn thiếu.' });
        }
        if (req.method !== 'POST' && req.method !== 'OPTIONS') {
          res.setHeader('Allow', 'POST, OPTIONS');
          return json(res, 405, {ok:false,message:'Chỉ hỗ trợ POST, OPTIONS.'});
        }
        // Avoid accepting tokens from an unrelated frontend project or demo emulator.
        if (req.method === 'POST' && req.headers['content-type']?.split(';')[0] !== 'application/json') {
          return json(res, 415, {ok:false,message:'Chỉ hỗ trợ application/json.'});
        }
        try {
          // Values are private to the local Node process, never import.meta.env.VITE_*.
          for (const key of ['GEMINI_API_KEY', 'GEMINI_MODEL', 'FIREBASE_WEB_API_KEY', 'FIREBASE_PROJECT_ID']) {
            if (serverEnv[key]) process.env[key] = serverEnv[key];
          }
          // The existing handlers use exact-origin CORS checks.
          process.env.CORS_ALLOWED_ORIGINS = `http://${req.headers.host}`;
          let body: unknown = undefined;
          if (req.method === 'POST') {
            const chunks: Buffer[] = [];
            let size = 0;
            for await (const chunk of req) {
              const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              size += buffer.length;
              if (size > 32_000) return json(res,413,{ok:false,message:'Yêu cầu vượt giới hạn kích thước.'});
              chunks.push(buffer);
            }
            try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
            catch { return json(res,400,{ok:false,message:'JSON không hợp lệ.'}); }
          }
          const module = await server.ssrLoadModule(API_PATHS[pathname]);
          if (typeof module.default !== 'function') return json(res,503,{ok:false,message:'API Gemini chưa sẵn sàng.'});
          const request = req as IncomingMessage & {body?:unknown};
          request.body = body;
          const response = res as ServerResponse & {status:(n:number)=>typeof response;json:(data:unknown)=>typeof response;send:(data:unknown)=>typeof response};
          response.status = (n: number) => { res.statusCode = n; return response; };
          response.json = (data:unknown) => {json(res, res.statusCode, data);return response;};
          response.send = (data:unknown) => {json(res,res.statusCode,data);return response;};
          await module.default(request, response);
        } catch {
          console.warn(`[CLA local API] ${pathname}: HANDLER_FAILURE`);
          if (!res.headersSent) json(res, 502, {ok:false,message:'Máy chủ Gemini localhost gặp lỗi. Kiểm tra terminal Vite; không gửi API key hoặc token.'});
          else if (!res.writableEnded) res.end();
        }
      });
    },
  };
}
