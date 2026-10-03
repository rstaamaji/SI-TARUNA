import { describe, it } from 'node:test';
import assert from 'node:assert';
import { request, app, getAdminAuth, getMemberAuth } from './setup';

export const runMemberTests = () => {
  describe('3. Member Management & Profile Module (/api/members)', () => {
    let testMemberId: string;
    const testMemberNumber = `KT-TEST-${Date.now()}`;

    it('should fetch member list with pagination and summary for authenticated user', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/members')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.members));
      assert.ok(typeof (res.body.data.pagination?.total ?? res.body.data.total) === 'number');
    });

    it('should filter members by status and search keyword', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .get('/api/members?status=ACTIVE&search=Rustam')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('should allow ADMIN to create a new member', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${token}`)
        .send({
          memberNumber: testMemberNumber,
          name: 'Anggota Test Unit',
          gender: 'MALE',
          phone: '081299998888',
          address: 'RT 02 / RW 01, Dusun Tuk Uluh',
          status: 'ACTIVE',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.memberNumber, testMemberNumber);
      testMemberId = res.body.data.id;
    });

    it('should reject creating a member with duplicate memberNumber (409 Conflict)', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${token}`)
        .send({
          memberNumber: testMemberNumber,
          name: 'Duplikat Anggota',
          gender: 'FEMALE',
          address: 'Dusun Tuk Uluh',
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
    });

    it('should get member detail by ID', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get(`/api/members/${testMemberId}`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.id, testMemberId);
    });

    it('should allow ADMIN to update member data', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .put(`/api/members/${testMemberId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Anggota Test Unit Updated',
          phone: '081200001111',
          address: 'RT 03 / RW 01, Dusun Tuk Uluh',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.name, 'Anggota Test Unit Updated');
    });

    it('should allow ADMIN to toggle member status (ACTIVE -> INACTIVE)', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .patch(`/api/members/${testMemberId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'INACTIVE',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, 'INACTIVE');
    });

    it('should allow MEMBER to view their personal profile with statistics (Module 26)', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/members/profile/me')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.stats, 'Statistik kehadiran harus tersedia');
      assert.ok(typeof res.body.data.stats.totalEvents === 'number');
      assert.ok(typeof res.body.data.stats.attendanceRate === 'number');
    });

    it('should allow MEMBER to update permitted profile fields', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .put('/api/members/profile/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: '089988776655',
          address: 'Alamat Update Member',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    it('should strictly forbid MEMBER from attempting to change their role (403 Forbidden)', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .put('/api/members/profile/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          role: 'ADMIN', // Terlarang!
        });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /tidak diizinkan mengubah role/i);
    });

    it('should allow ADMIN to delete the test member', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .delete(`/api/members/${testMemberId}`)
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });
  });
};

if (require.main === module) {
  runMemberTests();
}
