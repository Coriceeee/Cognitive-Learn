/**
 * Explicitly inject the approved Vercel API origin into the Firebase Hosting build.
 * Vite normally loads env files by its active mode; CLA also loads Firebase LIVE
 * configuration explicitly, so the API origin must follow the same source of truth.
 */
const APPROVED_API_ORIGIN = "https://cognitive-learn.vercel.app";

export function resolveLiveApiDefines(
  command: string,
  mode: string,
  qaOptIn: boolean,
  liveEnv: Record<string, string>,
): Record<string, string> {
  if ((command !== "serve" && command !== "build") || qaOptIn) return {};

  const raw = liveEnv.VITE_API_BASE_URL?.trim() ?? "";
  if (!raw) {
    // GitHub CI has no local .env.live.local. It validates source contracts and
    // compiles the default production mode, not the Firebase Hosting LIVE mode.
    if (command === "build" && process.env.CI === "true" && mode !== "live") {
      return { "import.meta.env.VITE_API_BASE_URL": JSON.stringify("") };
    }
    if (mode === "live") {
      throw new Error(
        "CLA API LIVE: thiếu VITE_API_BASE_URL. Hãy đặt https://cognitive-learn.vercel.app trong .env.live.local; không dùng domain Firebase Hosting.",
      );
    }
    return { "import.meta.env.VITE_API_BASE_URL": JSON.stringify("") };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("CLA API LIVE: VITE_API_BASE_URL không phải URL hợp lệ.");
  }

  if (
    url.origin !== APPROVED_API_ORIGIN ||
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    (url.pathname !== "" && url.pathname !== "/") ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "CLA API LIVE: VITE_API_BASE_URL phải chính xác là https://cognitive-learn.vercel.app (Production Vercel), không dùng domain website hoặc Preview URL.",
    );
  }

  return {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(APPROVED_API_ORIGIN),
  };
}
