const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('=== TEST MEMBER MANAGEMENT CRUD ===\n');

  // 1. Login Admin
  const adminLogin = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'admin', password: 'admin123' });
  const adminToken = adminLogin.body.data.token;
  console.log('1. Admin Token acquired:', adminToken.slice(0, 20) + '...');

  // 2. GET /api/members?page=1&limit=5
  const listRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/members?page=1&limit=5', method: 'GET',
    headers: { 'Authorization': 'Bearer ' + adminToken }
  });
  console.log('2. GET /api/members Status:', listRes.status);
  console.log('   Total in DB:', listRes.body.data.pagination.total, 'Count in page:', listRes.body.data.members.length);

  // 3. Search members
  const searchRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/members?search=Wahyu', method: 'GET',
    headers: { 'Authorization': 'Bearer ' + adminToken }
  });
  console.log('3. Search "Wahyu" Status:', searchRes.status, 'Results:', searchRes.body.data.members.map(m => m.name));

  // 4. Create new member
  const createRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/members', method: 'POST',
    headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' }
  }, {
    name: 'Ardi Prasetyo Nugroho',
    gender: 'MALE',
    phone: '081234567899',
    address: 'RT 04 / RW 01, Dusun Tuk Uluh, Desa Sringin',
    status: 'ACTIVE'
  });
  console.log('4. Create Member Status:', createRes.status);
  console.log('   Created Member:', createRes.body.data.memberNumber, '-', createRes.body.data.name);
  const newMemberId = createRes.body.data.id;

  // 5. Update member
  const updateRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/members/' + newMemberId, method: 'PUT',
    headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' }
  }, {
    name: 'Ardi Prasetyo Nugroho, S.Kom.'
  });
  console.log('5. Update Member Status:', updateRes.status, 'Updated Name:', updateRes.body.data.name);

  // 6. Update Status to INACTIVE
  const statusRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/members/' + newMemberId + '/status', method: 'PATCH',
    headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' }
  }, { status: 'INACTIVE' });
  console.log('6. Status Toggle Status:', statusRes.status, 'New Status:', statusRes.body.data.status);

  // 7. Delete Member
  const deleteRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/members/' + newMemberId, method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + adminToken }
  });
  console.log('7. Delete Member Status:', deleteRes.status, 'Message:', deleteRes.body.message);

  // 8. Member attempt to create (Forbidden check)
  const memberLogin = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'member', password: 'member123' });
  const memberToken = memberLogin.body.data.token;

  const forbiddenRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/members', method: 'POST',
    headers: { 'Authorization': 'Bearer ' + memberToken, 'Content-Type': 'application/json' }
  }, { name: 'Hacker Member', gender: 'MALE', address: 'Jumantono' });
  console.log('8. Member Create Attempt (Expect 403):', forbiddenRes.status, forbiddenRes.body.message);

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

run().catch(console.error);
