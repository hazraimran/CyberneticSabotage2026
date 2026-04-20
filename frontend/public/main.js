
const ImagesLoader = {
  "hacker": "images/hacker.png",
  "trini": "images/trini.png",
  "white-rabbit": "images/white-rabbit.png",
  "tutorial": "images/tutorial.png",
}

// Preload images
Object.keys(ImagesLoader).forEach(key => {
  const img = new Image();
  img.src = ImagesLoader[key];
});


/* global initSqlJs */
/**
 * Game Configuration object containing all initial game settings and white rabbit modal configuration
 * @constant {Object}
 */
const GAME_CONFIG = {
  initialScore: 100,
  initialProgress: 10,
  hintPoints: [10, 20, 40],
  whiteRabbitConfig: {
    imageUrl: ImagesLoader["white-rabbit"],
    imageWidth: 200,
    imageHeight: 200,
    background: "linear-gradient(to right, #000, var(--main-color))",
    color: "white",
    confirmButtonText: "Yes",
    showCancelButton: true,
    cancelButtonText: "No",
    confirmButtonColor: "var(--constraint-color-dark)",
    cancelButtonColor: "black",
    cancelButtonTextColor: "var(--main-color)",
    customClass: {
      actions: 'center-buttons-actions',
      swal_image: {
        borderRadius: "50%",
        border: "2px solid var(--main-color)",
        boxShadow: "0 0px 50px 0 rgba(0, 0, 0, 0.5)",
      },
    },
    toast: true,
  }
};

/**
 * DOM element references used throughout the application
 * @constant {Object}
 */
const DOM = {
  textarea: document.querySelector('#query-textarea'),
  displayText: document.querySelector('.display-text'),
  form: document.querySelector('#query-form'),
  restartButton: document.getElementById('restart-button'),
  storyline: document.getElementById('triny-text'),
  hintButton: document.getElementById('hint-button'),
  helpButton: document.getElementById('help-button'),
  yesButton: document.getElementById('yes'),
  noButton: document.getElementById('no'),
  okayButton: document.getElementById('okay'),
  hintContainer: document.getElementById('modal-content'),
  numberCluesLeft: document.getElementById('number-clues-left'),
  hintText: document.getElementById('hint-text'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  scoreText: document.getElementById('score'),
  endButton: document.getElementById('end-game'),
  clearButton: document.getElementById('clear-button'),
  agentNameDisplay: document.getElementById('agent-name-display'),
  correctQueries: document.getElementById('correct-queries'),
  settingsButton: document.getElementById('settings-button'),
  soundButton: document.getElementById('sound-on-button'),
  soundOffButton: document.getElementById('sound-off-button'),
  sqlCommands: document.getElementById('sql-commands'),
  sqlExplanation: document.getElementById('sql-commands-explanation'),
  mainColorPicker: document.getElementById('mainColorPicker'),
  constraintColorPicker: document.getElementById('constraintColorPicker'),
  textColorPicker: document.getElementById('TextColorPicker'),
  fontSizeSlider: document.getElementById('fontSizeSlider'),
};

/**
 * Game state object that maintains the current state of the game
 * @type {Object}
 */
const GameState = {
  queryHistory: [],
  currentQueryIndex: 0,
  startTime: null,
  score: GAME_CONFIG.initialScore,
  progress: GAME_CONFIG.initialProgress,
  flag: false,
  hintCounter: 0,
  soundEnabled: localStorage.getItem('sound-enabled') === 'true',
  correctQueriesSolved: 0,
  db: null,
  hintsUsed: 0
};

// Auto-complete suggestions
const SQL_SUGGESTIONS = [
  // Tables
  'Employee', 'Robot', 'Log', 'Incident', 'AccessCode', 'Repair',
  // Columns
  'employeeID', 'firstName', 'lastName', 'jobTitle', 'department', 'lastLogin',
  'robotID', 'Model', 'manufDate', 'status', 'lastUpdateOn', 'lastUpdatedByEmpID',
  'logID', 'actionDesc', 'timeStamp', 'incidentID', 'desc', 'reportedBy',
  'accessCode', 'accessLevel', 'lastAccess', 'repairID', 'repairStatus', 'repairedById',
  // SQL Keywords
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'INNER JOIN', 'GROUP BY',
  'ORDER BY', 'HAVING', 'COUNT', 'DISTINCT', 'LIMIT', 'INSERT INTO',
  'UPDATE', 'SET', 'CREATE TABLE', 'CREATE VIEW', 'MAX', 'MIN', 'AS',
  'AND', 'OR', 'ON', 'DESC', 'ASC', 'VALUES', 'INTO', 'PRIMARY KEY'
];

// Rate limiting
let lastScaffoldTime = 0;
const SCAFFOLD_COOLDOWN = 60000;

// Tab focus tracking for RAR calculation
let tabHiddenTime = 0;
let tabHiddenStart = null;

// repeated hints
let lastSubmittedQuery = '';

// Triny messages overlapped with queries
let currentQueryText = '';

// Limit LLM message generation to 1 per query
let lastScaffoldQueryIndex = -1;

// track the attempts students made
let attemptCount = 0;
let queryHelpLevel = 0; // 0=none, 1=hint1, 2=hint2/sampleOutput, 3=hint3, 4=finalSQL

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    tabHiddenStart = Date.now();
  } else {
    if (tabHiddenStart) {
      tabHiddenTime += Date.now() - tabHiddenStart;
      tabHiddenStart = null;
    }
  }
});

/**
 * Game data containing all queries, answers, hints and validation keys
 * @constant {Object}
 */
