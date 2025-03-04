/* global initSqlJs */
const textarea = document.querySelector('#query-textarea')
const displayText = document.querySelector('.display-text')
const form = document.querySelector('#query-form')
const restartButton = document.getElementById('restart-button')
const storyline = document.getElementById('triny-text')
const hintButton = document.getElementById('hint-button')
const yesButton = document.getElementById('yes')
const noButton = document.getElementById('no')
const okayButton = document.getElementById('okay')
const hintContainer = document.getElementById('modal-content')
const progressBar = document.getElementById('progress-bar')
const progressText = document.getElementById('progress-text')
const scoreText = document.getElementById('score')
const endButton = document.getElementById('end-game');

let queryHistory = []
let currentQueryIndex = 0
let startTime = null
let score = 150
let progress = 10
let flag = false
let hintCounter = 0
let subArrayLength
let soundEnabled = true
let correctQueriesSolved = 0

const agentName = localStorage.getItem('user')

if(!agentName){
  window.location.href = "index.html"
}

const queries = [
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
  " Time to record a repair case. Insert a new repair record with the given details into the 'Repair' table.",
  " Who last worked on the faulty robots? Identify the most recent employee who updated the software of malfunctioning robots. Return their employee ID, first name, last name, the timestamp of the last update, and the robot ID they updated."
]
storyline.textContent = queries[0]

const hints = [
  [['To list all the incidents from the \'Incident\' table, your first hint would be to use the select statement here.'], ['Next you can try following the structure of the query in the form of SELECT _ FROM [TableName] to get all the incidents from the \'Incident\' table. ']],
  [['Look for the most recent incident by considering the timestamp. Try using the LIMIT keyword.'], ['You can also consider ordering the timestamp in a descending order to find the most recent incident.']],
  [['In order to count the number of incidents for these robot models, firsty use the `LEFT JOIN` operation to combine the \'Robot\' and \'Incident\' tables.'], ['Now, try using the `GROUP BY` operation to group the related models and count incidents accordingly for these robot models.']],
  [['To determine the number of robots updated in the past week, focus on the lastUpdateOn column. Specify the date range using appropriate conditions to check the interval.'], ['To get accurate results, consider using the `DISTINCT` operation to count unique robotIDs that have been updated within the specified date range of the past week.']],
  [['Use a subquery to retrieve employee IDs of those who recently updated robots.'], ['Then, filter the employees details using the obtained IDs with the `IN` keyword to get the full name and unique IDs of employees who updated recently.']],
  [['To mark the most recently updated robots as `Under Repair`, use the `UPDATE` statement. Set the `status` column to `Under Repair` for robots that were last updated within a specific date range.'], [' After marking the most recently updated robots as "under repair", do not forget to display the Robot table by using the same structure as in Query 1']],
  [['To find the employee with the highest number of incidents, use the Robot table. Consider using the `COUNT` function along with the `GROUP BY` clause to count the number of incidents reported by each employee.'], ['Next order the results in descending order using the `ORDER BY` clause to get employee with the most incidents at the top of the table'], ['Additionally, use the LIMIT keyword to fetch only the employee with the highest number of incidents.']],
  [['Ensure to use the  `JOIN` condition to link the `Robot` and `Incident` tables based on their common column.'], ['Do not forget to include a `JOIN` with the `Employee` table to retrieve the first name and last name of the employee who last updated the robot and then display the view.']],
  [['To identify the source of malfunctions, use a subquery to count the number of incidents for each robot model.'], ['Now, filter the robot models with more than 2 incidents using the HAVING clause in the subquery to get the source of malfunctions.']],
  [['Use the `CREATE TABLE` syntax to create the desired  \'Repair\' table'], ['Remember to clearly define the types for the columns of \'Repair\' table as specified.']],
  [['Use INSERT INTO to add a repair record. Fill in the values for repairID, repairStatus, desc, robotID, and repairedById correctly.'], ['Use\'VALUES\' opersation to insert the following values :(1, \'Under Repair\', \'This robot model is undergoing repair due to its defaulty patterns\', 5 , 7) in the \'Repair\' table ']],
  [['You can use the `JOIN` operation to combine information from the Employee and log tables based on the appropriate columns first'], ['To find the last employee who updated the software of the malfunctioning robots, create a subquery to find the latest update timestamp for each robot using MAX()'], ['Lastly, JOIN the results with Employee and Robot tables using appropriate ON clauses to get the last updating employee\'s\' details']]
]

