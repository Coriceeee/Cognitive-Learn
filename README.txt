CLA GEMINI 502 - SAFE MODEL SELECTION (local only)

1. Extract both CLA_FIX_GEMINI.mjs and CLA_FIX_GEMINI.cmd DIRECTLY into:
   C:\Gạo\Cognitive-Learn\
2. Run CLA_FIX_GEMINI.cmd (double-click) or execute in PowerShell:
   Set-Location "C:\Gạo\Cognitive-Learn"
   node .\CLA_FIX_GEMINI.mjs
3. The utility uses the existing GEMINI_API_KEY, requests the Google model list,
   then sends a tiny JSON-output request to up to 5 Flash models.
   Google API calls may count against quota or incur small usage costs.
4. It modifies GEMINI_MODEL only after a successful generateContent test.
   It never modifies Firebase, source files, role rules, or Gemini key.
   .env.local backups (potentially containing secrets) are stored outside
   the repo under %LOCALAPPDATA%\CLA\GeminiBackups.
5. Restart Vite. Open Lumen and test the button again.

IMPORTANT: This package is a SAFE CONFIG REPAIR UTILITY, NOT a full source ZIP.
Without the current source ZIP, it cannot guarantee every error inside
api/gemini-lumen.ts is resolved. Do NOT share .env files or API keys.
