import { describe, it } from 'node:test';
import assert from 'node:assert';
import { request, app, getAdminAuth, getMemberAuth } from './setup';

export const runNotificationTests = () => {
  describe('9. Notification System Module (/api/notifications)', () => {
    let sampleNotifId: string;

    it('should fetch personal notifications for authenticated user', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok('notifications' in res.body.data);
      assert.ok('unreadCount' in res.body.data);
      if (res.body.data.notifications.length > 0) {
        sampleNotifId = res.body.data.notifications[0].id;
      }
    });

    it('should fetch unread notifications count', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(typeof res.body.data.unreadCount === 'number');
    });

    it('should allow ADMIN to broadcast notification to all members', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Notifikasi Siaran Test Unit',
          message: 'Pesan pengumuman penting untuk seluruh anggota',
          type: 'INFO',
          link: '/dashboard',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
    });

    it('should mark a specific notification as read', async () => {
      const { token } = await getAdminAuth();
      if (!sampleNotifId) {
        // Ambil lagi jika tadi belum ada
        const notifsRes = await request(app)
          .get('/api/notifications')
          .set('Authorization', `Bearer ${token}`);
        sampleNotifId = notifsRes.body.data.notifications[0]?.id;
      }

      if (sampleNotifId) {
        const res = await request(app)
          .patch(`/api/notifications/${sampleNotifId}/read`)
          .set('Authorization', `Bearer ${token}`);

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
      }
    });

    it('should mark all notifications as read for current user', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('should reject broadcasting from non-admin MEMBER (403 Forbidden)', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .post('/api/notifications/broadcast')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Siaran Ilegal',
          message: 'Pesan tidak sah',
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
    });
  });
};

if (require.main === module) {
  runNotificationTests();
}
