#!/usr/bin/env python3
"""CLA CP88: non-destructive, read-only Firebase local login diagnosis.

Run from the CLA project root with its .venv Python while a live-mode Vite
server is listening on 127.0.0.1:5174. Does NOT submit credentials, create
accounts, change Firebase Rules or write to Firebase.
"""
import argparse
import asyncio
import json
import os
from pathlib import Path

PROBE_JS = r"""async () => {
  const output = {
    origin: location.origin,
    project: null,
    auth_emulator: null,
    consent_gate: null,
    browser_online: navigator.onLine,
    auth_endpoint: null,
    auth_http_code: null,
    auth_api_error: null,
    session_present: false,
    user_document: 'NOT_CHECKED',
    consent_document: 'NOT_CHECKED',
    load_error: null
  };
  let auth, db;
  try {
    ({ auth, db } = await import('/src/lib/firebase.ts'));
    const config = await import('/src/lib/studentConsentConfig.ts');
    output.project = auth.app.options.projectId || 'UNSET';
    output.auth_emulator = Boolean(auth.emulatorConfig);
    output.consent_gate = Boolean(config.STUDENT_CONSENT_GATE_ENABLED);
  } catch (e) {
    output.load_error = String(e?.message || e?.name || 'MODULE_LOAD_FAILED').slice(0, 180);
    return output;
  }
  const apiKey = auth.app.options.apiKey;
  if (!apiKey || apiKey === 'fake-api-key') {
    output.auth_endpoint = 'NO_REAL_WEB_API_KEY';
  } else {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(
        'https://identitytoolkit.googleapis.com/v1/projects?key=' + encodeURIComponent(apiKey),
        { method: 'GET', credentials: 'omit', cache: 'no-store', signal: controller.signal }
      );
      output.auth_http_code = response.status;
      if (response.ok) {
        output.auth_endpoint = 'REACHABLE';
      } else {
        output.auth_endpoint = 'HTTP_ERROR';
        try {
          const err = await response.json();
          const msg = String(err?.error?.message || 'UNKNOWN');
          // Never echo body/URLs/API keys: only a vetted category.
          const patterns = [
            'API_KEY_INVALID', 'API_KEY_HTTP_REFERRER_BLOCKED', 'API_KEY_SERVICE_BLOCKED',
            'PROJECT_NOT_FOUND', 'PERMISSION_DENIED', 'SERVICE_DISABLED',
            'CONFIGURATION_NOT_FOUND', 'INVALID_ARGUMENT'
          ];
          output.auth_api_error = patterns.find(x => msg.includes(x)) || 'HTTP_' + response.status;
        } catch (_) { output.auth_api_error = 'HTTP_' + response.status; }
      }
    } catch (e) {
      output.auth_endpoint = e?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_OR_CORS_ERROR';
    } finally { clearTimeout(id); }
  }
  try { if (typeof auth.authStateReady === 'function') await Promise.race([
    auth.authStateReady(), new Promise((_,reject) => setTimeout(() => reject(new Error('AUTH_STATE_TIMEOUT')), 7000))
  ]); } catch (_) {}
  const user = auth.currentUser;
  output.session_present = Boolean(user);
  if (!user) return output;
  let idToken;
  try {
    idToken = await Promise.race([
      user.getIdToken(),
      new Promise((_,reject) => setTimeout(() => reject(new Error('TOKEN_TIMEOUT')), 8000))
    ]);
  } catch (_) {
    output.user_document = 'TOKEN_UNAVAILABLE';
    output.consent_document = 'NOT_CHECKED';
    return output;
  }
  const getSafeStatus = async (collection) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const url = 'https://firestore.googleapis.com/v1/projects/' +
        encodeURIComponent(output.project) + '/databases/(default)/documents/' +
        collection + '/' + encodeURIComponent(user.uid);
      const resp = await fetch(url, {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + idToken },
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal
      });
      if (resp.status === 200) return 'READ_OK';
      if (resp.status === 404) return 'NOT_FOUND';
      if (resp.status === 403) return 'PERMISSION_DENIED';
      if (resp.status === 401) return 'TOKEN_REJECTED';
      return 'HTTP_' + resp.status;
    } catch (e) {
      return e?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_OR_CORS_ERROR';
    } finally { clearTimeout(timer); }
  };
  output.user_document = await getSafeStatus('users');
  output.consent_document = await getSafeStatus('student_consents');
  return output;
}"""


