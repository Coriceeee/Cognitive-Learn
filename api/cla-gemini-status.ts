import process from "node:process";
import type { VercelRequest, VercelResponse } from "../server/vercelTypes.ts";
import { allowGeminiOrigin } from "../server/geminiCors.ts";
const REQUIRED_FIREBASE_ORIGINS = ["https://cognitivelearn.ai.vn", "https://cognitive-learn-ai.web.app", "https://cognitive-learn-ai.firebaseapp.com"] as const;
/** Public read-only probe. Never returns secret values or calls Gemini. */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const allowed = allowGeminiOrigin(req, res, "GET, OPTIONS");
  if (req.method === "OPTIONS") return allowed ? res.status(204).end() : res.status(403).end();
  if (!allowed) return res.status(403).json({ ok: false, message: "Origin không được phép." });
  if (req.method !== "GET") { res.setHeader("Allow", "GET, OPTIONS"); return res.status(405).json({ ok: false, message: "Chỉ hỗ trợ GET." }); }
  const origins = (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").map(value => value.trim().replace(/\/$/, "")).filter(Boolean);
  const missing: string[] = [];
  if (!process.env.GEMINI_API_KEY?.trim()) missing.push("GEMINI_API_KEY");
  if (!(process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || "").trim()) missing.push("FIREBASE_WEB_API_KEY");
  const project = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "").trim();
  if (project !== "cognitive-learn-ai") missing.push("FIREBASE_PROJECT_ID (expected cognitive-learn-ai)");
  const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
  if (!/^[A-Za-z0-9._-]+$/.test(model)) missing.push("GEMINI_MODEL");
  if (!REQUIRED_FIREBASE_ORIGINS.every(origin => origins.includes(origin))) missing.push("CORS_ALLOWED_ORIGINS (Firebase Hosting origins)");
  return res.status(200).json({ ok: true, service: "cla-gemini-api", backend: "Vercel Functions", configured: missing.length === 0, model, missing, note: "configured chỉ xác nhận biến môi trường và CORS; không xác nhận Gemini API key còn quota hoặc request thực tế thành công." });
}
