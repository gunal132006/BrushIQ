const fs = require('fs');
const path = require('path');
const { Jimp, intToRGBA, rgbaToInt } = require('jimp');
const { v4: uuidv4 } = require('uuid');
const mlAnalyzer = require('./mlAnalyzer');
const { validateToothbrushObject } = require('./objectDetector');

/**
 * AI toothbrush analysis engine.
 * Computes image quality scoring, bristle spread index, bristle density estimation,
 * wear trend progression, and overall health scores ONLY for confirmed single toothbrushes.
 * 
 * @param {string} imagePath - File path to the toothbrush image
 * @returns {Promise<Object>} Detailed report object compatible with database and frontend
 */
exports.analyzeToothbrushImage = async (imagePath) => {
  // 1. HARD VALIDATION GATE: Quality + Object Detection + Toothbrush Validation
  const validationResult = await validateToothbrushObject(imagePath);

  // 2. PROCEED TO WEAR ANALYSIS ONLY AFTER TOOTHBRUSH IS CONFIRMED
  console.log('[WEAR ANALYSIS] Starting wear analysis');

  const img = await Jimp.read(imagePath);
  const origW = img.bitmap.width;
  const origH = img.bitmap.height;

  const getLuma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

  const origGray = new Float32Array(origW * origH);
  let origSumBrightness = 0;
  for (let y = 0; y < origH; y++) {
    for (let x = 0; x < origW; x++) {
      const idx = (y * origW + x) * 4;
      const r = img.bitmap.data[idx];
      const g = img.bitmap.data[idx + 1];
      const b = img.bitmap.data[idx + 2];
      const luma = getLuma(r, g, b);
      origGray[y * origW + x] = luma;
      origSumBrightness += luma;
    }
  }
  const avgBrightness = origSumBrightness / (origW * origH);

  let sumL = 0, sumL2 = 0, countL = 0;
  for (let y = 1; y < origH - 1; y++) {
    for (let x = 1; x < origW - 1; x++) {
      const idx = y * origW + x;
      const val = 
        origGray[idx - origW] + origGray[idx - 1] + origGray[idx + 1] + origGray[idx + origW] - 4 * origGray[idx];
      sumL += val;
      sumL2 += val * val;
      countL++;
    }
  }
  const meanL = sumL / countL;
  const laplacianVariance = (sumL2 / countL) - (meanL * meanL);

  let confidenceWarning = null;
  if (laplacianVariance < 55.0) {
    confidenceWarning = "The image is slightly blurry, which may reduce analysis confidence.";
  } else if (avgBrightness < 70.0 || avgBrightness > 200.0) {
    confidenceWarning = "Suboptimal lighting detected. For best results, capture in bright, even lighting.";
  }

  let imageQualityScore = 100.0;
  if (laplacianVariance < 100.0) {
    imageQualityScore -= (100.0 - laplacianVariance) * 0.5;
  }
  if (avgBrightness < 80.0) {
    imageQualityScore -= (80.0 - avgBrightness) * 0.5;
  } else if (avgBrightness > 180.0) {
    imageQualityScore -= (avgBrightness - 180.0) * 0.5;
  }
  imageQualityScore = Math.max(40.0, Math.min(100.0, imageQualityScore));

  // Resize image to 200x200 for processing
  await img.resize({ w: 200, h: 200 });
  const width = img.bitmap.width;
  const height = img.bitmap.height;

  const gray = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      gray[y * width + x] = getLuma(img.bitmap.data[idx], img.bitmap.data[idx + 1], img.bitmap.data[idx + 2]);
    }
  }

  // Sobel Edge Detection
  const sobel = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const gx = 
        -gray[(y-1)*width + (x-1)] + gray[(y-1)*width + (x+1)] +
        -2*gray[y*width + (x-1)] + 2*gray[y*width + (x+1)] +
        -gray[(y+1)*width + (x-1)] + gray[(y+1)*width + (x+1)];
      const gy = 
        -gray[(y-1)*width + (x-1)] - 2*gray[(y-1)*width + x] - gray[(y-1)*width + (x+1)] +
        gray[(y+1)*width + (x-1)] + 2*gray[(y+1)*width + x] + gray[(y+1)*width + (x+1)];
      sobel[y*width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // PCA / Principal axis rotation
  let m00 = 0, m10 = 0, m01 = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const val = sobel[y * width + x];
      if (val > 25) {
        m00 += val;
        m10 += x * val;
        m01 += y * val;
      }
    }
  }

  let rotationAngle = 0;
  if (m00 > 0) {
    const cx = m10 / m00;
    const cy = m01 / m00;
    
    let mu20 = 0, mu02 = 0, mu11 = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const val = sobel[y * width + x];
        if (val > 25) {
          const dx = x - cx;
          const dy = y - cy;
          mu20 += dx * dx * val;
          mu02 += dy * dy * val;
          mu11 += dx * dy * val;
        }
      }
    }
    
    const theta = 0.5 * Math.atan2(2 * mu11, mu20 - mu02);
    const angleDegrees = (theta * 180) / Math.PI;
    rotationAngle = 90 - angleDegrees;
    
    if (rotationAngle > 180) rotationAngle -= 360;
    if (rotationAngle < -180) rotationAngle += 360;
  }
  
  if (Math.abs(rotationAngle) > 1.0) {
    await img.rotate(rotationAngle);
  }

  // Head detection and bounds calculation
  const rotWidth = img.bitmap.width;
  const rotHeight = img.bitmap.height;

  const rotGray = new Float32Array(rotWidth * rotHeight);
  for (let y = 0; y < rotHeight; y++) {
    for (let x = 0; x < rotWidth; x++) {
      const idx = (y * rotWidth + x) * 4;
      rotGray[y * rotWidth + x] = getLuma(img.bitmap.data[idx], img.bitmap.data[idx+1], img.bitmap.data[idx+2]);
    }
  }

  const rotSobel = new Float32Array(rotWidth * rotHeight);
  for (let y = 1; y < rotHeight - 1; y++) {
    for (let x = 1; x < rotWidth - 1; x++) {
      const gx = 
        -rotGray[(y-1)*rotWidth + (x-1)] + rotGray[(y-1)*rotWidth + (x+1)] +
        -2*rotGray[y*rotWidth + (x-1)] + 2*rotGray[y*rotWidth + (x+1)] +
        -rotGray[(y+1)*rotWidth + (x-1)] + rotGray[(y+1)*rotWidth + (x+1)];
      const gy = 
        -rotGray[(y-1)*rotWidth + (x-1)] - 2*rotGray[(y-1)*rotWidth + x] - rotGray[(y-1)*rotWidth + (x+1)] +
        rotGray[(y+1)*rotWidth + (x-1)] + 2*rotGray[(y+1)*rotWidth + x] + rotGray[(y+1)*rotWidth + (x+1)];
      rotSobel[y*rotWidth + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  const rowEdges = new Float32Array(rotHeight);
  for (let y = 0; y < rotHeight; y++) {
    let count = 0;
    for (let x = 0; x < rotWidth; x++) {
      if (rotSobel[y * rotWidth + x] > 25) {
        count++;
      }
    }
    rowEdges[y] = count;
  }

  const wSize = Math.round(rotHeight * 0.3);
  let maxEdgesSum = -1;
  let bestY = 0;
  for (let y = 0; y <= rotHeight - wSize; y++) {
    let sum = 0;
    for (let i = 0; i < wSize; i++) {
      sum += rowEdges[y + i];
    }
    if (sum > maxEdgesSum) {
      maxEdgesSum = sum;
      bestY = y;
    }
  }

  let yMin = bestY;
  let yMax = bestY + wSize;
  const avgEdgeDensity = maxEdgesSum / wSize;
  const cutThreshold = 0.08 * avgEdgeDensity;
  while (yMin > 0 && rowEdges[yMin - 1] > cutThreshold) {
    yMin--;
  }
  while (yMax < rotHeight - 1 && rowEdges[yMax + 1] > cutThreshold) {
    yMax++;
  }

  let xMin = rotWidth;
  let xMax = 0;
  for (let y = yMin; y <= yMax; y++) {
    for (let x = 0; x < rotWidth; x++) {
      if (rotSobel[y * rotWidth + x] > 25) {
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
      }
    }
  }

  if (xMin >= xMax || yMin >= yMax) {
    xMin = Math.round(rotWidth * 0.2);
    xMax = Math.round(rotWidth * 0.8);
    yMin = Math.round(rotHeight * 0.15);
    yMax = Math.round(rotHeight * 0.45);
  }

  const padding = 6;
  yMin = Math.max(0, yMin - padding);
  yMax = Math.min(rotHeight - 1, yMax + padding);
  xMin = Math.max(0, xMin - padding);
  xMax = Math.min(rotWidth - 1, xMax + padding);

  const cropW = xMax - xMin + 1;
  const cropH = yMax - yMin + 1;

  await img.crop({ x: xMin, y: yMin, w: cropW, h: cropH });

  // Normalize Scale (120x160)
  await img.resize({ w: 120, h: 160 });
  const normW = 120;
  const normH = 160;

  const normGray = new Float32Array(normW * normH);
  for (let y = 0; y < normH; y++) {
    for (let x = 0; x < normW; x++) {
      const idx = (y * normW + x) * 4;
      normGray[y * normW + x] = getLuma(img.bitmap.data[idx], img.bitmap.data[idx+1], img.bitmap.data[idx+2]);
    }
  }

  const normSobel = new Float32Array(normW * normH);
  for (let y = 1; y < normH - 1; y++) {
    for (let x = 1; x < normW - 1; x++) {
      const gx = 
        -normGray[(y-1)*normW + (x-1)] + normGray[(y-1)*normW + (x+1)] +
        -2*normGray[y*normW + (x-1)] + 2*normGray[y*normW + (x+1)] +
        -normGray[(y+1)*normW + (x-1)] + normGray[(y+1)*normW + (x+1)];
      const gy = 
        -normGray[(y-1)*normW + (x-1)] - 2*normGray[(y-1)*normW + x] - normGray[(y-1)*normW + (x+1)] +
        normGray[(y+1)*normW + (x-1)] + 2*normGray[(y+1)*normW + x] + normGray[(y+1)*normW + (x+1)];
      normSobel[y*normW + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  const localSD = new Float32Array(normW * normH);
  for (let y = 1; y < normH - 1; y++) {
    for (let x = 1; x < normW - 1; x++) {
      let sum = 0, sum2 = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const l = normGray[(y + dy) * normW + (x + dx)];
          sum += l;
          sum2 += l * l;
        }
      }
      const mean = sum / 9;
      const variance = (sum2 / 9) - (mean * mean);
      localSD[y * normW + x] = Math.sqrt(Math.max(0, variance));
    }
  }

  // Background profiling
  let normBgR = 0, normBgG = 0, normBgB = 0, normBgCount = 0;
  const corners = [
    {x: 0, y: 0}, {x: normW-1, y: 0}, 
    {x: 0, y: normH-1}, {x: normW-1, y: normH-1},
    {x: 2, y: 2}, {x: normW-3, y: 2}
  ];
  corners.forEach(c => {
    const idx = (c.y * normW + c.x) * 4;
    normBgR += img.bitmap.data[idx];
    normBgG += img.bitmap.data[idx+1];
    normBgB += img.bitmap.data[idx+2];
    normBgCount++;
  });
  normBgR /= normBgCount;
  normBgG /= normBgCount;
  normBgB /= normBgCount;

  const bristleMask = Array(normH).fill(0).map(() => Array(normW).fill(0));
  let bristlePixelCount = 0;
  for (let y = 0; y < normH; y++) {
    for (let x = 0; x < normW; x++) {
      const idx = (y * normW + x) * 4;
      const r = img.bitmap.data[idx];
      const g = img.bitmap.data[idx+1];
      const b = img.bitmap.data[idx+2];
      const dist = Math.sqrt((r-normBgR)*(r-normBgR) + (g-normBgG)*(g-normBgG) + (b-normBgB)*(b-normBgB));
      
      const isEdge = normSobel[y * normW + x] > 20.0;
      const isTexture = localSD[y * normW + x] > 12.0;

      if (dist > 30.0 && (isEdge || isTexture)) {
        bristleMask[y][x] = 1;
        bristlePixelCount++;
      }
    }
  }

  // CRITICAL FIX: REMOVED SYNTHETIC DUMMY BRISTLE MASK INJECTION!
  // (No more forcing dummy bristle mask rectangle if bristlePixelCount < 100)

  // Calculations for individual wear types
  let maxSplayWidth = 0;
  let baseWidthSum = 0;
  let baseRowsCount = 0;
  const splayZoneHeight = Math.round(normH * 0.25);

  for (let y = 0; y < normH; y++) {
    let xMinRow = normW, xMaxRow = -1;
    for (let x = 0; x < normW; x++) {
      if (bristleMask[y][x] === 1) {
        if (x < xMinRow) xMinRow = x;
        if (x > xMaxRow) xMaxRow = x;
      }
    }
    if (xMaxRow >= xMinRow) {
      const rowWidth = xMaxRow - xMinRow + 1;
      if (y < splayZoneHeight || y > normH - splayZoneHeight) {
        if (rowWidth > maxSplayWidth) maxSplayWidth = rowWidth;
      } else {
        baseWidthSum += rowWidth;
        baseRowsCount++;
      }
    }
  }

  const avgBaseWidth = baseRowsCount > 0 ? (baseWidthSum / baseRowsCount) : normW * 0.5;
  const splayIndex = avgBaseWidth > 0 ? (maxSplayWidth / avgBaseWidth) : 1.0;
  let spreadingRaw = Math.max(0.0, Math.min(100.0, (splayIndex - 1.0) * 150.0));

  // Bending
  let sumSqrDiff = 0;
  let centroidCount = 0;
  const rowCentroids = [];
  for (let y = 0; y < normH; y++) {
    let sumX = 0, countX = 0;
    for (let x = 0; x < normW; x++) {
      if (bristleMask[y][x] === 1) {
        sumX += x;
        countX++;
      }
    }
    if (countX > 0) {
      rowCentroids.push({ y, cx: sumX / countX });
    }
  }

  let sumCx = 0;
  rowCentroids.forEach(c => sumCx += c.cx);
  const avgCx = rowCentroids.length > 0 ? sumCx / rowCentroids.length : normW / 2;
  rowCentroids.forEach(c => {
    sumSqrDiff += Math.pow(c.cx - avgCx, 2);
    centroidCount++;
  });
  const bendingSD = centroidCount > 0 ? Math.sqrt(sumSqrDiff / centroidCount) : 0;
  let bendingRaw = Math.max(0.0, Math.min(100.0, bendingSD * 12.0));

  // Fraying
  let edgePixelCount = 0;
  for (let y = 0; y < normH; y++) {
    for (let x = 0; x < normW; x++) {
      if (bristleMask[y][x] === 1 && normSobel[y * normW + x] > 20.0) {
        edgePixelCount++;
      }
    }
  }
  const edgeRatio = bristlePixelCount > 0 ? (edgePixelCount / bristlePixelCount) : 0.0;
  let damageRaw = Math.max(0.0, Math.min(100.0, (edgeRatio - 0.18) * 280.0));

  // Density
  let bYMin = normH, bYMax = 0, bXMin = normW, bXMax = 0;
  for (let y = 0; y < normH; y++) {
    for (let x = 0; x < normW; x++) {
      if (bristleMask[y][x] === 1) {
        if (y < bYMin) bYMin = y;
        if (y > bYMax) bYMax = y;
        if (x < bXMin) bXMin = x;
        if (x > bXMax) bXMax = x;
      }
    }
  }
  const bW = bXMax - bXMin + 1;
  const bH = bYMax - bYMin + 1;
  const bArea = bW * bH;
  const bristleDensityRatio = bArea > 0 ? (bristlePixelCount / bArea) : 0.0;
  const targetDensity = 0.60;
  let densityLossRaw = Math.max(0.0, Math.min(100.0, (1.0 - (bristleDensityRatio / targetDensity)) * 100.0));

  // 5-Factor Scoring
  const densityScore = parseFloat(Math.max(0, Math.min(100, 100.0 - densityLossRaw)).toFixed(1));
  const spreadScore = parseFloat(Math.max(0, Math.min(100, 100.0 - spreadingRaw)).toFixed(1));
  const frayingScore = parseFloat(Math.max(0, Math.min(100, 100.0 - damageRaw)).toFixed(1));
  const bendingScore = parseFloat(Math.max(0, Math.min(100, 100.0 - bendingRaw)).toFixed(1));
  const confidenceScore = validationResult.confidenceScore;

  const healthVal = parseFloat((
    0.35 * densityScore +
    0.25 * spreadScore +
    0.20 * frayingScore +
    0.15 * bendingScore +
    0.05 * confidenceScore
  ).toFixed(1));
  const wearVal = parseFloat((100.0 - healthVal).toFixed(1));

  let condition = 'New';
  let recommendation = 'Your toothbrush is in brand new condition.';

  if (healthVal >= 90.0) {
    condition = 'New';
    recommendation = 'Your toothbrush is in brand new condition.';
  } else if (healthVal >= 75.0 && healthVal < 90.0) {
    condition = 'Light Wear';
    recommendation = 'Light wear detected. Good condition.';
  } else if (healthVal >= 50.0 && healthVal < 75.0) {
    condition = 'Moderate Wear';
    recommendation = 'Moderate wear detected. Continue monitoring.';
  } else if (healthVal >= 25.0 && healthVal < 50.0) {
    condition = 'Heavy Wear';
    recommendation = 'Heavy wear detected. Replace soon.';
  } else {
    condition = 'Replace Immediately';
    recommendation = 'Immediate replacement recommended.';
  }

  const detectedIssues = [];
  if (spreadingRaw > 50) detectedIssues.push('Significant bristle spreading and splay');
  else if (spreadingRaw > 20) detectedIssues.push('Moderate bristle spreading at margins');
  if (bendingRaw > 40) detectedIssues.push('Significant bristle bending');
  else if (bendingRaw > 15) detectedIssues.push('Minor bristle bending');
  if (damageRaw > 45) detectedIssues.push('Frayed bristle tips causing gum friction');
  if (densityLossRaw > 30) detectedIssues.push('Significant bristle density loss');

  // Generate Debug Visualization Overlay
  const overlayImg = img.clone();
  let overlayColor = 0x10B981FF;
  if (condition === 'Moderate Wear') {
    overlayColor = 0xF59E0BFF;
  } else if (condition === 'Heavy Wear' || condition === 'Replace Immediately') {
    overlayColor = 0xEF4444FF;
  }

  for (let x = 0; x < normW; x++) {
    overlayImg.setPixelColor(overlayColor, x, 0);
    overlayImg.setPixelColor(overlayColor, x, 1);
    overlayImg.setPixelColor(overlayColor, x, normH - 1);
    overlayImg.setPixelColor(overlayColor, x, normH - 2);
  }
  for (let y = 0; y < normH; y++) {
    overlayImg.setPixelColor(overlayColor, 0, y);
    overlayImg.setPixelColor(overlayColor, 1, y);
    overlayImg.setPixelColor(overlayColor, normW - 1, y);
    overlayImg.setPixelColor(overlayColor, normW - 2, y);
  }

  const debugFilename = `debug-${uuidv4()}.jpg`;
  const debugFileDir = path.join(__dirname, '../../uploads/debug');
  if (!fs.existsSync(debugFileDir)) {
    fs.mkdirSync(debugFileDir, { recursive: true });
  }
  const debugFilePath = path.join(debugFileDir, debugFilename);
  await overlayImg.write(debugFilePath);
  const debugImageUrl = `/uploads/debug/${debugFilename}`;

  const standardLifespan = 90;
  const remainingLifeDays = Math.max(0, Math.round((healthVal / 100.0) * standardLifespan));
  const replaceBeforeDate = new Date();
  replaceBeforeDate.setDate(replaceBeforeDate.getDate() + remainingLifeDays);
  const replaceBeforeDateStr = replaceBeforeDate.toISOString().split('T')[0];

  return {
    isToothbrushDetected: true,
    wearPercentage: wearVal,
    healthScore: healthVal,
    confidence: confidenceScore,
    condition,
    remainingLifeDays,
    replaceBeforeDate: replaceBeforeDateStr,
    detectedIssues,
    recommendation,
    debugImageUrl,

    confidenceScore: confidenceScore,
    aiRecommendation: recommendation,
    bristleSpreading: parseFloat(spreadingRaw.toFixed(1)),
    bristleBending: parseFloat(bendingRaw.toFixed(1)),
    bristleDamage: parseFloat(damageRaw.toFixed(1)),
    imageQualityScore: confidenceScore,
    bristleDensity: densityScore,
    confidenceWarning,

    spreadScore,
    densityScore,
    frayingScore,
    bendingScore,
    mlModelPredictions: await mlAnalyzer.predict(img)
  };
};
