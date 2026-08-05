const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const { OAuth2Client } = require('google-auth-library');

jest.mock('google-auth-library');

describe('Google Sign-In API Endpoints (POST /api/auth/google)', () => {
  const originalEnv = process.env.GOOGLE_CLIENT_ID;
  const mockClientId = '534843148727-ernb5gqgo6pf1cobmmvjbsl7d4f5026s.apps.googleusercontent.com';

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = mockClientId;
    db.setPgConnected(true);
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.GOOGLE_CLIENT_ID = originalEnv;
  });

  test('Should return HTTP 500 when GOOGLE_CLIENT_ID environment variable is missing', async () => {
    delete process.env.GOOGLE_CLIENT_ID;

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-mock-token' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      message: 'Google authentication is not configured.',
    });
  });

  test('Should return HTTP 503 when PostgreSQL database service is unavailable', async () => {
    db.setPgConnected(false);

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-mock-token' });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      message: 'PostgreSQL database service unavailable',
    });
  });

  test('Should return HTTP 400 when idToken is missing from request body', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: 'ID token is required',
    });
  });

  test('Should return HTTP 401 when Google ID token verification fails', async () => {
    OAuth2Client.prototype.verifyIdToken = jest.fn().mockRejectedValue(new Error('Invalid token signature'));

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'invalid-or-expired-token' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      message: 'Invalid or expired Google ID token',
    });
  });

  test('Should create a new user when Google user email does not exist in PostgreSQL', async () => {
    OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-12345',
        email: 'newgoogleuser@example.com',
        name: 'New Google User',
        picture: 'https://example.com/avatar.jpg',
      }),
    });

    const mockNewUser = {
      id: 'uuid-1111-2222-3333',
      full_name: 'New Google User',
      email: 'newgoogleuser@example.com',
      phone: null,
      google_id: 'google-sub-12345',
      auth_provider: 'google',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: new Date().toISOString(),
    };

    jest.spyOn(db, 'queryPgOnly')
      .mockResolvedValueOnce({ rows: [] }) // byGoogleId -> empty
      .mockResolvedValueOnce({ rows: [] }) // byEmail -> empty
      .mockResolvedValueOnce({ rows: [mockNewUser] }); // insertRes -> new user

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-google-id-token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toEqual({
      id: 'uuid-1111-2222-3333',
      fullName: 'New Google User',
      email: 'newgoogleuser@example.com',
      phone: null,
      googleId: 'google-sub-12345',
      authProvider: 'google',
      avatarUrl: 'https://example.com/avatar.jpg',
      createdAt: mockNewUser.created_at,
    });
  });

  test('Should link Google account to existing user when matching email exists', async () => {
    OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-67890',
        email: 'existinguser@example.com',
        name: 'Existing User',
        picture: 'https://example.com/avatar.jpg',
      }),
    });

    const existingUser = {
      id: 'existing-uuid-9999',
      full_name: 'Existing User',
      email: 'existinguser@example.com',
      phone: '1234567890',
      google_id: null,
      auth_provider: 'email',
      avatar_url: null,
      created_at: new Date().toISOString(),
    };

    const linkedUser = {
      ...existingUser,
      google_id: 'google-sub-67890',
      auth_provider: 'email',
      avatar_url: 'https://example.com/avatar.jpg',
    };

    jest.spyOn(db, 'queryPgOnly')
      .mockResolvedValueOnce({ rows: [] }) // byGoogleId -> empty
      .mockResolvedValueOnce({ rows: [existingUser] }) // byEmail -> existing user
      .mockResolvedValueOnce({ rows: [linkedUser] }); // linkRes -> linked user

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-google-id-token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.id).toBe('existing-uuid-9999');
    expect(res.body.user.googleId).toBe('google-sub-67890');
    expect(res.body.user.email).toBe('existinguser@example.com');
  });

  test('Should log in existing user directly by google_id', async () => {
    OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-12345',
        email: 'googleuser@example.com',
        name: 'Google User',
        picture: 'https://example.com/avatar.jpg',
      }),
    });

    const existingGoogleUser = {
      id: 'google-user-uuid',
      full_name: 'Google User',
      email: 'googleuser@example.com',
      phone: null,
      google_id: 'google-sub-12345',
      auth_provider: 'google',
      avatar_url: 'https://example.com/avatar.jpg',
      created_at: new Date().toISOString(),
    };

    jest.spyOn(db, 'queryPgOnly')
      .mockResolvedValueOnce({ rows: [existingGoogleUser] }) // byGoogleId -> found
      .mockResolvedValueOnce({ rows: [existingGoogleUser] }); // updateRes -> updated

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-google-id-token' });

    expect(res.status).toBe(200);
    expect(res.body.user.googleId).toBe('google-sub-12345');
    expect(res.body.user.id).toBe('google-user-uuid');
  });
});
