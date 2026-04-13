from pymongo import MongoClient
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

client = MongoClient(os.environ.get('MONGODB_PATH'), tlsAllowInvalidCertificates=True)
db = client['test']

users_col = db['users']
triggers_col = db['triggerevents']

print("Fetching data...")

# Filter cutoff date
cutoff = datetime(2026, 3, 25)

# Exclude test accounts
exclude_users = ['1', '2', 'test123', 'carazeng', 'gnblink44@gmail.com', 'lily', '123456', '12345679', '21e2', 'dqf3f', 'lily2', 'carazengca@gmail.com', '125', 'Rubyline', 'wait', 'bibi', '12345679', '12', '21e2', 'dqf3f', 'zengyuan', 'p', 'carazeng13', 'lily1', 'Test123', 'cara2002']

# Get users created after cutoff
users = list(users_col.find({'createdAt': {'$gte': cutoff}}, {'_id': 0}))
users = [u for u in users if u.get('username') not in exclude_users]

# Get all trigger events
triggers = list(triggers_col.find({}, {'_id': 0}))
triggers = [t for t in triggers if t.get('username') not in exclude_users]

rows = []

for user in users:
    username = user.get('username')
    questions = user.get('questions', [])
    
    for q in questions:
        raw_index = int(q.get('questionId', -1))
        # Some old accounts use 0-based questionId, normalize to 1-based
        query_index = raw_index if raw_index > 0 else raw_index + 1
        
        # Find matching trigger events for this user + query
        matching_triggers = [
            t for t in triggers
            if t.get('username') == username
            and t.get('query_index') == query_index - 1  # convert to 0-based
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
                    'query': q.get('query', '')[:100],
                    'detected_state': t.get('detected_state'),
                    'prob_flow': probs.get('flow'),
                    'prob_frustration': probs.get('frustration'),
                    'prob_impulsivity': probs.get('impulsivity'),
                    'prob_uncertainty': probs.get('uncertainty'),
                    'prob_anxiety': probs.get('anxiety'),
                    'triny_message': t.get('triny_message', '')[:200],
                    'trigger_timestamp_ms': t.get('timestamp_ms'),
                })
        else:
            rows.append({
                'username': username,
                'query_index': query_index,
                'time_used_ms': q.get('timeUsed'),
                'hints_used': q.get('hintsUsed'),
                'is_correct': q.get('isCorrect'),
                'score': user.get('score'),
                'query': q.get('query', '')[:100],
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
df = df.sort_values(['username', 'query_index', 'trigger_timestamp_ms']).reset_index(drop=True)
output_file = f'backend/scripts/study_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
df.to_csv(output_file, index=False)
print(f"Exported {len(rows)} rows to {output_file}")
print(f"Unique users: {df['username'].nunique()}")
print(f"Users: {df['username'].unique()}")