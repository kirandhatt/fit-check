import { parseSizeChart } from '../utils/sizeChartParser';
import { getRecommendation } from '../utils/sizeRecommendation';
import '../styles/styles.scss';

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

function displayRecommendation(recommendation) {
  let recommendationDiv = document.getElementById('fitcheck-recommendation');
  if (!recommendationDiv) {
    recommendationDiv = document.createElement('div');
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
  } else {
    recommendationDiv.querySelector('strong').textContent = recommendation.size;
    recommendationDiv.querySelector('p:nth-child(3)').textContent = `Confidence: ${recommendation.confidence}%`;
  }
}

async function analyzePage() {
  window.addEventListener('load', async () => {
    setTimeout(async () => {
      try {
        const sizeChart = parseSizeChart(document);
        if (sizeChart) {
          const { measurements, unit = 'in' } = await getStoredData(['measurements', 'unit']);

          if (measurements) {
            const recommendation = getRecommendation(sizeChart, measurements, unit);
            displayRecommendation(recommendation);
          }
        }
      } catch (error) {
        console.error('Error analyzing the page:', error);
      }
    }, 500); // wait an additional half second for dynamic content to load
  });
}

analyzePage();