hintContainer.textContent = hints[0][0]

const answerKeys = [
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

const whiteRabbitConfiguration = {
  imageUrl: "images/white-rabbit.png",
  imageWidth: 200,
  imageHeight: 200,
  background : "linear-gradient(to right, #000, green)",
  color: "white",
  confirmButtonText: "Yes",
  showCancelButton: true,
  cancelButtonText: "No",
  confirmButtonColor: "var(--secondary-color)",
  cancelButtonColor: "black",
  cancelButtonTextColor: "var(--main-color)",
  customClass: {
    actions: 'center-buttons-actions',
  },
  toast: true,
}


const hintPoints = [40, 60, 80]
let db

function restartGame () {
  queryHistory = []
  displayText.innerHTML = ''
  startTime = Date.now()
  score = 150
  progress = 10
  correctQueriesSolved = 0
  updateTimer()
  updateScore(0)
  updateProgressBar(0)
  initializeDB()
  storyline.textContent = queries[0]
  currentQueryIndex = 0
  hintCounter = 0
  hintContainer.textContent = hints[0][0]
}


function getAgentName(){
  const agentName = localStorage.getItem('user');
  if(agentName){
    return agentName.charAt(0).toUpperCase() + agentName.slice(1);
  }
  return 'Phoenix';
}

function startGame () {
  startTime = Date.now();
  let score = localStorage.getItem('score');
  let agentName = getAgentName();
  document.getElementById('agent-name-display').textContent = agentName;

  // Check if score is null or undefined, and set it to 150 if so
  if (score > 150) {
     score = parseInt(score,10);
  } else {
      score=150;
      score = parseInt(score, 10); // Convert score back to a number if it's stored as a string
  }
  correctQueriesSolved= parseInt(localStorage.getItem('totalQueriesSolved') ?? 0,10);
  if(correctQueriesSolved > 0){
  }else{
    correctQueriesSolved=0;
    correctQueriesSolved=parseInt(correctQueriesSolved,10);
  }
  scoreText.textContent='Score: '+score;
  document.getElementById('correct-queries').textContent = 'Q: ' + (correctQueriesSolved) + ' / 12';
  currentQueryIndex=correctQueriesSolved??0;
  nextQueryIndex=currentQueryIndex??0;
  const nextQuery = queries[nextQueryIndex]
  storyline.textContent = nextQuery
  progress = 10
  setInterval(updateTimer, 1000)
  initializeDB()
  updateProgressBar(correctQueriesSolved*8)
}

function endGame(){
  
  localStorage.clear();
  window.location.href = "index.html";
}

/**
 * @param {boolean} increaseScore If false, the score will not be increased
 * @param {string} query The query that was executed
 */
function getStory (increaseScore = true, query = '') {
  const nextQueryIndex = currentQueryIndex + 1
  if (flag === true && nextQueryIndex <= queries.length) {
    if (nextQueryIndex === queries.length) {
      location.assign('endScreen.html?gameStatus=win')
    } else {
      const nextQuery = queries[nextQueryIndex]
      storyline.textContent = nextQuery
      storyline.classList.add('chat-message-animation')
      setTimeout(() => {
        storyline.classList.remove('chat-message-animation')
      }, 5000)
      
      hintCounter = 0
      currentQueryIndex = nextQueryIndex
      if (increaseScore) {
        updateScore(100)
      }
      updateProgressBar(8)
      correctQueriesSolved++
    }
  } else {
    const currentQuery = queries[currentQueryIndex]
    
    if (!isSelectQuery(query)) {
      storyline.textContent = 'Oops! Please try again.' + currentQuery
      updateScore(-10)
    }

    if (score <= 0) {
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
      })
    }
  }
}
let timeElapsed = 0;
function updateTimer () {
  const now = Date.now()
   timeElapsed = Math.round((now - startTime) / 1000)
  document.getElementById('timer').textContent = 'Time: ' + timeElapsed + 's'
}
function updateScore (change) {
  score = score + change
  scoreText.textContent = 'Score: ' + score

  document.getElementById('correct-queries').textContent = 'Q: ' + (correctQueriesSolved+1) + ' / 12'

  if (change > 0 && soundEnabled) {
    const correctSound = document.getElementById('correct-sound')
    correctSound.currentTime = 0
    correctSound.play();
  }

  if (change < 0 && soundEnabled) {
    const incorrectSound = document.getElementById('incorrect-sound')
    incorrectSound.currentTime = 0
    incorrectSound.play()
  }
}

