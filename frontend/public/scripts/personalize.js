/**
 * Personalizes the game based on the user's settings
 * @returns {void}
 */
const personalize = () => {
  const options = getPersonalizedSettings();

  for (const option in options) {
    if (localStorage.getItem(option)) {
      document.documentElement.style.setProperty(`--${option}`, localStorage.getItem(option));
    }
  }
}
  
/**
 * Gets the personalized settings from the local storage
 * @returns {Object} The personalized settings
 */
const getPersonalizedSettings = () => {
  const options = {
    'main-color': localStorage.getItem('main-color'),
    'constraint-color': localStorage.getItem('constraint-color'),
    'text-color': localStorage.getItem('text-color'),
  }

  return options;
}

personalize();
  
    