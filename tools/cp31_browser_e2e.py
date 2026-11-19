#!/usr/bin/env python3
"""CP31 browser E2E against an explicitly opted-in LOCAL or QA STAGING CLA site.

No mocking of Firebase auth or role checks; no production writes and no browser
storage persistence. Test accounts must be isolated synthetic QA users.

Requires Python Playwright: python -m pip install playwright; python -m playwright install chromium
Run with --base-url http://127.0.0.1:5173 (or explicitly approved staging host).
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import URLError, HTTPError
from html.parser import HTMLParser
import re
import uuid
import sys
from datetime import datetime, timezone
# Both direct CLI execution and unittest spec loading must resolve the local helper.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from cp31_browser_gate import (load_groups, case_names, make_report, atomic_json, OPERATIONAL_VIEWS, DEFAULT_REPORT)

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "tests" / "e2e" / "cp31_nexus_manifest.json"
ROLES = ("ADMIN", "STUDENT", "TEACHER", "PARENT")
SAFE_LOOPBACK = {"127.0.0.1", "localhost", "::1"}


def checked_origin(raw: str, staging_host: str = "") -> str:
    value = urlsplit(raw)
    if not value.hostname or value.username or value.password or value.query or value.fragment:
        raise ValueError("Unsafe origin: expected a bare URL with no credentials/query/fragment")
    if value.path not in ("", "/"):
        raise ValueError("Unsafe origin: URL must not include a path")
    if value.hostname in SAFE_LOOPBACK:
        if value.scheme != "http" or value.port is None:
            raise ValueError("Local E2E requires http://loopback:port")
    elif not staging_host or value.hostname != staging_host or value.scheme != "https":
        raise ValueError("External E2E requires exact --staging-host and HTTPS")
    if value.hostname in SAFE_LOOPBACK and staging_host:
        raise ValueError("Do not mix staging allowlist and a local origin")
    if value.port is not None and not 1024 <= value.port <= 65535:
        raise ValueError("Invalid E2E port")
    return raw.rstrip("/")


def load_manifest() -> list[dict]:
    return load_groups()


def require_accounts(prompt_passwords: bool = False) -> dict[str, tuple[str, str]]:
    if os.environ.get("CLA_E2E_QA_ACK") != "I_USE_SYNTHETIC_QA_ACCOUNTS":
        raise ValueError("Set CLA_E2E_QA_ACK=I_USE_SYNTHETIC_QA_ACCOUNTS only for isolated QA users")
    result = {}
    for role in ROLES:
        email = os.environ.get(f"CLA_E2E_{role}_EMAIL", "").strip()
        password = os.environ.get(f"CLA_E2E_{role}_PASSWORD", "")
        if "@" not in email:
            raise ValueError(f"Missing QA email for {role}; no cases have run")
        if not password and prompt_passwords:
            import sys
            import getpass
            if not sys.stdin.isatty():
                raise ValueError("Password prompt requires an interactive terminal")
            password = getpass.getpass(f"QA {role} password (hidden): ")
        if not password:
            raise ValueError(f"Missing QA password for {role}; no cases have run")
        result[role] = (email, password)
    if len({v[0].lower() for v in result.values()}) != 4:
        raise ValueError("Student/Admin and two retired-role negative-test accounts must have distinct emails")
    return result


def local_qa_project(origin: str, expected_id: str) -> None:
    """For localhost Vite, refuse to use any unverified or wrong Firebase project.

    Vite .env priority for `development`: development.local > local > development > .env.
    This is a guard against accidentally targeting a different project, not
    independent proof that a QA project is isolated from production.
    """
    if urlsplit(origin).hostname not in SAFE_LOOPBACK:
        return  # HTTPS staging project is checked in the authenticated diagnostic UI.
    found = None
    for env_name in ('.env.development.local', '.env.local', '.env.development', '.env'):
        env_path = ROOT / env_name
        if not env_path.is_file():
            continue
        for line in env_path.read_text(encoding='utf-8-sig').splitlines():
            value = line.strip()
            if value.startswith('VITE_FIREBASE_PROJECT_ID='):
                found = value.split('=', 1)[1].strip().strip('"\'')
                break
        if found:
            break
    if not found or found != expected_id:
        raise ValueError('Local Firebase project is missing or differs from the explicitly approved QA project')



class _ProjectMarkerParser(HTMLParser):
    """Read the single public Firebase project marker; do not inspect student data."""
    def __init__(self):
        super().__init__()
        self.values: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() != "meta":
            return
        values = dict(attrs)
        if values.get("name") == "cla-firebase-project-id":
            self.values.append(values.get("content", ""))


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


def assert_qa_origin_project(origin: str, expected_id: str) -> None:
    """Validate the served app's build-time Firebase identity BEFORE reading QA passwords.

    Works for Vite localhost and HTTPS QA staging; rejects unexpected redirects,
    a missing/unexpanded marker, HTML errors, and mismatched Firebase projects.
    This is not a signed Firebase attestation and cannot establish staging isolation.
    """
    try:
        request = Request(origin + "/", headers={"Accept": "text/html", "Cache-Control": "no-cache"})
        with build_opener(_NoRedirect).open(request, timeout=8) as response:
            ctype = response.headers.get("Content-Type", "").lower()
            if response.status != 200 or "text/html" not in ctype:
                raise ValueError("QA server must serve HTML 200 at the approved origin")
            payload = response.read(131073)
            if len(payload) > 131072:
                raise ValueError("QA index.html exceeds the 128 KiB safety limit")
    except (HTTPError, URLError, OSError) as exc:
        # Do not expose remote page content, query strings, credentials, or URL body.
        raise ValueError("Approved QA server is unavailable or redirects to another URL") from exc
    parser = _ProjectMarkerParser()
    parser.feed(payload.decode("utf-8", errors="replace"))
    if len(parser.values) != 1:
        raise ValueError("QA HTML must expose exactly one Firebase project marker; restart/rebuild the updated site")
    if parser.values[0] != expected_id:
        raise ValueError("Served Firebase project ID differs from the approved QA project; credentials not requested")


def qa_preflight(origin: str, project_id: str, *, check_browser: bool = True) -> None:
    if not re.fullmatch(r"[a-z][a-z0-9-]{3,63}", project_id):
        raise ValueError("Supply an explicit Firebase QA project ID; no credentials requested")
    local_qa_project(origin, project_id)
    assert_qa_origin_project(origin, project_id)
    if check_browser:
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser_path = Path(p.chromium.executable_path)
                if not browser_path.is_file():
                    raise ValueError("Chromium is missing; run python -m playwright install chromium")
        except ImportError as exc:
            raise ValueError("Playwright missing; run python -m pip install playwright") from exc


def sign_in(page, origin: str, email: str, password: str, expected_role: str) -> None:
    page.goto(origin + "/", wait_until="domcontentloaded")
    page.get_by_placeholder("Nhập email").fill(email)
    page.get_by_placeholder("Nhập mật khẩu").fill(password)
    page.locator("form.login-form button[type=submit]").click()
    page.wait_for_url(f"{origin}/{expected_role.lower()}*", timeout=30000)


def run_browser(origin: str, groups: list[dict], accounts: dict, report_path: Path, headed: bool, project_id: str, run_id: str, started_at: str) -> int:
    try:
        from playwright.sync_api import sync_playwright, expect
    except ImportError as exc:
        raise RuntimeError("Missing Python Playwright; pip install playwright, then playwright install chromium") from exc
    results: list[dict] = []

    def record(case: str, operation) -> None:
        try:
            operation()
            results.append({"case": case, "result": "PASS"})
            print(f"PASS {case}", flush=True)
        except Exception as exc:
            # Do not log screenshots, student content, passwords or private page text.
            results.append({"case": case, "result": "FAIL", "errorType": type(exc).__name__})
            print(f"FAIL {case}: {type(exc).__name__}", flush=True)

    fatal_error = ""
    try:
      with sync_playwright() as p:
        browser = p.chromium.launch(headless=not headed)
        try:
            def anon_checks():
                context = browser.new_context()
                page = context.new_page()
                for path in ("/admin", "/admin/audit", "/admin/diagnostics?view=health"):
                    page.goto(origin + path, wait_until="domcontentloaded")
                    expect(page.get_by_role("heading", name="Bạn chưa đăng nhập")).to_be_visible(timeout=20000)
                    assert page.locator(".nexus-audit-item,.nexus-action-card").count() == 0
                context.close()
            record("CP31-E2E-01 anonymous denied all admin routes", anon_checks)

            context = browser.new_context(viewport={"width": 1366, "height": 900})
            page = context.new_page()
            def verified_admin_login():
                sign_in(page, origin, *accounts["ADMIN"], "ADMIN")
                page.goto(origin + '/admin/diagnostics?view=roles', wait_until='domcontentloaded')
                trigger = page.get_by_role('button', name='Chạy kiểm tra thực tế')
                expect(trigger).to_be_enabled(timeout=20000)
                trigger.click()
                expect(page.locator('section[aria-live="polite"]')).to_contain_text(
                    'Project: ' + project_id, timeout=20000)
            record("CP31-E2E-02 admin signs in using server verified role", verified_admin_login)
            if not any(t["case"] == "CP31-E2E-02 admin signs in using server verified role" and t["result"] == "PASS" for t in results):
                raise RuntimeError("Admin auth failed; aborting positive authorization tests")

            def audit_inventory():
                page.goto(origin + "/admin/audit", wait_until="domcontentloaded")
                expect(page.get_by_role("heading", name="Kiểm toán 22 tác vụ Nexus")).to_be_visible(timeout=20000)
                assert page.locator("[data-nexus-audit-id]").count() == 22
                assert page.locator("a.nexus-audit-link").count() == 22
                assert page.locator(".nexus-submodule-pending").count() == 0
                assert "PASS reviewer từ kiểm tra này" in page.locator(".nexus-audit-summary").inner_text()
            record("CP31-E2E-03 22 item inventory and honest evidence labels", audit_inventory)

            def bad_query():
                page.goto(origin + "/admin/audit?task=__invalid__", wait_until="domcontentloaded")
                expect(page.get_by_role("alert")).to_contain_text("Mã tác vụ Nexus không hợp lệ", timeout=15000)
                assert page.locator("[data-nexus-audit-id]").count() == 0
            record("CP31-E2E-04 invalid task filter fails closed", bad_query)

            for cluster_index, group in enumerate(groups):
                cluster = group["cluster"]
                def visit_cluster(group=group, cluster=cluster, cluster_index=cluster_index):
                    page.goto(origin + "/admin", wait_until="domcontentloaded")
                    expect(page.locator(".nexus-cluster-button").first).to_be_visible(timeout=20000)
                    page.locator(".nexus-cluster-button").nth(cluster_index).click()
                    page.wait_for_url(origin + f"/admin?cluster={cluster}", timeout=20000)
                    expect(page.locator(f'[data-nexus-cluster="{group["key"]}"]')).to_be_visible(timeout=20000)
                    if page.locator("details.nexus-submodule-more").count():
                        page.locator("details.nexus-submodule-more summary").click()
                    assert page.locator("[data-nexus-task]").count() == len(group["tasks"])
                    for task in group["tasks"]:
                        card = page.locator(f'[data-nexus-task="{task["id"]}"]')
                        assert card.count() == 1 and card.is_visible()
                        anchor = card.locator('a[href^="/admin/audit?task="]')
                        assert anchor.count() == 1
                        assert anchor.get_attribute("href") == f'/admin/audit?task={task["id"]}'
                record(f"CP31-E2E-CLUSTER-{group['key']} cards/navigation", visit_cluster)

            for group in groups:
                for task in group["tasks"]:
                    task_id = task["id"]
                    def visit_task(task=task, task_id=task_id, group=group):
                        # Exercise the actual card and link, not merely HTTP deep linking.
                        page.goto(origin + f"/admin?cluster={group['cluster']}", wait_until="domcontentloaded")
                        card = page.locator(f'[data-nexus-task="{task_id}"]')
                        if not card.is_visible():
                            page.locator("details.nexus-submodule-more summary").click()
                        expect(card).to_be_visible(timeout=20000)
                        card.locator('a[href^="/admin/audit?task="]').click()
                        page.wait_for_url(origin + f"/admin/audit?task={task_id}", timeout=20000)
                        article = page.locator(f'[data-nexus-audit-id="{task_id}"]')
                        expect(article).to_be_visible(timeout=20000)
                        assert page.locator("[data-nexus-audit-id]").count() == 1
                        expect(article.locator("h2")).to_have_text(task["title"])
                        assert "Điều kiện nghiệm thu" in article.inner_text()
                        assert "Bằng chứng bắt buộc" in article.inner_text()
                        if task["diagnostic"]:
                            assert article.locator("a.nexus-audit-link").get_attribute("href") == task["diagnostic"]
                        else:
                            assert article.locator("a.nexus-audit-link").count() == 0
                            assert "NOT TESTED" in article.inner_text()
                    record(f"CP31-E2E-TASK-{task_id} drilldown", visit_task)

            for group in groups:
                for task in group["tasks"]:
                    if task["diagnostic"]:
                        def diagnostic(task=task):
                            page.goto(origin + task["diagnostic"], wait_until="domcontentloaded")
                            expect(page.get_by_text("NEXUS CORE · DIAGNOSTICS")).to_be_visible(timeout=20000)
                            assert page.locator(".profile-head h1").count() == 1
                        record(f"CP31-E2E-DIAGNOSTIC-{task['id']} route", diagnostic)

            # CP31 Batch 3: exercise actual read-only audit action, not just the route.
            for view in OPERATIONAL_VIEWS:
                def run_operational_audit(view=view):
                    page.goto(origin + f"/admin/diagnostics?view={view}", wait_until="domcontentloaded")
                    trigger = page.get_by_role("button", name="Chạy kiểm tra thực tế")
                    expect(trigger).to_be_enabled(timeout=20000)
                    trigger.click()
                    result = page.locator('section[aria-live="polite"]')
                    expect(result).to_be_visible(timeout=20000)
                    # NOT TESTED status is intentional: no official-source / production verification.
                    expect(result).to_contain_text("NOT TESTED")
                record(f"CP31-E2E-OP-{view} read-only check", run_operational_audit)

            def refresh_deeplink():
                page.goto(origin + "/admin/audit?task=health", wait_until="domcontentloaded")
                page.reload(wait_until="domcontentloaded")
                expect(page.locator('[data-nexus-audit-id="health"]')).to_be_visible(timeout=20000)
            record("CP31-E2E-05 refresh retains scoped audit", refresh_deeplink)

            def mobile():
                # Keep the authenticated context; a new context would lose Firebase auth.
                page.set_viewport_size({"width": 390, "height": 844})
                page.goto(origin + "/admin/audit", wait_until="domcontentloaded")
                expect(page.locator('[data-nexus-audit-id="health"]')).to_be_visible(timeout=20000)
                assert page.locator("[data-nexus-audit-id]").count() == 22
                overflow = page.evaluate("() => document.documentElement.scrollWidth - innerWidth")
                assert overflow <= 5, f"mobile horizontal overflow: {overflow}px"
                page.set_viewport_size({"width": 1366, "height": 900})
            record("CP31-E2E-06 mobile audit and no horizontal overflow", mobile)
            context.close()

            for role in ("STUDENT", "TEACHER", "PARENT"):
                def denied_role(role=role):
                    role_context = browser.new_context()
                    role_page = role_context.new_page()
                    try:
                        # Legacy accounts remain QA attack fixtures, not product roles.
                        if role == "STUDENT":
                            sign_in(role_page, origin, *accounts[role], role)
                        else:
                            role_page.goto(origin + "/", wait_until="domcontentloaded")
                            role_page.get_by_placeholder("Nhập email").fill(accounts[role][0])
                            role_page.get_by_placeholder("Nhập mật khẩu").fill(accounts[role][1])
                            role_page.locator("form.login-form button[type=submit]").click()
                            expect(role_page.locator(".login-message")).to_contain_text("Vai trò tài khoản không hợp lệ", timeout=30000)
                        for path in ("/admin", "/admin/audit", "/admin/diagnostics?view=accounts", "/admin/diagnostics?view=atlas-approve", "/admin/diagnostics?view=orion-policy", "/admin/diagnostics?view=pulse-evidence", "/admin/diagnostics?view=haven-finance"):
                            role_page.goto(origin + path, wait_until="domcontentloaded")
                            expect(role_page.get_by_role("heading", name="Không có quyền truy cập trang này" if role == "STUDENT" else "Chưa có hồ sơ tài khoản hợp lệ")).to_be_visible(timeout=20000)
                            assert role_page.locator("[data-nexus-audit-id],[data-nexus-task]").count() == 0
                    finally:
                        role_context.close()
                record(f"CP31-E2E-DENY-{role.lower()} admin routes", denied_role)
        finally:
            browser.close()
    except Exception as exc:
        # An aborted run invalidates any previous PASS report, even when auth fails.
        fatal_error = type(exc).__name__
        print(f"CP31 E2E ABORTED: {fatal_error}; remaining cases are NOT RUN", flush=True)
    report = make_report(groups, results, run_id=run_id, started_at=started_at,
                         project_id=project_id, abort_reason=fatal_error)
    atomic_json(report_path, report)
    print(f"CP31 BROWSER E2E: {report['passed']}/{report['expected']} PASS; "
          f"FAIL={report['failed']}, NOT RUN={report['notRun']}, overall={report['overall']}; "
          f"report: {report_path}", flush=True)
    return 0 if report['overall'] == 'PASS' else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Run CP31 real Chromium E2E (synthetic QA accounts only)")
    parser.add_argument("--base-url", default=os.environ.get("CLA_E2E_BASE_URL", "http://127.0.0.1:5173"))
    parser.add_argument("--staging-host", default="", help="Exact opt-in HTTPS staging host; never production")
    parser.add_argument("--headed", action="store_true")
    parser.add_argument("--prompt-passwords", action="store_true", help="Prompt securely for QA passwords instead of env vars")
    parser.add_argument("--check-config", action="store_true", help="Validate manifest/origin only; NOT a browser test")
    parser.add_argument("--preflight", action="store_true", help="Check LIVE QA HTML/Project ID and installed Chromium without accounts")
    parser.add_argument("--qa-project-id", default=os.environ.get("CLA_E2E_QA_PROJECT_ID", ""),
                        help="Exact expected Firebase QA project ID, checked before and after login")
    args = parser.parse_args()
    # A real-run attempt must immediately invalidate stale evidence, before auth/preflight.
    run_id = uuid.uuid4().hex
    started_at = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    if not args.check_config and not args.preflight:
        atomic_json(DEFAULT_REPORT, {'schema': 'cla-cp31-browser-gate-v2', 'overall': 'BLOCKED',
                                     'runId': run_id, 'startedAtUtc': started_at,
                                     'abortReason': 'PreflightIncomplete', 'passed': 0})
    origin = checked_origin(args.base_url, args.staging_host)
    groups = load_manifest()
    if args.check_config:
        print(f"CP31 E2E CONFIG ONLY: 7 groups, 22 tasks, 22 diagnostics, 72 browser cases; "
              f"origin={origin}; no browser executed")
        return 0
    project_id = args.qa_project_id.strip()
    qa_preflight(origin, project_id)
    if args.preflight:
        print("CP31 E2E PREFLIGHT PASS: live QA HTML project ID and Chromium verified; 0 passwords requested; 0 browser cases run")
        return 0
    accounts = require_accounts(args.prompt_passwords)
    return run_browser(origin, groups, accounts, DEFAULT_REPORT, args.headed, project_id, run_id, started_at)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, RuntimeError) as exc:
        print(f"CP31 E2E BLOCKED: {type(exc).__name__}: {exc}")
        raise SystemExit(2)
