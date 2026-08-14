const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const db = require('../src/config/db');
const { OAuth2Client } = require('google-auth-library');

jest.mock('google-auth-library');

describe('Authentication API Endpoints (POST /api/auth/login & POST /api/auth/google)', () => {
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

  // ------------------------------------
  // EMAIL / PASSWORD LOGIN TESTS
  // ------------------------------------
  test('Email login: Should return HTTP 400 when missing username or password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please enter all fields');
  });

  test('Email login: Should return HTTP 401 when invalid email is provided', async () => {
    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('Email login: Should return HTTP 401 when invalid password is provided', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
    const mockUser = {
      id: 'user-uuid-123',
      full_name: 'Test User',
      email: 'testuser@example.com',
      password_hash: passwordHash,
      phone: null,
      created_at: new Date().toISOString()
    };

    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [mockUser] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('Email login: Should return HTTP 200 and JWT when credentials are valid', async () => {
    const rawPassword = 'ValidPassword123!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const mockUser = {
      id: 'user-uuid-123',
      full_name: 'Test User',
      email: 'testuser@example.com',
      password_hash: passwordHash,
      phone: null,
      created_at: new Date().toISOString()
    };

    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [mockUser] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com', password: rawPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('testuser@example.com');
  });

  test('Email login: Should return HTTP 503 when database is disconnected', async () => {
    db.setPgConnected(false);
    jest.spyOn(db, 'ensurePgConnected').mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@example.com', password: 'ValidPassword123!' });

    expect(res.status).toBe(503);
    expect(res.body.message).toBe('PostgreSQL database service unavailable');
  });

  // ------------------------------------
  // GOOGLE LOGIN TESTS
  // ------------------------------------
  test('Google login: Should return HTTP 500 when GOOGLE_CLIENT_ID environment variable is missing', async () => {
    delete process.env.GOOGLE_CLIENT_ID;

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-mock-token' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      message: 'Google authentication is not configured.',
    });
  });

  test('Google login: Should return HTTP 503 when PostgreSQL database service is unavailable', async () => {
    db.setPgConnected(false);
    jest.spyOn(db, 'ensurePgConnected').mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-mock-token' });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      message: 'PostgreSQL database service unavailable',
    });
  });

  test('Google login: Should return HTTP 400 when idToken is missing from request body', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      message: 'ID token is required',
    });
  });

  test('Google login: Should return HTTP 401 when Google ID token verification fails', async () => {
    OAuth2Client.prototype.verifyIdToken = jest.fn().mockRejectedValue(new Error('Invalid token signature'));

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'invalid-or-expired-token' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      message: 'Invalid or expired Google ID token',
    });
  });

  test('Google login: Should create a new user when Google user email does not exist in PostgreSQL', async () => {
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

  test('Google login: Should link Google account to existing user when matching email exists', async () => {
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

  test('Google login: Should log in existing user directly by google_id', async () => {
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

  // ------------------------------------
  // FORGOT PASSWORD & RESET PASSWORD TESTS
  // ------------------------------------
  test('Forgot Password: Should return HTTP 400 when email is missing or empty', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please provide a valid email address');
  });

  test('Forgot Password: Should return generic success for non-existent email without sending email', async () => {
    const mailerService = require('../src/services/mailerService');
    jest.spyOn(mailerService, 'sendPasswordResetEmail').mockResolvedValue(true);
    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [] }); // user not found

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('If an account exists for this email, a password reset link has been sent.');
    expect(mailerService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  test('Forgot Password: Should generate token and call mailerService when user exists', async () => {
    const mailerService = require('../src/services/mailerService');
    jest.spyOn(mailerService, 'sendPasswordResetEmail').mockResolvedValue(true);

    const mockUser = { id: 'user-uuid-1', email: 'registered@example.com', full_name: 'Registered User' };
    jest.spyOn(db, 'query')
      .mockResolvedValueOnce({ rows: [mockUser] }) // SELECT user
      .mockResolvedValueOnce({ rows: [] }) // UPDATE existing tokens used = TRUE
      .mockResolvedValueOnce({ rows: [] }); // INSERT token_hash

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'registered@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('If an account exists for this email, a password reset link has been sent.');
    expect(mailerService.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'registered@example.com',
        fullName: 'Registered User',
        resetUrl: expect.stringContaining('/api/auth/reset-password-page?token=')
      })
    );
  });

  test('Forgot Password: Should return HTTP 500 when email delivery fails', async () => {
    const mailerService = require('../src/services/mailerService');
    jest.spyOn(mailerService, 'sendPasswordResetEmail').mockResolvedValue(false);

    const mockUser = { id: 'user-uuid-1', email: 'registered@example.com', full_name: 'Registered User' };
    jest.spyOn(db, 'query')
      .mockResolvedValueOnce({ rows: [mockUser] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'registered@example.com' });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("We couldn't send the recovery email. Please try again.");
  });

  test('Reset Password: Should return HTTP 400 when token is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ newPassword: 'NewPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Reset token is required');
  });

  test('Reset Password: Should return HTTP 400 when newPassword is less than 10 characters', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'some-raw-token', newPassword: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must be at least 10 characters long');
  });

  test('Reset Password: Should return HTTP 400 when token is invalid or expired', async () => {
    jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [] }); // token not found / expired

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-token', newPassword: 'ValidNewPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid or expired password reset token');
  });

  test('Reset Password: Should update user password and mark token used when token is valid', async () => {
    const mockTokenRow = { id: 'token-uuid-1', user_id: 'user-uuid-1', used: false };
    jest.spyOn(db, 'query')
      .mockResolvedValueOnce({ rows: [mockTokenRow] }) // SELECT token
      .mockResolvedValueOnce({ rows: [] }) // UPDATE users password_hash
      .mockResolvedValueOnce({ rows: [] }); // UPDATE password_reset_tokens used = TRUE

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'valid-raw-token', newPassword: 'ValidNewPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password updated successfully');
  });
});
