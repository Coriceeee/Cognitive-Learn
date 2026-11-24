/**
 * CP93 Cloud Functions Gen2: reuse the existing reviewed handlers and return JSON
 * on the SAME origin as cognitivelearn.ai.vn. No API key enters the Vite bundle.
 * Deploy this codebase separately; it MUST NOT deploy optional push/admin Functions.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { routeName, shouldReturnStatus } from './src/router.mjs';
import chatHandler from './dist/chat.mjs';
import lumenHandler from './dist/lumen.mjs';
import admissionHandler from './dist/admission.mjs';

const key = defineSecret('GEMINI_API_KEY');
const firebaseWebKey = defineSecret('FIREBASE_WEB_API_KEY');
const HANDLERS = Object.freeze({chat:chatHandler,lumen:lumenHandler,admission:admissionHandler});
const ALLOWED_ORIGINS = [
  'https://cognitivelearn.ai.vn',
  'https://cognitive-learn-ai.web.app',
  'https://cognitive-learn-ai.firebaseapp.com',
];
function reply(res,status,payload) {
  res.status(status).set('Content-Type','application/json; charset=utf-8')
    .set('Cache-Control','no-store').set('X-Content-Type-Options','nosniff')
    .json(payload);
}
export const claGeminiApi = onRequest({
  region: 'asia-southeast1',
  invoker: 'public', // required for Hosting rewrite; the handlers still enforce Firebase ID token
  secrets: [key, firebaseWebKey],
  timeoutSeconds: 60,
  memory: '512MiB',
  maxInstances: 5,
  concurrency: 20,
}, async (req,res) => {
  const pathname = req.path || req.url || '';
  res.set('Cache-Control','no-store');
  res.set('X-Content-Type-Options','nosniff');
  if (shouldReturnStatus(pathname)) {
    if (req.method !== 'GET') return reply(res,405,{ok:false,message:'Chỉ hỗ trợ GET.'});
    return reply(res,200,{ok:true,backend:'Firebase Functions Gen2',configured:Boolean(key.value() && firebaseWebKey.value()),model:process.env.GEMINI_MODEL || 'gemini-2.5-flash'});
  }
  const handler = HANDLERS[routeName(pathname)];
  if (!handler) return reply(res,404,{ok:false,message:'Không tồn tại API Gemini này.'});
  // Firebase Admin is not used by these reviewed handlers; they verify the
  // Firebase ID token and active profile using Google's REST endpoints.
  process.env.GEMINI_API_KEY = key.value();
  process.env.FIREBASE_WEB_API_KEY = firebaseWebKey.value();
  process.env.FIREBASE_PROJECT_ID = 'cognitive-learn-ai';
  process.env.CORS_ALLOWED_ORIGINS = ALLOWED_ORIGINS.join(',');
  try {
    await handler(req,res);
  } catch (error) {
    // Never return/print upstream request details, Firebase token or secrets.
    console.error('CLA Gemini handler failure', { route: routeName(pathname), type: error instanceof Error ? error.name : 'unknown' });
    if (!res.headersSent) reply(res,502,{ok:false,message:'Máy chủ Gemini gặp lỗi không mong muốn.'});
    else if (!res.writableEnded) res.end();
  }
});
