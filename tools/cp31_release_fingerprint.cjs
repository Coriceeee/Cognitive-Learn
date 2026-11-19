/** CP31 B4 fingerprint of the distributable application/test sources.
 * Excludes this generated baseline, secrets, runtime logs, research rows and node_modules.
 * This is a source integrity CHECK, not an attestation of what production serves.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIRS = ['src', 'api', 'tests', 'tools', 'tests_cp31', 'functions-admin/src', 'functions-privacy/src', 'functions/src'];
const SOURCE_FILES = ['src/styles/07-atlas.css', 'src/components/common/charts/analytic-charts.css', 'src/styles/09-pulse.css', 'src/styles/10-haven.css', 'src/page/lumen/components/lumen-dynamic-state.css', 'research/benchmarks/cla_knowledge_120_v1.jsonl', 'package.json', 'package-lock.json', 'vercel.json', 'firestore.rules.CANDIDATE', 'tsconfig.json', 'tsconfig.api.json', 'index.html', 'firestore.rules.CANDIDATE_CP21', 'firebase.emulator.cp21.json', 'research/golden_path/fixture_SYNTHETIC.v1.json', 'research/golden_path/fixture_SYNTHETIC_cycle2.v1.json', 'research/golden_path/measurement_declarations_SYNTHETIC.v1.json', 'research/src/longitudinal_adaptive_ml.py', 'research/tests/test_longitudinal_adaptive_ml.py', 'research/src/uci_ml_comparison.py', 'research/tests/test_uci_ml_comparison.py', 'research/huggingface/uci_student_performance/fetch_eval.py', 'research/cognitive_validation/validate.py', 'research/cognitive_validation/reliability.py', 'research/cognitive_validation/tests/test_validation.py', 'research/cognitive_validation/tests/test_reliability.py', 'research/cognitive_validation/sample/paired_SYNTHETIC.csv', 'research/cognitive_validation/sample/paired_plan_SYNTHETIC.json', 'research/adaptive_study/study.py', 'research/adaptive_study/cluster_comparison.py', 'research/adaptive_study/tests/test_study.py', 'research/adaptive_study/tests/test_cluster_comparison.py', 'research/adaptive_study/sample/fixture_SYNTHETIC.csv'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.py', '.json']);
const EXCLUDED = new Set(['src/lib/nexusEvidenceBaseline.ts']);
function trackedFiles(root = ROOT) {
  const results = [...SOURCE_FILES];
  function walk(rel) {
    for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const child = path.posix.join(rel, entry.name);
      if (entry.isDirectory()) {
        if (!['__pycache__', 'node_modules', 'dist', '.git'].includes(entry.name)) walk(child);
      } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name)) && !EXCLUDED.has(child)) results.push(child);
    }
  }
  for (const dir of SOURCE_DIRS) if (fs.existsSync(path.join(root, dir))) walk(dir);
  return results.sort();
}
function fingerprint(root = ROOT) {
  const lines = trackedFiles(root).map(rel => {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
    return rel + '\t' + digest;
  });
  return { sha256: crypto.createHash('sha256').update(lines.join('\n') + '\n').digest('hex'), fileCount: lines.length };
}
if (require.main === module) {
  const result = fingerprint();
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
module.exports = { fingerprint, trackedFiles };
