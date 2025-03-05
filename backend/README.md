# Backend - Cybernetic Sabotage

The backend server for Cybernetic Sabotage, an interactive SQL learning game that simulates investigating and fixing malfunctioning robots.

## Description

This is the backend portion of Cybernetic Sabotage, featuring:

- RESTful API endpoints for game mechanics and user progress
- MongoDB database integration for persistent user data storage
- Real-time query validation and execution
- Progress tracking with scoring system
- User response and feedback collection

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm (Node Package Manager)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure environment variables in `.env`:
   ```
   MONGODB_USERNAME=your_username
   MONGODB_PASSWORD=your_password
   MONGODB_PATH=your_mongodb_connection_string
   ALLOWED_ORIGINS=comma_separated_origins
   ```
5. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication Routes
`/auth`
- **POST** `/register`
  - Register a new user
  - Body: `{ username: string, password: string }`
  - Returns: User object with token

- **POST** `/login` 
  - Login existing user
  - Body: `{ username: string, password: string }`
  - Returns: User object with token

### User Routes
`/users`
- **GET** `/`
  - Get all users
  - Returns: Array of user objects

- **POST** `/submitUserData`
  - Submit user game data
  - Body: `{ username: string, score: number, queries: array }`
  - Returns: Updated user object

### Survey Routes  
`/survey`
- **POST** `/submitSurveyResponse`
  - Submit survey response
  - Body: `{ username: string, responses: object }`
  - Returns: Created survey response object


## Database Schema

### User Model
- username (String, unique)
- score (Number)
- totalQueriesSolved (Number)
- questions (Array)
  - questionId (Number)
  - timeUsed (Number)
  - query (String)
  - isCorrect (Boolean)
  - hintsUsed (Number)

### UserResponse Model
- username (String, unique)
- responses (Object)

## Game Features

- Real-time SQL query validation
- Progressive difficulty levels
- Hint system with scoring impact
- Time tracking per query
- Detailed progress tracking

## Technical Stack

- Express.js for API routing
- MongoDB Atlas for cloud database
- Mongoose ODM for data modeling
- Node.js runtime environment
- SQL.js for query validation

## Security & Configuration

- Environment-based configuration
- CORS protection with whitelisted origins
- Input validation and sanitization
- Error handling and logging

The API allows access from origins specified in ALLOWED_ORIGINS environment variable. Current allowed origins:
- http://localhost:8080
- https://cyberneticsabotage-2.onrender.com
