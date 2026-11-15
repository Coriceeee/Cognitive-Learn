/**
 * CLA — fail-closed Firestore Emulator security gate.
 * No production Firebase API and no deploy command are ever used by this script.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
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

    const emulatorRun = runCommand('firebase', [
      'emulators:exec', '--project', PROJECT_ID, '--config', CONFIG_FILE,
      '--only', 'firestore', 'node --test tests/firestore.rules.cp21.test.mjs',
    ], root, 600000);
    report.emulatorAuthorizationTests = emulatorRun.ok ? 'PASS' : 'FAIL';
    log.push('--- EMULATOR AUTHORISATION TESTS ---', emulatorRun.output);
    if (!emulatorRun.ok) report.notes.push('Emulator test suite failed or timed out. Do NOT deploy candidate Rules.');
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

module.exports = { PROJECT_ID, RULES_FILE, validateConfiguration, validateEmulatorEnvironment, overallStatus, runGate };
