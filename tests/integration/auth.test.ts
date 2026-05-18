import request from 'supertest';
import app from '../../src/app';
import { User } from '../../src/schemas/user.schema';

describe('🔑 Authentication & Session Integration Tests', () => {
  const mockUser = {
    username: 'testplayer',
    email: 'testplayer@ffairdrop.gg',
    password: 'Password123!',
  };

  // Clean the database collections before each test run
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('📥 POST /api/auth/register', () => {
    it('should successfully register a new user with starting balance', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(mockUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.username).toBe(mockUser.username);
      expect(res.body.data.user.email).toBe(mockUser.email);
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Should exclude hash
      expect(res.body.data.user.wallet.balance).toBe(10); // Check starter balance (BDT 10)
    });

    it('should reject registration if the email is already in use', async () => {
      // 1. Create first user
      await request(app).post('/api/auth/register').send(mockUser);

      // 2. Propose duplicate registration
      const res = await request(app).post('/api/auth/register').send(mockUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should reject registration on validation parameter failures', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'p', // Too short
          email: 'invalid-email',
          password: '123', // Too short
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details.length).toBe(3); // All 3 rules should fail
    });
  });

  describe('🔓 POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register user before performing login assertions
      await request(app).post('/api/auth/register').send(mockUser);
    });

    it('should authenticate correctly and issue secure session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(mockUser.username);
      
      // Assert that a session JWT cookie is issued
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=/);
      expect(cookies[0]).toMatch(/HttpOnly/);
      expect(cookies[0]).toMatch(/SameSite=Strict/);
    });

    it('should reject login on invalid password input', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('👤 GET /api/auth/me', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      // Register and login to retrieve an active session cookie
      await request(app).post('/api/auth/register').send(mockUser);
      
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: mockUser.email,
          password: mockUser.password,
        });

      sessionCookie = loginRes.headers['set-cookie'][0].split(';')[0];
    });

    it('should retrieve active player profile using session cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [sessionCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe(mockUser.username);
      expect(res.body.data.user.wallet.balance).toBe(10);
    });

    it('should reject profile request if no session cookie is supplied', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NO_TOKEN_PROVIDED');
    });
  });

  describe('🚪 POST /api/auth/logout', () => {
    it('should clear the session token cookie on logout', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=;/); // Cleared cookie
    });
  });
});
