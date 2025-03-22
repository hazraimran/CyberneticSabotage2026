let currentScene = -1
let titleInterval, storyInterval
let writing = false
let agentName = localStorage.getItem('user')
const sceneTitleElement = document.getElementById('scene-title')
const sceneTextElement = document.getElementById('scene-text')
const agentNameElement = document.getElementById('agent-name')

if(!agentName){
  window.location.replace("login.html")
} else {
  agentName = agentName.charAt(0).toUpperCase() + agentName.slice(1)
  agentNameElement.textContent = agentName
}


const sceneText = [['The Digital Age', ['2145. Data rules civilization, but something is corrupting the system', `You are Cipher, a legendary hacker known as "${agentName}".`, 'RoboTech is a powerful AI and robotics corporation that hires you to uncover the truth behind a mysterious system breach threatening global security', 'Decrypt the system before it\'s too late.']],
  ['The Labyrinth Awaits', ['The database is a maze of encrypted secrets.', 'Solve SQL challenges, but be warned. Mistakes cost you.', 'Triny, your AI ally, can help you, but at a price.', 'Crack the code. Survive the game.']],
  ['Are You Ready?', ['The future of RoboTech and the digital world rests in your hands.', 'Decrypt. Unravel. Survive.', 'Begin your journey.']],
]


function nextScene () {
  if (currentScene === sceneText.length - 1) return
  if (!writing) currentScene = currentScene + 1
  displayText()
}

function previousScene () {
  if (currentScene === 0 ) return
  if(!writing) currentScene = currentScene - 1
  displayText()
}

function displayText() {

  // Animate text with typewriter effect
  let titleText = sceneText[currentScene][0];
  // Create unordered list element
  let storyText = `<ul class="story-text">${sceneText[currentScene][1].map(line => `<li>${line}</li>`).join('')}</ul>`;


  // Clear previous content
  sceneTitleElement.textContent = '';
  sceneTextElement.textContent = '';
  
  // Make elements visible
  sceneTitleElement.style.opacity = 1;
  sceneTextElement.style.opacity = 1;

  
  sceneTitleElement.textContent = titleText
  sceneTextElement.innerHTML = storyText;
  displayArrows()



  if (currentScene === sceneText.length - 1) {
    document.getElementById('button-container').style.display = 'block'
  } else {
    document.getElementById('button-container').style.display = 'none'
  }
}

function displayArrows (writing) {
  if (currentScene > 0 && !writing) {
    document.getElementById('arrow-left').style.display = 'block'
  } else {
    document.getElementById('arrow-left').style.display = 'none'
  }

  if (currentScene < sceneText.length - 1 && !writing) {
    document.getElementById('arrow-right').style.display = 'block'
  } else {
    document.getElementById('arrow-right').style.display = 'none'
  }
}


window.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') nextScene()
  if (event.key === 'ArrowLeft') previousScene()
})

function beginGame () {
  window.location.replace("mainGame.html");
}

const canvasStory = document.querySelector('canvas')
const ctxStory = canvasStory.getContext('2d')

canvasStory.height = window.innerHeight
canvasStory.width = window.innerWidth

let lettersStory = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@$%&'
lettersStory = lettersStory.split('')

const fontSizeStory = 11
const columnsStory = canvasStory.width / fontSizeStory

const dropsStory = []
for (let i = 0; i < columnsStory; i++) {
  dropsStory[i] = Math.random() * canvasStory.height / fontSizeStory
}

function drawStory () {
  ctxStory.fillStyle = 'rgba(0, 0, 0, .1)'
  ctxStory.fillRect(0, 0, canvasStory.width, canvasStory.height)
  ctxStory.fillStyle = 'rgba(0, 255, 0, 0.35)'
  ctxStory.font = fontSizeStory + 'px arial'
  for (let i = 0; i < dropsStory.length; i++) {
    const text = lettersStory[Math.floor(Math.random() * lettersStory.length)]
    ctxStory.fillText(text, i * fontSizeStory, dropsStory[i] * fontSizeStory)
    if (dropsStory[i] * fontSizeStory > canvasStory.height && Math.random() > 0.975) dropsStory[i] = 0
    dropsStory[i] += 0.7
  }
}

setInterval(drawStory, 33)

nextScene()