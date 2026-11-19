/**
 * CLA — fail-closed Firestore Emulator security gate.
 * No production Firebase API and no deploy command are ever used by this script.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const PROJECT_ID = 'demo-cla-cp21-security';
const CONFIG_FILE = 'firebase.emulator.cp21.json';
const RULES_FILE = 'firestore.rules.CANDIDATE_CP21';
const REPORT_FILE = 'reports/security/firestore_emulator_gate.json';
const LOG_FILE = 'reports/security/firestore_emulator_gate.log';

function isLoopback(host) {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

function validateConfiguration(config, projectId = PROJECT_ID) {
  if (projectId !== PROJECT_ID || !projectId.startsWith('demo-')) {
    throw new Error('SECURITY STOP: only the fixed demo-cla-cp21-security project is allowed.');
  }
  if (!config || config.firestore?.rules !== RULES_FILE) {
    throw new Error('SECURITY STOP: emulator must load the exact reviewed CANDIDATE_CP21 rules.');
  }
  const emu = config.emulators?.firestore;
  if (!emu || !isLoopback(emu.host) || !Number.isInteger(emu.port) || emu.port < 1024 || emu.port > 65535) {
    throw new Error('SECURITY STOP: Firestore Emulator must bind a local loopback address and valid port.');
  }
  if (config.emulators?.ui?.enabled !== false) {
    throw new Error('SECURITY STOP: Emulator UI must be disabled for this gate.');
  }
  return Object.freeze({ projectId, rules: RULES_FILE, host: emu.host, port: emu.port });
}

function validateEmulatorEnvironment(host) {
  if (!host) return true;
  const match = /^([^:]+):(\d+)$/.exec(host);
  if (!match || !isLoopback(match[1]) || Number(match[2]) < 1024 || Number(match[2]) > 65535) {
    throw new Error('SECURITY STOP: FIRESTORE_EMULATOR_HOST points outside a local emulator.');
  }
  return true;
}

function overallStatus(staticStatus, emulatorStatus) {
  if (staticStatus === 'PASS' && emulatorStatus === 'PASS') return 'PASS';
  if (staticStatus === 'FAIL' || emulatorStatus === 'FAIL') return 'FAIL';
  return 'BLOCKED';
}

function runCommand(command, args, cwd, timeout = 120000) {
  const win = process.platform === 'win32';
  const result = spawnSync(command, args, {
    cwd, encoding: 'utf8', timeout, windowsHide: true,
    shell: win && command !== process.execPath,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, GCLOUD_PROJECT: PROJECT_ID, GCP_PROJECT: PROJECT_ID },
  });
  return {
    ok: !result.error && result.status === 0,
    exitCode: result.status,
    output: [result.stdout || '', result.stderr || '', result.error?.message || ''].filter(Boolean).join('\n'),
  };
}

/**
 * Firestore's Java child process may lose non-ASCII characters on Windows
 * (for example C:\Gạo -> C:\G?o). Stage only this test's reviewed files in
 * a genuinely ASCII, writable directory; SUBST aliases are not sufficient
 * when subprocesses canonicalize cwd.
 *
 * node_modules is a junction to the already-installed local dependencies.
 * No student data, secrets, or production configuration is copied.
 */
