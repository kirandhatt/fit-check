export function getRecommendation(sizeChart, measurements, userUnit, chartUnit) {
  let bestSize = null;
  let bestScore = Infinity;

  const weights = {
    bust: 0.4,
    waist: 0.4,
    hips: 0.2,
  };

  // define a standard deviation for each measurement (in inches)
  const standardDeviations = {
    bust: 2,
    waist: 2,
    hips: 2,
  };

  for (const size in sizeChart) {
    const chartMeasurements = sizeChart[size];
    let score = 0;
    let totalWeight = 0;

    for (const measure in weights) {
      if (chartMeasurements[measure] && measurements[measure]) {
        const userMeasure = convertToChartUnit(measurements[measure], userUnit, chartUnit);
        const chartMeasure = (chartMeasurements[measure].min + chartMeasurements[measure].max) / 2;
        const diff = Math.abs(chartMeasure - userMeasure);
        
        // convert the difference to inches for consistent scoring
        const diffInInches = chartUnit === 'cm' ? diff / 2.54 : diff;
        
        // calculate z-score
        const zScore = diffInInches / standardDeviations[measure];
        
        score += zScore * weights[measure];
        totalWeight += weights[measure];
      }
    }

    if (totalWeight > 0) {
      score /= totalWeight;
    }

    if (score < bestScore) {
      bestScore = score;
      bestSize = size;
    }
  }

  // calculate confidence based on the z-score
  const confidence = Math.max(0, Math.min(100, Math.round((1 - bestScore) * 100)));

  return {
    size: bestSize,
    confidence: confidence,
  };
}

function convertToChartUnit(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  return fromUnit === 'cm' ? value / 2.54 : value * 2.54;
}