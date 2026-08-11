const request = require('supertest');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/config/jwt');
const app = require('../src/app');

describe('BRUSHIQ AI SCAN VALIDATION PIPELINE', () => {
  jest.setTimeout(30000);
  const fixturesDir = path.join(__dirname, 'fixtures');
  let authToken;

  beforeAll(() => {
    // Generate valid test token for authenticated endpoint
    authToken = jwt.sign({ user: { id: 'test-user-uuid-1234' } }, JWT_SECRET, { expiresIn: '1h' });
  });

  // Test 1: Human Photo
  test('1. Human photo must return 400 NON_TOOTHBRUSH_OBJECT or TOOTHBRUSH_NOT_DETECTED with no health metrics', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'human.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
    expect(res.body.healthScore).toBeUndefined();
    expect(res.body.wearPercentage).toBeUndefined();
    expect(res.body.condition).toBeUndefined();
    expect(res.body.remainingLifeDays).toBeUndefined();
    expect(res.body.recommendation).toBeUndefined();
  });

  // Test 2: Hand Photo
  test('2. Hand photo must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'hand.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
    expect(res.body.healthScore).toBeUndefined();
  });

  // Test 3: Floor Photo
  test('3. Floor texture must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'floor.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 4: Wall Photo
  test('4. Wall surface must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'wall.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 5: Bottle
  test('5. Bottle must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'bottle.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 6: Phone
  test('6. Phone must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'phone.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 7: Laptop
  test('7. Laptop must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'laptop.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
    expect(res.body.healthScore).toBeUndefined();
  });

  // Test 8: Keyboard
  test('8. Keyboard must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'keyboard.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 9: Chair
  test('9. Chair must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'chair.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 10: Plant
  test('10. Plant must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'plant.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 11: Clothes
  test('11. Clothes must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'clothes.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 12: Book
  test('12. Book must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'book.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 13: Paper
  test('13. Paper must return 400 validation error', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'paper.jpg'));

    expect(res.status).toBe(400);
    expect(['NON_TOOTHBRUSH_OBJECT', 'TOOTHBRUSH_NOT_DETECTED']).toContain(res.body.code);
  });

  // Test 14: Multiple Toothbrushes (2 toothbrushes)
  test('14. Two toothbrushes must return 400 MULTIPLE_TOOTHBRUSHES', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'two_toothbrushes.jpg'));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MULTIPLE_TOOTHBRUSHES');
    expect(res.body.message).toBe('Multiple toothbrushes detected. Please scan only one toothbrush.');
    expect(res.body.healthScore).toBeUndefined();
  });

  // Test 15: Dark Image Quality Rejection
  test('15. Dark image must return 400 IMAGE_QUALITY_ERROR', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'dark_image.jpg'));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('IMAGE_QUALITY_ERROR');
    expect(res.body.healthScore).toBeUndefined();
  });

  // Test 16: Blurred Image Quality Rejection
  test('16. Blurred image must return 400 IMAGE_QUALITY_ERROR', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'blurry_image.jpg'));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('IMAGE_QUALITY_ERROR');
    expect(res.body.healthScore).toBeUndefined();
  });

  // Test 17: Human Holding 1 Toothbrush
  test('17. Human holding 1 toothbrush must return 200 with valid health score', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'human_holding_toothbrush.jpg'));

    expect(res.status).toBe(200);
    expect(res.body.isToothbrushDetected).toBe(true);
    expect(typeof res.body.healthScore).toBe('number');
    expect(typeof res.body.wearPercentage).toBe('number');
    expect(typeof res.body.condition).toBe('string');
  });

  // Test 18: Real Single Toothbrush
  test('18. Real single toothbrush must return 200 with valid health score', async () => {
    const res = await request(app)
      .post('/api/scans/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('image', path.join(fixturesDir, 'single_toothbrush.jpg'));

    expect(res.status).toBe(200);
    expect(res.body.isToothbrushDetected).toBe(true);
    expect(typeof res.body.healthScore).toBe('number');
    expect(typeof res.body.wearPercentage).toBe('number');
    expect(typeof res.body.condition).toBe('string');
  });
});
