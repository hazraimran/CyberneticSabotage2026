# Cybernetic Sabotage

Cybernetic Sabotage is an immersive educational thriller game designed to teach and test SQL concepts through an engaging narrative. Players take on the role of a cybersecurity analyst investigating RoboTech Global's AI-driven robotics division, using SQL queries to uncover the truth behind a series of mysterious incidents.

## Key Features

- **Engaging Storyline**: A suspenseful narrative that keeps players invested while learning
- **Progressive SQL Learning**: 12 queries covering SELECT, JOIN, GROUP BY, UPDATE, CREATE TABLE, CREATE VIEW, and subqueries
- **Adaptive Scaffolding (Triny)**: An AI assistant powered by a Dynamic Bayesian Network (DBN) that detects student affective states in real-time and delivers personalized interventions
- **Tiered Hint System**: Three-level hints with transparent point deductions
- **Adaptive Feedback**: Query-specific error feedback based on what the student wrote
- **Score System**: Points awarded based on level of help used per query

## System Architecture

This project follows a monorepo structure with three services:

### Frontend (`/frontend`)
- Pure HTML/CSS/JavaScript
- Client-side SQL execution via sql.js
- Real-time keystroke feature extraction (9 behavioral metrics)
- SFI polling every 2 seconds via Flask API
- Interactive SQL editor with auto-complete and adaptive feedback

### Backend (`/backend`)
- Node.js/Express REST API
- MongoDB (Mongoose) for user data, game progress, and behavioral analytics
- Collections: `users`, `triggerevents`, `userresponses`

### SFI Engine (`/backend/sfi`)
- Flask API for real-time affective state inference
- Dynamic Bayesian Network classifying 5 states: Flow, Frustration, Impulsivity, Uncertainty, Anxiety
- ChromaDB RAG pipeline for scaffold retrieval
- Claude LLM (claude-sonnet) for generating personalized Triny messages
- Rate-limited to prevent over-intervention (60s cooldown)

## Branch History

| Branch | Description |
|--------|-------------|
| `master` | Latest stable version (same as week9-bug-fixes) |
| `week2-raw-event-capture` | Initial keystroke event capture implementation |
| `week4-feature-derivation` | Behavioral feature extraction pipeline (IKL, PEL, RAR, etc.) |
| `week5-sfi` | DBN inference engine and Flask SFI API |
| `week6-system-integration` | Full system integration: frontend ↔ Node.js ↔ Flask ↔ MongoDB |
| `week7-dry-run` | Pilot 1 preparation and dry run fixes |
| `week8-data` | Data export pipeline and post-pilot analysis |
| `week9-bug-fixes` | UI improvements, point system overhaul, adaptive feedback, analytics logging |

## Point System

- Starting score: **100 points**
- Hint 1: -10 pts / Hint 2: -20 pts / Hint 3: -40 pts
- Sample Output: -30 pts / Final SQL: -70 pts
- Correct answer reward based on highest help used:
  - No help → +80 pts
  - Hint 1 only → +70 pts
  - Hint 2 or Sample Output → +60 pts
  - Hint 3 → +50 pts
  - Final SQL → +30 pts
- Score never goes below 0

## Data Collection

Per query submission, the system logs:
- User ID, query index, time used, hints used, query submitted, correctness
- Help items used, attempt count, reward category, points before/after
- 9 real-time keystroke behavioral features (IKL, PEL, RAR, pause count, etc.)
- Affective state interventions stored in `triggerevents` collection

## Deployment

- **Frontend**: Render Static Site → `cybernetic-sabotage.com`
- **Backend**: Render Web Service (Node.js)
- **SFI API**: Render Web Service (Flask/Python)
- **Database**: MongoDB Atlas

## Getting Started (Local Development)

```bash
# Terminal 1 - Node.js backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && python3 server.py

# Terminal 3 - SFI Flask API
python3 -m backend.sfi.app
```

Then open http://localhost:8080/public/index.html