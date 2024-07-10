document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('measurementForm');
    const sizeRecommendation = document.getElementById('sizeRecommendation');
  
    // load saved measurements
    chrome.storage.sync.get(['measurements'], function(result) {
      if (result.measurements) {
        document.getElementById('chest').value = result.measurements.chest;
        document.getElementById('waist').value = result.measurements.waist;
        document.getElementById('hips').value = result.measurements.hips;
      }
    });
  
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const measurements = {
        chest: document.getElementById('chest').value,
        waist: document.getElementById('waist').value,
        hips: document.getElementById('hips').value
      };
  
      // save measurements
      chrome.storage.sync.set({measurements: measurements}, function() {
        console.log('Measurements saved');
      });
    });
  });