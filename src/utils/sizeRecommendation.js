export function getRecommendation(sizeChart, measurements, userUnit, chartUnit) {
  let bestSize = null;
  let bestScore = Infinity;

  const weights = {
    chest: 0.4,
    waist: 0.4,
    hips: 0.2,
  };

  for (const size in sizeChart) {
    const chartMeasurements = sizeChart[size];
    let score = 0;
    let totalWeight = 0;

    for (const measure in weights) {
      if (chartMeasurements[measure] !== undefined && measurements[measure] !== undefined) {
        const userMeasure = convertToPreferredUnit(measurements[measure], userUnit, chartUnit);
        const chartMeasure = chartMeasurements[measure];
        const diff = Math.abs(chartMeasure - userMeasure);
        score += diff * weights[measure];
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

  const confidence = Math.max(0, Math.min(100, Math.round((1 - bestScore / 5) * 100)));

  return {
    size: bestSize,
    confidence: confidence,
  };
}

function convertToPreferredUnit(value, fromUnit, toUnit) {
  if (fromUnit === 'cm' && toUnit === 'in') {
    return convertCmToInches(value);
  } else if (fromUnit === 'in' && toUnit === 'cm') {
    return convertInchesToCm(value);
  } else {
    return value; // no conversion needed if units are the same
  }
}

function convertCmToInches(cm) {
  return cm / 2.54;
}

function convertInchesToCm(inches) {
  return inches * 2.54;
}
