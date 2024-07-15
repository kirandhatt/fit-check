export async function parseSizeChart(document) {
  const sizeChart = parseSizeChartFromDocument(document);
  if (sizeChart) {
    return sizeChart;
  }

  const sizeGuideLinks = Array.from(document.querySelectorAll('a')).filter(link =>
    /size\s*guide|sizing\s*guide|size\s*chart|sizing\s*chart/i.test(link.innerText)
  );

  for (const link of sizeGuideLinks) {
    const response = await fetch(link.href);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const sizeChart = parseSizeChartFromDocument(doc);
    if (sizeChart) {
      return sizeChart;
    }
  }

  return null;
}

function parseSizeChartFromDocument(doc) {
  const tables = doc.querySelectorAll('table');
  let sizeChart = null;
  let detectedUnit = null;

  for (const table of tables) {
    const headers = Array.from(table.querySelectorAll('th, td')).map(cell => cell.innerText.trim().toLowerCase());
    const sizeIndex = headers.findIndex(header => /size|^s$|^m$|^l$/i.test(header));
    const measurementIndices = {
      bust: headers.findIndex(header => /bust|chest/i.test(header)),
      waist: headers.findIndex(header => /waist/i.test(header)),
      hips: headers.findIndex(header => /hip/i.test(header)),
    };

    if (sizeIndex === -1 || Object.values(measurementIndices).every(index => index === -1)) {
      continue;
    }

    detectedUnit = detectUnit(headers);

    if (!detectedUnit) {
      continue;
    }

    sizeChart = parseSizeTable(table, sizeIndex, measurementIndices, detectedUnit);
    if (sizeChart) {
      break;
    }
  }

  return sizeChart ? { sizeChart, unit: detectedUnit } : null;
}

function detectUnit(headers) {
  const unitHeader = headers.find(header => /cm|centimetre|centimeter|inch|inches/i.test(header));
  if (unitHeader) {
    return /cm|centimetre|centimeter/i.test(unitHeader) ? 'cm' : 'in';
  }
  return null;
}

function parseSizeTable(table, sizeIndex, measurementIndices, detectedUnit) {
  const sizeChart = {};
  const rows = table.querySelectorAll('tr');

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td');
    if (cells.length <= sizeIndex) continue;
    const size = cells[sizeIndex].innerText.trim();
    if (!size) continue;
    sizeChart[size] = {};

    for (const [measure, index] of Object.entries(measurementIndices)) {
      if (index !== -1 && cells.length > index) {
        let rangeText = cells[index].innerText.trim();
        let values = rangeText.split('-').map(val => parseFloat(val.trim()));
        let min = values[0];
        let max = values.length > 1 ? values[1] : values[0];

        if (isNaN(min) || isNaN(max)) {
          continue;
        }

        sizeChart[size][measure] = { min, max };
      }
    }
  }

  return Object.keys(sizeChart).length > 0 ? sizeChart : null;
}