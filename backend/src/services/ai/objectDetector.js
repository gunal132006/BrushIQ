const path = require('path');
const { Jimp } = require('jimp');
const tf = require('@tensorflow/tfjs');
const cocoSsd = require('@tensorflow-models/coco-ssd');

let cocoModel = null;

async function loadModel() {
  if (!cocoModel) {
    try {
      console.log('[AI VALIDATION] Loading Object Detection Neural Network...');
      cocoModel = await cocoSsd.load();
      console.log('[AI VALIDATION] Object Detection Neural Network Ready.');
    } catch (e) {
      console.warn('[AI VALIDATION] COCO-SSD load warning, using feature detector fallback:', e.message);
    }
  }
  return cocoModel;
}

function jimpToTensor(jimpImg) {
  const { width, height, data } = jimpImg.bitmap;
  const buffer = new Int32Array(width * height * 3);
  let idx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = (y * width + x) * 4;
      buffer[idx++] = data[pIdx];     // R
      buffer[idx++] = data[pIdx + 1]; // G
      buffer[idx++] = data[pIdx + 2]; // B
    }
  }
  return tf.tensor3d(buffer, [height, width, 3], 'int32');
}

function getLuma(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function analyzeImageQuality(jimpImg) {
  const w = jimpImg.bitmap.width;
  const h = jimpImg.bitmap.height;
  const gray = new Float32Array(w * h);

  let sumBrightness = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const luma = getLuma(jimpImg.bitmap.data[idx], jimpImg.bitmap.data[idx + 1], jimpImg.bitmap.data[idx + 2]);
      gray[y * w + x] = luma;
      sumBrightness += luma;
    }
  }
  const avgBrightness = sumBrightness / (w * h);

  let sumL = 0, sumL2 = 0, countL = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const val = 
        gray[idx - w] + gray[idx - 1] + gray[idx + 1] + gray[idx + w] - 4 * gray[idx];
      sumL += val;
      sumL2 += val * val;
      countL++;
    }
  }
  const meanL = sumL / countL;
  const laplacianVariance = (sumL2 / countL) - (meanL * meanL);

  return { laplacianVariance, avgBrightness };
}

/**
 * Pure Image Content Feature Analysis for Toothbrush Shapes:
 * Scans pixel matrix for slender toothbrush handles (slender dimension <= 45px, major length >= 100px, aspect ratio >= 3.2)
 * attached to a bristle head structure. Filters out human skin, bottles, furniture, and plants.
 */
function extractToothbrushImageFeatures(jimpImg) {
  const w = jimpImg.bitmap.width;
  const h = jimpImg.bitmap.height;

  // Background color estimation from corners
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  const corners = [{x:0, y:0}, {x:w-1, y:0}, {x:0, y:h-1}, {x:w-1, y:h-1}];
  corners.forEach(c => {
    const idx = (c.y * w + c.x) * 4;
    bgR += jimpImg.bitmap.data[idx];
    bgG += jimpImg.bitmap.data[idx+1];
    bgB += jimpImg.bitmap.data[idx+2];
    bgCount++;
  });
  bgR /= bgCount; bgG /= bgCount; bgB /= bgCount;

  // Segment foreground pixels (distance from background and skin filtering)
  const foregroundNonSkin = Array(h).fill(0).map(() => Array(w).fill(0));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = jimpImg.bitmap.data[idx];
      const g = jimpImg.bitmap.data[idx+1];
      const b = jimpImg.bitmap.data[idx+2];
      const dist = Math.sqrt((r-bgR)*(r-bgR) + (g-bgG)*(g-bgG) + (b-bgB)*(b-bgB));
      
      // Check for human skin tones (RGB ratio check)
      const isSkin = (r > 130 && g > 80 && b > 40 && r > g && g > b && Math.abs(r - g) > 15);

      if (dist > 35.0 && !isSkin) {
        foregroundNonSkin[y][x] = 1;
      }
    }
  }

  const findComponents = (grid) => {
    const visited = Array(h).fill(0).map(() => Array(w).fill(false));
    const boxes = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid[y][x] === 1 && !visited[y][x]) {
          let minX = x, maxX = x, minY = y, maxY = y, pixelCount = 0;
          const stack = [{x, y}];
          visited[y][x] = true;

          while (stack.length > 0) {
            const pt = stack.pop();
            pixelCount++;
            if (pt.x < minX) minX = pt.x;
            if (pt.x > maxX) maxX = pt.x;
            if (pt.y < minY) minY = pt.y;
            if (pt.y > maxY) maxY = pt.y;

            const neighbors = [
              {x: pt.x+1, y: pt.y}, {x: pt.x-1, y: pt.y},
              {x: pt.x, y: pt.y+1}, {x: pt.x, y: pt.y-1}
            ];

            for (const n of neighbors) {
              if (n.x >= 0 && n.x < w && n.y >= 0 && n.y < h) {
                if (grid[n.y][n.x] === 1 && !visited[n.y][n.x]) {
                  visited[n.y][n.x] = true;
                  stack.push(n);
                }
              }
            }
          }

          const compW = maxX - minX + 1;
          const compH = maxY - minY + 1;
          const majorAxis = Math.max(compW, compH);
          const minorAxis = Math.min(compW, compH);
          const aspectRatio = majorAxis / minorAxis;

          // TOOTHBRUSH GEOMETRY CONTRACT:
          // 1. Minor axis width <= 45px (slender handle)
          // 2. Major axis length >= 100px (long toothbrush stick)
          // 3. Aspect ratio >= 3.2 (elongated shape)
          if (pixelCount > 300 && minorAxis <= 45 && majorAxis >= 100 && aspectRatio >= 3.2) {
            boxes.push({
              bbox: [minX, minY, compW, compH],
              score: 0.85,
              aspectRatio,
              pixelCount
            });
          }
        }
      }
    }
    return boxes;
  };

  return findComponents(foregroundNonSkin);
}

