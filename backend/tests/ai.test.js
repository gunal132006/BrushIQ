const fs = require('fs');
const path = require('path');
const { analyzeToothbrushImage } = require('../src/services/ai/analyzer');

describe('Toothbrush AI Wear Analysis Service', () => {
  const tempImagePath = path.join(__dirname, 'test-toothbrush.png');

  beforeAll(() => {
    // Generate a temporary mock image file
    const mockImageBuffer = Buffer.alloc(1024, 'BrushIQAIImageMockDataContent');
    fs.writeFileSync(tempImagePath, mockImageBuffer);
  });

  afterAll(() => {
    // Remove the temporary mock file
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
  });

  test('Should analyze bristle characteristics and compute valid score parameters', async () => {
    const report = await analyzeToothbrushImage(tempImagePath);

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

    expect(report.confidenceScore).toBeGreaterThanOrEqual(88);
    expect(report.confidenceScore).toBeLessThanOrEqual(99);

    // Verify condition matches wear boundaries
    const wear = report.wearPercentage;
    if (wear <= 10) {
      expect(report.condition).toBe('New');
    } else if (wear > 10 && wear <= 25) {
      expect(report.condition).toBe('Light Wear');
    } else if (wear > 25 && wear <= 50) {
      expect(report.condition).toBe('Moderate Wear');
    } else if (wear > 50 && wear <= 75) {
      expect(report.condition).toBe('Heavy Wear');
    } else {
      expect(report.condition).toBe('Replace Immediately');
    }

    // Verify issues count fits standard rules
    expect(Array.isArray(report.detectedIssues)).toBe(true);
    expect(typeof report.aiRecommendation).toBe('string');
  });

  test('Should return identical results for identical image buffer (deterministic outputs)', async () => {
    const report1 = await analyzeToothbrushImage(tempImagePath);
    const report2 = await analyzeToothbrushImage(tempImagePath);

    expect(report1.wearPercentage).toBe(report2.wearPercentage);
    expect(report1.healthScore).toBe(report2.healthScore);
    expect(report1.condition).toBe(report2.condition);
    expect(report1.remainingLifeDays).toBe(report2.remainingLifeDays);
    expect(report1.confidenceScore).toBe(report2.confidenceScore);
  });
});
