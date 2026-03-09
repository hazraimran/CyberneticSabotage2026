from flask import Flask, request, jsonify
from flask_cors import CORS
from backend.sfi.dbn import DBN

app = Flask(__name__)
CORS(app)

# One DBN instance per session (in memory)
sessions = {}

@app.route('/sfi/infer', methods=['POST'])
def infer():
    data = request.get_json()
    
    session_id = data.get('session_id', 'default')
    features = data.get('features', {})
    
    if not features:
        return jsonify({'error': 'No features provided'}), 400
    
    # Get or create DBN for this session
    if session_id not in sessions:
        sessions[session_id] = DBN()
    
    dbn = sessions[session_id]
    result = dbn.update(features)
    
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