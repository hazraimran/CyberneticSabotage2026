from pymongo import MongoClient
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

# Connect to MongoDB
client = MongoClient(os.environ.get('MONGODB_PATH'), tlsAllowInvalidCertificates=True)
db = client['test']

users_col = db['users']
triggers_col = db['triggerevents']

print("Fetching data...")

# Get all users
users = list(users_col.find({}, {'_id': 0}))
# Get all trigger events
triggers = list(triggers_col.find({}, {'_id': 0}))

rows = []

for user in users:
    username = user.get('username')
    questions = user.get('questions', [])
    
    for q in questions:
        query_index = int(q.get('questionId', -1))
        
        # Find matching trigger events for this user + query
        matching_triggers = [
            t for t in triggers
            if t.get('username') == username
            and t.get('query_index') == query_index
        ]
        
        if matching_triggers:
            for t in matching_triggers:
                probs = t.get('probabilities', {})
                rows.append({
                    'username': username,
                    'query_index': query_index,
                    'time_used_ms': q.get('timeUsed'),
                    'hints_used': q.get('hintsUsed'),
                    'is_correct': q.get('isCorrect'),
                    'score': user.get('score'),
                    'query': q.get('query', '')[:50],
                    'detected_state': t.get('detected_state'),
                    'prob_flow': probs.get('flow'),
                    'prob_frustration': probs.get('frustration'),
                    'prob_impulsivity': probs.get('impulsivity'),
                    'prob_uncertainty': probs.get('uncertainty'),
                    'prob_anxiety': probs.get('anxiety'),
                    'triny_message': t.get('triny_message', '')[:100],
                    'trigger_timestamp_ms': t.get('timestamp_ms'),
                })
        else:
            # No trigger events for this query
            rows.append({
                'username': username,
                'query_index': query_index,
                'time_used_ms': q.get('timeUsed'),
                'hints_used': q.get('hintsUsed'),
                'is_correct': q.get('isCorrect'),
                'score': user.get('score'),
                'query': q.get('query', '')[:50],
                'detected_state': None,
                'prob_flow': None,
                'prob_frustration': None,
                'prob_impulsivity': None,
                'prob_uncertainty': None,
                'prob_anxiety': None,
                'triny_message': None,
                'trigger_timestamp_ms': None,
            })

df = pd.DataFrame(rows)
output_file = f'backend/scripts/study_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
df.to_csv(output_file, index=False)
print(f"Exported {len(rows)} rows to {output_file}")
print(f"Users: {df['username'].nunique()}")
print(f"Queries with trigger events: {df['detected_state'].notna().sum()}")