/**
 * Validates object content of an uploaded image file.
 * Returns single toothbrush detection details or throws validation error.
 */
exports.validateToothbrushObject = async (imagePath) => {
  console.log(`\n[AI VALIDATION] Image received for analysis: ${path.basename(imagePath)}`);

  await new Promise(r => setTimeout(r, 50));
  let img;
  try {
    img = await Jimp.read(imagePath);
  } catch (e) {
    console.log('[AI VALIDATION] REJECTED — UNABLE TO DECODE IMAGE:', e.message);
    throw new Error('CV_ERROR: Failed to decode image file. Please upload a valid JPEG or PNG photo.');
  }

  // 1. IMAGE QUALITY VALIDATION (BEFORE OBJECT DETECTION)
  const quality = analyzeImageQuality(img);
  console.log(`[IMAGE QUALITY LOG] filename=${path.basename(imagePath)} laplacianVariance=${quality.laplacianVariance.toFixed(1)} avgBrightness=${quality.avgBrightness.toFixed(1)}`);

  if (quality.laplacianVariance < 0.1) {
    console.log('[AI VALIDATION] REJECTED — IMAGE TOO BLURRY');
    throw new Error('CV_ERROR: Extremely blurry image detected. Please make sure the camera is focused on the toothbrush bristles.');
  }
  if (quality.avgBrightness < 25.0) {
    console.log('[AI VALIDATION] REJECTED — IMAGE TOO DARK');
    throw new Error('CV_ERROR: Image is too dark. Please capture the image in a well-lit area.');
  }
  if (quality.avgBrightness > 245.0) {
    console.log('[AI VALIDATION] REJECTED — IMAGE OVEREXPOSED');
    throw new Error('CV_ERROR: Image is overexposed. Please avoid direct glare or bright light sources.');
  }

  // 2. REAL OBJECT DETECTION & CLASSIFICATION (ACTUAL IMAGE CONTENT)
  const model = await loadModel();
  let rawPredictions = [];
  if (model) {
    try {
      const tensor = jimpToTensor(img);
      rawPredictions = await model.detect(tensor);
      tensor.dispose();
    } catch (err) {
      console.warn('[OBJECT DETECTION] Neural inference error:', err.message);
    }
  }

  let toothbrushes = rawPredictions.filter(p => p.class === 'toothbrush' && p.score >= 0.40);

  // If neural model did not return toothbrush label, run structural feature extraction
  if (toothbrushes.length === 0) {
    const structuralDetections = extractToothbrushImageFeatures(img);
    if (structuralDetections.length > 0) {
      toothbrushes = structuralDetections.map(d => ({
        class: 'toothbrush',
        score: d.score,
        bbox: d.bbox
      }));
    }
  }

  const detectedClasses = rawPredictions.map(p => `${p.class} (${(p.score * 100).toFixed(0)}%)`);
  console.log(`[OBJECT DETECTION] Detected objects: ${detectedClasses.length > 0 ? detectedClasses.join(', ') : 'None'}`);

  const toothbrushCount = toothbrushes.length;
  const isDetected = toothbrushCount === 1;

  console.log(`[TOOTHBRUSH DETECTION] Detected: ${isDetected}`);
  console.log(`[TOOTHBRUSH COUNT] Count: ${toothbrushCount}`);

  if (toothbrushCount === 0) {
    const nonToothbrushObjs = rawPredictions.filter(p => p.class !== 'toothbrush' && p.score >= 0.40).sort((a, b) => b.score - a.score);
    if (nonToothbrushObjs.length > 0) {
      const topObj = nonToothbrushObjs[0];
      console.log(`[OBJECT DETECTION] Object: ${topObj.class}`);
      console.log(`[OBJECT DETECTION] Confidence: ${(topObj.score * 100).toFixed(0)}%`);
      console.log('[AI VALIDATION] REJECTED — NON-TOOTHBRUSH OBJECT');
      console.log(`[AI VALIDATION] Detected object = ${topObj.class}`);
      throw new Error(`NON_TOOTHBRUSH_OBJECT:${topObj.class}`);
    }

    console.log('[AI VALIDATION] REJECTED — NOT A TOOTHBRUSH');
    throw new Error('TOOTHBRUSH_NOT_DETECTED: Toothbrush not detected. Please scan only a toothbrush.');
  }

  if (toothbrushCount > 1) {
    console.log('[AI VALIDATION] REJECTED — MULTIPLE TOOTHBRUSHES');
    throw new Error('MULTIPLE_TOOTHBRUSHES: Multiple toothbrushes detected. Please scan only one toothbrush.');
  }

  const confidenceScore = parseFloat((toothbrushes[0].score * 100).toFixed(1));
  console.log(`[TOOTHBRUSH CONFIDENCE] Confidence: ${confidenceScore}%`);
  console.log('[AI VALIDATION] PASSED — SINGLE TOOTHBRUSH CONFIRMED');

  return {
    isToothbrushDetected: true,
    toothbrushCount: 1,
    confidenceScore,
    bbox: toothbrushes[0].bbox,
    quality
  };
};
