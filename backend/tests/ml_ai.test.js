const path = require('path');
const mlAnalyzer = require('../src/services/ai/mlAnalyzer');
const analyzer = require('../src/services/ai/analyzer');

describe('Machine Learning Model & Image Analysis Pipeline', () => {
  jest.setTimeout(30000);
  const sampleImagePath = path.join(__dirname, 'fixtures', 'single_toothbrush.jpg');

  test('mlAnalyzer returns valid softmax probabilities and top class', async () => {
    const result = await mlAnalyzer.predict(sampleImagePath);

    expect(result).toBeDefined();
    expect(result.modelName).toBe('MobileNetV2-ToothbrushWear-v1');
    expect(result.probabilities).toBeDefined();
    expect(result.probabilities.new).toBeGreaterThanOrEqual(0);
    expect(result.probabilities.severeWear).toBeGreaterThanOrEqual(0);
    expect(typeof result.mlConfidence).toBe('number');
    expect(['New', 'Light Wear', 'Moderate Wear', 'Severe Wear']).toContain(result.topClass);
  });

  test('analyzeToothbrushImage incorporates mlModelPredictions in report', async () => {
    const report = await analyzer.analyzeToothbrushImage(sampleImagePath);

    expect(report).toBeDefined();
    expect(report.healthScore).toBeDefined();
    expect(report.wearPercentage).toBeDefined();
    expect(report.mlModelPredictions).toBeDefined();
    expect(report.mlModelPredictions.modelName).toBe('MobileNetV2-ToothbrushWear-v1');
  });
});