const GameData = {
  queries: [
  " Detective, your first mission is to retrieve all reported incidents from the 'Incident' table. Let's see what we're dealing with!",
  " Great job, Detective! Now, let's track down the most recent incident. Retrieve the latest reported case from the <strong>Incident</strong> table and display all its details. Stay sharp!",
  " We're closing in! Identify which robot models have been involved in incidents. Count the number of incidents per model and return only two values: the robot model and the incident count (<strong>IncidentCount</strong>). Make sure to include all robot models, even those with zero incidents.",
  " Time to check our system updates. Count how many robots have been updated in the past week (Assume today is 2023-07-24). Return this count as 'NumberOfUpdatedRobots'.",
  " Who's been fixing our robots? Identify employees who recently updated any robots within the past week. We want to know their employee ID, first name, and last name (Assume today is 2023-07-24).",
  " Some robots need urgent repairs! First, update all robots that were serviced in the past 7 days  by setting their status to <strong>'Under Repair'</strong>. Then, retrieve and display all robot details.  (Assume today is 2023-07-24)",
  " Who's our top whistleblower? Identify the employee with the most robot updates. If multiple employees have the same number, return any one of them. Display <strong>employeeID</strong> and <strong>NumberOfIncidents</strong>.",
  " Let's compile all the evidence! Create a view, <strong>RobotIncidentView</strong>, that links robots to their incidents. Show the robot ID, model, last updated by (employee ID), incident ID, description, timestamp, and the name of the employee responsible for the update. Then, display the view.",
  " Let's uncover the problematic robot models! Find all models that have been involved in more than 2 incidents. Return only the model names.",
  " We need a repair log! Create a <strong>Repair</strong> table to track all robot repairs. Include columns for <strong>repairID</strong> (INTEGER), <strong>repairStatus</strong> (TEXT), <strong>desc</strong> (TEXT), <strong>robotID</strong> (INTEGER), and <strong>repairedById</strong> (INTEGER) to record the employee responsible for the repair.",
  " Time to record a repair case! Insert a new repair record into the <strong>Repair</strong> table with the provided details. Use the given values for <strong>repairID</strong>, <strong>repairStatus</strong>, <strong>desc</strong>, <strong>robotID</strong>, and <strong>repairedById</strong>.",
  " Who last worked on the faulty robots? Identify the most recent employee who updated the software of robots currently marked as <strong>'Under Repair'</strong>. Return their <strong>employeeID, first name, last name, timestamp</strong> of the last update, and the <strong>robotID</strong> they updated."
  ],
  queryAnswers: [
  'SELECT * FROM Incident;',
  'SELECT * FROM Incident ORDER BY timeStamp DESC LIMIT 1;',
  'SELECT r.Model, COUNT(i.incidentID) AS IncidentCount FROM Robot AS r LEFT JOIN Incident AS i ON r.robotID = i.robotID GROUP BY r.Model;',
  'SELECT COUNT(DISTINCT robotID) AS NumberOfUpdatedRobots FROM Robot WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\';',
  'SELECT DISTINCT e.employeeID, e.firstName, e.lastName FROM Employee e WHERE e.employeeID IN ( SELECT DISTINCT lastUpdatedByEmpID FROM Robot WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\' );',
  'UPDATE Robot SET status = \'Under Repair\' WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\'; SELECT * FROM Robot;',
  'SELECT lastUpdatedByEmpID AS employeeID, COUNT(*) AS NumberOfIncidents FROM Robot GROUP BY lastUpdatedByEmpID ORDER BY COUNT(*) DESC LIMIT 1;',
  'CREATE VIEW RobotIncidentView AS SELECT r.robotID, r.Model, r.lastUpdatedByEmpID, i.incidentID, i.desc, i.timeStamp, e.firstName, e.lastName FROM Robot r JOIN Incident i ON r.robotID = i.robotID JOIN Employee e ON r.lastUpdatedByEmpID = e.employeeID; SELECT * FROM RobotIncidentView;',
  'SELECT Model FROM Robot WHERE robotID IN ( SELECT robotID FROM Incident GROUP BY robotID HAVING COUNT(*) > 2 );',
  'CREATE TABLE Repair ( repairID INTEGER, repairStatus TEXT, desc TEXT, robotID INTEGER, repairedById INTEGER );',
  'INSERT INTO Repair (repairID, repairStatus, desc, robotID, repairedById) VALUES (1, \'Under Repair\', \'This robot model is undergoing repair due to its faulty patterns\', 5, 7); SELECT * FROM Repair;',
  'SELECT e.employeeID, e.firstName, e.lastName, l.lastUpdate, l.robotID FROM Employee e JOIN ( SELECT MAX(timeStamp) AS lastUpdate, robotID, employeeID FROM log WHERE actionDesc = \'Updates\' GROUP BY robotID ) l ON e.employeeID = l.employeeID JOIN Robot r ON l.robotID = r.robotID WHERE r.status = \'Under Repair\';'
  ],
  hints: [
  [
    'All reported incidents means you need every row from the <strong>Incident</strong> table.',
    'To return all columns from one table, use the pattern: <strong>SELECT * FROM table_name</strong>. Replace <strong>table_name</strong> with <strong>Incident</strong>.',
    '<strong>SELECT * FROM Incident;</strong> This works because <strong>*</strong> selects all columns and <strong>FROM Incident</strong> specifies the table.'
  ],
  [
    'The most recent incident means the row with the latest <strong>timeStamp</strong> value.',
    'To get the latest record, sort the table by <strong>timeStamp</strong> in descending order: <strong>ORDER BY timeStamp DESC</strong>',
    '<strong>SELECT * FROM Incident ORDER BY timeStamp DESC LIMIT 1;</strong> This works because <strong>ORDER BY timeStamp DESC</strong> puts the latest record first, and <strong>LIMIT 1</strong> returns only that row.'
  ],
  [
    'You need to count how many incidents are linked to each robot model, while still including models with no incidents.',
    'Join the <strong>Robot</strong> and <strong>Incident</strong> tables using a <strong>LEFT JOIN</strong>, then group by model: <strong>FROM Robot r LEFT JOIN Incident i ON r.robotID = i.robotID GROUP BY r.Model</strong>',
    '<strong>SELECT r.Model, COUNT(i.incidentID) AS IncidentCount FROM Robot AS r LEFT JOIN Incident AS i ON r.robotID = i.robotID GROUP BY r.Model;</strong> This works because <strong>LEFT JOIN</strong> keeps all robot models, <strong>COUNT()</strong> counts incidents per model, and <strong>GROUP BY</strong> groups results by model.'
  ],
  [
    'You need to count how many unique robots were updated in the past week, based on the <strong>lastUpdateOn</strong> date.',
    'Filter rows within the date range using <strong>WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\'</strong>. Use <strong>COUNT(DISTINCT robotID)</strong> to count unique robots.',
    '<strong>SELECT COUNT(DISTINCT robotID) AS NumberOfUpdatedRobots FROM Robot WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\';</strong> This works because the <strong>WHERE</strong> clause filters updates within the past week, and <strong>COUNT(DISTINCT robotID)</strong> ensures each robot is counted only once.'
  ],
  [
    'You need to find employees who updated robots in the past week. First identify which employee IDs appear in recent robot updates, then retrieve their details.',
    'Use a subquery to get employee IDs from <strong>Robot</strong>, then filter <strong>Employee</strong> using <strong>IN</strong>: <strong>WHERE employeeID IN (SELECT lastUpdatedByEmpID FROM Robot WHERE ...)</strong>',
    '<strong>SELECT DISTINCT e.employeeID, e.firstName, e.lastName FROM Employee e WHERE e.employeeID IN ( SELECT DISTINCT lastUpdatedByEmpID FROM Robot WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\' );</strong> This works because the subquery finds employees who updated robots recently, and <strong>IN</strong> filters the Employee table to return their details.'
  ],
  [
    'You need to first update the <strong>status</strong> of robots serviced in the past week, then retrieve all robot records to see the updated results.',
    'Use an <strong>UPDATE</strong> statement with a <strong>WHERE</strong> clause to modify recent robots, then run a <strong>SELECT</strong> query: <strong>UPDATE Robot SET status = \'Under Repair\' WHERE ...;</strong> followed by <strong>SELECT * FROM Robot;</strong>',
    '<strong>UPDATE Robot SET status = \'Under Repair\' WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\'; SELECT * FROM Robot;</strong> This works because the <strong>UPDATE</strong> statement modifies the status of recent robots, and the <strong>SELECT</strong> query retrieves all robot details after the update.'
  ],
  [
    'You need to count how many updates each employee made, then find the employee with the highest count.',
    'Group updates by employee and count them, then sort in descending order: <strong>GROUP BY lastUpdatedByEmpID ORDER BY COUNT(*) DESC</strong>',
    '<strong>SELECT lastUpdatedByEmpID AS employeeID, COUNT(*) AS NumberOfIncidents FROM Robot GROUP BY lastUpdatedByEmpID ORDER BY COUNT(*) DESC LIMIT 1;</strong> This works because <strong>GROUP BY</strong> counts updates per employee, <strong>ORDER BY ... DESC</strong> puts the highest count first, and <strong>LIMIT 1</strong> returns the top employee.',
  ],
  [
    'You need to combine data from <strong>Robot</strong>, <strong>Incident</strong>, and <strong>Employee</strong> into a single result, save it as a view, and then display it.',
    'First join <strong>Robot</strong> with <strong>Incident</strong>, then join <strong>Employee</strong> to get the updater\'s name. Wrap the query using <strong>CREATE VIEW RobotIncidentView AS ...</strong>, then run <strong>SELECT * FROM RobotIncidentView;</strong>',
    '<strong>CREATE VIEW RobotIncidentView AS SELECT r.robotID, r.Model, r.lastUpdatedByEmpID, i.incidentID, i.desc, i.timeStamp, e.firstName, e.lastName FROM Robot r JOIN Incident i ON r.robotID = i.robotID JOIN Employee e ON r.lastUpdatedByEmpID = e.employeeID; SELECT * FROM RobotIncidentView;</strong> This works because the joins connect robots to their incidents and the employee who last updated them, and the view stores the combined query for reuse.'
  ],
  [
    'You need to find robot IDs that appear in more than 2 incidents, then return the models of those robots.',
    'Use a subquery to count incidents per robot using <strong>GROUP BY</strong> and filter using <strong>HAVING COUNT(*) > 2</strong>, then use <strong>IN</strong> to match those robot IDs in the <strong>Robot</strong> table.',
    '<strong>SELECT Model FROM Robot WHERE robotID IN ( SELECT robotID FROM Incident GROUP BY robotID HAVING COUNT(*) > 2 );</strong> This works because the subquery identifies robots with more than 2 incidents, and the outer query returns their corresponding models.'
  ],
  [
    'You need to create a new table called <strong>Repair</strong> with the specified columns and data types to store repair information.',
    'Use <strong>CREATE TABLE</strong> followed by the table name and define each column with its data type inside parentheses: <strong>CREATE TABLE Repair (columnName dataType, ...)</strong>',
    '<strong>CREATE TABLE Repair ( repairID INTEGER, repairStatus TEXT, desc TEXT, robotID INTEGER, repairedById INTEGER );</strong> This works because <strong>CREATE TABLE</strong> defines a new table structure, and each column is assigned the correct data type for storing repair data.'
  ],
  [
    'You need to insert a new row into the <strong>Repair</strong> table with the given values, then retrieve the table to confirm the insertion.',
    'Use <strong>INSERT INTO</strong> with the column names, followed by <strong>VALUES</strong> to add the new record: <strong>INSERT INTO Repair (columns...) VALUES (...);</strong> Then run <strong>SELECT * FROM Repair;</strong>',
    '<strong>INSERT INTO Repair (repairID, repairStatus, desc, robotID, repairedById) VALUES (1, \'Under Repair\', \'This robot model is undergoing repair due to its faulty patterns\', 5, 7); SELECT * FROM Repair;</strong> This works because <strong>INSERT INTO</strong> adds a new record to the table, and <strong>SELECT *</strong> displays the updated contents.'
  ],
  [
    'You need to find the most recent update made to any robot currently under repair, then return the employee who performed that update.',
    'Use a subquery on <strong>Log</strong> to find the latest update per robot using <strong>MAX(timeStamp)</strong>, then join with <strong>Employee</strong> and <strong>Robot</strong>, and sort to get the most recent: <strong>ORDER BY lastUpdate DESC LIMIT 1</strong>',
    '<strong>SELECT e.employeeID, e.firstName, e.lastName, l.lastUpdate, l.robotID FROM Employee e JOIN ( SELECT MAX(timeStamp) AS lastUpdate, robotID, employeeID FROM Log WHERE actionDesc = \'Updates\' GROUP BY robotID ) l ON e.employeeID = l.employeeID JOIN Robot r ON l.robotID = r.robotID WHERE r.status = \'Under Repair\' ORDER BY l.lastUpdate DESC LIMIT 1;</strong> This works because the subquery finds the latest update for each robot, and the joins connect that to employee and robot details, while sorting and limiting returns the single most recent update overall.'
  ]
],
  answerKeys: [
  [
    [1, 'Robot malfunctioned during production', '2022-02-20 09:30:00', 'Jane Smith', 2],
    [2, 'Collision with another robot', '2022-03-15 13:45:00', 'Emily Davis', 4],
    [3, 'Software glitch caused erratic behavior', '2022-04-05 10:15:00', 'John Johnson', 1],
    [4, 'Power outage interrupted production process', '2022-05-10 14:20:00', 'Sarah Wilson', 3],
    [5, 'Component failure resulted in production delay', '2022-06-25 11:00:00', 'Michael Thompson', 2],
    [6, 'Robot arm malfunctioned, causing damage to equipment', '2022-07-12 16:30:00', 'Amy Anderson', 4],
    [7, 'Communication failure with central control system', '2022-08-18 09:45:00', 'Ryan Garcia', 1],
    [8, 'Sensor calibration error led to incorrect measurements', '2022-09-27 13:00:00', 'Emma Martinez', 3],
    [9, 'Overheating issue caused temporary shutdown', '2022-10-30 10:10:00', 'David Hernandez', 2],
    [10, 'Software update caused compatibility problems', '2022-11-22 15:20:00', 'Olivia Robinson', 4]
  ],
  [
    [10, 'Software update caused compatibility problems', '2022-11-22 15:20:00', 'Olivia Robinson', 4]
  ],
  [
    ['CyberHelper', 2],
    ['MegaMech', 3],
    ['RoboBot', 0],
    ['RoboBot 2000', 2],
    ['TurboBot', 3]
  ],
  [
    [4]
  ],
  [
    [2, 'karim', 'khoja'],
    [3, 'John', 'Doe'],
    [4, 'Jane', 'Smith'],
    [7, 'Laksh', 'Agarwal']
  ],
  [
    [1, 'RoboBot 2000', '2022-02-02 09:15:00', 'Active', '2022-03-05 15:30:00', '6'],
    [2, 'MegaMech', '2022-04-18 11:45:00', 'Under Repair', '2023-07-17 09:30:00', '3'],
    [3, 'CyberHelper', '2022-03-05 15:30:00', 'In Repair', '2022-04-18 11:45:00', '4'],
    [4, 'TurboBot', '2022-05-10 14:20:00', 'Under Repair', '2023-07-19 13:30:00', '2'],
    [5, 'MegaMech', '2022-02-02 09:15:00', 'Under Repair', '2023-07-20 11:30:00', '4'],
    [6, 'RoboBot', '2022-06-08 14:50:00', 'In Repair', '2022-09-08 12:40:00', '8'],
    [7, 'TurboBot', '2022-11-19 17:20:00', 'Under Repair', '2023-07-21 15:30:00', '7']
  ],
  [
    [4, 2]
  ],
  [
    [2, 'MegaMech', '3', 1, 'Robot malfunctioned during production', '2022-02-20 09:30:00', 'John', 'Doe'],
    [4, 'TurboBot', '2', 2, 'Collision with another robot', '2022-03-15 13:45:00', 'karim', 'khoja'],
    [1, 'RoboBot 2000', '6', 3, 'Software glitch caused erratic behavior', '2022-04-05 10:15:00', 'Emily', 'Davis'],
    [3, 'CyberHelper', '4', 4, 'Power outage interrupted production process', '2022-05-10 14:20:00', 'Jane', 'Smith'],
    [2, 'MegaMech', '3', 5, 'Component failure resulted in production delay', '2022-06-25 11:00:00', 'John', 'Doe'],
    [4, 'TurboBot', '2', 6, 'Robot arm malfunctioned, causing damage to equipment', '2022-07-12 16:30:00', 'karim', 'khoja'],
    [1, 'RoboBot 2000', '6', 7, 'Communication failure with central control system', '2022-08-18 09:45:00', 'Emily', 'Davis'],
    [3, 'CyberHelper', '4', 8, 'Sensor calibration error led to incorrect measurements', '2022-09-27 13:00:00', 'Jane', 'Smith'],
    [2, 'MegaMech', '3', 9, 'Overheating issue caused temporary shutdown', '2022-10-30 10:10:00', 'John', 'Doe'],
    [4, 'TurboBot', '2', 10, 'Software update caused compatibility problems', '2022-11-22 15:20:00', 'karim', 'khoja']
  ],
  [
    ['MegaMech'],
    ['TurboBot']
  ],
  [
    ['repairID'], ['repairStatus'], ['desc'], ['robotID'], ['repairedById']
  ],
  [
    [1, 'Under Repair', 'This robot model is undergoing repair due to its faulty patterns', 5, 7]
  ],
  [
    [1, 'Thomas', 'Anderson', '2022-06-12 10:25:00', 4]
  ]
]
};


