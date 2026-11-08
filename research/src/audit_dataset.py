"""CLA dataset license/privacy gate and time-leakage audit.
No real data is bundled. Does not print identifiers or row-level data.
"""
import argparse
import csv
import hashlib
import json
from collections import Counter
from datetime import datetime
from pathlib import Path

REQUIRED = {"participant_id", "data_scope", "research_allowed", "t0_time", "t1_time", "gpa_t0", "gpa_t1"}

def parse_time(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))

def audit(input_path):
    path = Path(input_path)
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        columns = set(reader.fieldnames or [])
        missing = sorted(REQUIRED - columns)
        rows = list(reader)
    result = {"source_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
              "row_count": len(rows), "missing_columns": missing,
              "counts": {}, "eligible_n": 0, "unique_eligible_participants": 0,
              "status": "BLOCKED", "notes": []}
    if missing:
        result["notes"].append("Missing required columns. Dataset cannot enter research pipeline.")
        return result
    reasons = Counter()
    usable_participants = set()
    seen = set()
    for row in rows:
        scope = (row.get("data_scope") or "").strip().lower()
        consent = (row.get("research_allowed") or "").strip().lower()
        participant_id = (row.get("participant_id") or "").strip()
        if scope in ("demo", "synthetic", "test"):
            reasons["excluded_demo_or_synthetic"] += 1
            continue
        if scope != "research" or consent not in ("true", "1", "yes"):
            reasons["missing_permission"] += 1
            continue
        if not participant_id:
            reasons["missing_pseudonym"] += 1
            continue
        try:
            t0, t1 = parse_time(row["t0_time"]), parse_time(row["t1_time"])
            x, y = float(row["gpa_t0"]), float(row["gpa_t1"])
            if not (t0 < t1 and 0 <= x <= 10 and 0 <= y <= 10):
                reasons["invalid_time_or_grade"] += 1
                continue
        except (ValueError, TypeError, KeyError):
            reasons["invalid_time_or_grade"] += 1
            continue
        key = (participant_id, row["t0_time"], row["t1_time"])
        if key in seen:
            reasons["duplicate_participant_window"] += 1
            continue
        seen.add(key)
        usable_participants.add(participant_id)
        reasons["eligible"] += 1
    result["counts"] = dict(reasons)
    result["eligible_n"] = reasons["eligible"]
    result["unique_eligible_participants"] = len(usable_participants)
    if reasons["eligible"]:
        result["status"] = "READY_FOR_BASELINE_AUDIT"
        result["notes"].append("License/provenance must also be independently approved in Source Register.")
        result["notes"].append("Dataset eligibility is not evidence of predictive validity.")
    else:
        result["notes"].append("No eligible non-demo observations. No performance claims allowed.")
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Approved, pseudonymized CSV only")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    report = audit(args.input)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Audit status={report['status']}; eligible={report['eligible_n']}; report={out}")
