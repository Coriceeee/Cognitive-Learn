"""Offline, auditable VNHSGE benchmark preparation for Cognitive Learn AI.

Nothing here changes CLA source or uploads data to a model.
"""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import random
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

DATASET_ID = "roshansk23/Vietnam_HighSchool_Exam_Dataset"
SOURCE_URL = "https://github.com/Xdao85/VNHSGE"


def timestamp():
    return datetime.now(timezone.utc).isoformat()


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, payload):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_jsonl(path):
    with open(path, encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            if line.strip():
                try:
                    yield json.loads(line)
                except json.JSONDecodeError as exc:
                    raise ValueError(f"Malformed JSONL line {lineno}") from exc


def norm(s):
    return re.sub(r"\s+", " ", str(s).strip()).casefold()


def get_answer(row):
    a = str(row.get("answer", "")).strip().upper()
    if a in {"A", "B", "C", "D"}:
        return str("ABCD".index(a) + 1)
    if a.isdigit() and 1 <= int(a) <= 4:
        return str(int(a))
    return None


def problem(row):
    if not isinstance(row, dict):
        return "not_object"
    if not str(row.get("question", "")).strip():
        return "missing_question"
    opts = row.get("options")
    if not isinstance(opts, list) or len(opts) != 4:
        return "not_four_options"
    if any(not str(v).strip() for v in opts):
        return "empty_option"
    if get_answer(row) is None:
        return "invalid_answer"
    return None


def fingerprint(row):
    key = [norm(row["question"]), *(norm(o) for o in row["options"])]
    return hashlib.sha256(json.dumps(key, ensure_ascii=False).encode()).hexdigest()


def fetch(args):
    try:
        from datasets import load_dataset
        from huggingface_hub import HfApi
    except ImportError as e:
        raise SystemExit("Install dependencies: pip install -r requirements.txt") from e
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    info = HfApi().dataset_info(DATASET_ID, revision=args.revision)
    revision_sha = info.sha
    # Pin the exact source snapshot used by the run.
    dataset = load_dataset(DATASET_ID, split="train", revision=revision_sha, trust_remote_code=False)
    target = out / "source.jsonl"
    with target.open("w", encoding="utf-8") as f:
        for item in dataset:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    write_json(out / "fetch_manifest.json", {
        "source": DATASET_ID, "upstream": SOURCE_URL,
        "requested_revision": args.revision, "resolved_revision": revision_sha,
        "rows": len(dataset), "artifact": "source.jsonl", "sha256": sha256(target),
        "fetched_at_utc": timestamp(), "mirror_license_label": "cc",
        "license_verified_upstream": False,
        "research_use_approved": False,
        "population": "Vietnamese high school multiple-choice questions, NOT learner records",
    })
    print(f"Fetched {len(dataset)} rows; SHA {revision_sha}")


def audit(args):
    rows = list(read_jsonl(args.input))
    errors = Counter()
    groups = defaultdict(set)
    counts = Counter()
    for row in rows:
        issue = problem(row)
        if issue:
            errors[issue] += 1
            continue
        groups[fingerprint(row)].add(get_answer(row))
        counts[str(row.get("category_en") or row.get("category_original_lang") or "unknown")] += 1
    dupe = sum(max(0, count - 1) for count in Counter(
        fingerprint(r) for r in rows if problem(r) is None).values())
    result = {
        "input": str(args.input), "input_sha256": sha256(args.input),
        "utc": timestamp(), "row_count": len(rows),
        "valid_schema_count": len(rows) - sum(errors.values()),
        "schema_issues": dict(errors), "exact_duplicate_excess_rows": dupe,
        "conflicting_answer_fingerprints": sum(len(x) > 1 for x in groups.values()),
        "by_category_valid_rows": dict(sorted(counts.items())),
        "manual_review_required": ["original licensing", "answer key accuracy", "semantic near-duplicates", "pretraining contamination"],
    }
    write_json(Path(args.out) / "audit.json", result)
    print(json.dumps(result, indent=2, ensure_ascii=False))


def make_prompt(row):
    return (f"Chọn đáp án đúng duy nhất cho câu hỏi dưới đây. "
            f"Chỉ trả về một ký tự A, B, C hoặc D; không giải thích.\n\n"
            f"{row['question']}\n" + "\n".join(
                f"{label}. {answer}" for label, answer in zip("ABCD", row["options"])))


def split_groups(rows, seed):
    """Deterministic group split; source exam-file group, not individual questions."""
    buckets = defaultdict(list)
    for item in rows:
        source_group = str(item.get("file_name", "")).strip()
        # Without group name avoid incorrect independence claims: one group per row
        # remains a weaker split, disclosed in manifest.
        key = source_group if source_group else "missing::" + fingerprint(item)
        buckets[key].append(item)
    keys = sorted(buckets)
    random.Random(seed).shuffle(keys)
    # group-level partition; counts can differ because source files vary in size
    n = len(keys)
    if n < 3:
        raise ValueError("At least three distinct source-file groups required for train/val/test split")
    ntest = max(1, round(n * 0.2))
    nval = max(1, round(n * 0.1))
    if ntest + nval >= n:
        ntest, nval = 1, 1
    partition = {
        "test": keys[:ntest], "val": keys[ntest:ntest+nval],
        "train": keys[ntest+nval:]
    }
    return {part: [r for k in part_keys for r in buckets[k]] for part, part_keys in partition.items()}, {p: len(v) for p, v in partition.items()}


def write_csv(path, headers, records):
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for record in records:
            writer.writerow({k: record.get(k, "") for k in headers})


def prepare(args):
    rows = list(read_jsonl(args.input))
    valid = [r for r in rows if problem(r) is None]
    by_fp = defaultdict(list)
    for row in valid:
        by_fp[fingerprint(row)].append(row)
    conflict_ids = {k for k, group in by_fp.items() if len({get_answer(x) for x in group}) > 1}
    deduped = [group[0] for k, group in sorted(by_fp.items()) if k not in conflict_ids]
    splits, group_counts = split_groups(deduped, args.seed)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for split, items in splits.items():
        path = out / f"{split}.jsonl"
        with path.open("w", encoding="utf-8") as f:
            for i in items:
                f.write(json.dumps(i, ensure_ascii=False) + "\n")
    # Test keys are separated: benchmark prompt file never contains the answer.
    prompts, gold = [], []
    for idx, item in enumerate(splits["test"], 1):
        item_id = f"vnhsge-{idx:06d}"
        prompts.append({"item_id": item_id, "prompt": make_prompt(item)})
        gold.append({"item_id": item_id, "answer": "ABCD"[int(get_answer(item))-1],
                     "category": item.get("category_en") or item.get("category_original_lang") or "unknown"})
    write_csv(out / "benchmark_prompts.csv", ["item_id", "prompt"], prompts)
    write_csv(out / "benchmark_gold.csv", ["item_id", "answer", "category"], gold)
    write_json(out / "manifest.json", {
        "purpose": "LLM Vietnamese MCQ benchmark only", "input_sha256": sha256(args.input),
        "created_at_utc": timestamp(), "seed": args.seed,
        "valid_rows_before_dedup": len(valid), "quarantined_conflicting_fingerprints": len(conflict_ids),
        "removed_exact_duplicate_rows": len(valid) - sum(len(g) for k,g in by_fp.items() if k in conflict_ids) - len(deduped),
        "split_rows": {k: len(v) for k, v in splits.items()},
        "split_source_groups": group_counts,
        "source_group_key": "file_name; fallback=question fingerprint if missing",
        "warning": "Group split mitigates exam-file overlap only; pretrained LLM test contamination and semantic near-duplicates still require audit",
        "model_evaluated": False, "empirical_student_outcome": False,
    })
    print("Prepared:", {k: len(v) for k,v in splits.items()}, "; quarantined conflicts:", len(conflict_ids))


def evaluate(args):
    with open(args.gold, encoding="utf-8-sig", newline="") as f:
        gold = list(csv.DictReader(f))
    with open(args.predictions, encoding="utf-8-sig", newline="") as f:
        pred_rows = list(csv.DictReader(f))
    ids = [r["item_id"] for r in gold]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate item_id in gold")
    predictions = {}
    for r in pred_rows:
        item = r["item_id"]
        if item in predictions:
            raise ValueError(f"Duplicate prediction item_id: {item}")
        predictions[item] = r.get("prediction", "").strip().upper()
    if set(predictions) - set(ids):
        raise ValueError("Prediction contains item_id not found in gold")
    count, correct, covered = len(gold), 0, 0
    per_category = defaultdict(lambda: {"n": 0, "correct": 0, "answered": 0})
    records = []
    for g in gold:
        pr = predictions.get(g["item_id"], "")
        if pr in {"1","2","3","4"}:
            pr = "ABCD"[int(pr)-1]
        answer = pr in "ABCD" and len(pr) == 1
        yes = answer and pr == g["answer"]
        correct += yes
        covered += answer
        cat = g["category"]
        per_category[cat]["n"] += 1
        per_category[cat]["correct"] += yes
        per_category[cat]["answered"] += answer
        records.append({"item_id": g["item_id"], "prediction": pr, "correct": int(yes), "answered": int(answer)})
    result = {
        "utc": timestamp(), "gold_sha256": sha256(args.gold), "predictions_sha256": sha256(args.predictions),
        "n": count, "n_answered": covered, "n_correct": correct,
        "accuracy_all_questions": correct / count if count else None,
        "answer_coverage": covered / count if count else None,
        "accuracy_on_answered": correct / covered if covered else None,
        "per_category": {k: {**v, "accuracy_all_questions": v["correct"]/v["n"]} for k,v in sorted(per_category.items())},
        "warning": "Results describe answering this dataset only, not learning gains or CLA intervention efficacy",
    }
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    write_json(out / "metrics.json", result)
    write_csv(out / "item_results.csv", ["item_id", "prediction", "correct", "answered"], records)
    print(json.dumps(result, ensure_ascii=False, indent=2))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)
    q = sub.add_parser("fetch"); q.add_argument("--out", required=True); q.add_argument("--revision", default="main"); q.set_defaults(func=fetch)
    q = sub.add_parser("audit"); q.add_argument("--input", required=True); q.add_argument("--out", required=True); q.set_defaults(func=audit)
    q = sub.add_parser("prepare"); q.add_argument("--input", required=True); q.add_argument("--out", required=True); q.add_argument("--seed", type=int, default=20261115); q.set_defaults(func=prepare)
    q = sub.add_parser("evaluate"); q.add_argument("--gold", required=True); q.add_argument("--predictions", required=True); q.add_argument("--out", required=True); q.set_defaults(func=evaluate)
    args = p.parse_args()
    args.func(args)

if __name__ == "__main__":
    main()
