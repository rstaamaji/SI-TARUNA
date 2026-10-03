import { describe, it } from 'node:test';
import assert from 'node:assert';
import { request, app, getAdminAuth, getMemberAuth } from './setup';

export const runAnnouncementTests = () => {
  describe('6. Announcements Module (/api/announcements)', () => {
    let testAnnouncementId: string;

    it('should fetch announcements for authenticated users', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.announcements || res.body.data));
    });

    it('should fetch urgent/attention announcements', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/announcements/attention')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('should allow ADMIN to create new announcement', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Pengumuman Rapat Bulanan Test',
          content: 'Diharapkan seluruh pengurus dan anggota hadir di Balai Dusun Tuk Uluh.',
          type: 'RAPAT',
          isAttention: true,
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Pengumuman Rapat Bulanan Test');
      testAnnouncementId = res.body.data.id;
    });

    it('should reject creating announcement with missing title or content (400 Bad Request)', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '', // Empty title
          content: '',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('should allow ADMIN to update announcement', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .put(`/api/announcements/${testAnnouncementId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Pengumuman Rapat Bulanan Test (Diperbarui)',
          content: 'Perubahan jam rapat menjadi 19.30 WIB.',
          type: 'RAPAT',
          isAttention: false,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Pengumuman Rapat Bulanan Test (Diperbarui)');
    });

    it('should allow ADMIN to delete announcement', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .delete(`/api/announcements/${testAnnouncementId}`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });
  });
};

if (require.main === module) {
  runAnnouncementTests();
}
