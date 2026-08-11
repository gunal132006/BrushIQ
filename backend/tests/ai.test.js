const path = require('path');
const { analyzeToothbrushImage } = require('../src/services/ai/analyzer');

describe('Toothbrush AI Wear Analysis Service', () => {
  jest.setTimeout(30000);
  const sampleImagePath = path.join(__dirname, 'fixtures', 'single_toothbrush.jpg');

  test('Should analyze bristle characteristics and compute valid score parameters', async () => {
    const report = await analyzeToothbrushImage(sampleImagePath);

    // Validate key fields exist and are of correct types
    expect(report).toHaveProperty('wearPercentage');
    expect(report).toHaveProperty('healthScore');
    expect(report).toHaveProperty('remainingLifeDays');
    expect(report).toHaveProperty('condition');
    expect(report).toHaveProperty('confidenceScore');
    expect(report).toHaveProperty('bristleSpreading');
    expect(report).toHaveProperty('bristleBending');
    expect(report).toHaveProperty('bristleDamage');
    expect(report).toHaveProperty('detectedIssues');
    expect(report).toHaveProperty('aiRecommendation');

    // Validate ranges
    expect(report.wearPercentage).toBeGreaterThanOrEqual(0);
    expect(report.wearPercentage).toBeLessThanOrEqual(100);

    expect(report.healthScore).toBeGreaterThanOrEqual(0);
    expect(report.healthScore).toBeLessThanOrEqual(100);

    // Verify mathematical relation: health = 100 - wear
    expect(report.healthScore + report.wearPercentage).toBeCloseTo(100, 1);

    expect(report.remainingLifeDays).toBeGreaterThanOrEqual(0);
    expect(report.remainingLifeDays).toBeLessThanOrEqual(90);

    expect(report.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(report.confidenceScore).toBeLessThanOrEqual(100);
  });

  test('Should return identical results for identical image buffer (deterministic outputs)', async () => {
    const report1 = await analyzeToothbrushImage(sampleImagePath);
    const report2 = await analyzeToothbrushImage(sampleImagePath);

    expect(report1.wearPercentage).toEqual(report2.wearPercentage);
    expect(report1.healthScore).toEqual(report2.healthScore);
    expect(report1.condition).toEqual(report2.condition);
  });
});
