
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
  initialScore: 150,
  initialProgress: 10,
  hintPoints: [40, 60, 80],
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

// Rate limiting
let lastScaffoldTime = 0;
const SCAFFOLD_COOLDOWN = 60000;

// Tab focus tracking for RAR calculation
let tabHiddenTime = 0;
let tabHiddenStart = null;

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
  " Detective, your first mission is to retrieve all reported incidents from the 'Incident' database. Let's see what we're dealing with!",
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
  'INSERT INTO Repair ("repairID", "repairStatus", "desc", "robotID", "repairedById" ) VALUES (1, \'Under Repair\', \'This robot model is undergoing repair due to its defaulty patterns\', 5 , 7); SELECT * FROM Repair;', 
  'SELECT e.employeeID, e.firstName, e.lastName, l.lastUpdate, l.robotID FROM Employee e JOIN ( SELECT MAX(timeStamp) AS lastUpdate, robotID, employeeID FROM log WHERE actionDesc = \'Updates\' GROUP BY robotID ) l ON e.employeeID = l.employeeID JOIN Robot r ON l.robotID = r.robotID WHERE r.status = \'Under Repair\';'
  ],
  hints: [
  ['start with the basics. Use the <strong>SELECT</strong> statement to pull data from the <strong>Incident</strong> table.', 'hink like a pro. Structure your query as: SELECT _ FROM [TableName]. You’re almost there!'],
  ['time is key! To find the most recent incident, focus on the <strong>timeStamp</strong>. Try using the <strong>LIMIT</strong> keyword.', 'Sort the <strong>timeStamp</strong> in descending order (<strong>DESC</strong>) to bring the latest case to the top.'],
  ['first, connect the <strong>Robot</strong> and <strong>Incident</strong> tables using a <strong>LEFT JOIN</strong> to ensure all robot models are included.', 'Now, use <strong>GROUP BY Model</strong> to group the robots and count incidents for each one.'],
  ['focus on the <strong>lastUpdateOn</strong> column to track recent updates. Use a condition to filter for the past 7 days.', 'o ensure accuracy, use <strong>DISTINCT</strong> to count unique <strong>robotIDs</strong> updated within the given date range.'],
  ['start by using a subquery to find employee IDs of those who updated robots in the past 7 days.', 'Next, filter the employee records using <strong>IN</strong> to get their full names and unique IDs.'],
  ['start by updating the robots! Use <strong>UPDATE</strong> to set the <strong>status</strong> to <strong>Under Repair</strong> for those updated in the past 7 days.', 'After marking them, retrieve and display all robot details…Just like in your first mission.'],
  ['track down the employee with the most robot updates! Use <strong>COUNT(*)</strong> and <strong>GROUP BY lastUpdatedByEmpID</strong> to count updates per employee.', 'Now, sort the results in descending order with <strong>ORDER BY COUNT(*) DESC</strong> to find the top whistleblower.', 'Use <strong>LIMIT 1</strong> to return only the employee with the highest number of updates.'],
  ['start by linking the <strong>Robot</strong> and <strong>Incident</strong> tables using <strong>JOIN</strong> on their common column to connect incidents with robots.', 'Next, join the <strong>Employee</strong> table to retrieve the first and last names of the employee who last updated each robot. Then, display the view.'],
  ['to track down malfunctioning models, use a subquery to count how many incidents each robot has been involved in.','Now, filter models with more than 2 incidents using the <strong>HAVING</strong> clause to identify the most problematic robots.'],
  ['start by using <strong>CREATE TABLE</strong> to set up the <strong>Repair</strong> table with the required columns.', 'Ensure each column has the correct data type as specified in the mission.', 'If the table already exists, use <strong>DROP TABLE Repair;</strong> before creating it again.'],
  ['use <strong>INSERT INTO</strong> to add a new repair record. Ensure all required columns are correctly filled.', "Use <strong>VALUES</strong> to insert the following data: <strong>(1, 'Under Repair', 'This robot model is undergoing repair due to its faulty patterns', 5, 7)</strong>."],
  ['start by using <strong>JOIN</strong> to link the <strong>Employee</strong> and <strong>Log</strong> tables based on the appropriate columns.', 'To track the last employee who updated faulty robots, use a subquery with <strong>MAX(timeStamp)</strong> to find the most recent update for each robot.', 'Finally, <strong>JOIN</strong> this result with the <strong>Employee</strong> and <strong>Robot</strong> tables to get the details of the last updating employee.']
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
    [1, 'Under Repair', 'This robot model is undergoing repair due to its defaulty patterns', 5, 7]
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
  DOM.helpButton.onclick = getHelp;
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
async function submitUserData(username, queryIndex, queryTime, hintsUsed, query, isCorrect, score) {
  if (!username || queryTime === undefined || queryIndex === undefined || hintsUsed === undefined) {
    return;
  }

  const personalizedSettings = getPersonalizedSettings();

  const payload = { username, queryIndex, queryTime, hintsUsed, query, isCorrect, score,  personalizedSettings};
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
    await submitUserData(localStorage.getItem('user'), GameState.currentQueryIndex, timeElapsed(), GameState.hintsUsed, x, GameState.flag, GameState.score);
  } catch (error) {
    console.error('Error submitting user data:', error);
  }

  if (window.keystrokeLogger) {
  const events = window.keystrokeLogger.getEvents();
  const calculator = new FeatureCalculator(events, window.keystrokeLogger.questionStartTime, GameState.currentQueryIndex, tabHiddenTime);
  const features = calculator.calculateFeatures();
  console.log('=== Calculated features ===', features);
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
  btn.textContent = `Hint ${GameState.hintCounter + 1} (-${cost} pts)`;
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
  GameState.startTime = Date.now();
  let score = localStorage.getItem('score');
  let agentName = getAgentName();
  DOM.agentNameDisplay.textContent = agentName;

  if (score > 150) {
    score = parseInt(score, 10);
  } else {
    score = 150;
      score = parseInt(score, 10); // Convert score back to a number if it's stored as a string
  }

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
  tabHiddenTime = 0;
  tabHiddenStart = null;
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
  GameState.score = GAME_CONFIG.initialScore;
  GameState.progress = GAME_CONFIG.initialProgress;
  GameState.correctQueriesSolved = 0;
  appendStoryline(GameData.queries[0]);
  if (window.keystrokeLogger) window.keystrokeLogger.recordQuestionStart();
  tabHiddenTime = 0;
  tabHiddenStart = null;
  GameState.currentQueryIndex = 0;
  DOM.hintContainer.textContent = GameData.hints[0][0];

  setGameConfiguration(0, 150);
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
      tabHiddenTime = 0;
      tabHiddenStart = null;
      DOM.hintCounter = 0;
      GameState.currentQueryIndex = nextQueryIndex;
      if (increaseScore) {
        GameState.correctQueriesSolved++;
        updateScore(100);
        Swal.fire({
          title: '',
          imageUrl: ImagesLoader["trini"],
          imageWidth: 50,
          imageHeight: 50,
          text: 'You have earned 100 points!',
          icon: 'success',
          background: '#000',
          color: '#fff',
          toast: true,  
          position: 'center',
          showConfirmButton: false,
          timer: 2000,
        }).then(() => {
          setGameConfiguration(GameState.correctQueriesSolved, GameState.score);
        });
      }
      updateProgressBar(8);
    }
  } else {
    const currentQuery = GameData.queries[GameState.currentQueryIndex];
    
    if (!isSelectQuery(query)) {
      appendStoryline('Oops! Please try again.' + currentQuery);
      updateScore(-10);
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
  GameState.score += change;
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
        features: features,
        query_index: GameState.currentQueryIndex,
        query_context: GameData.queries[GameState.currentQueryIndex],
        baseline: personalBaseline
      })
    });
    const result = await response.json();
    console.log('SFI result:', result);

    if (result.trigger_scaffold && result.triny_message) {
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

function appendStoryline(text) {
  // Escape special characters to render correctly in HTML
  text = text.replace(/'/g, '&#39;');
  DOM.storyline.innerHTML = text + ' <span id="inline-hint-button" onclick="yesButtonHandler()" style="color: #00ff00; text-decoration: underline; cursor: pointer; font-size: 0.85em;"></span>';
  // Update hints
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


