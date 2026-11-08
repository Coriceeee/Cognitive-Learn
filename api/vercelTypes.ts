import type { IncomingMessage, ServerResponse } from "node:http";

// Minimal structural types for the Vercel Node.js request/response API.
// These are compile-time only; Vercel supplies the runtime objects.
export type VercelRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[]>;
  cookies?: Record<string, string>;
};

export type VercelResponse = ServerResponse & {
  status(statusCode: number): VercelResponse;
  json(body: unknown): VercelResponse;
  send(body: unknown): VercelResponse;
};
