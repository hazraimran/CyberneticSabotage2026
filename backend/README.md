# Backend - Cybernetic Sabotage

The backend server for Cybernetic Sabotage, providing API endpoints and database functionality.

## Description

This is the backend portion of Cybernetic Sabotage, featuring:

- RESTful API endpoints for game functionality
- MongoDB database integration for user data storage
- User authentication and session management
- Progress tracking and scoring system
- Query validation and response handling

## Getting Started

### Prerequisites

- Node.js
- MongoDB
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
4. Create a `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string
   ```
5. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### User Management
- `POST /register` - Register new user
- `GET /getUser` - Authenticate and retrieve user data
- `GET /getUsers` - Get all users (admin only)

### Game Progress
- `POST /submitUserData` - Save user's query attempts and progress
- `POST /submitSurveyResponse` - Store user feedback and responses

## Database Schema

### User Model
- username (String, unique)
- password (String, hashed)
- timestamps

### UserResponse Model
- username (String, unique)
- responses (Object)
- password (String)

## Security Features

- Password hashing
- Input validation
- Error handling
- Session management

## Technical Stack

- Express.js for API routing
- MongoDB with Mongoose ODM
- Node.js runtime environment
- RESTful architecture

## CORS Configuration

The following origins are allowed to access the API:
SET on you .env file  ALLOWED_ORIGINS= with the allowed origins

CORS is configured using the `cors` middleware with specific allowed origins defined in the `.env` file:

