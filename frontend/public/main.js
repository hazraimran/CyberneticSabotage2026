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
    imageUrl: "images/white-rabbit.png",
    imageWidth: 200,
    imageHeight: 200,
    background: "linear-gradient(to right, #000, green)",
    color: "white",
    confirmButtonText: "Yes",
    showCancelButton: true,
    cancelButtonText: "No",
    confirmButtonColor: "var(--secondary-color)",
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
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  scoreText: document.getElementById('score'),
  endButton: document.getElementById('end-game'),
  clearButton: document.getElementById('clear-button'),
  numberCluesLeft: document.getElementById('number-clues-left'),
  agentNameDisplay: document.getElementById('agent-name-display'),
  correctQueries: document.getElementById('correct-queries'),
  settingsButton: document.getElementById('settings-button'),
  soundButton: document.getElementById('sound-on-button'),
  soundOffButton: document.getElementById('sound-off-button')
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
  soundEnabled: true,
  correctQueriesSolved: 0,
  db: null,
  hintsUsed: 0
};

/**
 * Game data containing all queries, answers, hints and validation keys
 * @constant {Object}
 */
const GameData = {
  queries: [
  " Detective, your first mission is to retrieve all reported incidents from the 'Incident' database. Let's see what we're dealing with!",
  " Great job! Now, let's track down the most recent incident. Find the latest reported case from the 'Incident' table. Make sure to return all its details.",
  " We're onto something! Count the number of incidents reported for each robot model. Return the robot model and the number of incidents as 'IncidentCount'.",
  " Time to check our system updates. Count how many robots have been updated in the past week (Assume today is 2023-07-24). Return this count as 'NumberOfUpdatedRobots'.",
  " Who's been fixing our robots? Identify employees who recently updated any robots within the past week. We want to know their employee ID, first name, and last name (Assume today is 2023-07-24).",
  " Some robots need urgent repairs! Mark the recently updated robots as 'Under Repair' and then display all robot details (Assume today is 2023-07-24).",
  " Who's our top whistleblower? Find the employee who has the most robot update records. Display the result with column names 'employeeID' and 'NumberOfIncidents' respectively.",
  " Let's compile all the evidence. Create a view that connects the 'Incident' and 'Robot' tables, showing all incidents related to each robot model. Include the robot ID, model, employee who last updated it, incident ID, incident description, incident timestamp, and the name of the employee responsible for the update. Then, display the view.",
  " Let's uncover the problematic robot models! Find all models that have been involved in more than 2 incidents. Return only the model names.",
  " We need a repair log! Create a 'Repair' table with columns for repair ID((INTEGER), repairStatus (TEXT), desc(TEXT), robotID(TEXT),  and the employee who performed the repair as and repairedById (TEXT)",
  " Time to record a repair case. Insert a new repair record with the given details into the 'Repair' table. (repairID = 1, repairStatus = 'Under Repair', desc = 'This robot model is undergoing repair due to its defaulty patterns', robotID = 5, repairedById = 7)",
  " Who last worked on the faulty robots? Identify the most recent employee who updated the software of malfunctioning robots. Return their employee ID, first name, last name, the timestamp of the last update, and the robot ID they updated."
  ],
  queryAnswers: [
  'SELECT * FROM Incident;',
  'SELECT * FROM Incident ORDER BY timeStamp DESC LIMIT 1;',
  'SELECT r.Model, COUNT(i.incidentID) AS IncidentCount FROM Robot AS r LEFT JOIN Incident AS i ON r.robotID = i.robotID GROUP BY r.Model;',
  'SELECT COUNT(DISTINCT robotID) AS NumberOfUpdatedRobots FROM Robot WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\';',
  'SELECT DISTINCT e.employeeID, e.firstName, e.lastName FROM Employee e WHERE e.employeeID IN ( SELECT DISTINCT lastUpdatedByEmpID FROM Robot WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\' );',
  'UPDATE Robot SET status = \'Under Repair\' WHERE lastUpdateOn >= \'2023-07-17\' AND lastUpdateOn < \'2023-07-24\';',
  'SELECT lastUpdatedByEmpID AS employeeID, COUNT(*) AS NumberOfIncidents FROM Robot GROUP BY lastUpdatedByEmpID ORDER BY COUNT(*) DESC LIMIT 1;',
  'CREATE VIEW RobotIncidentView AS SELECT r.robotID, r.Model, r.lastUpdatedByEmpID, i.incidentID, i.desc, i.timeStamp, e.firstName, e.lastName FROM Robot r JOIN Incident i ON r.robotID = i.robotID JOIN Employee e ON r.lastUpdatedByEmpID = e.employeeID; SELECT * FROM RobotIncidentView;',
  'SELECT Model FROM Robot WHERE robotID IN ( SELECT robotID FROM Incident GROUP BY robotID HAVING COUNT(*) > 2 );',
  'CREATE TABLE Repair ( repairID INTEGER, repairStatus TEXT, desc TEXT, robotID INTEGER, repairedById INTEGER );',
  'INSERT INTO Repair ("repairID", "repairStatus", "desc", "robotID", "repairedById" ) VALUES (1, \'Under Repair\', \'This robot model is undergoing repair due to its defaulty patterns\', 5 , 7);', 
  'SELECT e.employeeID, e.firstName, e.lastName, l.lastUpdate, l.robotID FROM Employee e JOIN ( SELECT MAX(timeStamp) AS lastUpdate, robotID, employeeID FROM log WHERE actionDesc = \'Updates\' GROUP BY robotID ) l ON e.employeeID = l.employeeID JOIN Robot r ON l.robotID = r.robotID WHERE r.status = \'In Repair\';'
  ],
  hints: [
  [['To list all the incidents from the \'Incident\' table, your first hint would be to use the select statement here.'], ['Next you can try following the structure of the query in the form of SELECT _ FROM [TableName] to get all the incidents from the \'Incident\' table. ']],
  [['Look for the most recent incident by considering the timestamp. Try using the LIMIT keyword.'], ['You can also consider ordering the timestamp in a descending order to find the most recent incident.']],
  [['In order to count the number of incidents for these robot models, firsty use the `LEFT JOIN` operation to combine the \'Robot\' and \'Incident\' tables.'], ['Now, try using the `GROUP BY` operation to group the related models and count incidents accordingly for these robot models.']],
  [['To determine the number of robots updated in the past week, focus on the lastUpdateOn column. Specify the date range using appropriate conditions to check the interval.'], ['To get accurate results, consider using the `DISTINCT` operation to count unique robotIDs that have been updated within the specified date range of the past week.']],
  [['Use a subquery to retrieve employee IDs of those who recently updated robots.'], ['Then, filter the employees details using the obtained IDs with the `IN` keyword to get the full name and unique IDs of employees who updated recently.']],
  [['To mark the most recently updated robots as `Under Repair`, use the `UPDATE` statement. Set the `status` column to `Under Repair` for robots that were last updated within a specific date range.'], [' After marking the most recently updated robots as "under repair", do not forget to display the Robot table by using the same structure as in Query 1']],
  [['To find the employee with the highest number of incidents, use the Robot table. Consider using the `COUNT` function along with the `GROUP BY` clause to count the number of incidents reported by each employee.'], ['Next order the results in descending order using the `ORDER BY` clause to get employee with the most incidents at the top of the table'], ['Additionally, use the LIMIT keyword to fetch only the employee with the highest number of incidents.']],
  [['Ensure to use the  `JOIN` condition to link the `Robot` and `Incident` tables based on their common column.'], ['Do not forget to include a `JOIN` with the `Employee` table to retrieve the first name and last name of the employee who last updated the robot and then display the view.']],
  [['To identify the source of malfunctions, use a subquery to count the number of incidents for each robot model.'], ['Now, filter the robot models with more than 2 incidents using the HAVING clause in the subquery to get the source of malfunctions.']],
  [['Use the `CREATE TABLE` syntax to create the desired  \'Repair\' table'], ['Remember to clearly define the types for the columns of \'Repair\' table as specified.'], ['IF Table is already create Try to DROP the table and create it again']],
  [['Use INSERT INTO to add a repair record. Fill in the values for repairID, repairStatus, desc, robotID, and repairedById correctly.'], ['Use\'VALUES\' opersation to insert the following values :(1, \'Under Repair\', \'This robot model is undergoing repair due to its defaulty patterns\', 5 , 7) in the \'Repair\' table ']],
  [['You can use the `JOIN` operation to combine information from the Employee and log tables based on the appropriate columns first'], ['To find the last employee who updated the software of the malfunctioning robots, create a subquery to find the latest update timestamp for each robot using MAX()'], ['Lastly, JOIN the results with Employee and Robot tables using appropriate ON clauses to get the last updating employee\'s\' details']]
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

const EXTERNAL_API = window.config.EXTERNAL_API;

/**
 * Initializes all event listeners for the game
 * @function
 */
function initializeEventListeners() {
  DOM.form.addEventListener('submit', handleFormSubmit);
  DOM.restartButton.addEventListener('click', restartGame);
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
}



/**
 * Initializes the game by setting up the database and starting the game
 * @async
 * @function
 */
async function initializeGame() {
  await initializeDB();
  initializeEventListeners();
  startGame();
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

  const payload = { username, queryIndex, queryTime, hintsUsed, query, isCorrect, score };

  console.log(payload);
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

    console.log(error);
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
  const queryWrapper = document.createElement('div');
  const queryParagraph = document.createElement('p');
  const x = document.forms['query-input']['query-input-box'].value;
  const query = DOM.textarea.value;

  // Always append queryWrapper to displayText first since it's needed in all cases
  DOM.displayText.appendChild(queryWrapper);

  if (!validateForm()) {
    displayError(queryWrapper, 'Empty Query Provided');
  } else if (!isValidSQLQuery(query)) {
    displayError(queryWrapper, 'Invalid SQL Query Syntax: ' + query);
  } else {
    GameState.queryHistory.push(query);
    queryParagraph.textContent = query;
    queryWrapper.appendChild(queryParagraph);
    // Execute query and update UI
    await executeQuery(query, GameState.currentQueryIndex, queryWrapper);
    await getStory(true, query);
  }

  // Scroll to bottom once at the end
  scrollToBottom();

  // add push to database over here
  await submitUserData(localStorage.getItem('user'), GameState.currentQueryIndex, timeElapsed(), GameState.hintsUsed, x, GameState.flag, GameState.score);
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
 * Displays an error message
 * @function
 * @param {HTMLElement} queryWrapper - The element to append the error to
 * @param {string} message - The error message to display
 */
function displayError(queryWrapper, message) {
  const errorElement = document.createElement('p');
  errorElement.textContent = message;
  errorElement.style.color = 'red';
  queryWrapper.appendChild(errorElement);
  scrollToBottom();
}

/**
 * Displays query results in a table format
 * @function
 * @param {HTMLElement} queryWrapper - The element to append the table to
 * @param {Object} result - The query result object
 */
function displayResults(queryWrapper, result) {
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

function displayMessage(queryWrapper, message) {
  const p = document.createElement('p');
  p.textContent = message;
  queryWrapper.appendChild(p);
}

function displayRepairRow() {
  if (GameState.currentQueryIndex >= 9) {
    document.getElementById('repair-row').style.display = 'table-row';
  }
}

function updateTimer() {
  const now = Date.now();
  const timeElapsed = Math.round((now - GameState.startTime) / 1000);
  document.getElementById('timer').textContent = 'Time: ' + timeElapsed + 's';
}

/**
 * Updates the game score and plays appropriate sound
 * @function
 * @param {number} change - The amount to change the score by
 */
function updateScore(change) {
  GameState.score += change;
  DOM.scoreText.textContent = 'Score: ' + GameState.score;
  DOM.correctQueries.textContent = 'Q: ' + (GameState.correctQueriesSolved + 1) + ' / 12';

  if (change > 0 && GameState.soundEnabled) {
    SoundManager.playSound('correct');
  }
  if (change < 0 && GameState.soundEnabled) {
    SoundManager.playSound('incorrect');
  }
}

function toggleSound() {
  const modal = document.getElementById('sound-modal');
  modal.style.display = 'block';
}

function setSoundOff() {
  GameState.soundEnabled = false;
  const modal = document.getElementById('sound-modal');
  modal.style.display = 'none';
}

function setSoundOn() {
  GameState.soundEnabled = true;
  const modal = document.getElementById('sound-modal');
  modal.style.display = 'none';
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
  GameState.hintCounter = 0;

  if (GameState.hintCounter < hintArray.length) {
    updateScore(-GAME_CONFIG.hintPoints[GameState.hintCounter]);
    GameState.hintCounter = GameState.hintCounter + 1;
    return hintArray;
  }
}

function getHelp() {
  Swal.fire({
    imageUrl: "images/tutorial.png",
    imageWidth: "100%",
    imageHeight: "100%",
    background: '#000',
    height: '80%',  
    width: '80%',
    color: '#fff',
  });
}

function yesButtonHandler() {
  const hintIndex = GameState.currentQueryIndex;
  const hintArray = GameData.hints[hintIndex];
  if (GameState.hintCounter !== hintArray.length) {
    Swal.fire({
      title: 'Would you like to hire White Rabbit?',
      ...GAME_CONFIG.whiteRabbitConfig,
      html: `Hint : For hint # ${GameState.hintCounter + 1} for this problem, it's going to cost you ${GAME_CONFIG.hintPoints[GameState.hintCounter]} points. Click "Yes" to use it or "No" to cancel`,
    }).then((result) => {
      if (result.isConfirmed) {
        const hint_array = getHint();
        const formatted_hint = hint_array.slice(0, GameState.hintCounter).map((hint, index) => {
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
  } else {
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

function noButtonHandler() {
  const modal = document.getElementById('hint-modal');
  modal.style.display = 'none';
}

function okayButtonHandler() {
  const modal = document.getElementById('hint-modal');
  modal.style.display = 'none';
}

window.onclick = function (event) {
  const modal = document.getElementById('hint-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
}

function clearQuery() {
  DOM.textarea.value = '';
  DOM.clearButton.style.display = 'none';
}

function getAgentName() {
  const agentName = localStorage.getItem('user');
  if (agentName) {
    return agentName.charAt(0).toUpperCase() + agentName.slice(1);
  }
  return 'Phoenix';
}

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
  DOM.storyline.textContent = nextQuery;
  GameState.progress = 10;
  setInterval(updateTimer, 1000);
  updateScore(0);
  initializeDB();
  updateProgressBar(GameState.correctQueriesSolved * 8);
}

function restartGame() {
  GameState.queryHistory = [];
  DOM.displayText.innerHTML = '';
  GameState.startTime = Date.now();
  GameState.score = GAME_CONFIG.initialScore;
  GameState.progress = GAME_CONFIG.initialProgress;
  GameState.correctQueriesSolved = 0;
  updateTimer();
  updateScore(0);
  updateProgressBar(0);
  initializeDB();
  DOM.storyline.textContent = GameData.queries[0];
  GameState.currentQueryIndex = 0;
  GameState.hintCounter = 0;
  DOM.hintContainer.textContent = GameData.hints[0][0];
}

function endGame() {
  localStorage.clear();
  window.location.href = "login.html";
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
      Swal.fire({
        title: 'Congratulations!',
        text: 'You have saved RoboTech. Would you like to try again?',
        icon: 'success',
        confirmButtonText: 'Yes',
        showCancelButton: true,
        cancelButtonText: 'No',
        background: '#000',
        color: '#fff',
      }).then((result) => {
        if (result.isConfirmed) {
          restartGame();
        } else {
          endGame();
        }
      });
    } else {
      const nextQuery = GameData.queries[nextQueryIndex];
      DOM.storyline.textContent = nextQuery;
      DOM.hintCounter = 0;
      GameState.currentQueryIndex = nextQueryIndex;
      if (increaseScore) {
        GameState.correctQueriesSolved++;
        updateScore(100);
        Swal.fire({
          title: '',
          imageUrl: 'images/trini.png',
          imageWidth: 50,
          imageHeight: 50,
          text: 'You have earned 100 points!',
          icon: 'success',
          background: '#000',
          color: '#fff',
          toast: true,  
          position: 'top-right',
          showConfirmButton: false,
          timer: 3000,
        });
      }
      updateProgressBar(8);
    }
  } else {
    const currentQuery = GameData.queries[GameState.currentQueryIndex];
    
    if (!isSelectQuery(query)) {
      DOM.storyline.textContent = 'Oops! Please try again.' + currentQuery;
      updateScore(-10);
    }

    if (GameState.score <= 0) {
      Swal.fire({
        title: 'Game Over',
        text: 'RoboTech has fallen. Would you like to try again?',
        icon: 'error',
        background: '#000',
        color: '#fff',
        confirmButtonText: 'OK',
        showCancelButton: true,
        cancelButtonText: 'No',
        confirmButtonColor: 'var(--secondary-color)',
        cancelButtonColor: 'black',
        cancelButtonTextColor: 'var(--main-color)',
      }).then((result) => {
        if (result.isConfirmed) {
          restartGame();
        } else {
          endGame();
        }
      });
    }
  }
}

function timeElapsed() {
  const now = Date.now();
  const timeElapsed = Math.round((now - GameState.startTime) / 1000);
  document.getElementById('timer').textContent = 'Time: ' + timeElapsed + 's';
  return timeElapsed;
}

function updateTimer() {
  const now = Date.now();
  const timeElapsed = Math.round((now - GameState.startTime) / 1000);
  document.getElementById('timer').textContent = 'Time: ' + timeElapsed + 's';
}

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
}

function toggleSound() {
  const modal = document.getElementById('sound-modal');
  modal.style.display = 'block';
}

function setSoundOff() {
  GameState.soundEnabled = false;
  const modal = document.getElementById('sound-modal');
  modal.style.display = 'none';
}

function setSoundOn() {
  GameState.soundEnabled = true;
  const modal = document.getElementById('sound-modal');
  modal.style.display = 'none';
}

function updateProgressBar(change) {
  GameState.progress = Math.min(GameState.progress + change, 100);
  DOM.progressBar.style.width = GameState.progress + '%';
  DOM.progressText.innerText = GameState.progress + '%';
  displayRepairRow();
}

function displayRepairRow() {
  if (GameState.currentQueryIndex >= 9) {
    document.getElementById('repair-row').style.display = 'table-row';
  }
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
async function initializeDB() {
  await initSqlJs().then(function (SQL) {
    fetch('database/main.db')
      .then(response => response.arrayBuffer())
      .then(buffer => {
        GameState.db = new SQL.Database(new Uint8Array(buffer));
      })
      .then(() => {
        if (GameState.currentQueryIndex >= 9) {
          GameState.db.exec('CREATE TABLE Repair ( repairID INTEGER, repairStatus TEXT, desc TEXT, robotID INTEGER, repairedById INTEGER );');
        }
      });
  });
}

/**
 * Executes an SQL query and displays the results
 * @function
 * @param {string} query - The SQL query to execute
 * @param {number} index - The current query index
 * @param {HTMLElement} queryWrapper - The element to display results in
 */
function executeQuery(query, index, queryWrapper) {
  try {
    const results = GameState.db.exec(query);
    if (results.length === 0) {
      displayMessage(queryWrapper, 'Command executed successfully.');
      if (GameState.currentQueryIndex === 9) {
        const results2 = GameState.db.exec('SELECT name FROM pragma_table_info(\'Repair\') ORDER BY cid;');
        GameState.flag = validateResult(results2[0].values, GameState.currentQueryIndex);
      }
    } else {
      displayResults(queryWrapper, results[0]);
      GameState.flag = validateResult(results[0].values, GameState.currentQueryIndex);
    }

    if (GameState.flag) {
      DOM.textarea.value = '';
    }
  } catch (error) {
    displayError(queryWrapper, 'ERROR: ' + error.message);
    GameState.flag = false;
  }
  scrollToBottom();
}

function displayError(queryWrapper, message) {
  const errorElement = document.createElement('p');
  errorElement.textContent = message;
  errorElement.style.color = 'red';
  queryWrapper.appendChild(errorElement);
  scrollToBottom();
}

function displayResults(queryWrapper, result) {
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

function displayMessage(queryWrapper, message) {
  const p = document.createElement('p');
  p.textContent = message;
  queryWrapper.appendChild(p);
}

function scrollToBottom() {
  DOM.displayText.scrollTop = DOM.displayText.scrollHeight;
}

/**
 * Starts the game initialization process
 */
initializeGame();