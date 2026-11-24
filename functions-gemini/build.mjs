/** Bundle the existing, reviewed API handlers into this isolated Firebase codebase.
 * Run locally before deploy. The compiled output includes necessary source modules;
 * Firebase CLI uploads functions-gemini only, not the root React project.
 */
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
await build({
  entryPoints: {
    chat: path.join(root, 'api/gemini-chat.ts'),
    lumen: path.join(root, 'api/gemini-lumen.ts'),
    admission: path.join(root, 'api/gemini-admission-reader.ts'),
  },
  outdir: path.join(here, 'dist'),
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  packages: 'bundle',
  logLevel: 'warning',
});
console.log('CLA GEMINI FUNCTIONS BUILD PASS: three bundled API handlers.');
