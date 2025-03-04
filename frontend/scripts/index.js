
const EXTERNAL_API = "https://sqlgameserver.onrender.com"
var canvas = document.querySelector("canvas")
var ctx = canvas.getContext("2d")

function resizeCanvas() {
  canvas.height = window.innerHeight
  canvas.width = window.innerWidth
}

window.addEventListener("resize", resizeCanvas)
resizeCanvas()

var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@$%&"
letters = letters.split("")

var fontSize = 11
var columns = canvas.width / fontSize

var drops = []
var speeds = []
for (var i = 0; i < columns; i++) {
  drops[i] = 1
  speeds[i] = Math.random() + 0.5
}
let isVerified=false;
function draw() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = "rgba(0, 255, 0, 0.3)"
  ctx.font = fontSize + "px arial"
  for (var i = 0; i < drops.length; i++) {
    var text = letters[Math.floor(Math.random() * letters.length)]
    ctx.fillText(text, i * fontSize, drops[i] * fontSize)

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0
    }

    drops[i] += speeds[i]
  }
}

setInterval(draw, 33)



async function startGame(type) {
  let username = document.getElementById("username").value;
  let password = document.getElementById("pass").value;
  
  if(username == ""||password == ""){
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      background: '#000',
      width: '300px',
      color: '#fff',
      text: 'Please enter username and password to Proceed!!!',
    })
    return;
  }

  Swal.fire({
    icon: 'info',
    toast: true,
    title: 'Loading...',
    background: '#000',
    width: '300px',
    color: '#fff',
    text: 'Robotech is verifying your data...',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  })


  try{
    const userFactory = new UserFactory(username,password, type);
    await userFactory.initializeUserInstance();
    if(userFactory.isUserVerified()){
      window.location.href = userFactory.getTotalQueriesSolved() > 0 ? "mainGame.html" : "storyScreen.html";
    }else{
      document.getElementById('warning').classList.remove('hidden');
    }
  } catch(err){
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      background: '#000',
      width: '300px',
      color: '#fff',
      text: 'There was a problem submitting your data. Please try again.',
    })
  }
}

async function checkUser(username,password){
  try{
    const response = await fetch(`${EXTERNAL_API}/getUser?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json(); // Capture the response body
    throw new Error(`Error ${response.status}: ${errorData.error || 'Unknown error'}`);
  }
  const data = await response.json();
  return data;
}catch(error){
  console.error("Error submitting data:", error);
  alert("There was a problem submitting your data. Please try again.");
  }
}

async function registerUser(username,password){
  try{
    const response = await fetch(`${EXTERNAL_API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json(); // Capture the response body
      throw new Error(`Error ${response.status}: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data;

  }catch(error){
    console.error("Error registering user:", error);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'There was a problem registering your data. Please try again.',
    })
  }
}



/**
 * Factory class for managing user authentication, registration, and game data.
 * 
 * @class UserFactory
 * @description Handles user authentication, data management, and game configuration storage.
 * The class provides methods for user login/registration and maintains game progress.
 */
class UserFactory {
  /**
   * Creates an instance of UserFactory.
   * @param {string} username - The user's nickname/username
   * @param {string} password - The user's password
   */
  constructor(username, password, type) {
    this.username = username;
    this.password = password;
    this.type = type;
    this.data = {
      isVerified: false,
      totalQueriesSolved: 0, 
      score: 0
    };
  }

  /**
   * Creates a user instance based on login or registration.
   * @async
   * @param {string} type - The type of instance to create ("register" or "login")
   * @returns {Promise<void>} Updates the instance data with server response
   */
  async initializeUserInstance() {

    try{
      let newData = {};
      if(this.type === "register") {
        newData = await registerUser(this.username, this.password);
      } else if(this.type === "login") {
        newData = await checkUser(this.username, this.password); 
      }
      this.data = {...this.data, ...newData?.user, isVerified: newData?.isVerified};
      this.setGameConfiguration();
    }catch(error){
      console.error("Error initializing user instance:", error);
    }
  }

  /**
   * Gets the current game configuration data.
   * @returns {Object} The current game configuration state
   */
  getGameConfiguration() {
    return {...this.data};
  }

  /**
   * Saves the current game configuration to localStorage.
   */
  setGameConfiguration() {
    localStorage.setItem("user", this.username);
    localStorage.setItem("isVerified", this.data.isVerified);
    localStorage.setItem("totalQueriesSolved", this.data.totalQueriesSolved);
    localStorage.setItem("score", this.data.score);
  }

  /**
   * Checks if the current user is verified.
   * @returns {boolean} User verification status
   */
  isUserVerified() {
    return this.data.isVerified;
  }

  /**
   * Gets the total number of queries solved by the user.
   * @returns {number} Total queries solved
   */
  getTotalQueriesSolved() {
    return this.data.totalQueriesSolved;
  }

  /**
   * Gets the current score of the user.
   * @returns {number} Current user score
   */
  getScore() {
    return this.data.score;
  }
}