const SQL_COMMANDS_HTML = {
  "SELECT": "<div><h4>SELECT</h4> <span>The <strong>SELECT</strong> statement is used to retrieve data from a database. It specifies which columns to return and from which table.<br><br><strong>Example 1:</strong><br><code>SELECT firstName, lastName FROM Employees;</code><br><br><strong>Example 2:</strong><br><code>SELECT * FROM Orders WHERE orderDate > '2023-01-01';</code></span></div>",
  "UPDATE": "<div><h4>UPDATE</h4> <span>The <strong>UPDATE</strong> statement is used to modify existing records in a table.<br><br><strong>Example 1:</strong><br><code>UPDATE Employees SET Salary = 60000 WHERE EmployeeID = 3;</code><br><br><strong>Example 2:</strong><br><code>UPDATE Orders SET Status = 'Shipped' WHERE OrderID = 101;</code></span></div>",
  "DELETE": "<div><h4>DELETE FROM</h4> <span>The <strong>DELETE FROM</strong> statement is used to remove records from a table.<br><br><strong>Example 1:</strong><br><code>DELETE FROM Customers WHERE CustomerID = 5;</code><br><br><strong>Example 2:</strong><br><code>DELETE FROM Orders WHERE OrderDate < '2022-01-01';</code></span></div>",
  "JOIN": "<div><h4>JOIN</h4> <span>The <strong>JOIN</strong> statement is used to combine rows from two or more tables based on a related column.<br><br><strong>Example 1:</strong><br><code>SELECT Orders.OrderID, Customers.CustomerName FROM Orders JOIN Customers ON Orders.CustomerID = Customers.CustomerID;</code><br><br><strong>Example 2:</strong><br><code>SELECT Employees.Name, Departments.DepartmentName FROM Employees JOIN Departments ON Employees.DepartmentID = Departments.DepartmentID;</code></span></div>",
  "LEFT JOIN": "<div><h4>LEFT JOIN</h4> <span>The <strong>LEFT JOIN</strong> returns all records from the left table and the matched records from the right table. If no match is found, NULL values are returned.<br><br><strong>Example 1:</strong><br><code>SELECT Customers.CustomerName, Orders.OrderID FROM Customers LEFT JOIN Orders ON Customers.CustomerID = Orders.CustomerID;</code><br><br><strong>Example 2:</strong><br><code>SELECT Employees.Name, Departments.DepartmentName FROM Employees LEFT JOIN Departments ON Employees.DepartmentID = Departments.DepartmentID;</code></span></div>",
  "AS": "<div><h4>AS</h4> <span>The <strong>AS</strong> keyword is used to rename a column or table with an alias.<br><br><strong>Example 1:</strong><br><code>SELECT firstName AS First_Name, lastName AS Last_Name FROM Employees;</code><br><br><strong>Example 2:</strong><br><code>SELECT COUNT(*) AS TotalOrders FROM Orders;</code></span></div>",
  "BY": "<div><h4>BY</h4> <span>The <strong>BY</strong> keyword is commonly used in GROUP BY and ORDER BY clauses to organize or sort query results.<br><br><strong>Example 1:</strong><br><code>SELECT Department, COUNT(*) FROM Employees GROUP BY Department;</code><br><br><strong>Example 2:</strong><br><code>SELECT firstName, lastName FROM Employees ORDER BY lastName;</code></span></div>",
  "COUNT": "<div><h4>COUNT</h4> <span>The <strong>COUNT</strong> function returns the number of rows matching a specified condition.<br><br><strong>Example 1:</strong><br><code>SELECT COUNT(*) FROM Employees;</code><br><br><strong>Example 2:</strong><br><code>SELECT COUNT(OrderID) FROM Orders WHERE Status = 'Shipped';</code></span></div>",
  "ORDER": "<div><h4>ORDER</h4> <span>The <strong>ORDER BY</strong> clause sorts query results in ascending (default) or descending order.<br><br><strong>Example 1:</strong><br><code>SELECT firstName, lastName FROM Employees ORDER BY lastName;</code><br><br><strong>Example 2:</strong><br><code>SELECT * FROM Orders ORDER BY TotalAmount DESC;</code></span></div>",
  "LIMIT": "<div><h4>LIMIT</h4> <span>The <strong>LIMIT</strong> clause restricts the number of rows returned by a query.<br><br><strong>Example 1:</strong><br><code>SELECT * FROM Orders LIMIT 10;</code><br><br><strong>Example 2:</strong><br><code>SELECT firstName, lastName FROM Employees ORDER BY lastName LIMIT 5;</code></span></div>",
  "WHERE": "<div><h4>WHERE</h4> <span>The <strong>WHERE</strong> clause filters records based on a specified condition.<br><br><strong>Example 1:</strong><br><code>SELECT * FROM Employees WHERE Salary > 50000;</code><br><br><strong>Example 2:</strong><br><code>SELECT * FROM Orders WHERE Status = 'Pending';</code></span></div>",
  "ORDER BY": "<div><h4>ORDER BY</h4> <span>The <strong>ORDER BY</strong> clause is used to sort the result set in ascending (ASC) or descending (DESC) order.<br><br><strong>Example 1:</strong><br><code>SELECT firstName, lastName FROM Employees ORDER BY lastName ASC;</code><br><br><strong>Example 2:</strong><br><code>SELECT * FROM Orders ORDER BY TotalAmount DESC;</code></span></div>",
  "GROUP BY": "<div><h4>GROUP BY</h4> <span>The <strong>GROUP BY</strong> clause groups rows that have the same values in specified columns into aggregated results.<br><br><strong>Example 1:</strong><br><code>SELECT Department, COUNT(*) FROM Employees GROUP BY Department;</code><br><br><strong>Example 2:</strong><br><code>SELECT ProductID, SUM(Quantity) FROM Orders GROUP BY ProductID;</code></span></div>",
  "DISTINCT": "<div><h4>DISTINCT</h4> <span>The <strong>DISTINCT</strong> keyword removes duplicate values from query results.<br><br><strong>Example 1:</strong><br><code>SELECT DISTINCT Department FROM Employees;</code><br><br><strong>Example 2:</strong><br><code>SELECT DISTINCT Country FROM Customers;</code></span></div>",
  "CREATE VIEW": "<div><h4>CREATE VIEW</h4> <span>The <strong>CREATE VIEW</strong> statement creates a virtual table based on a SELECT query.<br><br><strong>Example 1:</strong><br><code>CREATE VIEW HighSalaries AS SELECT Name, Salary FROM Employees WHERE Salary > 70000;</code><br><br><strong>Example 2:</strong><br><code>CREATE VIEW OrderSummary AS SELECT OrderID, CustomerID, TotalAmount FROM Orders;</code></span></div>",
  "HAVING": "<div><h4>HAVING COUNT</h4> <span>The <strong>HAVING COUNT</strong> clause filters groups based on an aggregate function.<br><br><strong>Example 1:</strong><br><code>SELECT Department, COUNT(*) FROM Employees GROUP BY Department HAVING COUNT(*) > 5;</code><br><br><strong>Example 2:</strong><br><code>SELECT ProductID, COUNT(*) FROM Orders GROUP BY ProductID HAVING COUNT(*) > 10;</code></span></div>",
  "CREATE TABLE": "<div><h4>CREATE TABLE</h4> <span>The <strong>CREATE TABLE</strong> statement is used to define a new table in the database.<br><br><strong>Example 1:</strong><br><code>CREATE TABLE Employees (EmployeeID INT PRIMARY KEY, Name VARCHAR(100), Salary DECIMAL(10,2));</code><br><br><strong>Example 2:</strong><br><code>CREATE TABLE Orders (OrderID INT PRIMARY KEY, CustomerID INT, TotalAmount DECIMAL(10,2));</code></span></div>",
  "INSERT INTO": "<div><h4>INSERT INTO</h4> <span>The <strong>INSERT INTO</strong> statement is used to insert new rows into a table.<br><br><strong>Example 1:</strong><br><code>INSERT INTO Customers (CustomerName, ContactName, Country) VALUES ('John Doe', 'John', 'USA');</code><br><br><strong>Example 2:</strong><br><code>INSERT INTO Products (ProductName, Price) VALUES ('Laptop', 999.99);</code></span></div>",
  "MAX": "<div><h4>MAX</h4> <span>The <strong>MAX</strong> function returns the highest value in a specified column.<br><br><strong>Example 1:</strong><br><code>SELECT MAX(Salary) FROM Employees;</code><br><br><strong>Example 2:</strong><br><code>SELECT MAX(TotalAmount) FROM Sales;</code></span></div>"
}


