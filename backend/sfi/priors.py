# Control-Value Theory priors
# P(Bt | St): likelihood of observing behavior B given state S

# Emission probabilities: how likely each marker is for each state
EMISSION_PROBS = {
    "flow": {
        "high_ikl": 0.1, # Flow = steady typing, unlikely to have high IKL
        "high_pel": 0.1, # Flow = quick recovery from errors
        "high_backspace": 0.15, # Flow = few deletions
        "high_pause": 0.1, # Flow = few long pauses
        "rapid_resubmission": 0.1, # Flow = not guessing
        "schema_hovering": 0.2,  # Flow students occasionally check schema
    },
    "frustration": {
        "high_ikl": 0.7, # Frustration = slow/irregular typing
        "high_pel": 0.8, # Frustration = long pause after error
        "high_backspace": 0.75, # Frustration = lots of deletion
        "high_pause": 0.7, # Frustration = lots of long pauses
        "rapid_resubmission": 0.6, # Frustration = panic guessing
        "schema_hovering": 0.5,  # Frustrated students check schema more
    }
}

# Transition probabilities: P(St | St-1)
# How likely to stay in or switch states
TRANSITION_PROBS = {
    "flow": {
        "flow": 0.8, # Likely to stay in flow
        "frustration": 0.2 # Unlikely to switch to frustration
    },
    "frustration": {
        "flow": 0.3, # Can recover to flow
        "frustration": 0.7 # Likely to stay frustrated
    }
}

# Initial state probabilities
INITIAL_PROBS = {
    "flow": 0.7, # Assume student starts in flow
    "frustration": 0.3
}