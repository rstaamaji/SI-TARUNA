import { describe, it } from 'node:test';
import assert from 'node:assert';
import { request, app, getAdminAuth, getMemberAuth } from './setup';

export const runAuthTests = () => {
  describe('1. Authentication Module (/api/auth)', () => {
    it('should successfully login as ADMIN with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token, 'Token JWT harus tersedia');
      assert.strictEqual(res.body.data.user.role, 'ADMIN');
      assert.strictEqual(res.body.data.user.username, 'admin');
    });

    it('should successfully login as MEMBER with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'member', password: 'member123' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token, 'Token JWT harus tersedia');
      assert.strictEqual(res.body.data.user.role, 'MEMBER');
      assert.strictEqual(res.body.data.user.username, 'member');
    });

    it('should reject login with wrong password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /kredensial tidak valid/i);
    });

    it('should reject login with non-existent username (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistentuser999', password: 'password123' });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /kredensial tidak valid/i);
    });

    it('should reject login request with invalid body payload (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: '' }); // missing password and empty username

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('should fetch current authenticated user profile via /api/auth/me', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.username, 'admin');
      assert.strictEqual(res.body.data.role, 'ADMIN');
    });

    it('should reject /api/auth/me without authorization token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/auth/me');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });
  });
};

if (require.main === module) {
  runAuthTests();
}
