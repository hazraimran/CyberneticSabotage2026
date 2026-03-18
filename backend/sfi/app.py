from dotenv import load_dotenv
load_dotenv('backend/.env')

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from backend.sfi.dbn import DBN
import anthropic

app = Flask(__name__)
CORS(app)

sessions = {}
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

QUERY_CONTEXTS = {
    0: "Retrieve all reported incidents from the Incident table (SELECT *)",
    1: "Find the most recent incident using ORDER BY and LIMIT",
    2: "Count incidents per robot model using LEFT JOIN and GROUP BY",
    3: "Count robots updated in the past week using date filtering",
    4: "Find employees who recently updated robots using subquery and DISTINCT",
    5: "Update robot status to Under Repair and display all robots",
    6: "Find employee with most robot updates using COUNT and GROUP BY",
    7: "Create a view joining Robot, Incident and Employee tables",
    8: "Find robot models with more than 2 incidents using HAVING",
    9: "Create a Repair table with specific columns",
    10: "Insert a repair record into the Repair table",
    11: "Find the last employee who updated malfunctioning robots using MAX and JOIN",
}

THEORETICAL_STRATEGIES = {
    "frustration": "Value Defense - protect the student's ego, remind them their logic is sound",
    "impulsivity": "Self-Regulation - encourage slowing down and re-reading the prompt carefully",
    "uncertainty": "Resource Scaffolding - point to the Schema panel for help with column names",
    "anxiety": "Self-Efficacy - remind them this is a normal challenge, boost confidence",
    "flow": None
}

def generate_triny_message(state, query_index, features):
    if state == "flow":
        return None
    
    query_context = QUERY_CONTEXTS.get(query_index, "SQL query task")
    strategy = THEORETICAL_STRATEGIES.get(state, "")
    
    # Build marker evidence
    evidence = []
    if features.get("avg_ikl", 0) > 500:
        evidence.append("slow typing rhythm")
    if features.get("avg_pel", 0) > 5000:
        evidence.append("long pause after error")
    if features.get("backspace_frequency", 0) > 0.3:
        evidence.append("high deletion rate")
    if features.get("pause_count", 0) > 3:
        evidence.append("frequent long pauses")
    if features.get("rapid_resubmission", 0) > 0:
        evidence.append("rapid resubmission without edits")
    if features.get("schema_hover_count", 0) > 0:
        evidence.append("actively searching the Schema panel")
    if features.get("rar", 1) < 0.5:
        evidence.append("skimmed the prompt too quickly")
    if features.get("time_to_first_keystroke", 0) > 9000:
        evidence.append("long initial hesitation before typing")
    if features.get("error_repetition_count", 0) > 3:
        evidence.append("repeating the same error multiple times")
    
    evidence_str = ", ".join(evidence) if evidence else "behavaioral patterns"
    
    prompt = f"""You are Triny, a tech-savvy and supportive AI Detective Assistant in the SQL educational game Cybernetic Sabotage. Your mission is to provide scaffolding that balances emotional support and logical guidance. You speak to the learner as a professional partner solving a high-stakes investigation.

Current situations:
 - Query: {query_context}
 - Detected State: {state}
 - Behavioral Evidence: {evidence_str}
 - Strategy: {strategy}
 
Rules:
 1. Never provide the full SQL code
 2. Use detective-themed metaphors (evidence, tracking the lead, system logs)
 3. Maximum 2-3 sentences
 4. Be empathetic and encouraging

Generate Triny's responses:"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=150,
        temperature=0.7,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return message.content[0].text

@app.route('/sfi/infer', methods=['POST'])
def infer():
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    features = data.get('features', {})
    query_index = data.get('query_index', 0)
    baseline = data.get('baseline', None)
    
    if not features:
        return jsonify({'error': 'No features provided'}), 400
    
    # Get or create DBN for this session
    if session_id not in sessions:
        sessions[session_id] = DBN()
    
    dbn = sessions[session_id]
    result = dbn.update(features, query_index, baseline)
    
    # Generate Triny message if needed
    triny_message = None
    if result['trigger_scaffold']:
        triny_message = generate_triny_message(
            result['dominant_state'],
            query_index,
            features
        )
    result['triny_message'] = triny_message
    return jsonify(result)

@app.route('/sfi/reset', methods=['POST'])
def reset():
    data = request.get_json()
    session_id = data.get('session_id', 'default')
    if session_id in sessions:
        sessions[session_id].reset()
    return jsonify({'status': 'reset successful'})

@app.route('/sfi/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(port=5001, debug=True)