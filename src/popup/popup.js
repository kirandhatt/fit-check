import '../styles/styles.scss';
import { parseSizeChart } from '../utils/sizeChartParser';
import { getRecommendation } from '../utils/sizeRecommendation';

document.addEventListener('DOMContentLoaded', () => {
  const measurementForm = document.getElementById('measurementForm');
  const optionsButton = document.getElementById('optionsButton');
  const findMySizeButton = document.getElementById('findMySizeButton');
  const popupContent = document.getElementById('popupContent');
  const recommendationContent = document.getElementById('recommendationContent');
  const optionsFrame = document.getElementById('optionsFrame');
  const backToPopupButton = document.getElementById('backToPopupButton');

  initializeExtension();
  loadMeasurements();

  measurementForm.addEventListener('submit', saveMeasurements);
  optionsButton.addEventListener('click', () => {
    popupContent.style.display = 'none';
    optionsFrame.style.display = 'block';
  });

  findMySizeButton.addEventListener('click', findMySize);

  backToPopupButton.addEventListener('click', () => {
    recommendationContent.style.display = 'none';
    popupContent.style.display = 'block';
  });

  chrome.storage.onChanged.addListener(handleStorageChanges);

  // add validation to prevent negative numbers
  const numberInputs = document.querySelectorAll('input[type="number"]');
  numberInputs.forEach(input => {
    input.addEventListener('input', () => {
      if (input.value < 0) input.value = 0;
    });
  });

  // listen for messages from options page
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'unitChange') {
      convertMeasurements(message.oldUnit, message.unit);
    } else if (message.type === 'switchToPopup') {
      optionsFrame.style.display = 'none';
      popupContent.style.display = 'block';
    }
  });

  // check if measurements exist and enable/disable the "Find My Size" button
  checkMeasurements();
});

function checkMeasurements() {
  chrome.storage.sync.get('measurements', (result) => {
    const measurements = result.measurements;
    const findMySizeButton = document.getElementById('findMySizeButton');
    
    if (measurements && Object.keys(measurements).length > 0) {
      findMySizeButton.disabled = false;
    } else {
      findMySizeButton.disabled = true;
    }
  });
}

function saveMeasurements(e) {
  e.preventDefault();
  const measurements = {
    chest: parseFloat(document.getElementById('chest').value),
    waist: parseFloat(document.getElementById('waist').value),
    hips: parseFloat(document.getElementById('hips').value),
  };

  // ensure measurements are not negative or empty
  for (const [key, value] of Object.entries(measurements)) {
    if (isNaN(value) || value < 0) {
      alert('Please enter valid measurements.');
      return;
    }
  }

  chrome.storage.sync.set({ measurements }, () => {
    alert('Measurements saved successfully!');
    checkMeasurements(); // check measurements after saving
  });
}

function findMySize() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: analyzePage
      }, (injectionResults) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          displayRecommendation({ size: 'Error: Unable to analyze page', confidence: 0 });
        } else if (injectionResults && injectionResults[0]) {
          displayRecommendation(injectionResults[0].result);
        } else {
          displayRecommendation({ size: 'Unable to determine', confidence: 0 });
        }
      });
    } else {
      console.error('No active tab found');
      displayRecommendation({ size: 'Error: No active tab', confidence: 0 });
    }
  });
}

function displayRecommendation(recommendation) {
  const sizeRecommendation = document.getElementById('sizeRecommendation');
  const confidenceLevel = document.getElementById('confidenceLevel');
  const popupContent = document.getElementById('popupContent');
  const recommendationContent = document.getElementById('recommendationContent');

  sizeRecommendation.textContent = `Recommended size: ${recommendation.size}`;
  confidenceLevel.textContent = `Confidence: ${recommendation.confidence}%`;

  popupContent.style.display = 'none';
  recommendationContent.style.display = 'block';
}

async function analyzePage() {
  try {
    const sizeChart = parseSizeChart(document);
    if (sizeChart) {
      const { measurements, unit = 'in' } = await chrome.storage.sync.get(['measurements', 'unit']);

      if (measurements) {
        return getRecommendation(sizeChart, measurements, unit);
      } else {
        return { size: 'No measurements found', confidence: 0 };
      }
    } else {
      return { size: 'No size chart found', confidence: 0 };
    }
  } catch (error) {
    console.error('Error analyzing the page:', error);
    return { size: 'Error analyzing the page', confidence: 0 };
  }
}

function loadMeasurements() {
  chrome.storage.sync.get(['measurements', 'unit'], (result) => {
    const measurements = result.measurements || {};
    const unit = result.unit || 'in';

    Object.keys(measurements).forEach(key => {
      const input = document.getElementById(key);
      if (input) {
        input.value = measurements[key].toFixed(2);
      }
    });

    updateUnitLabels(unit);
    checkMeasurements(); // check measurements after loading
  });
}

function updateUnitLabels(unit) {
  const unitLabels = document.querySelectorAll('.unit-label');
  const inputs = document.querySelectorAll('input[type="number"]');
  
  unitLabels.forEach(label => {
    label.textContent = unit === 'cm' ? '(cm)' : '(in)';
  });
  
  inputs.forEach(input => {
    if (unit === 'cm') {
      input.step = '1';
      input.placeholder = 'Enter in cm';
    } else {
      input.step = '0.1';
      input.placeholder = 'Enter in inches';
    }
  });
}

function handleStorageChanges(changes, namespace) {
  if (namespace === 'sync' && changes.unit) {
    updateUnitLabels(changes.unit.newValue);
  }
}

function initializeExtension() {
  chrome.storage.sync.get('unit', (result) => {
    const unit = result.unit || 'in';
    chrome.storage.sync.set({ unit: unit }, () => {
      updateUnitLabels(unit);
    });
  });
}

function convertMeasurements(oldUnit, newUnit) {
  chrome.storage.sync.get('measurements', (result) => {
    const measurements = result.measurements || {};
    const convertedMeasurements = {};

    Object.keys(measurements).forEach(key => {
      if (oldUnit === 'in' && newUnit === 'cm') {
        convertedMeasurements[key] = measurements[key] * 2.54;
      } else if (oldUnit === 'cm' && newUnit === 'in') {
        convertedMeasurements[key] = measurements[key] / 2.54;
      } else {
        convertedMeasurements[key] = measurements[key];
      }
    });

    chrome.storage.sync.set({ measurements: convertedMeasurements }, () => {
      loadMeasurements();
    });
  });
}