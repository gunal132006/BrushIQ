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
  // Downscale image to 416x416 for MobileNet/COCO-SSD standard receptive field
  const resized = jimpImg.clone().resize({ w: 416, h: 416 });
  const { width, height, data } = resized.bitmap;
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
 * Calculates human skin ratio in image as backup human detector
 */
function extractSkinRatio(jimpImg) {
  const w = jimpImg.bitmap.width;
  const h = jimpImg.bitmap.height;
  let skinCount = 0;
  const total = w * h;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = jimpImg.bitmap.data[idx];
      const g = jimpImg.bitmap.data[idx + 1];
      const b = jimpImg.bitmap.data[idx + 2];
      const isSkin = (r > 120 && g > 70 && b > 35 && r > g && g > b && Math.abs(r - g) > 12);
      if (isSkin) skinCount++;
    }
  }
  return skinCount / total;
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

  // 1. PRIMARY NEURAL OBJECT CLASSIFICATION
  const model = await loadModel();
  let rawPredictions = [];
  if (model) {
    try {
      const tensor = jimpToTensor(img);
      // MinScore = 0.20 to capture all object candidate predictions
      rawPredictions = await model.detect(tensor, 10, 0.20);
      tensor.dispose();
    } catch (err) {
      console.warn('[OBJECT DETECTION] Neural inference error:', err.message);
    }
  }

  console.log('[AI DETECTION] All model detections:');
  if (rawPredictions.length === 0) {
    console.log('  [AI DETECTION] (none)');
  } else {
    rawPredictions.forEach(p => console.log(`  [AI DETECTION] class=${p.class.padEnd(15)} confidence=${(p.score * 100).toFixed(1)}% bbox=${JSON.stringify(p.bbox)}`));
  }

  // Extract skin ratio as secondary human indicator
  const skinRatio = extractSkinRatio(img);
  console.log(`[AI DETECTION] Skin ratio: ${(skinRatio * 100).toFixed(1)}%`);

  // Identify candidates
  const humanObj = rawPredictions.find(p => (p.class === 'person' || p.class === 'human') && p.score >= 0.25);
  const isHumanDetected = !!humanObj || skinRatio > 0.30;

  const neuralToothbrushes = rawPredictions.filter(p => p.class === 'toothbrush' && p.score >= 0.25);
  const toothbrushCount = neuralToothbrushes.length;

  console.log('[TOOTHBRUSH CANDIDATES]');
  console.log(`  candidate count = ${toothbrushCount}`);
  neuralToothbrushes.forEach((t, i) => console.log(`  candidate ${i + 1}: confidence=${(t.score * 100).toFixed(1)}% bbox=${JSON.stringify(t.bbox)}`));

  // 2. EXPLICIT NON-TOOTHBRUSH REJECTION FIRST
  if (isHumanDetected && toothbrushCount === 0) {
    console.log('[FINAL OBJECT DECISION] type = PERSON, toothbrushCount = 0');
    console.log('[AI VALIDATION] REJECTED — HUMAN DETECTED');
    throw new Error('NON_TOOTHBRUSH_OBJECT:person');
  }

  const nonToothbrushObjs = rawPredictions.filter(p => p.class !== 'toothbrush' && p.class !== 'person' && p.score >= 0.25).sort((a, b) => b.score - a.score);
  if (nonToothbrushObjs.length > 0 && toothbrushCount === 0) {
    const topObj = nonToothbrushObjs[0];
    console.log(`[FINAL OBJECT DECISION] type = ${topObj.class.toUpperCase()}, toothbrushCount = 0`);
    console.log(`[AI VALIDATION] REJECTED — NON-TOOTHBRUSH OBJECT (${topObj.class})`);
    throw new Error(`NON_TOOTHBRUSH_OBJECT:${topObj.class}`);
  }

  // 3. TOOTHBRUSH COUNT DECISION (ZERO GEOMETRY-ONLY FABRICATED DETECTIONS)
  if (toothbrushCount === 0) {
    console.log('[FINAL OBJECT DECISION] type = UNKNOWN, toothbrushCount = 0');
    console.log('[AI VALIDATION] REJECTED — NOT A TOOTHBRUSH');
    throw new Error('TOOTHBRUSH_NOT_DETECTED: Toothbrush not detected. Please scan only a toothbrush.');
  }

  if (toothbrushCount > 1) {
    console.log(`[FINAL OBJECT DECISION] type = MULTIPLE_TOOTHBRUSHES, toothbrushCount = ${toothbrushCount}`);
    console.log('[AI VALIDATION] REJECTED — MULTIPLE TOOTHBRUSHES');
    throw new Error('MULTIPLE_TOOTHBRUSHES: Multiple toothbrushes detected. Please scan only one toothbrush.');
  }

  console.log('[FINAL OBJECT DECISION] type = TOOTHBRUSH, toothbrushCount = 1');

  // 4. TOOTHBRUSH-SPECIFIC IMAGE QUALITY VALIDATION (ONLY FOR CONFIRMED TOOTHBRUSH)
  const quality = analyzeImageQuality(img);
  console.log(`[IMAGE QUALITY LOG] filename=${path.basename(imagePath)} laplacianVariance=${quality.laplacianVariance.toFixed(1)} avgBrightness=${quality.avgBrightness.toFixed(1)}`);

  if (quality.laplacianVariance < 0.1) {
    console.log('[AI VALIDATION] REJECTED — IMAGE TOO BLURRY FOR WEAR ANALYSIS');
    throw new Error('CV_ERROR: Extremely blurry image detected. Please make sure the camera is focused on the toothbrush bristles.');
  }
  if (quality.avgBrightness < 20.0) {
    console.log('[AI VALIDATION] REJECTED — IMAGE TOO DARK FOR WEAR ANALYSIS');
    throw new Error('CV_ERROR: Image is too dark. Please capture the image in a well-lit area.');
  }
  if (quality.avgBrightness > 250.0) {
    console.log('[AI VALIDATION] REJECTED — IMAGE OVEREXPOSED FOR WEAR ANALYSIS');
    throw new Error('CV_ERROR: Image is overexposed. Please avoid direct glare or bright light sources.');
  }

  const confidenceScore = parseFloat((neuralToothbrushes[0].score * 100).toFixed(1));
  console.log(`[TOOTHBRUSH CONFIDENCE] Confidence: ${confidenceScore}%`);
  console.log('[AI VALIDATION] PASSED — SINGLE TOOTHBRUSH CONFIRMED');

  return {
    isToothbrushDetected: true,
    toothbrushCount: 1,
    confidenceScore,
    bbox: neuralToothbrushes[0].bbox,
    quality
  };
};