function toggleSound () {
  const modal = document.getElementById('sound-modal')
  modal.style.display = 'block'
}

function setSoundOff () {
  soundEnabled = false
  const modal = document.getElementById('sound-modal')
  modal.style.display = 'none'
}

function setSoundOn () {
  soundEnabled = true
  const modal = document.getElementById('sound-modal')
  modal.style.display = 'none'
}

function updateProgressBar (change) {
  progress = Math.min(progress + change, 100)
  progressBar.style.width = progress + '%'
  progressText.innerText = progress + '%'
}

restartButton.addEventListener('click', restartGame)

function validateForm () {

  const x = document.forms['query-input']['query-input-box'].value
  if (x === '') {
    return false
  }
  return true
}

const settingsButton = document.getElementById('settings-button')
settingsButton.addEventListener('click', toggleSound)

const soundOnButton = document.getElementById('sound-on-button')
soundOnButton.addEventListener('click', setSoundOn)

const soundOffButton = document.getElementById('sound-off-button')
soundOffButton.addEventListener('click', setSoundOff)

const soundModalClose = document.getElementsByClassName('close')[1]
soundModalClose.addEventListener('click', function () {
  const modal = document.getElementById('sound-modal')
  modal.style.display = 'none'
})

window.addEventListener('click', function (event) {
  const modal = document.getElementById('sound-modal')
  if (event.target === modal) {
    modal.style.display = 'none'
  }
})

form.addEventListener('submit', function (event) {
  event.preventDefault()
  const queryWrapper = document.createElement('div')
  const queryParagraph = document.createElement('p')
  const x = document.forms['query-input']['query-input-box'].value;
  const query = textarea.value

  // Always append queryWrapper to displayText first since it's needed in all cases
  displayText.appendChild(queryWrapper)

  if (!validateForm()) {
    displayError(queryWrapper, 'Empty Query Provided')
  } else if (!isValidSQLQuery(query)) {
    displayError(queryWrapper, 'Invalid SQL Query Syntax: ' + query)
  } else {
    queryHistory.push(query)
    queryParagraph.textContent = query
    queryWrapper.appendChild(queryParagraph)
    
    // Execute query and update UI
    executeQuery(query, queryHistory.length - 1, queryWrapper)
    getStory(true, query)
    
    // Clear textarea after successful query
    textarea.value = ''
  }

  // Scroll to bottom once at the end
  scrollToBottom()

  // add push to database over here
  submitUserData(localStorage.getItem('user'), currentQueryIndex, timeElapsed, hintsUsed,x,flag,score)
})
let hintsUsed =0;
function getHint () {
  const hintIndex = currentQueryIndex
  const hintArray = hints[hintIndex]
  hintsUsed++;
  subArrayLength = hintArray.length

  if (hintCounter < subArrayLength) {
    updateScore(-hintPoints[hintCounter])
    hintCounter = hintCounter + 1
    return hintArray
  }
}

const modal = document.getElementById('hint-modal')

const spanClose = document.getElementsByClassName('close')[0]

hintButton.onclick = function () {

  if (hintCounter !== subArrayLength) {
    Swal.fire({
    title: 'Would you like to hire White Rabbit?',
    ...whiteRabbitConfiguration,
    html: `Hint : For hint # ${hintCounter + 1} for this problem, it's going to cost you ${hintPoints[hintCounter]} points. Click "Yes" to use it or "No" to cancel`,
    }).then((result) => {
      if (result.isConfirmed) {
        const hint_array = getHint()
        const formatted_hint = hint_array.slice(0, hintCounter).map((hint, index) => {
          if (hintCounter-1 === index) {
            return `<span style="color: white;">${index + 1}. ${hint}</span>`
          } else {
            return `<span style="color: gray;">${index + 1}. ${hint}</span>`
          }
        }).join('<hr>')

        Swal.fire({
          title: '', 
          html: formatted_hint,
          ...whiteRabbitConfiguration,
          showCancelButton: false,
          confirmButtonText: "Got It",
        })
      }
    })
  } else {
    Swal.fire({
      title: 'White Rabit Wants To Help',
      text: 'I have infiltrated the database and found the answer to your question. Im sending it to you now.',
      ...whiteRabbitConfiguration,
      timer: 10000,
      timerProgressBar: true,
      showCancelButton: false,
      confirmButtonText: "Got It",
      toast: true,

    }).then(() => {
      flag = true
      getStory(false)
    })
  }
}

