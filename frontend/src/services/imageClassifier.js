/**
 * Client-Side Machine Learning Object Classifier for BrushIQ Web Application
 * Uses TensorFlow.js + MobileNet architecture executing directly in the Web Browser.
 */

let modelInstance = null;
let isModelLoading = false;
let modelLoadPromise = null;

// Confidence threshold for object classification (25% = 0.25)
export const CONFIDENCE_THRESHOLD = 0.25;

/**
 * Dynamically loads TensorFlow.js and MobileNet model libraries into browser
 */
const loadTensorFlowScripts = () => {
  return new Promise((resolve, reject) => {
    if (window.tf && window.mobilenet) {
      return resolve();
    }

    const scriptTf = document.createElement('script');
    scriptTf.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js';
    scriptTf.async = true;

    scriptTf.onload = () => {
      const scriptMobilenet = document.createElement('script');
      scriptMobilenet.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js';
      scriptMobilenet.async = true;
      scriptMobilenet.onload = () => resolve();
      scriptMobilenet.onerror = (err) => reject(new Error('Failed to load MobileNet model script'));
      document.head.appendChild(scriptMobilenet);
    };

    scriptTf.onerror = (err) => reject(new Error('Failed to load TensorFlow.js core script'));
    document.head.appendChild(scriptTf);
  });
};

/**
 * Pre-loads and caches TensorFlow.js MobileNet model in memory
 */
export const loadClassifierModel = async () => {
  if (modelInstance) return modelInstance;
  if (isModelLoading) return modelLoadPromise;

  isModelLoading = true;
  modelLoadPromise = (async () => {
    try {
      await loadTensorFlowScripts();
      if (!window.mobilenet) {
        throw new Error('MobileNet library unavailable');
      }
      modelInstance = await window.mobilenet.load({
        version: 2,
        alpha: 1.0
      });
      console.log('[TensorFlow.js ML] MobileNet Model successfully loaded into browser memory.');
      return modelInstance;
    } catch (err) {
      console.error('[TensorFlow.js ML Error] Model initialization failed:', err);
      throw err;
    } finally {
      isModelLoading = false;
    }
  })();

  return modelLoadPromise;
};

/**
 * Keywords mapped to Human / Person classification
 */
const HUMAN_KEYWORDS = [
  'person', 'human', 'man', 'woman', 'child', 'boy', 'girl', 'baby', 'infant',
  'face', 'head', 'groom', 'bride', 'skin', 'wig', 'hair', 'beard', 'mustache',
  'suit', 'jersey', 't-shirt', 'jean', 'sweater', 'jacket', 'coat', 'dress',
  'bikini', 'pajama', 'trench', 'cardigan', 'vest', 'neck', 'shoulder', 'hand', 'arm'
];

/**
 * Keywords mapped to Toothbrush / Oral care classification
 */
const TOOTHBRUSH_KEYWORDS = [
  'toothbrush', 'brush', 'electric toothbrush', 'scrub brush', 'comb', 'hairbrush', 'swab', 'cleaning brush'
];

/**
 * Classifies an HTML Image Element or Image File using client-side TensorFlow.js MobileNet
 * @param {HTMLImageElement|File|string} imageElementOrSrc 
 * @returns {Promise<Object>} Classification details
 */
export const classifyImageClientSide = async (imageElementOrSrc) => {
  const model = await loadClassifierModel();

  let imgElement = imageElementOrSrc;
  let createdImg = false;

  if (typeof imageElementOrSrc === 'string' || imageElementOrSrc instanceof File || imageElementOrSrc instanceof Blob) {
    createdImg = true;
    imgElement = document.createElement('img');
    imgElement.crossOrigin = 'anonymous';

    const srcUrl = imageElementOrSrc instanceof File || imageElementOrSrc instanceof Blob
      ? URL.createObjectURL(imageElementOrSrc)
      : imageElementOrSrc;

    await new Promise((resolve, reject) => {
      imgElement.onload = () => resolve();
      imgElement.onerror = (err) => reject(new Error('Failed to load image for ML inference'));
      imgElement.src = srcUrl;
    });
  }

  // Run TensorFlow.js MobileNet inference in browser
  const predictions = await model.classify(imgElement, 5);
  console.log('[TensorFlow.js ML Predictions]', predictions);

  if (createdImg && (imageElementOrSrc instanceof File || imageElementOrSrc instanceof Blob)) {
    URL.revokeObjectURL(imgElement.src);
  }

  if (!predictions || predictions.length === 0) {
    return {
      category: 'other',
      confidence: 0,
      label: 'Unknown',
      message: 'Unsupported Image: Please upload a clear image of a toothbrush.',
      predictions: []
    };
  }

  const topPrediction = predictions[0];
  const topClassName = topPrediction.className.toLowerCase();
  const topProbability = topPrediction.probability;

  // Check confidence threshold
  if (topProbability < CONFIDENCE_THRESHOLD) {
    return {
      category: 'other',
      confidence: topProbability,
      label: topPrediction.className,
      message: 'Low Confidence / Unsupported Image: Please upload a clearer image of a toothbrush.',
      predictions
    };
  }

  // Evaluate Human vs Toothbrush vs Other
  let isHuman = false;
  let isToothbrush = false;

  for (const pred of predictions) {
    const label = pred.className.toLowerCase();
    const prob = pred.probability;

    if (HUMAN_KEYWORDS.some(k => label.includes(k)) && prob >= 0.15) {
      isHuman = true;
      break;
    }
    if (TOOTHBRUSH_KEYWORDS.some(k => label.includes(k)) && prob >= 0.10) {
      isToothbrush = true;
      break;
    }
  }

  if (isToothbrush) {
    return {
      category: 'toothbrush',
      confidence: topProbability,
      label: topPrediction.className,
      message: 'Toothbrush Detected: Proceeding with bristle wear analysis...',
      predictions
    };
  }

  if (isHuman) {
    return {
      category: 'human',
      confidence: topProbability,
      label: topPrediction.className,
      message: 'Human Detected: This image contains a human. Please upload a toothbrush image for analysis.',
      predictions
    };
  }

  return {
    category: 'other',
    confidence: topProbability,
    label: topPrediction.className,
    message: 'Unsupported Image: Please upload a clear image of a toothbrush.',
    predictions
  };
};
