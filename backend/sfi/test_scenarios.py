"""
SFI Engine - Full 24 Scenario Test
Tests all 6 queries x 4 scenarios (A/B/C/D) per SFI Architecture Document
Run from project root: python3 backend/sfi/test_scenarios.py
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:5001/sfi/infer"

SCENARIOS = [
    # ── Query 1 ──────────────────────────────────────────────────────────────
    {
        "query": 1, "scenario": "A", "expected_state": "flow",
        "description": "Steady typing, normal TFK → Flow",
        "features": {"avg_ikl": 150, "avg_pel": 0, "backspace_frequency": 0.05,
                     "pause_count": 1, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 5000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 0
    },
    {
        "query": 1, "scenario": "B", "expected_state": "impulsivity",
        "description": "Low RAR < 0.5, Rapid Sub, Low Paste → Impulsivity",
        "features": {"avg_ikl": 100, "avg_pel": 0, "backspace_frequency": 0.1,
                     "pause_count": 0, "rapid_resubmission": 2, "rar": 0.3,
                     "time_to_first_keystroke": 2000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 0
    },
    {
        "query": 1, "scenario": "C", "expected_state": "uncertainty",
        "description": "PEL > 5s, Pause > 3, Mouse Hover → Uncertainty",
        "features": {"avg_ikl": 300, "avg_pel": 6000, "backspace_frequency": 0.1,
                     "pause_count": 4, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 3, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 0
    },
    {
        "query": 1, "scenario": "D", "expected_state": "frustration",
        "description": "High Backspace, Total Rewrites, Rapid Sub → Frustration",
        "features": {"avg_ikl": 400, "avg_pel": 6000, "backspace_frequency": 0.5,
                     "pause_count": 3, "rapid_resubmission": 2, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 2},
        "query_index": 0
    },

    # ── Query 2 ──────────────────────────────────────────────────────────────
    {
        "query": 2, "scenario": "A", "expected_state": "flow",
        "description": "RAR > 1.0, Pause 1-2, steady IKL → Flow",
        "features": {"avg_ikl": 150, "avg_pel": 0, "backspace_frequency": 0.05,
                     "pause_count": 1, "rapid_resubmission": 0, "rar": 1.2,
                     "time_to_first_keystroke": 54000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 1
    },
    {
        "query": 2, "scenario": "B", "expected_state": "impulsivity",
        "description": "Rapid Sub, Pause < 1 (burst typing) → Impulsivity",
        "features": {"avg_ikl": 100, "avg_pel": 0, "backspace_frequency": 0.1,
                     "pause_count": 0, "rapid_resubmission": 2, "rar": 1.2,
                     "time_to_first_keystroke": 8000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 1
    },
    {
        "query": 2, "scenario": "C", "expected_state": "uncertainty",
        "description": "Mouse Hover, PEL > 8s → Uncertainty",
        "features": {"avg_ikl": 300, "avg_pel": 9000, "backspace_frequency": 0.1,
                     "pause_count": 2, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 3, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 1
    },
    {
        "query": 2, "scenario": "D", "expected_state": "frustration",
        "description": "Total Rewrites, High Backspace → Frustration",
        "features": {"avg_ikl": 400, "avg_pel": 6000, "backspace_frequency": 0.5,
                     "pause_count": 3, "rapid_resubmission": 1, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 2},
        "query_index": 1
    },

    # ── Query 3 ──────────────────────────────────────────────────────────────
    {
        "query": 3, "scenario": "A", "expected_state": "flow",
        "description": "Pause 2-4 (productive struggle), steady IKL → Flow",
        "features": {"avg_ikl": 200, "avg_pel": 0, "backspace_frequency": 0.1,
                     "pause_count": 3, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 2
    },
    {
        "query": 3, "scenario": "B", "expected_state": "impulsivity",
        "description": "RAR < 0.6, Rapid Sub → Impulsivity",
        "features": {"avg_ikl": 100, "avg_pel": 0, "backspace_frequency": 0.1,
                     "pause_count": 0, "rapid_resubmission": 2, "rar": 0.5,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 2
    },
    {
        "query": 3, "scenario": "C", "expected_state": "uncertainty",
        "description": "Mouse Hover, PEL > 8s → Uncertainty",
        "features": {"avg_ikl": 300, "avg_pel": 8500, "backspace_frequency": 0.1,
                     "pause_count": 3, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 3, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 2
    },
    {
        "query": 3, "scenario": "D", "expected_state": "frustration",
        "description": "Total Rewrites, High Backspace → Frustration",
        "features": {"avg_ikl": 400, "avg_pel": 6000, "backspace_frequency": 0.5,
                     "pause_count": 3, "rapid_resubmission": 2, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 2},
        "query_index": 2
    },

    # ── Query 4 ──────────────────────────────────────────────────────────────
    {
        "query": 4, "scenario": "A", "expected_state": "flow",
        "description": "RAR ~1.0, Pause 1-2, steady IKL → Flow",
        "features": {"avg_ikl": 150, "avg_pel": 0, "backspace_frequency": 0.05,
                     "pause_count": 1, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 28000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 3
    },
    {
        "query": 4, "scenario": "B", "expected_state": "impulsivity",
        "description": "Rapid Sub, Low Backspace, TFK < 15s → Impulsivity",
        "features": {"avg_ikl": 100, "avg_pel": 0, "backspace_frequency": 0.05,
                     "pause_count": 0, "rapid_resubmission": 2, "rar": 0.8,
                     "time_to_first_keystroke": 10000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 3
    },
    {
        "query": 4, "scenario": "C", "expected_state": "uncertainty",
        "description": "Mouse Hover, PEL > 6s → Uncertainty",
        "features": {"avg_ikl": 300, "avg_pel": 7000, "backspace_frequency": 0.1,
                     "pause_count": 2, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 3, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 3
    },
    {
        "query": 4, "scenario": "D", "expected_state": "frustration",
        "description": "High Backspace, Total Rewrites → Frustration",
        "features": {"avg_ikl": 400, "avg_pel": 6000, "backspace_frequency": 0.5,
                     "pause_count": 3, "rapid_resubmission": 2, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 2},
        "query_index": 3
    },

    # ── Query 5 ──────────────────────────────────────────────────────────────
    {
        "query": 5, "scenario": "A", "expected_state": "flow",
        "description": "Pause 3-5 (productive struggle), steady IKL → Flow",
        "features": {"avg_ikl": 150, "avg_pel": 0, "backspace_frequency": 0.05,
                     "pause_count": 4, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 4
    },
    {
        "query": 5, "scenario": "B", "expected_state": "impulsivity",
        "description": "Rapid Sub, RAR < 0.6, Pause < 3 → Impulsivity",
        "features": {"avg_ikl": 100, "avg_pel": 0, "backspace_frequency": 0.1,
                     "pause_count": 1, "rapid_resubmission": 2, "rar": 0.5,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 4
    },
    {
        "query": 5, "scenario": "C", "expected_state": "uncertainty",
        "description": "Mouse Hover, PEL > 10s → Uncertainty",
        "features": {"avg_ikl": 300, "avg_pel": 11000, "backspace_frequency": 0.1,
                     "pause_count": 3, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 3, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 4
    },
    {
        "query": 5, "scenario": "D", "expected_state": "frustration",
        "description": "Total Rewrites, High Backspace → Frustration",
        "features": {"avg_ikl": 400, "avg_pel": 6000, "backspace_frequency": 0.5,
                     "pause_count": 6, "rapid_resubmission": 2, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 2},
        "query_index": 4
    },

    # ── Query 12 ─────────────────────────────────────────────────────────────
    {
        "query": 12, "scenario": "A", "expected_state": "flow",
        "description": "TFK > 150s = Deep Mental Modeling, steady IKL → Flow",
        "features": {"avg_ikl": 150, "avg_pel": 0, "backspace_frequency": 0.1,
                     "pause_count": 3, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 162000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 11
    },
    {
        "query": 12, "scenario": "B", "expected_state": "impulsivity",
        "description": "Rapid Sub, Pause < 2 → Impulsivity (Cognitive Overflow)",
        "features": {"avg_ikl": 150, "avg_pel": 0, "backspace_frequency": 0.1,
                     "pause_count": 1, "rapid_resubmission": 3, "rar": 1.0,
                     "time_to_first_keystroke": 162000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 11
    },
    {
        "query": 12, "scenario": "C", "expected_state": "uncertainty",
        "description": "Mouse Hover, PEL > 12s → Uncertainty",
        "features": {"avg_ikl": 300, "avg_pel": 13000, "backspace_frequency": 0.1,
                     "pause_count": 3, "rapid_resubmission": 0, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 3, "paste_frequency": 0, "total_rewrites": 0},
        "query_index": 11
    },
    {
        "query": 12, "scenario": "D", "expected_state": "frustration",
        "description": "Total Rewrites, High Backspace > 0.5 → Frustration",
        "features": {"avg_ikl": 400, "avg_pel": 6000, "backspace_frequency": 0.6,
                     "pause_count": 3, "rapid_resubmission": 2, "rar": 1.0,
                     "time_to_first_keystroke": 3000, "error_repetition_count": 0,
                     "schema_hover_count": 0, "paste_frequency": 0, "total_rewrites": 2},
        "query_index": 11
    },
]

def run_tests():
    print(f"SFI Engine - 24 Scenario Test Log")
    print(f"Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    passed = 0
    failed = 0
    results = []

    for s in SCENARIOS:
        try:
            resp = requests.post(BASE_URL, json={
                "session_id": f"test_q{s['query']}_{s['scenario']}",
                "features": s["features"],
                "query_index": s["query_index"]
            }, timeout=10)
            data = resp.json()
            actual = data.get("dominant_state")
            probs = data.get("probabilities", {})
            triggered = data.get("trigger_scaffold", False)
            msg = data.get("triny_message", "")

            ok = actual == s["expected_state"]
            status = "✅ PASS" if ok else "❌ FAIL"
            if ok: passed += 1
            else: failed += 1

            print(f"\nQ{s['query']} Scenario {s['scenario']} — {status}")
            print(f"  Description : {s['description']}")
            print(f"  Expected    : {s['expected_state']}")
            print(f"  Actual      : {actual} ({probs.get(actual, 0)*100:.1f}%)")
            print(f"  Triggered   : {triggered}")
            if msg:
                print(f"  Triny       : {msg[:100]}...")

            results.append({**s, "actual": actual, "triggered": triggered, "pass": ok})

        except Exception as e:
            print(f"\nQ{s['query']} Scenario {s['scenario']} — ❌ ERROR: {e}")
            failed += 1

    print("\n" + "=" * 70)
    print(f"RESULTS: {passed}/24 passed | {failed} failed")

    # Save log
    log = {
        "run_at": datetime.now().isoformat(),
        "passed": passed,
        "failed": failed,
        "total": 24,
        "results": results
    }
    with open("backend/sfi/test_log.json", "w") as f:
        json.dump(log, f, indent=2)
    print(f"Log saved to backend/sfi/test_log.json")

if __name__ == "__main__":
    run_tests()