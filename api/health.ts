import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      service: "cla-api",
      message: "Method Not Allowed",
    });
  }

  return res.status(200).json({
    ok: true,
    service: "cla-api",
    message: "Vercel API Function is deployed",
  });
}
