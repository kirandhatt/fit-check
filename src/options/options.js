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
    const unitSelect = document.getElementById('unit');
    if (unitSelect) {
      unitSelect.value = unit;
    } else {
      console.error('Unit select element not found');
    }
  } catch (error) {
    console.error('Error loading options:', error);
  }
}

async function saveOptions(e) {
  e.preventDefault();
  const unitSelect = document.getElementById('unit');
  if (!unitSelect) {
    console.error('Unit select element not found');
    return;
  }
  const newUnit = unitSelect.value;

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
    chrome.runtime.sendMessage({ type: 'unitChange', unit: newUnit, oldUnit: oldUnit });

  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

function closeOptionsPage() {
  chrome.runtime.sendMessage({ type: 'switchToPopup' });
}

function initializeOptionsPage() {
  const optionsForm = document.getElementById('optionsForm');
  const backToPopupButton = document.getElementById('backToPopup');

  if (optionsForm) {
    optionsForm.addEventListener('submit', saveOptions);
  } else {
    console.error('Options form not found');
  }

  if (backToPopupButton) {
    backToPopupButton.addEventListener('click', closeOptionsPage);
  } else {
    console.error('Back to popup button not found');
  }

  loadOptions();
}

// wait for the DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOptionsPage);
} else {
  initializeOptionsPage();
}