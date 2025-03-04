# Cybernetic Sabotage

Cybernetic Sabotage is an immersive educational thriller game designed to teach and test SQL concepts to students who are new to database programming. Through an engaging narrative and hands-on challenges, players learn essential SQL skills while solving an intriguing mystery.

## Overview

In this game, the player takes on the role of a leading cybersecurity analyst who has been called in after a major tech corporation, RoboTech Global, experiences a series of strange occurrences within their AI-driven robotics division. With fears of an inside job, corporate espionage, or even an AI gone rogue, players must use SQL queries to investigate the company's extensive databases and uncover the truth behind these incidents.

## Key Features

- **Engaging Storyline**: A suspenseful narrative that keeps players invested while learning
- **Progressive Learning**: SQL concepts introduced gradually, from basic SELECT statements to complex joins and subqueries
- **Interactive Challenges**: Hands-on SQL puzzles that must be solved to progress in the investigation
- **Real-world Context**: Database scenarios based on realistic corporate data structures
- **Immediate Feedback**: Query validation and hints system to guide learning
- **Score System**: Points awarded based on query efficiency and minimal hint usage

## Educational Benefits

- Learn fundamental SQL concepts through practical application
- Understand database structure and relationships
- Develop problem-solving skills in a database context
- Experience real-world scenarios for data analysis
- Practice writing efficient and effective SQL queries

## Technical Requirements

- Modern web browser
- Internet connection for online features
- No additional software installation needed

## Getting Started

1. Create an account or log in
2. Complete the tutorial mission
3. Begin investigating the main case
4. Progress through increasingly complex database challenges
5. Solve the mystery using your SQL skills

## Game Progression

The game features multiple levels of investigation, each introducing new SQL concepts:
- Basic data retrieval using SELECT statements
- Filtering data with WHERE clauses
- Joining multiple tables for complex information
- Aggregating data using GROUP BY
- Advanced queries with subqueries and complex conditions

The adventure concludes when players have mastered all required SQL concepts and successfully uncovered the truth behind RoboTech Global's mysterious incidents through carefully crafted queries.

## Project Structure

The project follows a monorepo architecture divided into frontend and backend directories:

### Frontend
- Located in `/frontend` directory
- Pure HTML/CSS/JavaScript implementation
- Canvas-based matrix animation effects
- Client-side user authentication handling
- Interactive SQL query interface
- Real-time query validation and feedback
- Local storage for game state persistence

### Backend
- Located in `/backend` directory
- Node.js/Express server implementation
- MongoDB database integration using Mongoose
- RESTful API endpoints for:
  - User authentication (login/register)
  - Query validation
  - Progress tracking
  - Score management
- CORS security configuration
- Environment-based configuration using dotenv

The separation of concerns between frontend and backend allows for:
- Independent development and testing
- Clear API contract between client and server
- Scalable architecture for future features
- Easier deployment and maintenance
- Secure handling of sensitive operations
