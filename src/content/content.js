import { parseSizeChart } from '../utils/sizeChartParser';
import { getRecommendation } from '../utils/sizeRecommendation';
import '../styles/styles.scss';

function analyzePage() {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const sizeChart = parseSizeChart(document);
      if (sizeChart) {
        chrome.storage.sync.get(['measurements', 'unit'], (result) => {
          const measurements = result.measurements;
          const unit = result.unit || 'in';

          if (measurements) {
            const recommendation = getRecommendation(sizeChart, measurements, unit);
            displayRecommendation(recommendation);
          }
        });
      }
    }, 1000); // wait an additional second for dynamic content to load
  });
}

function displayRecommendation(recommendation) {
  const existingRecommendation = document.getElementById('fitcheck-recommendation');
  if (existingRecommendation) {
    existingRecommendation.remove();
  }

  const recommendationDiv = document.createElement('div');
  recommendationDiv.id = 'fitcheck-recommendation';
  recommendationDiv.innerHTML = `
    <h3>FitCheck Recommendation</h3>
    <p>Based on your measurements, we recommend size: <strong>${recommendation.size}</strong></p>
    <p>Confidence: ${recommendation.confidence}%</p>
    <button id="fitcheck-close">Close</button>
  `;
  document.body.appendChild(recommendationDiv);

  document.getElementById('fitcheck-close').addEventListener('click', () => {
    recommendationDiv.remove();
  });
}

analyzePage();