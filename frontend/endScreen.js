const startPageButton = document.getElementById('start-page')
const restartEndButton = document.getElementById('restart-gameover')
const headerText = document.getElementById('main-text')
const submitButton = document.getElementById('submitButton');

startPageButton.addEventListener('click',goToMain);
restartEndButton.addEventListener('click', restart)

const searchParams = new URLSearchParams(window.location.search)
const gameStatus = searchParams.get('gameStatus')

if (gameStatus === 'win') {
  headerText.innerHTML = 'You won! Congratulations!!! \n\n Please select one of the following options:\n\n'
} else if (gameStatus === 'lose') {
  headerText.innerHTML = 'You lost!\nSorry, please try again!\n\n'
}
else{
  headerText.innerHTML = 'Good try!\nYou got, '+gameStatus+' score';
}

submitButton.onclick = (e) => {
  e.preventDefault(); // Corrected method name

  let responses = {};

            // Retrieve gender selection
            const selectedGender = document.querySelector('input[name="gender"]:checked');
            responses.gender = selectedGender ? selectedGender.value : "Not selected";

            // Retrieve dropdown (select) responses
            const selectFields = ['narrative', 'motivation', 'sqlConfidence', 'interfaceEase', 
                                  'instructionsClarity', 'overallExperience', 'interactionFlow',
                                  'sqlRecall', 'storylineMotivation', 'interestInSQL', 'suspenseEffectiveness'];
            
            selectFields.forEach(fieldName => {
                const selectedOption = document.querySelector(`input[name="${fieldName}"]:checked`);
                responses[fieldName] = selectedOption?selectedOption.value:"Not Selected";
            });

            // Retrieve text area responses
            responses.designFeedback = document.getElementById('designFeedback').value;
            responses.frustrationPoints = document.getElementById('frustrationPoints').value;
            responses.usabilitySuggestions = document.getElementById('usabilitySuggestions').value;

          const data={
            'username':localStorage.getItem('user'),
            'responses':responses
          };
  submitRes(data); // Call the function to submit the response
};

async function submitRes(usr_res) {
  try {
    const response = await fetch('https://sqlgameserver.onrender.com/submitSurveyResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usr_res),
    });
    document.getElementById('message').textContent="Feedback saved Succesfully";
    if(!response.ok){
      const errorData = await response.json(); // Capture the response body
      throw new Error(`Error ${response.status}: ${errorData.error || 'Unknown error'}`);
      document.getElementById("message").textContent="Error while sending feedback";
    }
    localStorage.clear;
    const data = await response.json();
    console.log("Server response:", data);
  } catch (error) {
    console.error("Error submitting data:", error);
    alert("There was a problem submitting your data. Please try again."); // User-friendly message
  }
}


function goToMain () {
  location.assign('index.html')
}

function restart () {
  location.assign('mainGame.html')
}
