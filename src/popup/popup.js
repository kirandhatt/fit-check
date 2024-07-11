import '../styles/styles.scss';

document.addEventListener('DOMContentLoaded', () => {
  const measurementForm = document.getElementById('measurementForm');
  const optionsButton = document.getElementById('optionsButton');

  loadMeasurements();

  measurementForm.addEventListener('submit', saveMeasurements);
  optionsButton.addEventListener('click', openOptions);
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
  const unitSpans = document.querySelectorAll('.unit');
  unitSpans.forEach(span => {
    span.textContent = unit;
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
  chrome.runtime.openOptionsPage();
}

// listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.unit) {
    updateUnitLabels(changes.unit.newValue);
  }
});