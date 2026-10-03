import { describe, it } from 'node:test';
import assert from 'node:assert';
import { request, app, getAdminAuth, getMemberAuth } from './setup';

export const runArisanTests = () => {
  describe('7. Arisan Management Module (/api/arisan)', () => {
    let testArisanId: string;

    it('should fetch arisan periods for authenticated members', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/arisan')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('should fetch upcoming arisan (Arisan Terdekat)', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/arisan/upcoming')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('should fetch arisan history records', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/arisan/history')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('should allow ADMIN to schedule new arisan period', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/arisan')
        .set('Authorization', `Bearer ${token}`)
        .send({
          month: 12,
          year: 2026,
          location: 'Rumah Warga RT 02 Dusun Tuk Uluh',
          amount: 500000,
          drawDate: '2026-12-05T00:00:00.000Z',
          status: 'UPCOMING',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.month, 12);
      testArisanId = res.body.data.id;
    });

    it('should allow ADMIN to determine arisan winner for the period', async () => {
      const { token } = await getAdminAuth();
      const membersRes = await request(app)
        .get('/api/members?limit=1')
        .set('Authorization', `Bearer ${token}`);

      const memberId = membersRes.body.data.members[0]?.id;
      if (memberId && testArisanId) {
        const res = await request(app)
          .post(`/api/arisan/${testArisanId}/winner`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            memberId,
            location: 'Rumah Pemenang RT 01',
          });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.status, 'WON');
      }
    });

    // Cleanup
    it('should allow ADMIN to cleanup test arisan period', async () => {
      const { token } = await getAdminAuth();
      if (testArisanId) {
        await request(app)
          .delete(`/api/arisan/${testArisanId}`)
          .set('Authorization', `Bearer ${token}`);
      }
    });
  });
};

if (require.main === module) {
  runArisanTests();
}
