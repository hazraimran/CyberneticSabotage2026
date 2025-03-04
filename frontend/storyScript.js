let currentScene = 0
let interval
let writing = false
let agentName = localStorage.getItem('user')
const sceneTitleElement = document.getElementById('scene-title')
const sceneTextElement = document.getElementById('scene-text')
const agentNameElement = document.getElementById('agent-name')

if(!agentName){
  window.location.href = "index.html"
} else {
  agentName = agentName.charAt(0).toUpperCase() + agentName.slice(1)
  agentNameElement.textContent = agentName
}


const sceneText = [['The Digital Age',
  'The year is 2145. Cities shimmer with neon, and vast digital networks course through the veins of civilization. In this matrix-infused world, data is power, and power is everything. To embark on your journey, navigate with the left and right arrow keys.'],
  [`${agentName}'s Calling`,
  `You are an enigma prodigious programmer, known in hushed tones as ${agentName}. RoboTech Global, a global behemoth, is ensnared in a web of digital deception. Their databases hint at internal betrayal, external espionage, or perhaps... an AI evolving beyond its confines. They\'ve sent for you, the only one with the skills to decode the chaos.`],
  ['Navigating the Labyrinth',
  'Each database is a labyrinth, with secrets locked behind SQL challenges. Crack them, and your score soars. But be cautious: errors will deplete your score, and the deeper you go, the more intricate the queries become. While hints can light your way, they bear a cost. Use them wisely.'],
  ['Allies in Code',
  'Yet, in this digital expanse, you\'re not isolated. Triny, an advanced AI ally, stands by your side. Gleaming at the screen\'s corner, she\'s your beacon amidst the data storms, offering clues and guidance. But heed this: leaning on Triny too much might drain your score faster than you anticipate.'],
  ['The Future of RoboTech Global',
    'The future of RoboTech Global, and perhaps the digital world at large, hinges on your prowess. Beyond each SQL challenge lies a fragment of the truth. Can you piece together the mystery, or will you be consumed by the endless streams of data? Dive in, Cipher, and let the digital hunt begin!'],
  ['','']
]

document.getElementById('begin-button').addEventListener('click', beginGame)

function nextScene () {
  if (currentScene === sceneText.length - 1 || writing) return
  currentScene = (currentScene + 1) % sceneText.length
  displayText()
}

function previousScene () {
  if (currentScene === 0 || writing) return
  currentScene = (currentScene - 1 + sceneText.length) % sceneText.length
  displayText()
}

function displayText() {

  // Add fade effect to scene elements
  sceneTitleElement.style.opacity = 0;
  sceneTextElement.style.opacity = 0;
  
  // Animate text with typewriter effect
  let titleText = sceneText[currentScene][0];
  let storyText = sceneText[currentScene][1];
  let titleIndex = 0;
  let storyIndex = 0;

  // Clear previous content
  sceneTitleElement.textContent = '';
  sceneTextElement.textContent = '';
  
  // Make elements visible
  sceneTitleElement.style.opacity = 1;
  sceneTextElement.style.opacity = 1;

  writing = true
  displayArrows(true)
  // Animate title
  const titleInterval = setInterval(() => {
    if (titleIndex < titleText.length) {
      sceneTitleElement.textContent += titleText.charAt(titleIndex);
      titleIndex++;
    } else {
      clearInterval(titleInterval);
      // Start story text animation after title completes
      const storyInterval = setInterval(() => {
        if (storyIndex < storyText.length) {
          sceneTextElement.textContent += storyText.charAt(storyIndex);
          storyIndex++;
        } else {
          clearInterval(storyInterval);
          writing = false
          displayArrows(writing)
        }
      }, 10);
    }
  }, 50);

  if (currentScene === sceneText.length - 1) {
    document.getElementById('button-container').style.display = 'block'
  } else {
    document.getElementById('button-container').style.display = 'none'
  }
}

function displayArrows (writing) {
  if (currentScene > 1 && !writing) {
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
  window.location.href = "mainGame.html";
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