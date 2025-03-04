# CYBERNETIC SABOTAGE: GAME RULES AND ENHANCEMENTS

## Game Overview
- You are a cybersecurity analyst investigating suspicious activities at RoboTech Global
- Use SQL queries to analyze databases and uncover the truth
- Progress through increasingly complex challenges
- Earn points by solving queries efficiently

## Core Game Rules

1. Query Challenges
   - Each level presents a unique database investigation task
   - Write valid SQL queries to extract the required information
   - Queries must match expected results exactly to progress

2. Scoring System
   - Start with base points for each level
   - Lose points when using hints
   - Maintain high score by minimizing hint usage
   - Time taken affects final score

3. Hint System
   - Multiple hints available per challenge
   - Each hint costs progressively more points
   - Hints provide graduated assistance
   - Track total hints used per session

4. Game Progress
   - Complete challenges sequentially
   - Progress bar shows completion percentage
   - Cannot skip challenges
   - Must solve current query to advance

## Game Enhancements

1. Sound Effects
   - Toggle sound on/off
   - Audio feedback for actions
   - Background ambiance options

2. Visual Feedback
   - Color-coded error messages
   - Progress indicators
   - Dynamic query results display
   - Animated transitions

3. Save System
   - Progress automatically tracked
   - Query history maintained
   - Performance metrics recorded
   - Username-based tracking


# Query Validator Rules

This document outlines the rules and validation logic used in the Query Validator component.

## Core Validation Rules

1. Query cannot be empty
   - Empty queries will return an error message "Empty Query Provided"

2. Basic SQL syntax validation
   - Queries must follow valid SQL syntax
   - Invalid syntax will return "Invalid SQL Query Syntax" with the problematic query

3. Query Results Validation
   - Results are validated against predefined answer keys
   - Both the number of rows and actual values must match exactly
   - Numeric values are parsed and compared as floats
   - String values are compared directly

4. SELECT queries for searching tables (not deducting points)
   - Queries must start with "SELECT"
   - Other SQL keywords are not allowed
   - Example: "SELECT * FROM employees" is valid, "INSERT INTO employees" is invalid

## Validation Process

1. First pass: Check for empty query
2. Second pass: Validate SQL syntax
3. Third pass: Execute query and compare results
4. Special case: For first query (index 0), validate table structure

## Error Handling

- All SQL execution errors are caught and displayed in red
- Error messages include the specific error details
- Failed validations set the flag to false
- Successful validations set the flag to true

## Success Criteria

For a query to be considered valid it must:
1. Not be empty
2. Have valid SQL syntax
3. Execute successfully
4. Return results that exactly match the expected answer key
5. Have the correct number of rows and columns