const EXTERNAL_API = window.config.EXTERNAL_API;
const FEEDBACK_FORM_URL = window.config.FEEDBACK_FORM_URL;

/**
 * Initializes all event listeners for the game
 * @function
 */
function initializeEventListeners() {
  DOM.form.addEventListener('submit', handleFormSubmit);
  DOM.restartButton.addEventListener('click', askForRestart);
  DOM.hintButton.onclick = yesButtonHandler;
  /* DOM.helpButton.onclick = getHelp; */
  /* Remove Tutotial */
  if (DOM.helpButton) DOM.helpButton.onclick = getHelp;
  DOM.yesButton.onclick = yesButtonHandler;
  DOM.noButton.onclick = noButtonHandler;
  DOM.okayButton.onclick = okayButtonHandler;
  DOM.clearButton.addEventListener('click', clearQuery);
  DOM.textarea.addEventListener('input', () => {
    DOM.clearButton.style.display = DOM.textarea.value.length > 0 ? 'block' : 'none';
  });
  DOM.settingsButton.addEventListener('click',toggleSound);
  DOM.soundOffButton.addEventListener('click', setSoundOff);
  DOM.soundButton.addEventListener('click', setSoundOn);
  DOM.mainColorPicker.addEventListener('change', setColor);
  DOM.constraintColorPicker.addEventListener('change', setColor);
  DOM.textColorPicker.addEventListener('change', setColor);
  DOM.fontSizeSlider.addEventListener('input', setFontSize);
  DOM.textarea.addEventListener('keydown', (event) => {
    if (DOM.textarea.value === 'wr-code') {
      DOM.textarea.value = GameData.queryAnswers[GameState.currentQueryIndex];
    } else if(DOM.textarea.value === 'wr-hack'){
      Swal.fire({
        title: 'White Rabbit',
        html: '<p>'+ (GameState.currentQueryIndex) +'</p><ol>' + GameData.queryAnswers.join('<li>') + '</ol>',
        icon: 'success',
        background: '#000',
        color: '#fff',
      })
      DOM.textarea.value = '';
    }
  });
  DOM.sqlCommands.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
      DOM.sqlExplanation.innerHTML = SQL_COMMANDS_HTML[e.target.textContent];
    }
  });
  // Week2: Keystroke logging
  DOM.textarea.addEventListener('keydown', (e) => {
    if (window.keystrokeLogger) window.keystrokeLogger.logKeydown(e);
  });

  DOM.textarea.addEventListener('paste', (e) => {
    if (window.keystrokeLogger) window.keystrokeLogger.logPaste(e);
  });

  DOM.form.addEventListener('submit', (e) => {
    if (window.keystrokeLogger) window.keystrokeLogger.logQuerySubmit(DOM.textarea.value);
  });
  
  // Week7: Mouse hover tracking on Schema panel
  const schemaPanel = document.querySelector('.table-container');
  let hoverStartTime = null;

  if (schemaPanel) {
    schemaPanel.addEventListener('mouseenter', () => {
      hoverStartTime = Date.now();
    });

    schemaPanel.addEventListener('mouseleave', () => {
      if (hoverStartTime) {
        const duration = Date.now() - hoverStartTime;
        if (duration > 2000 && window.keystrokeLogger) {
          window.keystrokeLogger.logSchemaHover(duration);
        }
        hoverStartTime = null;
      }
    });
  }
}



/**
 * Initializes the game by setting up the database and starting the game
 * @async
 * @function
 */
async function initializeGame() {
  try {
    await initializeDB();
    initializeEventListeners();
    startGame();
  } catch (error) {
    console.error('Error initializing game:', error);
  }
  initAutoComplete();
}

/**
 * Submits user gameplay data to the external API
 * @async
 * @function
 * @param {string} username - The player's username
 * @param {number} queryIndex - Current query index
 * @param {number} queryTime - Time taken for the query
 * @param {number} hintsUsed - Number of hints used
 * @param {string} query - The SQL query submitted
 * @param {boolean} isCorrect - Whether the query was correct
 * @param {number} score - Current score
 * @returns {Promise<void>}
 */
