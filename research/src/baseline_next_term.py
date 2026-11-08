#!/usr/bin/env python3
"""A leakage-aware, student-held-out GPA baseline (research data only).
This deliberately REFUSES demo/synthetic rows and underpowered data.
"""
import argparse
import csv
import hashlib
import json
import math
import random
from pathlib import Path
from datetime import datetime

import numpy as np
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error


def holdout_bucket(student_id, seed):
    value = int(hashlib.sha256(f"{seed}:{student_id}".encode()).hexdigest()[:10], 16)
    return value % 10

def run(input_path, seed):
    with open(input_path, newline="", encoding="utf-8-sig") as stream:
        records = list(csv.DictReader(stream))
    entries = []
    for r in records:
        if r.get("data_scope", "").lower() != "research" or r.get("research_allowed", "").lower() not in ("true", "1", "yes"):
            continue
        try:
            a, b = float(r["gpa_t0"]), float(r["gpa_t1"])
            t0, t1 = datetime.fromisoformat(r["t0_time"].replace("Z", "+00:00")), datetime.fromisoformat(r["t1_time"].replace("Z", "+00:00"))
            if not (0 <= a <= 10 and 0 <= b <= 10 and t0 < t1):
                continue
            entries.append((r["participant_id"], a, b))
        except (KeyError, ValueError, TypeError):
            continue
    ids = set(row[0] for row in entries)
    out = {"status": "BLOCKED", "n_rows": len(entries), "n_students": len(ids),
           "metrics": None, "note": "Requires approved real research data, independent students, adequate sample and holdout."}
    if len(ids) < 30 or len(entries) < 30:
        return out
    train = [r for r in entries if holdout_bucket(r[0], seed) < 8]
    test = [r for r in entries if holdout_bucket(r[0], seed) >= 8]
    if len(set(r[0] for r in train)) < 20 or len(set(r[0] for r in test)) < 5:
        return out
    if set(r[0] for r in train) & set(r[0] for r in test):
        raise RuntimeError("Participant leakage detected")
    x_train = np.asarray([r[1] for r in train]).reshape(-1, 1)
    y_train = np.asarray([r[2] for r in train]); x_test = np.asarray([r[1] for r in test]).reshape(-1, 1)
    y_test = np.asarray([r[2] for r in test])
    last_score = x_test.reshape(-1)
    model = Ridge(alpha=1.0).fit(x_train, y_train)
    fitted = np.clip(model.predict(x_test), 0, 10)
    def metric(pred):
        return {"MAE": round(float(mean_absolute_error(y_test, pred)), 4),
                "RMSE": round(float(math.sqrt(mean_squared_error(y_test, pred))), 4)}
    out.update({"status": "EVALUATED_WITH_LIMITATIONS",
                "n_train": len(train), "n_test": len(test), "student_disjoint": True,
                "metrics": {"last_score_baseline": metric(last_score), "ridge": metric(fitted)},
                "note": "Internal student-disjoint benchmark. External THPT VN validity and temporal drift still need independent evaluation."})
    return out

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--seed", type=int, default=20261102)
    args = p.parse_args()
    result = run(args.input, args.seed)
    dest = Path(args.output); dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"status={result['status']} n_students={result['n_students']}")
