#!/usr/bin/env python3
"""External-domain UCI Student Performance baseline mirrored on Hugging Face.

This is a methods-feasibility analysis only. It is not a CLA learner model and
cannot support claims about Vietnamese students or CLA intervention effects.
Run Math and Portuguese files separately; do not merge subjects.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

SEED = 20261109
TARGET = "G3"
CONTEXT_BEHAVIOR = [
    "studytime", "failures", "schoolsup", "famsup", "paid", "activities",
    "traveltime", "absences", "freetime", "goout", "internet", "higher",
]
REQUIRED = set(CONTEXT_BEHAVIOR + ["G1", "G2", "G3"])


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _preprocessor(frame: pd.DataFrame) -> ColumnTransformer:
    numeric = [c for c in frame.columns if pd.api.types.is_numeric_dtype(frame[c])]
    categorical = [c for c in frame.columns if c not in numeric]
    numeric_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
    ])
    categorical_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore")),
    ])
    return ColumnTransformer([
        ("numeric", numeric_pipe, numeric),
        ("categorical", categorical_pipe, categorical),
    ])


def _mae_ci(y_true: np.ndarray, y_pred: np.ndarray, seed: int, reps: int = 2000) -> list[float]:
    rng = np.random.default_rng(seed)
    n = len(y_true)
    if n < 2:
        return [float("nan"), float("nan")]
    values = np.empty(reps, dtype=float)
    for i in range(reps):
        ix = rng.integers(0, n, size=n)
        values[i] = mean_absolute_error(y_true[ix], y_pred[ix])
    lo, hi = np.quantile(values, [0.025, 0.975])
    return [round(float(lo), 4), round(float(hi), 4)]


def _metrics(y_true: np.ndarray, y_pred: np.ndarray, seed: int) -> dict:
    return {
        "MAE": round(float(mean_absolute_error(y_true, y_pred)), 4),
        "MAE_bootstrap_95CI": _mae_ci(y_true, y_pred, seed),
        "RMSE": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 4),
        "R2": round(float(r2_score(y_true, y_pred)), 4),
    }


def _fit_ridge(train_x: pd.DataFrame, train_y: pd.Series, test_x: pd.DataFrame) -> np.ndarray:
    pipe = Pipeline([
        ("preprocess", _preprocessor(train_x)),
        ("model", Ridge(alpha=1.0)),
    ])
    pipe.fit(train_x, train_y)
    return np.clip(pipe.predict(test_x), 0, 20)


def run(input_path: str | Path, subject: str, seed: int = SEED, source_revision: str | None = None, source_verified: bool = False) -> dict:
    path = Path(input_path)
    raw_hash = sha256_file(path)
    frame = pd.read_csv(path, sep=";")
    missing = sorted(REQUIRED - set(frame.columns))
    result = {
        "status": "BLOCKED", "dataset": "UCI Student Performance (HF mirror)",
        "subject": subject, "target": TARGET, "seed": seed,
        "source_revision": source_revision or "UNPINNED", "source_verified": bool(source_verified),
        "source_file": path.name, "source_sha256": raw_hash,
        "n_rows": int(len(frame)), "missing_required_columns": missing,
        "metrics": None,
        "evidence_class": "E_EXTERNAL",
        "claim_scope": "METHOD_FEASIBILITY_ONLY_NOT_CLA_EFFECTIVENESS",
        "limitations": [
            "Two Portuguese schools; not a Vietnamese THPT cohort.",
            "No CLA-specific SCI/MAS/CSL, intervention or check-in outcomes.",
            "No participant ID in the public CSV; split is row-level and repeated-person identity cannot be audited within this file.",
            "Math and Portuguese files must be analyzed separately; do not merge without a cross-file participant key.",
            "G3 is strongly correlated with G1/G2; feature cutoffs must be reported explicitly.",
        ],
    }
    if not source_verified or not source_revision:
        result["block_reason"] = "Source license and immutable revision must be verified before analysis."
        return result
    if missing:
        result["block_reason"] = "Missing required columns."
        return result
    if len(frame) < 100:
        result["block_reason"] = "Fewer than 100 rows; technical feasibility floor only, not a statistical power threshold."
        return result
    for col in ["G1", "G2", "G3"]:
        frame[col] = pd.to_numeric(frame[col], errors="coerce")
    frame = frame.dropna(subset=["G3"]).copy()
    if frame.empty or not frame["G3"].between(0, 20).all():
        result["block_reason"] = "Target G3 is missing or outside the documented 0–20 range."
        return result
    if frame[["G1", "G2"]].isna().any().any():
        result["note"] = "Rows with missing G1/G2 remain in context-only analysis only; score-specific subsets are handled separately."
    train_idx, test_idx = train_test_split(
        np.arange(len(frame)), test_size=0.2, random_state=seed
    )
    train, test = frame.iloc[train_idx].copy(), frame.iloc[test_idx].copy()
    y_train = train[TARGET].astype(float).to_numpy()
    y_test = test[TARGET].astype(float).to_numpy()
    metrics = {}

    # Context/behavior-only model: excludes all prior grades.
    context_cols = [c for c in CONTEXT_BEHAVIOR if c in frame.columns]
    context_pred = _fit_ridge(train[context_cols], train[TARGET], test[context_cols])
    mean_model = DummyRegressor(strategy="mean").fit(np.zeros((len(train), 1)), y_train)
    mean_pred = mean_model.predict(np.zeros((len(test), 1)))
    metrics["context_behavior_only"] = {
        "ridge": _metrics(y_test, context_pred, seed + 1),
        "mean_baseline": _metrics(y_test, mean_pred, seed + 2),
        "features": context_cols,
    }

    # First-period model: only rows with observed G1; no G2.
    first_train, first_test = train.dropna(subset=["G1"]), test.dropna(subset=["G1"])
    if len(first_train) >= 50 and len(first_test) >= 15:
        first_cols = context_cols + ["G1"]
        first_pred = _fit_ridge(first_train[first_cols], first_train[TARGET], first_test[first_cols])
        metrics["after_first_period_G1"] = {
            "ridge": _metrics(first_test[TARGET].to_numpy(), first_pred, seed + 3),
            "last_score_G1_baseline": _metrics(first_test[TARGET].to_numpy(), first_test["G1"].to_numpy(), seed + 4),
            "features": first_cols,
            "n_train": int(len(first_train)), "n_test": int(len(first_test)),
        }
    else:
        metrics["after_first_period_G1"] = {"status": "NOT_EVALUABLE_IN_SPLIT", "n_train": int(len(first_train)), "n_test": int(len(first_test))}

    # Second-period model: G1 and G2 are available before final G3.
    second_train = train.dropna(subset=["G1", "G2"])
    second_test = test.dropna(subset=["G1", "G2"])
    if len(second_train) >= 50 and len(second_test) >= 15:
        second_cols = context_cols + ["G1", "G2"]
        second_pred = _fit_ridge(second_train[second_cols], second_train[TARGET], second_test[second_cols])
        metrics["after_second_period_G1_G2"] = {
            "ridge": _metrics(second_test[TARGET].to_numpy(), second_pred, seed + 5),
            "last_score_G2_baseline": _metrics(second_test[TARGET].to_numpy(), second_test["G2"].to_numpy(), seed + 6),
            "features": second_cols,
            "n_train": int(len(second_train)), "n_test": int(len(second_test)),
        }
    else:
        metrics["after_second_period_G1_G2"] = {"status": "NOT_EVALUABLE_IN_SPLIT", "n_train": int(len(second_train)), "n_test": int(len(second_test))}

    result.update({
        "status": "EXTERNAL_BASELINE_EVALUATED_WITH_LIMITATIONS",
        "n_rows_after_target_validation": int(len(frame)),
        "n_train": int(len(train)), "n_test": int(len(test)),
        "split": "random row holdout 80/20; fixed seed; no participant ID available",
        "model": "Ridge(alpha=1.0), fixed without test-set tuning",
        "metrics": metrics,
        "interpretation": "External method-feasibility only. Do not use these metrics as CLA student performance or Vietnamese population evidence.",
    })
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Local Hugging Face CSV file")
    parser.add_argument("--subject", choices=["math", "portuguese"], required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--source-revision", required=True, help="Immutable HF commit SHA after verification")
    parser.add_argument("--source-verified", action="store_true", help="Explicitly confirm license/source review is complete")
    args = parser.parse_args()
    report = run(args.input, args.subject, args.seed, args.source_revision, args.source_verified)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"status={report['status']} n_rows={report['n_rows']} output={output}")