async function submitUserData(username, queryIndex, queryTime, hintsUsed, query, isCorrect, score, features = {}) {
  if (!username || queryTime === undefined || queryIndex === undefined || hintsUsed === undefined) {
    return;
  }

  const personalizedSettings = getPersonalizedSettings();

  const payload = { username, queryIndex, queryTime, hintsUsed, query, isCorrect, score, personalizedSettings, features};
  try {
    const response = await fetch(`${EXTERNAL_API}/users/submitUserData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json(); // Capture the response body
      throw new Error(`Error ${response.status}: ${errorData.error || 'Unknown error'}`);
    }
    const data = await response.json();
  } catch (error) {

    Swal.fire({
      title: 'Error',
      text: 'There was a problem submitting your data. Please try again.',
      icon: 'error',
      background: '#000',
      color: '#fff',
    })
  }
}

/**
 * Handles form submission for SQL queries
 * @async
 * @function
 * @param {Event} event - The form submission event
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  const x = document.forms['query-input']['query-input-box'].value;
  const query = DOM.textarea.value;
  
  if (!validateForm()) {
    displayMessage('Empty Query Provided', true);
  } else if (!isValidSQLQuery(query)) {
    displayMessage('Invalid SQL Query Syntax: ' + query, true);
  } else {
    analyzeQuery(query);
  }

  // Scroll to bottom once at the end
  scrollToBottom();

  // add push to database over here
  try {
      const events = window.keystrokeLogger ? window.keystrokeLogger.getEvents() : [];
      const calculator = new FeatureCalculator(events, window.keystrokeLogger?.questionStartTime, GameState.currentQueryIndex, tabHiddenTime);
      const features = calculator.calculateFeatures();
      console.log('=== Calculated features ===', features);
      await submitUserData(localStorage.getItem('user'), GameState.currentQueryIndex, timeElapsed(), GameState.hintsUsed, x, GameState.flag, GameState.score, features);
    } catch (error) {
      console.error('Error submitting user data:', error);
    }
}

/**
 * Analyzes the query and updates the UI
 * @async
 * @function
 * @param {string} query - The query to analyze
 * @param {number} index - The index of the query
 * @param {boolean} manually - Whether the query is being analyzed manually
 */
async function analyzeQuery(query, index = GameState.currentQueryIndex, manually = true) {
  
  //Update the UI
  displayMessage(query);
  // Execute query and update UI
  executeQuery(query, index);

  //If the system runs this function manually, then we need to add the query to the history and get the story
  if (manually) {
    GameState.queryHistory.push(query);
    getStory(true, query);
  }
}


/**
 * Validates that the form input is not empty
 * @function
 * @returns {boolean} Whether the form is valid
 */
function validateForm() {
  const x = document.forms['query-input']['query-input-box'].value;
  if (x === '') {
    return false;
  }
  return true;
}

/**
 * Validates if the provided string is a valid SQL query
 * @function
 * @param {string} query - The SQL query to validate
 * @returns {boolean} Whether the query is valid
 */
function isValidSQLQuery(query) {
  // Implement your validation logic here
  return true; // Placeholder return, actual implementation needed
}

function scrollToBottom() {
  DOM.displayText.scrollTop = DOM.displayText.scrollHeight;
}

/**
 * Displays query results in a table format
 * @function
 * @param {Object} result - The query result object
 */
function displayResults(result) {
  const queryWrapper = document.createElement('div');
  DOM.displayText.appendChild(queryWrapper);
  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.width = '100%';
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  let headers = null;
  result.values.forEach((row, rowIndex) => {
    if (!headers) {
      headers = result.columns;
      const headerRow = document.createElement('tr');
      headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        th.style.border = '1px solid';
        th.style.padding = '8px';
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
    }
    const dataRow = document.createElement('tr');
    headers.forEach(header => {
      const td = document.createElement('td');
      td.textContent = result.values[rowIndex][headers.indexOf(header)];
      td.style.border = '1px solid';
      td.style.padding = '8px';
      dataRow.appendChild(td);
    });
    tbody.appendChild(dataRow);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  queryWrapper.appendChild(table);

  const rowCount = document.createElement('p');
  rowCount.textContent = `${result.values.length} row(s) returned`;
  rowCount.style.color = '#00ff00';
  rowCount.style.fontSize = '0.85em';
  rowCount.style.marginTop = '4px';
  queryWrapper.appendChild(rowCount);
}

/**
 * Displays a message in the display text
 * @function
 * @param {string} message - The message to display
 * @param {boolean} isError - Whether the message is an error
 */
function displayMessage(message, isError = false) {

  const queryWrapper = document.createElement('div');
  const p = document.createElement('p');
  p.textContent = message;

  // If the message is an error, set the color to red
  if (isError) p.style.color = 'red';
  
  queryWrapper.appendChild(p);
  DOM.displayText.appendChild(queryWrapper);
  scrollToBottom();
}

/**
 * Displays the repair row
 * @function
 */
function displayRepairRow() {
  document.getElementById('repair-row').style.display =  GameState.currentQueryIndex > 9 ? 'table-row' : 'none';
}

/**
 * Updates the timer display
 * @function
 */
function updateTimer() {
  const now = Date.now();
  const timeElapsed = Math.round((now - GameState.startTime) / 1000);
  document.getElementById('timer').textContent = 'Time: ' + timeElapsed + 's';
}

/**
 * Toggles the sound modal
 * @function
 */
function toggleSound() {
  const modal = document.getElementById('sound-modal');
  modal.style.display == 'block' ? modal.style.display = 'none' : modal.style.display = 'block';
}

/**
 * Loads the SQL commands
 * @function
 * @param {boolean} allKeys - Whether to load all keys
 */
function LoadSqlCommands(allKeys = false) {
  
  const currentGroup = allKeys ? null : GameData.queryAnswers[GameState.currentQueryIndex];
  const source = extractSqlKeywords(currentGroup);
  DOM.sqlCommands.innerHTML = '';
  DOM.sqlExplanation.innerHTML = '';
  for (const command of source) {
    const li = document.createElement('li');
    li.textContent = command.toUpperCase();
    DOM.sqlCommands.appendChild(li);
  }
  toggleSql();
}

/**
 * Extracts the SQL keywords from the query
 * @function
 * @param {string} query - The query to extract the keywords from
 * @returns {Array<string>} The extracted keywords
 */
function extractSqlKeywords(query = null) {

  const sqlCommands = Object.keys(SQL_COMMANDS_HTML);
  const extractedKeywords = query ? sqlCommands.filter(keyword => query.toUpperCase().includes(keyword.toUpperCase()+' ')) : sqlCommands;
  return extractedKeywords;
}

/**
 * Toggles the SQL modal
 * @function
 */
function toggleSql() {
  const modal = document.getElementById('sql-modal');
  modal.style.display == 'block' ? modal.style.display = 'none' : modal.style.display = 'block';
}

/**
 * Sets the sound off
 * @function
 */
function setSoundOff() {
  GameState.soundEnabled = false;
  const modal = document.getElementById('sound-modal');
  localStorage.setItem('sound-enabled', 'false');
  modal.style.display = 'none';
  document.getElementById('sound-on-button').classList.remove('sound-button-on');
  document.getElementById('sound-off-button').classList.add('sound-button-on');
}

/**
 * Sets the sound on
 * @function
 */
function setSoundOn() {
  GameState.soundEnabled = true;
  const modal = document.getElementById('sound-modal');
  localStorage.setItem('sound-enabled', 'true');
  modal.style.display = 'none';
  document.getElementById('sound-on-button').classList.add('sound-button-on');
  document.getElementById('sound-off-button').classList.remove('sound-button-on');
}

/**
 * Updates the progress bar display
 * @function
 * @param {number} change - The amount to increase progress by
 */
function updateProgressBar(change) {
  GameState.progress = Math.min(GameState.progress + change, 100);
  DOM.progressBar.style.width = GameState.progress + '%';
  DOM.progressText.innerText = GameState.progress + '%';
  displayRepairRow();
  updateHintCounter();
}

/**
 * Gets a hint for the current query
 * @function
 * @returns {Array<string>|undefined} Array of hints if available
 */
function getHint() {
  const hintIndex = GameState.currentQueryIndex;
  const hintArray = GameData.hints[hintIndex];
  GameState.hintsUsed++; 
  if (GameState.hintCounter === 0) queryHelpLevel = Math.max(queryHelpLevel, 1);
  else if (GameState.hintCounter === 1) queryHelpLevel = Math.max(queryHelpLevel, 2);
  else if (GameState.hintCounter === 2) queryHelpLevel = Math.max(queryHelpLevel, 3);

  if (GameState.hintCounter < hintArray.length) {
    updateScore(-GAME_CONFIG.hintPoints[GameState.hintCounter]);
  }
  updateHintCounter(1);
  return hintArray;
}

/**
 * Inline hints in Triny message box
 */
function updateInlineHintButton() {
  const btn = document.getElementById('inline-hint-button');
  const hintArray = GameData.hints[GameState.currentQueryIndex];

  if (GameState.hintCounter >= hintArray.length) {
    btn.textContent = '';
    return;
  }
  const cost = GAME_CONFIG.hintPoints[GameState.hintCounter] ?? 80;
  btn.style.display = 'inline';
  btn.innerHTML = `Hint ${GameState.hintCounter + 1} <span style="color: #ff4444; font-weight: bold;">(-${cost} pts)</span>`;
  btn.style.border = '';
  btn.style.padding = '';
  btn.style.borderRadius = '';
}

/**
 * Gets help from the White Rabbit
 * @function
 */
function getHelp() {
  Swal.fire({
    imageUrl: ImagesLoader["tutorial"],
    imageWidth: "100%",
    imageHeight: "100%",
    background: '#000',
    height: '80%',  
    width: '80%',
    color: '#fff',
  });
}

/**
 * Handles the yes button click
 * @function
 */
function yesButtonHandler() {
  const hintIndex = GameState.currentQueryIndex;
  const hintArray = GameData.hints[hintIndex];
  if (GameState.hintCounter < hintArray.length) {
    Swal.fire({
      title: 'Would you like to hire White Rabbit?',
      ...GAME_CONFIG.whiteRabbitConfig,
      html: `Hint : For hint # ${GameState.hintCounter + 1} for this problem, it's going to cost you ${GAME_CONFIG.hintPoints[GameState.hintCounter]} points. Click "Yes" to use it or "No" to cancel`,
    }).then((result) => {
      if (result.isConfirmed) {
        const hint_array = getHint();

        const formatted_hint = 'Hey ' + getAgentName() + ':<br><br>' + hint_array.slice(0, GameState.hintCounter).map((hint, index) => {
          if (GameState.hintCounter-1 === index) {
            return `<span style="color: white;">${index + 1}. ${hint}</span>`
          } else {
            return `<span style="color: gray;">${index + 1}. ${hint}</span>`
          }
        }).join('<hr>')

        Swal.fire({
          title: '', 
          html: formatted_hint,
          ...GAME_CONFIG.whiteRabbitConfig,
          showCancelButton: false,
          confirmButtonText: "Got It",
        })
      }
    })
  } else if (GameState.hintCounter === hintArray.length) {
    updateHintCounter(1);
    Swal.fire({
      title: 'White Rabit Wants To Help',
      text: 'I have infiltrated the database and found the answer to your question. Im sending it to you now.',
      ...GAME_CONFIG.whiteRabbitConfig,
      timer: 10000,
      timerProgressBar: true,
      showCancelButton: false,
      confirmButtonText: "Got It",
  toast: true,
    }).then(() => {
      DOM.textarea.value = GameData.queryAnswers[GameState.currentQueryIndex];
    })
  }
}

/**
 * Handles the no button click
 * @function
 */
function noButtonHandler() {
  const modal = document.getElementById('hint-modal');
  modal.style.display = 'none';
}

/**
 * Handles the okay button click
 * @function
 */
function okayButtonHandler() {
  const modal = document.getElementById('hint-modal');
  modal.style.display = 'none';
}

/**
 * Handles the click event on the hint modal
 * @function
 */
