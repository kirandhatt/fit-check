import '../styles/styles.scss';

document.addEventListener('DOMContentLoaded', () => {
  const measurementForm = document.getElementById('measurementForm');
  const optionsButton = document.getElementById('optionsButton');

  initializeExtension();
  loadMeasurements();

  measurementForm.addEventListener('submit', saveMeasurements);
  optionsButton.addEventListener('click', openOptions);

  chrome.storage.onChanged.addListener(handleStorageChanges);

  // add validation to prevent negative numbers
  const numberInputs = document.querySelectorAll('input[type="number"]');
  numberInputs.forEach(input => {
    input.addEventListener('input', () => {
      if (input.value < 0) input.value = 0;
    });
  });
});

async function getStoredData(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

async function setStoredData(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

async function initializeExtension() {
  try {
    const { unit } = await getStoredData(['unit']);
    if (!unit) {
      await setStoredData({ unit: 'in' });
      updateUnitLabels('in');
    } else {
      updateUnitLabels(unit);
    }
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

async function loadMeasurements() {
  try {
    const { measurements = {}, unit = 'in' } = await getStoredData(['measurements', 'unit']);

    Object.keys(measurements).forEach(key => {
      const input = document.getElementById(key);
      if (input) {
        input.value = measurements[key].toFixed(2);
      }
    });

    updateUnitLabels(unit);
  } catch (error) {
    console.error('Error loading measurements:', error);
  }
}

async function saveMeasurements(e) {
  e.preventDefault();
  const measurements = {
    chest: parseFloat(document.getElementById('chest').value),
    waist: parseFloat(document.getElementById('waist').value),
    hips: parseFloat(document.getElementById('hips').value),
  };

  // ensure measurements are not negative
  for (const key in measurements) {
    if (measurements[key] < 0) {
      alert('Measurements cannot be negative.');
      return;
    }
  }

  try {
    const { unit = 'in' } = await getStoredData(['unit']);
    if (unit === 'cm') {
      Object.keys(measurements).forEach(key => {
        measurements[key] = measurements[key] / 2.54;
      });
    }

    await setStoredData({ measurements });
    alert('Measurements saved successfully!');
  } catch (error) {
    console.error('Error saving measurements:', error);
  }
}

function updateUnitLabels(unit) {
  const unitLabels = document.querySelectorAll('.unit-label');
  unitLabels.forEach(label => {
    label.textContent = unit === 'cm' ? 'centimeters' : 'inches';
  });

  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    if (unit === 'cm') {
      input.step = '0.1';
      input.placeholder = 'Enter in cm';
    } else {
      input.step = '0.01';
      input.placeholder = 'Enter in inches';
    }
  });
}

function openOptions() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

function handleStorageChanges(changes, namespace) {
  if (namespace === 'sync' && changes.unit) {
    updateUnitLabels(changes.unit.newValue);
    loadMeasurements(); // reload measurements to display in the new unit
  }
}