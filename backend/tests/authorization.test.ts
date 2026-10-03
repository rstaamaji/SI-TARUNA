import { describe, it } from 'node:test';
import assert from 'node:assert';
import { request, app, getAdminAuth, getMemberAuth } from './setup';

export const runAuthorizationTests = () => {
  describe('2. Backend RBAC & Authorization Tests', () => {
    it('should grant access to admin endpoints for ADMIN role', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .get('/api/admin/management-data')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('should strictly deny access to admin endpoints for MEMBER role (403 Forbidden)', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/admin/management-data')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /403|hanya dapat diakses oleh admin/i);
    });

    it('should reject requests without token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/admin/management-data');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    it('should reject requests with tampered JWT token (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/admin/management-data')
        .set('Authorization', 'Bearer invalid.tampered.token');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    it('should prevent MEMBER from creating financial transactions (403 Forbidden)', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .post('/api/finance/incomes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 50000,
          description: 'Percobaan input dari member',
          source: 'Iuran',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    it('should prevent MEMBER from creating announcements (403 Forbidden)', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Pengumuman Ilegal',
          content: 'Konten pengumuman',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });

    it('should prevent MEMBER from determining arisan winner (403 Forbidden)', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .post('/api/arisan/dummy-id/winner')
        .set('Authorization', `Bearer ${token}`)
        .send({
          memberId: 'dummy-member',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });
  });
};

if (require.main === module) {
  runAuthorizationTests();
}
