import '../styles/styles.scss';

document.addEventListener('DOMContentLoaded', () => {
  const optionsForm = document.getElementById('optionsForm');
  const backToPopupButton = document.getElementById('backToPopup');

  loadOptions();
  optionsForm.addEventListener('submit', saveOptions);
  backToPopupButton.addEventListener('click', closeOptionsPage);
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

async function loadOptions() {
  try {
    const { unit = 'in' } = await getStoredData(['unit']);
    document.getElementById('unit').value = unit;
  } catch (error) {
    console.error('Error loading options:', error);
  }
}

async function saveOptions(e) {
  e.preventDefault();
  const newUnit = document.getElementById('unit').value;

  try {
    const { unit: oldUnit = 'in', measurements = {} } = await getStoredData(['unit', 'measurements']);

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

    await setStoredData({ unit: newUnit, measurements });
    alert('Preferences saved successfully!');

    // send a message to the popup to update the unit labels
    chrome.runtime.sendMessage({ type: 'unitChange', unit: newUnit });

  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

function closeOptionsPage() {
  chrome.runtime.sendMessage({ type: 'switchToPopup' });
}