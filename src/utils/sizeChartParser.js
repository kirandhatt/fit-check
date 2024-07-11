export function parseSizeChart(document) {
  const tables = document.querySelectorAll('table');
  for (const table of tables) {
    const sizeChart = parseSizeTable(table);
    if (sizeChart) {
      return sizeChart;
    }
  }
  return parseSizeText(document.body.innerText);
}

function parseSizeTable(table) {
  const headers = Array.from(table.querySelectorAll('th, td')).map(cell => cell.innerText ? cell.innerText.trim().toLowerCase() : '');
  const sizeIndex = headers.findIndex(header => /size|^s$|^m$|^l$/i.test(header));
  const measurementIndices = {
    chest: headers.findIndex(header => /chest|bust/i.test(header)),
    waist: headers.findIndex(header => /waist/i.test(header)),
    hips: headers.findIndex(header => /hip/i.test(header)),
  };

  if (sizeIndex === -1 || Object.values(measurementIndices).every(index => index === -1)) {
    return null;
  }

  const sizeChart = {};
  const rows = table.querySelectorAll('tr');

  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].querySelectorAll('td');
    if (cells.length <= sizeIndex) continue;
    const size = cells[sizeIndex].innerText ? cells[sizeIndex].innerText.trim() : '';
    if (!size) continue;
    sizeChart[size] = {};

    for (const [measure, index] of Object.entries(measurementIndices)) {
      if (index !== -1 && cells.length > index) {
        const value = parseFloat(cells[index].innerText ? cells[index].innerText.trim() : '');
        if (!isNaN(value)) {
          sizeChart[size][measure] = value;
        }
      }
    }
  }

  return Object.keys(sizeChart).length > 0 ? sizeChart : null;
}

function parseSizeText(text) {
  const sizeChartRegex = /Size\s+(\w+)[\s\S]*?Chest:?\s*(\d+(\.\d+)?)"?\s*Waist:?\s*(\d+(\.\d+)?)"?\s*Hips?:?\s*(\d+(\.\d+)?)"?/gi;
  const sizeChart = {};

  let match;
  while ((match = sizeChartRegex.exec(text)) !== null) {
    const [, size, chest, , waist, , hips] = match;
    sizeChart[size] = {
      chest: parseFloat(chest),
      waist: parseFloat(waist),
      hips: parseFloat(hips),
    };
  }

  return Object.keys(sizeChart).length > 0 ? sizeChart : null;
}