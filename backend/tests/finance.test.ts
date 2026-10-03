import { describe, it } from 'node:test';
import assert from 'node:assert';
import { request, app, getAdminAuth, getMemberAuth } from './setup';

export const runFinanceTests = () => {
  describe('4. Financial Transparency & Cash Withdrawal Module (/api/finance)', () => {
    let createdIncomeId: string;
    let createdExpenseId: string;

    it('should fetch financial overview with income, expense, and current balance', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/finance/overview')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok('totalKas' in res.body.data);
      assert.ok('totalPemasukan' in res.body.data);
      assert.ok('totalPengeluaran' in res.body.data);
      assert.ok('saldoSaatIni' in res.body.data);
    });

    it('should allow MEMBER to read income transactions list', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/finance/incomes')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    it('should allow ADMIN to record new income transaction', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/finance/incomes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 250000,
          description: 'Donasi Test Warga',
          source: 'Donasi',
          category: 'Donasi',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(Number(res.body.data.amount), 250000);
      createdIncomeId = res.body.data.id;
    });

    it('should reject recording income with negative or zero amount (400 Bad Request)', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/finance/incomes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: -50000, // Invalid negative amount
          description: 'Invalid Transaction',
          source: 'Donasi',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('should allow ADMIN to record new expense transaction', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/finance/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 75000,
          description: 'Konsumsi Rapat Pengurus Test',
          category: 'Konsumsi',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(Number(res.body.data.amount), 75000);
      createdExpenseId = res.body.data.id;
    });

    it('should allow ADMIN to record cash withdrawal (pengambilan kas)', async () => {
      const { token } = await getAdminAuth();
      const res = await request(app)
        .post('/api/withdrawals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          withdrawerName: 'Rustam Aji',
          amount: 50000,
          purpose: 'Pembelian ATK Notulensi',
          description: 'Pengambilan kas operasional test',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.withdrawerName, 'Rustam Aji');
    });

    it('should fetch cash withdrawal summary and records', async () => {
      const { token } = await getMemberAuth();
      const res = await request(app)
        .get('/api/withdrawals/summary')
        .set('Authorization', `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok('totalWithdrawn' in res.body.data);
    });

    // Cleanup created test transactions
    it('should allow ADMIN to cleanup test finance transactions', async () => {
      const { token } = await getAdminAuth();
      if (createdIncomeId) {
        await request(app)
          .delete(`/api/finance/incomes/${createdIncomeId}`)
          .set('Authorization', `Bearer ${token}`);
      }
      if (createdExpenseId) {
        await request(app)
          .delete(`/api/finance/expenses/${createdExpenseId}`)
          .set('Authorization', `Bearer ${token}`);
      }
    });
  });
};

if (require.main === module) {
  runFinanceTests();
}
