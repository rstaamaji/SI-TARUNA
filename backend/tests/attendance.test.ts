import { describe, it } from 'node:test';
import assert from 'node:assert';
import { request, app, getAdminAuth, getMemberAuth } from './setup';

export const runAttendanceTests = () => {
  describe('5. Attendance Management Module (/api/attendance)', () => {
    let testEventId: string;

    it('should fetch attendance records for authenticated users', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.records || res.body.data));
    });

    it('should allow MEMBER to fetch personal attendance history', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/attendance/my-history')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('should allow ADMIN to create a new event for attendance', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/attendance/events')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Kerja Bakti Lapangan Test',
          description: 'Membersihkan lapangan voli',
          eventDate: new Date().toISOString(),
          location: 'Lapangan Dusun Tuk Uluh',
          type: 'COMMUNITY_SERVICE',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      testEventId = res.body.data.id;
    });

    it('should get event attendance sheet', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .get(`/api/attendance/events/${testEventId}`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.event.id, testEventId);
    });

    it('should allow ADMIN to record attendance for members', async () => {
      const { token } = await getAdminAuth();
      // Ambil satu member id
      const membersRes = await request(app)
        .get('/api/members?limit=1')
        .set('Authorization', `Bearer ${token}`);

      const memberId = membersRes.body.data.members[0]?.id;
      if (memberId) {
        const res = await request(app)
          .post(`/api/attendance/events/${testEventId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            attendances: [
              {
                memberId,
                status: 'PRESENT',
                notes: 'Hadir tepat waktu',
              },
            ],
          });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
      }
    });

    it('should allow ADMIN to view attendance statistics across members', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .get('/api/attendance/statistics')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.summary);
    });
  });
};

if (require.main === module) {
  runAttendanceTests();
}