function createAsciiEmulatorStage(root) {
  const ascii = value => typeof value === 'string' && /^[\x00-\x7F]+$/.test(value);
  const roots = [os.tmpdir(), process.env.PUBLIC,
    path.join(process.env.SystemDrive || 'C:', 'Users', 'Public')];
  let stage;
  for (const base of roots) {
    if (!ascii(base) || !fs.existsSync(base)) continue;
    try {
      stage = fs.mkdtempSync(path.join(base, 'cla-firestore-gate-'));
      if (!ascii(fs.realpathSync.native(stage))) {
        fs.rmdirSync(stage);
        stage = undefined;
        continue;
      }
      break;
    } catch (_) { stage = undefined; }
  }
  if (!stage) throw new Error('SECURITY STOP: no writable real ASCII path for Windows Firestore Emulator.');
  try {
    fs.mkdirSync(path.join(stage, 'tests'));
    for (const rel of [CONFIG_FILE, RULES_FILE, 'tests/firestore.rules.cp21.test.mjs']) {
      fs.copyFileSync(path.join(root, rel), path.join(stage, rel));
    }
    const nodeModules = path.join(root, 'node_modules');
    if (!fs.existsSync(nodeModules)) throw new Error('Missing local node_modules; run npm ci first.');
    fs.symlinkSync(nodeModules, path.join(stage, 'node_modules'), 'junction');
    const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, RULES_FILE))).digest('hex');
    const stagedHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(stage, RULES_FILE))).digest('hex');
    if (sourceHash !== stagedHash) throw new Error('SECURITY STOP: staged Rules checksum mismatch.');
    return stage;
  } catch (error) {
    try { clearAsciiEmulatorStage(stage); } catch (_) { /* keep diagnostic */ }
    throw error;
  }
}
function clearAsciiEmulatorStage(stage) {
  // Never recursively traverse a junction back into the real node_modules.
  const link = path.join(stage, 'node_modules');
  if (fs.existsSync(link)) fs.unlinkSync(link);
  if (fs.existsSync(link)) throw new Error('SECURITY STOP: cannot unlink staged node_modules junction.');
  for (const rel of ['tests/firestore.rules.cp21.test.mjs', RULES_FILE, CONFIG_FILE,
    'firestore-debug.log', 'firebase-debug.log']) {
    const file = path.join(stage, rel);
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  const tests = path.join(stage, 'tests');
  if (fs.existsSync(tests)) fs.rmdirSync(tests);
  fs.rmdirSync(stage); // Deliberately nonrecursive and fail-safe.
}

/**
 * A Windows port can be reserved by HNS/Hyper-V even when Get-NetTCPConnection
 * shows no listener. Check a local bind in an isolated Node child process.
 * Port selection changes ONLY the ASCII staging config, never repo/production.
 */
function canBindLoopbackPort(port) {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return false;
  const probe = `const net=require('node:net');
    const s=net.createServer();
    s.once('error', () => process.exit(2));
    s.listen(Number(process.argv[1]), '127.0.0.1', () => s.close(() => process.exit(0)));`;
  const result = spawnSync(process.execPath, ['-e', probe, String(port)], {
    encoding: 'utf8', timeout: 5000, windowsHide: true, shell: false,
  });
  return !result.error && result.status === 0;
}

function chooseStagePort(previousPorts = []) {
  // Avoid 8080 on Windows: commonly excluded or claimed by another service.
  // The list is fixed and local. No externally supplied host/port is accepted.
  for (const port of [18080, 18081, 18082, 28080, 28081, 38080, 48080, 58080]) {
    if (!previousPorts.includes(port) && canBindLoopbackPort(port)) return port;
  }
  throw new Error('SECURITY STOP: no available local Firestore port among approved test ports.');
}

function setStagedEmulatorPort(stagedRoot, port) {
  const configPath = path.join(stagedRoot, CONFIG_FILE);
  const stagedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  stagedConfig.emulators.firestore.port = port;
  validateConfiguration(stagedConfig);
  fs.writeFileSync(configPath, JSON.stringify(stagedConfig, null, 2) + '\n');
}

function runGate(root = path.resolve(__dirname, '..'), options = {}) {
  const reportPath = path.join(root, REPORT_FILE);
  const logPath = path.join(root, LOG_FILE);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const report = {
    gateVersion: 'cla-firestore-security-gate-v1',
    at: new Date().toISOString(),
    projectId: PROJECT_ID,
    configFile: CONFIG_FILE,
    rulesFile: RULES_FILE,
    rulesSha256: null,
    preflight: 'BLOCKED',
    staticTests: 'BLOCKED',
    emulatorAuthorizationTests: 'BLOCKED',
    overall: 'BLOCKED',
    productionRulesVerified: false,
    productionDeploymentPerformed: false,
    notes: [],
  };
  const log = [];
  const publish = () => {
    report.overall = overallStatus(report.staticTests, report.emulatorAuthorizationTests);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(logPath, log.join('\n') + '\n');
    process.stdout.write(`SECURITY GATE: ${report.overall} (static ${report.staticTests}, emulator ${report.emulatorAuthorizationTests}).\n`);
    process.stdout.write(`Evidence: ${REPORT_FILE}\n`);
    return report.overall === 'PASS' ? 0 : 1;
  };

  try {
    const config = JSON.parse(fs.readFileSync(path.join(root, CONFIG_FILE), 'utf8'));
    validateConfiguration(config);
    validateEmulatorEnvironment(process.env.FIRESTORE_EMULATOR_HOST);
    const rulesSource = fs.readFileSync(path.join(root, RULES_FILE));
    report.rulesSha256 = crypto.createHash('sha256').update(rulesSource).digest('hex');
    for (const rel of ['tests/firestore.rules.cp21.test.mjs', 'tests/cp21.rules.contract.test.cjs']) {
      if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing security test file: ${rel}`);
    }
    // Always run the static smoke tests, even without Firebase CLI or Java.
    const staticRun = runCommand(process.execPath, ['--test', 'tests/cp21.rules.contract.test.cjs'], root);
    report.staticTests = staticRun.ok ? 'PASS' : 'FAIL';
    log.push('--- STATIC CONTRACT TEST ---', staticRun.output);
    if (!staticRun.ok) {
      report.notes.push('Static contract failed; refusing to run the emulator.');
      return publish();
    }

    if (options.preflightOnly) {
      report.notes.push('Preflight-only mode: no emulator security evaluation was executed.');
    }
    const deps = ['@firebase/rules-unit-testing', 'firebase'];
    for (const dependency of deps) {
      if (!fs.existsSync(path.join(root, 'node_modules', ...dependency.split('/')))) {
        report.notes.push(`Missing ${dependency}. Run npm ci --include=dev before emulator verification.`);
      }
    }
    const java = runCommand('java', ['-version'], root, 15000);
    if (!java.ok) report.notes.push('Java not found. Install Java 21+ and check java -version.');
    const firebase = runCommand('firebase', ['--version'], root, 15000);
    if (!firebase.ok) report.notes.push('Firebase CLI not found. Install: npm install -g firebase-tools.');
    if (report.notes.length) {
      if (options.preflightOnly && report.notes.length === 1) report.preflight = 'PASS';
      return publish();
    }
    report.preflight = 'PASS';
    if (options.preflightOnly) return publish();

    // firebase emulators:exec accepts exactly ONE positional command.
    // On Windows runCommand uses shell:true, which joins args with spaces and
    // removes the positional boundary unless the nested command is quoted.
    // The nested command is a hard-coded relative test path (no user input).
    const testCommand = 'node --test tests/firestore.rules.cp21.test.mjs';
    const nestedCommandArg = process.platform === 'win32'
      ? `"${testCommand}"`
      : testCommand;
    let emulatorRoot = root;
    let stagedRoot;
    try {
      // Always stage on Windows; SUBST drive aliases can be canonicalized back
      // to a Unicode source path before the Java child opens its Rules file.
      if (process.platform === 'win32') {
        stagedRoot = createAsciiEmulatorStage(root);
        emulatorRoot = stagedRoot;
        log.push('Using real ASCII-only emulator staging directory: ' + stagedRoot);
      }
      // Keep the reviewed repo config unmodified; only the disposable ASCII
      // stage gets a different loopback port. Firebase emulators:exec injects
      // FIRESTORE_EMULATOR_HOST for the nested Node authorization suite.
      // Retry only on explicit bind failures, never on test assertions/failures.
      let emulatorRun;
      const selectedPorts = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        if (stagedRoot) {
          const port = chooseStagePort(selectedPorts);
          selectedPorts.push(port);
          setStagedEmulatorPort(stagedRoot, port);
          report.emulatorPort = port;
          log.push(`Loopback port attempt ${attempt}: 127.0.0.1:${port} (staging only; original config remains unchanged)`);
        }
        emulatorRun = runCommand('firebase', [
          'emulators:exec', '--project', PROJECT_ID, '--config', CONFIG_FILE,
          '--only', 'firestore', nestedCommandArg,
        ], emulatorRoot, 600000);
        log.push(`--- EMULATOR AUTHORISATION TESTS (attempt ${attempt}) ---`, emulatorRun.output);
        if (emulatorRun.ok) break;
        const bindError = /port taken|Port \d+ is not open|could not start Firestore Emulator, port taken/i.test(emulatorRun.output);
        if (!stagedRoot || !bindError || attempt === 3) break;
        log.push('Port bind failed; retrying with a different available staging-only loopback port.');
      }
      report.emulatorAuthorizationTests = emulatorRun.ok ? 'PASS' : 'FAIL';
      if (!emulatorRun.ok) report.notes.push('Emulator test suite failed or timed out. Do NOT deploy candidate Rules.');
      if (stagedRoot) {
        for (const [srcName, dstName] of [
          ['firestore-debug.log', 'firestore_emulator_debug.log'],
          ['firebase-debug.log', 'firebase_emulator_debug.log'],
        ]) {
          const src = path.join(stagedRoot, srcName);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(root, 'reports/security', dstName));
            log.push('Saved staged emulator debug log: reports/security/' + dstName);
          }
        }
      }
    } finally {
      if (stagedRoot) {
        try { clearAsciiEmulatorStage(stagedRoot); }
        catch (e) { log.push('ASCII staging cleanup warning: ' + e.message); }
      }
    }
  } catch (error) {
    report.notes.push(String(error?.message || error));
    log.push('SECURITY STOP: ' + String(error?.message || error));
  }
  return publish();
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--preflight')) {
    console.error('Only --preflight is accepted. Production project/Rules cannot be overridden.');
    process.exitCode = 2;
  } else {
    process.exitCode = runGate(path.resolve(__dirname, '..'), { preflightOnly: args.includes('--preflight') });
  }
}

module.exports = { PROJECT_ID, RULES_FILE, validateConfiguration, validateEmulatorEnvironment, overallStatus, createAsciiEmulatorStage, clearAsciiEmulatorStage, canBindLoopbackPort, chooseStagePort, setStagedEmulatorPort, runGate };
