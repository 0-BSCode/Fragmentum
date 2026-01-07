// Get DOM elements
const colorPicker = document.getElementById('colorPicker');
const changeColorBtn = document.getElementById('changeColorBtn');
const resetBtn = document.getElementById('resetBtn');
const presetButtons = document.querySelectorAll('.preset-color');

// Function to change background color
async function changeBackgroundColor(color) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [color],
    func: (color) => {
      document.body.style.backgroundColor = color;
    }
  });
}

// Function to reset background color
async function resetBackgroundColor() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      document.body.style.backgroundColor = '';
    }
  });
}

// Event listeners
changeColorBtn.addEventListener('click', () => {
  const selectedColor = colorPicker.value;
  changeBackgroundColor(selectedColor);
});

resetBtn.addEventListener('click', () => {
  resetBackgroundColor();
});

// Preset color buttons
presetButtons.forEach(button => {
  button.addEventListener('click', () => {
    const color = button.getAttribute('data-color');
    colorPicker.value = color;
    changeBackgroundColor(color);
  });
});