def summarize(result):
    if result.get('load_error'):
        return 'APP_MODULE_LOAD_ERROR: inspect local Vite config and module startup.'
    if result.get('project') != 'cognitive-learn-ai' or result.get('auth_emulator'):
        return 'WRONG_FIREBASE_TARGET: live session is not using the original production Firebase project.'
    ep = result.get('auth_endpoint')
    if ep == 'NO_REAL_WEB_API_KEY':
        return 'WEB_API_KEY_MISSING: copy Web App configuration from the original Firebase project.'
    if ep in ('TIMEOUT', 'NETWORK_OR_CORS_ERROR'):
        return 'AUTH_NETWORK_BLOCKED: check browser extensions, firewall, DNS, proxy and access to identitytoolkit.googleapis.com.'
    if ep == 'HTTP_ERROR':
        return 'AUTH_CONFIG_REJECTED: check matching Web App API key and domain/referrer/API restrictions for localhost.'
    if result.get('user_document') == 'PERMISSION_DENIED':
        return 'USERS_READ_DENIED: production Firestore Rules deny users/{uid}; do not loosen Rules without reviewed security tests.'
    if result.get('user_document') == 'NOT_FOUND':
        return 'USERS_PROFILE_MISSING: Auth account exists but Firestore users/{uid} is absent; requires authorized owner/admin review.'
    if result.get('consent_gate') and result.get('consent_document') == 'PERMISSION_DENIED':
        return 'CONSENT_READ_DENIED: production Rules deny student_consents/{uid}; use reviewed rollout, not access bypass.'
    if not result.get('session_present'):
        return 'AUTH_ENDPOINT_OK_NO_SESSION: endpoint is reachable; login failure needs browser Network failing request status.'
    return 'AUTH_ENDPOINT_REACHABLE: review returned access checks and the exact failing login request if needed.'


async def run(url, report_path):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        try:
            page = await browser.new_page()
            failed_hosts = []

            def on_failed(req):
                try:
                    from urllib.parse import urlsplit
                    hostname = urlsplit(req.url).hostname
                    if hostname in ('identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'firestore.googleapis.com'):
                        failed_hosts.append(hostname)
                except Exception:
                    pass
            page.on('requestfailed', on_failed)
            try:
                response = await page.goto(url, wait_until='domcontentloaded', timeout=12000)
                await page.wait_for_timeout(1000)
                result = await page.evaluate(PROBE_JS)
                result['local_page_http'] = response.status if response else 'NO_HTTP_RESPONSE'
            except Exception as exc:
                result = {'local_page_http': 'ERROR', 'load_error': type(exc).__name__, 'origin': url}
            result['failed_firebase_hosts'] = sorted(set(failed_hosts))
        finally:
            await browser.close()
    result['diagnosis'] = summarize(result)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(result, indent=2, ensure_ascii=True), encoding='utf-8')
    print('CLA LOCAL LOGIN TRIAGE (read-only, no passwords or account data)')
    for key in ('origin', 'local_page_http', 'project', 'auth_emulator', 'consent_gate',
                'browser_online', 'auth_endpoint', 'auth_http_code', 'auth_api_error',
                'session_present', 'user_document', 'consent_document', 'failed_firebase_hosts'):
        print(f'{key}: {result.get(key)}')
    print('DIAGNOSIS: ' + result['diagnosis'])
    print('REPORT: ' + str(report_path.resolve()))
    return result


def main():
    parser = argparse.ArgumentParser(description='Read-only local Firebase login triage for existing CLA accounts')
    parser.add_argument('--url', default='http://127.0.0.1:5174/', help='Live-mode Vite URL, default localhost:5174')
    parser.add_argument('--report', default='reports/auth/cla_local_login_triage.json')
    args = parser.parse_args()
    if not args.url.startswith(('http://127.0.0.1:', 'http://localhost:')):
        raise SystemExit('FAIL: only loopback HTTP URLs are permitted; no production website inspection')
    asyncio.run(run(args.url, Path(args.report)))


if __name__ == '__main__':
    main()
