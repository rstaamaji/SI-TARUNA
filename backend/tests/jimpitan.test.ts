import { describe, it } from 'node:test';
import assert from 'node:assert';
import { request, app, getAdminAuth, getMemberAuth } from './setup';

export const runJimpitanTests = () => {
  describe('8. Jimpitan Management Module (/api/jimpitan)', () => {
    let testRecordId: string;
    let groupId: string;
    const testMonth = 12;
    const testYear = 2029; // Tahun masa depan unik agar tidak konflik dengan data seed

    it('should fetch 7 groups for Jimpitan (Kelompok 1 - 7)', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/jimpitan/groups')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 7, 'Harus memiliki minimal 7 kelompok jimpitan');
      groupId = res.body.data[0].id;
    });

    it('should fetch jimpitan dashboard with group breakdown and total calculation', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/jimpitan/dashboard')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok('totalJimpitanBulanIni' in res.body.data);
      assert.ok('groups' in res.body.data);
    });

    it('should allow ADMIN to record monthly jimpitan for a group', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/jimpitan')
        .set('Authorization', `Bearer ${token}`)
        .send({
          groupId,
          month: testMonth,
          year: testYear,
          amount: 150000,
          notes: 'Setoran Uji Coba Unit Testing',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(Number(res.body.data.amount), 150000);
      testRecordId = res.body.data.id;
    });

    it('should strictly reject duplicate jimpitan record for the same group, month, and year (400 Bad Request)', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/jimpitan')
        .set('Authorization', `Bearer ${token}`)
        .send({
          groupId,
          month: testMonth,
          year: testYear,
          amount: 175000,
          notes: 'Duplikat input terlarang',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /sudah memiliki catatan jimpitan|duplikat/i);
    });

    it('should allow ADMIN to update jimpitan record', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .put(`/api/jimpitan/${testRecordId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 180000,
          notes: 'Diperbarui oleh unit test',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(Number(res.body.data.amount), 180000);
    });

    it('should allow ADMIN to delete the test jimpitan record', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .delete(`/api/jimpitan/${testRecordId}`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });
  });
};

if (require.main === module) {
  runJimpitanTests();
}
