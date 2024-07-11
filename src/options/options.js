import '../styles/styles.scss';

document.addEventListener('DOMContentLoaded', () => {
  const optionsForm = document.getElementById('optionsForm');
  const backToPopupButton = document.getElementById('backToPopup');

  loadOptions();
  optionsForm.addEventListener('submit', saveOptions);
  backToPopupButton.addEventListener('click', () => {
    chrome.action.openPopup();
  });
});

function loadOptions() {
  chrome.storage.sync.get(['unit'], (result) => {
    const unitSelect = document.getElementById('unit');
    unitSelect.value = result.unit || 'in';
  });
}

function saveOptions(e) {
  e.preventDefault();
  const newUnit = document.getElementById('unit').value;

  chrome.storage.sync.get(['unit', 'measurements'], (result) => {
    const oldUnit = result.unit || 'in';
    const measurements = result.measurements || {};

    if (oldUnit !== newUnit) {
      Object.keys(measurements).forEach(key => {
        if (newUnit === 'cm') {
          measurements[key] *= 2.54;
        } else {
          measurements[key] /= 2.54;
        }
        measurements[key] = parseFloat(measurements[key].toFixed(2));
      });
    }

    chrome.storage.sync.set({ unit: newUnit, measurements }, () => {
      alert('Options saved successfully!');
    });
  });
}