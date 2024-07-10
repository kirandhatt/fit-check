import '../styles/styles.scss';

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('settingsForm').addEventListener('submit', saveOptions);
document.getElementById('unitSystem').addEventListener('change', updateUnitLabels);

function saveOptions(e) {
    e.preventDefault();
    const measurements = {
        chest: parseFloat(document.getElementById('chest').value),
        waist: parseFloat(document.getElementById('waist').value),
        hips: parseFloat(document.getElementById('hips').value)
    };
    const preferences = {
        preferredFit: document.getElementById('preferredFit').value,
        unitSystem: document.getElementById('unitSystem').value
    };

    const oldUnitSystem = document.getElementById('unitSystem').dataset.oldValue;
    if (oldUnitSystem !== preferences.unitSystem) {
        if (preferences.unitSystem === 'imperial') {
            Object.keys(measurements).forEach(key => {
                measurements[key] = (measurements[key] / 2.54).toFixed(2);
            });
        } else {
            Object.keys(measurements).forEach(key => {
                measurements[key] = (measurements[key] * 2.54).toFixed(2);
            });
        }
    }

    chrome.storage.sync.set(
        { measurements: measurements, preferences: preferences },
        function() {
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(function() {
                status.textContent = '';
            }, 750);
            updateUnitLabels();
        }
    );
};

function restoreOptions() {
    chrome.storage.sync.get(
        { 
            measurements: { chest: '', waist: '', hips: '' },
            preferences: { preferredFit: 'regular', unitSystem: 'metric' }
        },
        function(items) {
            document.getElementById('chest').value = items.measurements.chest;
            document.getElementById('waist').value = items.measurements.waist;
            document.getElementById('hips').value = items.measurements.hips;
            document.getElementById('preferredFit').value = items.preferences.preferredFit;
            document.getElementById('unitSystem').value = items.preferences.unitSystem;
            document.getElementById('unitSystem').dataset.oldValue = items.preferences.unitSystem;
            updateUnitLabels();
        }
    );
};

function updateUnitLabels() {
    const unitSystem = document.getElementById('unitSystem').value;
    const unitLabel = unitSystem === 'metric' ? 'cm' : 'inches';
    document.getElementById('chestUnit').textContent = unitLabel;
    document.getElementById('waistUnit').textContent = unitLabel;
    document.getElementById('hipsUnit').textContent = unitLabel;
};