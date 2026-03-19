from datetime import datetime
from backend.sfi.priors import EMISSION_PROBS, TRANSITION_PROBS, INITIAL_PROBS

# Per-query threshold overrides based on SFI architecture document
QUERY_THRESHOLDS = {
    0:  {"pause_count": 3, "avg_ikl": 500, "pel_threshold": 5000}, # Q1
    1:  {"pause_count": 2, "avg_ikl": 500, "low_pause_impulsivity": True, "pel_threshold": 8000}, # Q2
    2:  {"pause_count": 4, "avg_ikl": 600, "pel_threshold": 8000, "rar_impulsivity": 0.6}, # Q3
    3:  {"pause_count": 3, "avg_ikl": 500, "min_tfk": 15000, "pel_threshold": 6000, "low_pause_impulsivity": True}, # Q4
    4:  {"pause_count": 5, "avg_ikl": 600, "pel_threshold": 10000, "low_pause_impulsivity": True}, # Q5                                # Q5
    11: {"pause_count": 6, "avg_ikl": 700, "tfk_is_flow": True, "pel_threshold": 12000, "backspace_threshold": 0.5},   # Q12: higher backspace threshold
}
DEFAULT_THRESHOLDS = {"pause_count": 3, "avg_ikl": 500, "pel_threshold": 5000}

class DBN:
    def __init__(self):
        self.states = ["flow", "frustration", "impulsivity", "uncertainty", "anxiety"]
        # Start with initial probabilities
        self.current_probs = INITIAL_PROBS.copy()
    
    def extract_signals(self, features: dict, query_index: int = 0, baseline: dict = None) -> dict:
        t = QUERY_THRESHOLDS.get(query_index, DEFAULT_THRESHOLDS)
        
        # Use z-score for IKL if baseline available, otherwise use fixed threshold
        if baseline and baseline.get('sd_ikl', 0) > 0:
            high_ikl = features.get('_z_ikl', 0) > 1.5
        else:
            high_ikl = features.get('avg_ikl', 0) > t["avg_ikl"]
        
        return {
            "high_ikl": high_ikl,
            "high_pel": features.get("avg_pel", 0) > t.get("pel_threshold", 5000),
            "high_backspace": features.get("backspace_frequency", 0) > t.get("backspace_threshold", 0.3),
            "high_pause": features.get("pause_count", 0) > t["pause_count"],
            "rapid_resubmission": features.get("rapid_resubmission", 0) > 0,
            "schema_hovering": features.get("schema_hover_count", 0) > 0,
            "low_rar": features.get("rar", 1) < QUERY_THRESHOLDS.get(query_index, DEFAULT_THRESHOLDS).get("rar_impulsivity", 0.5),
            "high_tfk": (
                False if QUERY_THRESHOLDS.get(query_index, {}).get("tfk_is_flow", False)
                and features.get("time_to_first_keystroke", 0) > 150000
                else features.get("time_to_first_keystroke", 0) > 9000
            ),
            "high_error_repetition": features.get("error_repetition_count", 0) > 3,
            "high_rewrites": features.get("total_rewrites", 0) >= 1,  
            "low_pause_burst": (
                QUERY_THRESHOLDS.get(query_index, {}).get("low_pause_impulsivity", False)
                and features.get("pause_count", 0) < (3 if query_index == 4 else 1)
            ),
            "skimmed_prompt": (
                "min_tfk" in QUERY_THRESHOLDS.get(query_index, {})
                and features.get("time_to_first_keystroke", 0) < QUERY_THRESHOLDS[query_index]["min_tfk"]
                and features.get("time_to_first_keystroke", 0) > 0
            ),  
            "low_paste": features.get("paste_frequency", 0) == 0,
            "low_pause_q12": (
                query_index == 11
                and features.get("pause_count", 0) < 2
            ),
            "productive_pause_q5": (
                query_index == 4
                and 3 <= features.get("pause_count", 0) <= 5
            ),
            "low_backspace_q4": (
                query_index == 3
                and features.get("backspace_frequency", 0) < 0.1
            ),
        }
        
    def compute_emission(self, state: str, signals: dict) -> float:
        """
        P(Bt | St): probability of observing current behavior given state
        Multiply all signal probabilities together
        """
        prob = 1.0
        for signal, is_high in signals.items():
            emission = EMISSION_PROBS[state][signal]
            prob *= emission if is_high else (1 - emission)
        return prob
    
    def update(self, features: dict, query_index: int = 0, baseline: dict = None) -> dict:
        # If we have a personal baseline, use z-score to adjust IKL threshold
        if baseline and baseline.get('sd_ikl', 0) > 0:
            mean_ikl = baseline['mean_ikl']
            sd_ikl = baseline['sd_ikl']
            z_score = (features.get('avg_ikl', 0) - mean_ikl) / sd_ikl
            features = dict(features)
            features['_z_ikl'] = z_score

        signals = self.extract_signals(features, query_index, baseline)
        new_probs = {}

        for state in self.states:
            transition = sum(
                TRANSITION_PROBS[prev][state] * self.current_probs[prev]
                for prev in self.states
            )
            emission = self.compute_emission(state, signals)
            new_probs[state] = emission * transition

        total = sum(new_probs.values())
        if total > 0:
            new_probs = {s: p / total for s, p in new_probs.items()}
        else:
            new_probs = INITIAL_PROBS.copy()

        self.current_probs = new_probs

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "probabilities": new_probs,
            "dominant_state": max(new_probs, key=new_probs.get),
            "trigger_scaffold": (
                new_probs.get("frustration", 0) > 0.75 or
                new_probs.get("impulsivity", 0) > 0.50 or
                new_probs.get("uncertainty", 0) > 0.65 or
                new_probs.get("anxiety", 0) > 0.65
            )
        }
        
    def reset(self):
        self.current_probs = INITIAL_PROBS.copy()