window.onclick = function (event) {
  const modal = document.getElementById('hint-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}

/**
 * Handles the SQL button click
 * @function
 */
function sqlButtonHandler() {
  const modal = document.getElementById('sql-modal');
  modal.style.display = 'block';
}

/**
 * Clears the query
 * @function
 */
function clearQuery() {
  DOM.textarea.value = '';
  DOM.clearButton.style.display = 'none';
}

/**
 * Gets the agent name
 * @function
 * @returns {string} The agent name
 */
function getAgentName() {
  const agentName = localStorage.getItem('user');
  if (agentName) {
    return agentName.charAt(0).toUpperCase() + agentName.slice(1);
  }
  return 'Phoenix';
}

/**
 * Starts the game
 * @function
 */
function startGame() {
  const savedStartTime = localStorage.getItem('startTime');
  const savedProgress = parseInt(localStorage.getItem('totalQueriesSolved') ?? 0);
  GameState.startTime = (savedStartTime && savedProgress > 0) ? parseInt(savedStartTime) : Date.now();
  localStorage.setItem('startTime', GameState.startTime);
  let score = localStorage.getItem('score');
  let agentName = getAgentName();
  DOM.agentNameDisplay.textContent = agentName;

  score = score ? parseInt(score, 10) : 100;
  if (score > 100) score = 100;

  GameState.correctQueriesSolved = parseInt(localStorage.getItem('totalQueriesSolved') ?? 0, 10);
  GameState.score = score;
  if (GameState.correctQueriesSolved > 0) {
  } else {
    GameState.correctQueriesSolved = 0;
    GameState.correctQueriesSolved = parseInt(GameState.correctQueriesSolved, 10);
  }
  DOM.scoreText.textContent = 'Score: ' + score;
  DOM.correctQueries.textContent = 'Q: ' + (GameState.correctQueriesSolved) + ' / 12';
  GameState.currentQueryIndex = GameState.correctQueriesSolved ?? 0;
  const nextQueryIndex = GameState.currentQueryIndex ?? 0;
  const nextQuery = GameData.queries[nextQueryIndex];
  appendStoryline(nextQuery);
  if (window.keystrokeLogger) window.keystrokeLogger.recordQuestionStart();
  attemptCount = 0;
  tabHiddenTime = 0;
  tabHiddenStart = null;
  queryHelpLevel = 0; 
  GameState.progress = 10;
  setInterval(updateTimer, 1000);
  // pollSFI
  setInterval(pollSFI, 2000);

  updateScore(0);
  initializeDB();
  updateProgressBar(GameState.correctQueriesSolved * 8);
  updateUivalues();
  updateInlineHintButton();
}

/**
 * Restarts the game
 * @function
 */
function restartGame() {
  GameState.queryHistory = [];
  DOM.displayText.innerHTML = '';
  GameState.startTime = Date.now();
  localStorage.setItem('startTime', GameState.startTime);
  GameState.score = GAME_CONFIG.initialScore;
  GameState.progress = GAME_CONFIG.initialProgress;
  GameState.correctQueriesSolved = 0;
  appendStoryline(GameData.queries[0]);
  if (window.keystrokeLogger) window.keystrokeLogger.recordQuestionStart();
  attemptCount = 0;
  tabHiddenTime = 0;
  tabHiddenStart = null;
  queryHelpLevel = 0; 
  GameState.currentQueryIndex = 0;
  DOM.hintContainer.textContent = GameData.hints[0][0];

  setGameConfiguration(0, 100);
  updateTimer();
  updateScore(0);
  updateProgressBar(0);
  initializeDB();
}

/**
 * Ends the game
 * @function
 */
function endGame() {
  localStorage.clear();
  window.location.href = "login.html";
}

/**
 * Provides feedback
 * @function
 */
function provideFeedback() {

  window.open(FEEDBACK_FORM_URL, '_blank');
}

function getAdaptiveFeedback(query, queryIndex) {
  const q = query.toUpperCase().trim();

  const rules = [
    // Q1
    [
      { check: () => q === '' || q.length < 3, msg: 'Start with the basic query pattern: <strong>SELECT ... FROM ....</strong>' },
      { check: () => q.startsWith('SELECT') && !q.includes('FROM'), msg: 'You\'ve started correctly. Now specify what to return after SELECT, such as <strong>*</strong> for all columns.' },
      { check: () => q.includes('FROM') && !q.includes('INCIDENT'), msg: 'Check the table name. For this task, use <strong>Incident</strong>.' },
      { check: () => !q.startsWith('SELECT'), msg: 'SQL queries must follow the structure <strong>SELECT ... FROM ....</strong>' },
    ],
    // Q2
    [
      { check: () => q === '' || q.length < 3, msg: 'Start with the basic query pattern: <strong>SELECT ... FROM Incident</strong>, then think about ordering by time.' },
      { check: () => q.includes('SELECT') && q.includes('FROM') && !q.includes('ORDER'), msg: 'You are retrieving all incidents, but not selecting the latest one. Think about ordering by time.' },
      { check: () => q.includes('ORDER') && !q.includes('DESC'), msg: 'Ascending order shows the oldest first. Use <strong>DESC</strong> to get the most recent record.' },
      { check: () => q.includes('ORDER') && q.includes('DESC') && !q.includes('LIMIT'), msg: 'You sorted correctly. Now return only one row using <strong>LIMIT 1</strong>.' },
    ],
    // Q3
    [
      { check: () => q === '' || q.length < 3, msg: 'Start by selecting from the <strong>Robot</strong> table, then think about joining it with <strong>Incident</strong>.' },
      { check: () => !q.includes('JOIN'), msg: 'You need to combine <strong>Robot</strong> and <strong>Incident</strong> to count incidents per model.' },
      { check: () => q.includes('INNER JOIN') && !q.includes('LEFT'), msg: '<strong>INNER JOIN</strong> excludes robots with no incidents. Use <strong>LEFT JOIN</strong> to include all models.' },
      { check: () => q.includes('JOIN') && !q.includes('GROUP'), msg: 'You need to group by <strong>Model</strong> to get counts per robot.' },
      { check: () => q.includes('GROUP') && !q.includes('COUNT'), msg: 'Use <strong>COUNT()</strong> to calculate the number of incidents for each model.' },
      { check: () => q.includes('JOIN') && !q.includes('R.ROBOTID') && !q.includes('ROBOTID'), msg: 'Check the join condition. Match <strong>r.robotID</strong> with <strong>i.robotID</strong>.' },
    ],
    // Q4
    [
      { check: () => q === '' || q.length < 3, msg: 'Start with <strong>SELECT COUNT(...) FROM Robot</strong>, then think about filtering by date.' },
      { check: () => q.includes('COUNT') && !q.includes('WHERE'), msg: 'You need to filter robots updated in the past week using <strong>lastUpdateOn</strong>.' },
      { check: () => q.includes('WHERE') && (!q.includes('2023-07-17') || !q.includes('2023-07-24')), msg: 'Use dates from <strong>2023-07-17</strong> to <strong>2023-07-24</strong> to represent the past 7 days.' },
      { check: () => q.includes('COUNT(*)') && !q.includes('DISTINCT'), msg: 'A robot may appear multiple times. Use <strong>DISTINCT</strong> to count each robot once.' },
      { check: () => !q.includes('LASTUPDATEON'), msg: 'Use the <strong>lastUpdateOn</strong> column to filter recent updates.' },
    ],
    // Q5
    [
      { check: () => q === '' || q.length < 3, msg: 'Start from the <strong>Employee</strong> table, then think about how to filter employees based on robot updates.' },
      { check: () => !q.includes('IN') && !q.includes('JOIN'), msg: 'You need a way to identify which employees updated robots. Consider using a subquery with <strong>IN</strong>.' },
      { check: () => q.includes('IN') && !q.includes('LASTUPDATEDBYEMPID'), msg: 'Use <strong>lastUpdatedByEmpID</strong> to identify which employee made the update.' },
      { check: () => q.includes('WHERE') && (!q.includes('2023-07-17') || !q.includes('2023-07-24')), msg: 'Filter robot updates between <strong>2023-07-17</strong> and <strong>2023-07-24</strong>.' },
      { check: () => !q.includes('DISTINCT'), msg: 'An employee may appear multiple times. Use <strong>DISTINCT</strong> to return unique employees.' },
    ],
    // Q6
    [
      { check: () => q === '' || q.length < 3, msg: 'Start with an <strong>UPDATE</strong> statement to modify robot status, then retrieve results using <strong>SELECT</strong>.' },
      { check: () => !q.includes('UPDATE'), msg: 'You need to update the status of robots before retrieving them.' },
      { check: () => q.includes('UPDATE') && !q.includes('WHERE'), msg: 'Be careful. Without <strong>WHERE</strong>, all robots will be updated. Filter by <strong>lastUpdateOn</strong>.' },
      { check: () => q.includes('WHERE') && (!q.includes('2023-07-17') || !q.includes('2023-07-24')), msg: 'Use dates from <strong>2023-07-17</strong> to <strong>2023-07-24</strong> to represent the past 7 days.' },
      { check: () => q.includes('UPDATE') && !q.includes("'UNDER REPAIR'") && !q.includes('"UNDER REPAIR"'), msg: 'Set <strong>status = \'Under Repair\'</strong> to mark the robots correctly.' },
      { check: () => q.includes('UPDATE') && !q.includes('SELECT'), msg: 'You updated the data, but also need to retrieve it. Add <strong>SELECT * FROM Robot;</strong> after the update.' },
    ],
    // Q7
    [
      { check: () => q === '' || q.length < 3, msg: 'Start by grouping robot updates by employee, then count how many updates each made.' },
      { check: () => !q.includes('GROUP'), msg: 'You need to group updates by <strong>lastUpdatedByEmpID</strong> to count per employee.' },
      { check: () => q.includes('GROUP') && !q.includes('COUNT'), msg: 'Use <strong>COUNT(*)</strong> to calculate how many updates each employee made.' },
      { check: () => q.includes('COUNT') && !q.includes('ORDER'), msg: 'You have counts, but need to sort them to find the highest one.' },
      { check: () => q.includes('ORDER') && !q.includes('DESC'), msg: 'Ascending order shows the smallest counts first. Use <strong>DESC</strong> for highest.' },
      { check: () => q.includes('ORDER') && q.includes('DESC') && !q.includes('LIMIT'), msg: 'You sorted correctly. Now return only one row using <strong>LIMIT 1</strong>.' },
    ],
    // Q8
    [
      { check: () => q === '' || q.length < 3, msg: 'Start by joining <strong>Robot</strong>, <strong>Incident</strong>, and <strong>Employee</strong>, then place the query inside a <strong>CREATE VIEW</strong> statement.' },
      { check: () => !q.includes('CREATE VIEW'), msg: 'You need to create a view named <strong>RobotIncidentView</strong> using <strong>CREATE VIEW</strong>.' },
      { check: () => q.includes('CREATE VIEW') && !q.includes('INCIDENT'), msg: 'This query requires all three tables: <strong>Robot</strong>, <strong>Incident</strong>, and <strong>Employee</strong>.' },
      { check: () => q.includes('JOIN') && !q.includes('R.ROBOTID') && !q.includes('I.ROBOTID'), msg: 'Join using <strong>r.robotID = i.robotID</strong>.' },
      { check: () => q.includes('JOIN') && !q.includes('LASTUPDATEDBYEMPID') && !q.includes('E.EMPLOYEEID'), msg: 'Join using <strong>r.lastUpdatedByEmpID = e.employeeID</strong>.' },
      { check: () => q.includes('CREATE VIEW') && !q.includes('SELECT * FROM ROBOTINCIDENTVIEW'), msg: 'Run <strong>SELECT * FROM RobotIncidentView;</strong> to display the results.' },
    ],
    // Q9
    [
      { check: () => q === '' || q.length < 3, msg: 'Start by identifying robots with more than 2 incidents, then retrieve their models.' },
      { check: () => !q.includes('IN') && !q.includes('JOIN'), msg: 'You need a subquery to count incidents per robot.' },
      { check: () => q.includes('FROM INCIDENT') && !q.includes('GROUP'), msg: 'Group incidents by <strong>robotID</strong> to count how many each robot has.' },
      { check: () => q.includes('GROUP') && !q.includes('HAVING'), msg: 'Use <strong>HAVING COUNT(*) > 2</strong> to filter robots with more than 2 incidents.' },
      { check: () => q.includes('WHERE') && !q.includes('HAVING') && q.includes('COUNT'), msg: '<strong>WHERE</strong> cannot filter aggregated results. Use <strong>HAVING</strong> with <strong>COUNT()</strong>.' },
    ],
    // Q10
    [
      { check: () => q === '' || q.length < 3, msg: 'Start with <strong>CREATE TABLE Repair</strong>, then define each column with its data type.' },
      { check: () => !q.includes('CREATE TABLE'), msg: 'Use <strong>CREATE TABLE Repair (...)</strong> to define the table.' },
      { check: () => q.includes('CREATE TABLE') && (!q.includes('(') || !q.includes(')')), msg: 'Column definitions must be enclosed in parentheses after the table name.' },
      { check: () => q.includes('CREATE TABLE') && (!q.includes('REPAIRID') || !q.includes('REPAIRSTATUS') || !q.includes('ROBOTID') || !q.includes('REPAIREDBYID')), msg: 'Include all required columns: <strong>repairID, repairStatus, desc, robotID, repairedById</strong>.' },
      { check: () => q.includes('ALREADY EXISTS') || (q.includes('CREATE TABLE') && q.includes('REPAIR') && q.includes('ERROR')), msg: 'If the table exists, run <strong>DROP TABLE Repair;</strong> before creating it again.' },
    ],
    // Q11
    [
      { check: () => q === '' || q.length < 3, msg: 'Start with <strong>INSERT INTO Repair</strong>, then specify columns and values.' },
      { check: () => !q.includes('INSERT'), msg: 'Use <strong>INSERT INTO Repair (...) VALUES (...)</strong> to add a new record.' },
      { check: () => q.includes('INSERT') && !q.includes('REPAIRID'), msg: 'Specify the columns: <strong>repairID, repairStatus, desc, robotID, repairedById</strong>.' },
      { check: () => q.includes('INSERT') && !q.includes('VALUES'), msg: 'Use <strong>VALUES</strong> to insert the provided data.' },
      { check: () => q.includes('INSERT') && !q.includes('SELECT'), msg: 'You need to also retrieve the table after inserting. Add <strong>SELECT * FROM Repair;</strong>' },
    ],
    // Q12
    [
      { check: () => q === '' || q.length < 3, msg: 'Start by finding the latest update per robot, then connect it to employee and robot details.' },
      { check: () => !q.includes('MAX') && !q.includes('SUBQUERY'), msg: 'Use a subquery to identify the most recent update using <strong>MAX(timeStamp)</strong>.' },
      { check: () => q.includes('MAX') && !q.includes('GROUP'), msg: 'Group by <strong>robotID</strong> to get the latest update per robot.' },
      { check: () => q.includes('FROM') && !q.includes('EMPLOYEE'), msg: 'Join with <strong>Employee</strong> to retrieve first and last names.' },
      { check: () => q.includes('JOIN') && !q.includes('ROBOT R'), msg: 'Join with <strong>Robot</strong> to filter by status.' },
      { check: () => !q.includes("'UNDER REPAIR'"), msg: 'Use <strong>r.status = \'Under Repair\'</strong>.' },
      { check: () => q.includes('WHERE') && !q.includes('ORDER'), msg: 'Sort by <strong>lastUpdate</strong> in descending order to get the most recent update.' },
      { check: () => q.includes('ORDER') && !q.includes('LIMIT'), msg: 'Use <strong>LIMIT 1</strong> to return only the most recent record.' },
    ],
  ];

  const queryRules = rules[queryIndex];
  if (!queryRules) return null;

  for (const rule of queryRules) {
    if (rule.check()) return rule.msg;
  }
  return null;
}

/**
 * Updates the game story based on query results
 * @function
 * @param {boolean} increaseScore - Whether to increase the score
 * @param {string} query - The executed query
 */
function getStory(increaseScore = true, query = '') {
  const nextQueryIndex = GameState.currentQueryIndex + 1;

  if (GameState.flag === true && nextQueryIndex <= GameData.queries.length) {
    if (nextQueryIndex === GameData.queries.length) {
      generateSwalRestart({
        swal: {
          title: 'Congratulations!',
          text: 'You have saved RoboTech and the world. Would you like to try again?',
          icon: 'success',
        }
      })
    } else {
      const nextQuery = GameData.queries[nextQueryIndex];
      appendStoryline(nextQuery);
      if (window.keystrokeLogger) window.keystrokeLogger.recordQuestionStart();
      attemptCount = 0;
      tabHiddenTime = 0;
      tabHiddenStart = null;
      DOM.hintCounter = 0;
      GameState.currentQueryIndex = nextQueryIndex;
      if (increaseScore) {
        GameState.correctQueriesSolved++;
        const rewardMap = [80, 70, 60, 50, 30];
        const reward = rewardMap[queryHelpLevel] ?? 80;
        queryHelpLevel = 0;
        tabHiddenTime = 0;
        tabHiddenStart = null;
        attemptCount = 0;
        updateScore(reward);
        Swal.fire({
          title: '',
          imageUrl: ImagesLoader["trini"],
          imageWidth: 50,
          imageHeight: 50,
          text: `You have earned ${reward} points!`,
          icon: 'success',
          background: '#000',
          color: '#fff',
          toast: true,  
          position: 'center',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          setGameConfiguration(GameState.correctQueriesSolved, GameState.score);
          updateInlineHintButton();
          updateUivalues();
        });
      }
      updateProgressBar(8);
    }
  } else {
    const currentQuery = GameData.queries[GameState.currentQueryIndex];
    
    
      const feedback = getAdaptiveFeedback(query, GameState.currentQueryIndex);
      appendStoryline(feedback || 'Oops! Please try again.');
      if (query !== lastSubmittedQuery) {
        updateScore(-10);
        /* Use the same stylesheet for points deduction */
        /*
        Swal.fire({
          title: '-10 Points',
          text: 'Incorrect query. Each unique incorrect submission deducts 10 points.',
          icon: 'warning',
          background: '#000',
          color: '#ff0000',
          toast: true,
          position: 'top',
          showConfirmButton: false,
          timer: 3000,
        });
        */
        Swal.fire({
          title: '',
          imageUrl: ImagesLoader["trini"],
          imageWidth: 50,
          imageHeight: 50,
          text: 'Incorrect query. -10 points deducted!',
          icon: 'error',
          background: '#000',
          color: '#fff',
          toast: true,
          position: 'center',
          showConfirmButton: false,
          timer: 2000,
        });
        attemptCount++;
      }
      lastSubmittedQuery = query;

      if (attemptCount >= 5) {
        Swal.fire({
        title: 'Need help?',
        text: "You've tried 5 times. Would you like some help?",
        icon: 'question',
        background: '#000',
        color: '#fff',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Show Final SQL & move on (-70 pts)',
        denyButtonText: 'Show Sample Output (-30 pts)',
        cancelButtonText: 'Keep trying',
      }).then((result) => {
        if (result.isConfirmed) {
          updateScore(-70);
          queryHelpLevel = 4;
          appendStoryline('The correct answer: ' + GameData.queryAnswers[GameState.currentQueryIndex]);
          attemptCount = 0;
          setTimeout(() => getStory(false), 3000);
        } else if (result.isDenied) {
          updateScore(-30);
          queryHelpLevel = Math.max(queryHelpLevel, 2);
          appendStoryline('Sample output has been deducted from your score.');
          attemptCount = 0;
        }
      });
    }
  }
}

/**
 * Calculates the time elapsed
 * @function
 * @returns {number} The time elapsed
 */
function timeElapsed() {
  const now = Date.now();
  const timeElapsed = Math.round((now - GameState.startTime) / 1000);
  document.getElementById('timer').textContent = 'Time: ' + timeElapsed + 's';
  return timeElapsed;
}

/**
 * Updates the score
 * @function
 * @param {number} change - The amount to change the score by
 */
function updateScore(change) {
  GameState.score = Math.max(0, GameState.score + change);
  DOM.scoreText.textContent = 'Score: ' + GameState.score;
  DOM.correctQueries.textContent = 'Q: ' + (GameState.correctQueriesSolved + 1) + ' / 12';
  if (change > 0 && GameState.soundEnabled) {
    const correctSound = document.getElementById('correct-sound');
    correctSound.currentTime = 0;
    correctSound.play();
  }

  if (change < 0 && GameState.soundEnabled) {
    const incorrectSound = document.getElementById('incorrect-sound');
    incorrectSound.currentTime = 0;
    incorrectSound.play();
  }

  
  if (GameState.score <= 0) {
    gameOver();
  }
}

/**
 * Updates the hint counter
 * @function
 * @param {number} change - The amount to increase hint counter by
 */
function updateHintCounter(change = 0) {
  GameState.hintCounter = change === 0 ? 0 : GameState.hintCounter + change;
  const hintArray = GameData.hints[GameState.currentQueryIndex];
  const difference = Math.max(hintArray.length - GameState.hintCounter + 1, 0);

  DOM.numberCluesLeft.textContent = difference;
  DOM.hintText.textContent = difference === 1 ? 'Hint' : 'Hints';
  updateInlineHintButton();
}

/**
 * Displays the game over message
 * @function
 */
function gameOver() {
  generateSwalRestart({ swal: {
    title: 'Mission Failed',
    html: '<h1>RoboTech has fallen. The system has been compromised.</h1><br><p>The enemy now controls the robots. You were our last hope.</p><p>Do you want to launch a counterattack and try again?</p>',
    icon: 'error',
    cancelButtonText: 'Accept Defeat',
  }})
}

/**
 * Asks for a restart
 * @function
 */ 
function askForRestart() {
  generateSwalRestart({actions: {cancel: () => null}} );
}

/**
 * Generates a Swal restart dialog
 * @function
 * @param {Object} config - The configuration object for the Swal dialog
 * @returns {Promise} A promise that resolves when the dialog is confirmed or dismissed
 */
function generateSwalRestart(config = {}) {

  const actions = {
    confirm: () => restartGame(),
    cancel: () => endGame(),
    deny: () => provideFeedback(),
    ...config.actions,
  }
  
  Swal.fire({
    title: 'Would you like to restart?',
    icon: 'warning',
    confirmButtonText: 'Reebot Mission',
    showCancelButton: true,
    cancelButtonText: 'No',
    showDenyButton: true,
    denyButtonText: 'Provide Feedback',
    color: '#fff',
    background: '#26242470',
    backdrop: `
      rgba(0,0,123,0.4)
      url("images/hacker.png")
      no-repeat
      center center
  `,
    ...config.swal,
  }).then((result) => {

    if (result.isConfirmed) {
      actions.confirm();
    } else if (result.isDismissed && result.dismiss === 'cancel') {
      actions.cancel();
    } else if (result.isDenied ) {
      actions.deny();
    } else {
      generateSwalRestart(config);
    }
    
  });
}


/**
 * Validates the query result against the answer key
 * @function
 * @param {Array} resultValues - The values returned from the query
 * @param {number} queryIndex - The index of the current query
 * @returns {boolean} Whether the result matches the answer key
 */
function validateResult(resultValues, queryIndex) {
  const answerKey = GameData.answerKeys[queryIndex];

  if (!answerKey || resultValues.length !== answerKey.length) {
    return false;
  }

  // Sort both arrays for consistent comparison
  resultValues.sort((a, b) => a.join() < b.join() ? -1 : 1);
  answerKey.sort((a, b) => a.join() < b.join() ? -1 : 1);

  for (let i = 0; i < resultValues.length; i++) {
    for (let j = 0; j < resultValues[i].length; j++) {
      const expectedValue = answerKey[i][j];
      const actualValue = resultValues[i][j];
      const parsedExpectedValue = isNaN(expectedValue) ? expectedValue : parseFloat(expectedValue);
      const parsedActualValue = isNaN(actualValue) ? actualValue : parseFloat(actualValue);

      if (parsedActualValue !== parsedExpectedValue) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Initializes the SQLite database
 * @async
 * @function
 */
async function initializeDB(recursion = 0) {

  try {
    const SQL = await initSqlJs();
    const buffer = await fetch('database/main.db');
    const db = new SQL.Database(new Uint8Array(await buffer.arrayBuffer()));

    //Assign the database to the GameState object
    GameState.db = db;
    // Execute all previous queries to set up database state
    GameData.queryAnswers.slice(0, GameState.currentQueryIndex).forEach((query, idx) => analyzeQuery(query, idx, false));

  } catch (error) {
    if (recursion < 3) {
      initializeDB(recursion ++);
    } else {
      console.error('Error initializing database:', error);
    }
  }
}


/**
 * Executes an SQL query and displays the results
 * @function
 * @param {string} query - The SQL query to execute
 */
function executeQuery(query ) {
  try {
    const results = GameState.db.exec(query);

    if (results.length === 0) {
      displayMessage('Command executed successfully.');
      if (GameState.currentQueryIndex === 9) {
        const results2 = GameState.db.exec('SELECT name FROM pragma_table_info(\'Repair\') ORDER BY cid;');
        GameState.flag = validateResult(results2[0].values, GameState.currentQueryIndex);
      } else if (GameState.currentQueryIndex === 10) {
        const results2 = GameState.db.exec('SELECT * FROM Repair;');
        GameState.flag = validateResult(results2[0].values, GameState.currentQueryIndex);
      } else {
        GameState.flag = validateResult('', GameState.currentQueryIndex)
      }
    } else {
      displayResults(results[0]);
      GameState.flag = validateResult(results[0].values, GameState.currentQueryIndex);
    }

    if (GameState.flag) {
      DOM.textarea.value = '';
    }
  } catch (error) {
    displayMessage('ERROR: ' + error.message, true);
    if (window.keystrokeLogger) {
      const errorType = error.message.includes('Syntax') ? 'syntax_error' :
                        error.message.includes('no such table') ? 'schema_error' :
                        'semantic_error';
      window.keystrokeLogger.logError(error.message, errorType);
    }
    GameState.flag = false;
  }
  scrollToBottom();
}




function toggleMenu() {
  const menu = document.querySelector(".button-container-1");
  menu.style.display = menu.style.display === "none" || menu.style.display === "" ? "flex" : "none";
}

function setGameConfiguration(totalQueriesSolved, score) {
  localStorage.setItem("totalQueriesSolved", totalQueriesSolved);
  localStorage.setItem("score", score);
}

/**
 * SFI polling - sends features to DBN every 2 seconds
 */
async function pollSFI() {
  // Z-Score normalization baseline
  let personalBaseline = null; // {mean_ikl, sd_ikl}
  if (!window.keystrokeLogger) return;
  const events = window.keystrokeLogger.getEvents();
  if (events.length === 0) return;
  // Rate limiting
  const now = Date.now();
  if (now - lastScaffoldTime < SCAFFOLD_COOLDOWN) return;

  const calculator = new FeatureCalculator(events, window.keystrokeLogger.questionStartTime, GameState.currentQueryIndex, tabHiddenTime);
  const features = calculator.calculateFeatures();
  updateBaseline(features);

  try {
      const response = await fetch('https://cybernetic-sabotage-sfi.onrender.com/sfi/infer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: localStorage.getItem('user') || 'anonymous',
        username: localStorage.getItem('user') || 'Detective',
        features: features,
        query_index: GameState.currentQueryIndex,
        query_context: GameData.queries[GameState.currentQueryIndex],
        baseline: personalBaseline
      })
    });
    const result = await response.json();
    console.log('SFI result:', result);

    if (result.trigger_scaffold && result.triny_message && GameState.currentQueryIndex !== lastScaffoldQueryIndex) {
      lastScaffoldQueryIndex = GameState.currentQueryIndex;
      triggerTrinyScaffold(result.triny_message, result);
    }
  } catch (error) {
    console.error('SFI polling error:', error);
  }
}

/**
 * Records the student's personal typing baseline during Query 1.
 * This baseline (mean IKL and SD) is used to normalize subsequent
 * queries so the DBN judges each student relative to their own
 * normal typing rhythm, not a fixed threshold.
 * Only runs during Query 1 (the simplest task, assumed Flow state).
 */
function updateBaseline(features) {
  if (GameState.currentQueryIndex !== 0) return;
  if (features.ikl_std_dev === 0) return;
  
  personalBaseline = {
    mean_ikl: features.avg_ikl,
    sd_ikl: features.ikl_std_dev
  };
  console.log('Personal baseline set:', personalBaseline);
}

/**
 * Triggers Triny to show affective scaffolding message
 */
function triggerTrinyScaffold(message, result) {
  // record the scaffold time for rate liming
  lastScaffoldTime = Date.now();
  appendStoryline(message);

  // Log trigger event to MongoDB
  fetch(`${EXTERNAL_API}/sfi/logTrigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: localStorage.getItem('user') || 'anonymous',
      query_index: GameState.currentQueryIndex,
      detected_state: result.dominant_state,
      probabilities: result.probabilities,
      marker_evidence: result.probabilities || {},
      triny_message: message,
    })
  }).catch(err => console.error('Failed to log trigger:', err));
}

function linkSQLKeywords(text) {
  const keywords = Object.keys(SQL_COMMANDS_HTML).sort((a, b) => b.length - a.length);
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
    text = text.replace(regex, `<span style="text-decoration: underline; cursor: pointer; color: #00ff00; font-weight: bold;" onclick="openCheatsheetFor('${keyword}')">${keyword}</span>`);
  });
  return text;
}

function openCheatsheetFor(keyword) {
  LoadSqlCommands();
  setTimeout(() => {
    const explanation = document.getElementById('sql-commands-explanation');
    if (SQL_COMMANDS_HTML[keyword.toUpperCase()]) {
      explanation.innerHTML = SQL_COMMANDS_HTML[keyword.toUpperCase()];
    }
  }, 100);
}

function initAutoComplete() {
  const textarea = document.getElementById('query-textarea');
  
  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.id = 'autocomplete-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    background: #000;
    border: 1px solid #00ff00;
    border-radius: 4px;
    max-height: 150px;
    overflow-y: auto;
    z-index: 1000;
    display: none;
    min-width: 150px;
  `;
  textarea.parentElement.style.position = 'relative';
  textarea.parentElement.appendChild(dropdown);

  textarea.addEventListener('input', () => {
    const value = textarea.value;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastWord = textBeforeCursor.split(/[\s,.()\n]/).pop();

    if (lastWord.length < 2) {
      dropdown.style.display = 'none';
      return;
    }

    const matches = SQL_SUGGESTIONS.filter(s => 
      s.toLowerCase().startsWith(lastWord.toLowerCase()) && 
      s.toLowerCase() !== lastWord.toLowerCase()
    );

    if (matches.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.innerHTML = matches.slice(0, 8).map(m => 
      `<div style="padding: 6px 10px; cursor: pointer; color: #00ff00; font-family: monospace;"
        onmouseover="this.style.background='#1a1a1a'"
        onmouseout="this.style.background=''"
        onclick="insertSuggestion('${m}')">${m}</div>`
    ).join('');
    
    dropdown.style.display = 'block';
  });

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target !== textarea) dropdown.style.display = 'none';
  });
}

function insertSuggestion(suggestion) {
  const textarea = document.getElementById('query-textarea');
  const cursorPos = textarea.selectionStart;
  const value = textarea.value;
  const textBeforeCursor = value.substring(0, cursorPos);
  const lastWordStart = textBeforeCursor.search(/[\w]+$/);
  
  textarea.value = value.substring(0, lastWordStart) + suggestion + value.substring(cursorPos);
  textarea.focus();
  textarea.selectionStart = lastWordStart + suggestion.length;
  textarea.selectionEnd = lastWordStart + suggestion.length;
  
  document.getElementById('autocomplete-dropdown').style.display = 'none';
}

function appendStoryline(text) {
  text = text.replace(/'/g, '&#39;');
  
  const isQueryText = GameData.queries.some(q => q.replace(/'/g, '&#39;') === text);
  
  if (isQueryText) {
    currentQueryText = text;
    DOM.storyline.innerHTML = currentQueryText + '<br><span id="inline-hint-button" onclick="yesButtonHandler()" style="color: #ff4444; text-decoration: underline; cursor: pointer; font-size: 1em; font-weight: bold;"></span>';
  } else if (text.startsWith('Oops')) {
    DOM.storyline.innerHTML = currentQueryText + '<br><span id="inline-hint-button" onclick="yesButtonHandler()" style="color: #ff4444; text-decoration: underline; cursor: pointer; font-size: 1em; font-weight: bold;"></span>';
  } else {
    DOM.storyline.innerHTML = currentQueryText + '<br><span id="inline-hint-button" onclick="yesButtonHandler()" style="color: #ff4444; text-decoration: underline; cursor: pointer; font-size: 1em; font-weight: bold;"></span><hr style="border-color: #00ff00; margin: 8px 0;"><small style="opacity: 0.8;">' + text + '</small>';
  }
  updateInlineHintButton();
}

function setColor(event) {
  const color = event.target.value;
  const id = event.target.id;

  if (id === 'mainColorPicker') {
    document.documentElement.style.setProperty('--main-color', color);
    localStorage.setItem('main-color', color);
  } else if (id === 'constraintColorPicker') {
    document.documentElement.style.setProperty('--constraint-color', color);
    localStorage.setItem('constraint-color', color);
  } else if (id === 'TextColorPicker') {
    document.documentElement.style.setProperty('--text-color', color);
    localStorage.setItem('text-color', color);
  }
  
}

/**
 * Sets the font size
 * @function
 * @param {Event} event - The event object
 */
function setFontSize(event) {
  const fontSize = event.target.value;
  localStorage.setItem('font-size', fontSize + 'px');
  document.documentElement.style.fontSize = fontSize + 'px';
}


/**
 * Updates the UI values
 * @function
 */
function updateUivalues(){
  const fontSize = localStorage.getItem('font-size');
  const mainColor = localStorage.getItem('main-color');
  const constraintColor = localStorage.getItem('constraint-color');
  const textColor = localStorage.getItem('text-color');
  const soundEnabled = localStorage.getItem('sound-enabled');

  if(fontSize) document.getElementById('fontSizeSlider').value = fontSize;
  if(mainColor) document.getElementById('mainColorPicker').value = mainColor;
  if(constraintColor) document.getElementById('constraintColorPicker').value = constraintColor;
  if(textColor) document.getElementById('TextColorPicker').value = textColor;
  if(soundEnabled == 'true') {
    document.getElementById('sound-on-button').classList.add('sound-button-on');
  } else {
    document.getElementById('sound-off-button').classList.add('sound-button-on');
  }
  
  
}
/**
 * Starts the game initialization process
 */
initializeGame();

