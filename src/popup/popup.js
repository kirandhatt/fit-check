import '../styles/styles.scss';

function initializeExtension() {
  chrome.storage.sync.get(['unit'], (result) => {
    if (!result.unit) {
      chrome.storage.sync.set({ unit: 'in' }, () => {
        updateUnitLabels('in');
      });
    } else {
      updateUnitLabels(result.unit);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const measurementForm = document.getElementById('measurementForm');
  const optionsButton = document.getElementById('optionsButton');

  initializeExtension();
  loadMeasurements();

  measurementForm.addEventListener('submit', saveMeasurements);
  optionsButton.addEventListener('click', openOptions);

  chrome.storage.onChanged.addListener(handleStorageChanges);
});


// load saved measurements
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
  });
}

function saveMeasurements(e) {
  e.preventDefault();
  const measurements = {
    chest: parseFloat(document.getElementById('chest').value),
    waist: parseFloat(document.getElementById('waist').value),
    hips: parseFloat(document.getElementById('hips').value),
  };

  chrome.storage.sync.get(['unit'], (result) => {
    const unit = result.unit || 'in';
    if (unit === 'cm') {
      Object.keys(measurements).forEach(key => {
        measurements[key] = measurements[key] / 2.54;
      });
    }

    // save measurements
    chrome.storage.sync.set({ measurements }, () => {
      alert('Measurements saved successfully!');
    });
  });
}

function updateUnitLabels(unit) {
  const unitLabels = document.querySelectorAll('.unit-label');
  unitLabels.forEach(label => {
    label.textContent = unit === 'cm' ? 'centimeters' : 'inches';
  });

  // update input step and placeholder based on the unit
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

// listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.unit) {
    updateUnitLabels(changes.unit.newValue);
    chrome.storage.onChanged.addListener(handleStorageChanges);
  }
});

// handle changes in storage
function handleStorageChanges(changes, namespace) {
  if (namespace === 'sync' && changes.unit) {
    updateUnitLabels(changes.unit.newValue);
    loadMeasurements(); // reload measurements to display in the new unit
  }
}