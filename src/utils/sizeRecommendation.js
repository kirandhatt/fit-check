export function getRecommendation(sizeChart, measurements, unit) {
    let bestSize = null;
    let bestScore = Infinity;
    let totalWeight = 0;
  
    const weights = {
      chest: 0.4,
      waist: 0.4,
      hips: 0.2,
    };
  
    for (const size in sizeChart) {
      const chartMeasurements = sizeChart[size];
      let score = 0;
  
      for (const measure in weights) {
        if (chartMeasurements[measure] && measurements[measure]) {
          const userMeasure = unit === 'cm' ? measurements[measure] / 2.54 : measurements[measure];
          const diff = Math.abs(chartMeasurements[measure] - userMeasure);
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