import type { VercelRequest, VercelResponse } from "./vercelTypes.ts";
export declare function allowGeminiOrigin(
  req: VercelRequest,
  res: VercelResponse,
  methods: string,
): boolean;