yesButton.onclick = function () {
  modal.style.display = 'none'
  getHint()
}

noButton.onclick = function () {
  modal.style.display = 'none'
}

spanClose.onclick = function () {
  modal.style.display = 'none'
}

okayButton.onclick = function () {
  modal.style.display = 'none'
}

window.onclick = function (event) {
  if (event.target === modal) {
    modal.style.display = 'none'
  }
}

function displayResults (queryWrapper, result) {
  const table = document.createElement('table')
  table.style.borderCollapse = 'collapse'
  table.style.width = '100%'
  const thead = document.createElement('thead')
  const tbody = document.createElement('tbody')
  let headers = null
  result.values.forEach((row, rowIndex) => {
    if (!headers) {
      headers = result.columns
      const headerRow = document.createElement('tr')
      headers.forEach(header => {
        const th = document.createElement('th')
        th.textContent = header
        th.style.border = '1px solid'
        th.style.padding = '8px'
        headerRow.appendChild(th)
      })
      thead.appendChild(headerRow)
    }
    const dataRow = document.createElement('tr')
    headers.forEach(header => {
      const td = document.createElement('td')
      td.textContent = result.values[rowIndex][headers.indexOf(header)]
      td.style.border = '1px solid'
      td.style.padding = '8px'
      dataRow.appendChild(td)
    })
    tbody.appendChild(dataRow)
  })
  table.appendChild(thead)
  table.appendChild(tbody)
  queryWrapper.appendChild(table)
}

function displayMessage (queryWrapper, message) {
  const p = document.createElement('p')
  p.textContent = message
  queryWrapper.appendChild(p)
}

function initializeDB () {
  initSqlJs().then(function (SQL) {
    fetch('database/main.db')
      .then(response => response.arrayBuffer())
      .then(buffer => {
        db = new SQL.Database(new Uint8Array(buffer))
      }
      )
  }
  )
}

function executeQuery (query, index, queryWrapper) {
  try {
    const results = db.exec(query)
    if (results.length === 0) {
      displayMessage(queryWrapper, 'Command executed successfully.')
      if (currentQueryIndex === 0) {
        const results2 = db.exec('SELECT name FROM pragma_table_info(\'Repair\') ORDER BY cid;')
        if (validateResult(results2[0].values, currentQueryIndex)) {
          flag = true
        } else {
          flag = false
        }
      }
    } else {
      displayResults(queryWrapper, results[0])
      if (validateResult(results[0].values, currentQueryIndex)) {
        flag = true
      } else {
        flag = false
      }
    }
  } catch (error) {
    const errorMessage = 'ERROR: ' + error.message
    displayError(queryWrapper, errorMessage)
    flag = false
  }
  scrollToBottom()
}
function displayError (queryWrapper, message) {
  const errorElement = document.createElement('p')
  errorElement.textContent = message
  errorElement.style.color = 'red'
  queryWrapper.appendChild(errorElement)
  scrollToBottom()
}

function validateResult (resultValues, queryIndex) {
  const answerKey = answerKeys[queryIndex]
  if (!answerKey || resultValues.length !== answerKey.length) {
    return false
  }

  for (let i = 0; i < resultValues.length; i++) {
    for (let j = 0; j < resultValues[i].length; j++) {
      const expectedValue = answerKey[i][j]
      const actualValue = resultValues[i][j]
      const parsedExpectedValue = isNaN(expectedValue) ? expectedValue : parseFloat(expectedValue)
      const parsedActualValue = isNaN(actualValue) ? actualValue : parseFloat(actualValue)

      if (parsedActualValue !== parsedExpectedValue) {
        return false
      }
    }
  }
  return true
}

function scrollToBottom () {
  const displayText = document.querySelector('.display-text')
  displayText.scrollTop = displayText.scrollHeight
}

startGame();

async function submitUserData(username, queryIndex, queryTime, hintsUsed, query, isCorrect,score) {
  if (!username || queryTime === undefined || queryIndex === undefined || hintsUsed === undefined) {
    console.error('Missing required fields. CLIENT');
    return;
  }

  const payload = { username, queryIndex, queryTime, hintsUsed, query, isCorrect,score };

  try {
    const response = await fetch('https://sqlgameserver.onrender.com/submitUserData', {
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
    console.error("Error submitting data:", error);
    alert("There was a problem submitting your data. Please try again."); // User-friendly message
  }
}

