import { PrismaClient, Role, Gender, MemberStatus, TransactionType, AttendanceStatus, ArisanStatus, EventType, NotificationType, AnnouncementType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for SI-TARUNA...');

  // 1. Password Hashing
  const hashedPasswordSuperadmin = await bcrypt.hash('superadmin', 10);
  const hashedPasswordTukuluhJaya = await bcrypt.hash('TukuluhJaya', 10);

  // 2. Create Users
  // Superadmin: rustaamaji / superadmin
  const superadminUser = await prisma.user.upsert({
    where: { username: 'rustaamaji' },
    update: {
      password: hashedPasswordSuperadmin,
      role: Role.SUPERADMIN,
      isApproved: true,
    },
    create: {
      username: 'rustaamaji',
      email: 'rustaamaji@taruna-setyabakti.id',
      password: hashedPasswordSuperadmin,
      role: Role.SUPERADMIN,
      isApproved: true,
    },
  });

  // Admin: admin / TukuluhJaya (Disetujui oleh Superadmin rustaamaji)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPasswordTukuluhJaya,
      role: Role.ADMIN,
      isApproved: true,
      approvedBy: 'rustaamaji',
      approvedAt: new Date(),
    },
    create: {
      username: 'admin',
      email: 'admin@taruna-setyabakti.id',
      password: hashedPasswordTukuluhJaya,
      role: Role.ADMIN,
      isApproved: true,
      approvedBy: 'rustaamaji',
      approvedAt: new Date(),
    },
  });

  // Super Admin Rustam Aji: Nama Lengkap sebagai username / TukuluhJaya
  const rustamAjiMemberUser = await prisma.user.upsert({
    where: { username: 'Rustam Aji' },
    update: {
      password: hashedPasswordTukuluhJaya,
      role: Role.SUPERADMIN,
      isApproved: true,
    },
    create: {
      username: 'Rustam Aji',
      email: 'rustam.aji@taruna-setyabakti.id',
      password: hashedPasswordTukuluhJaya,
      role: Role.SUPERADMIN,
      isApproved: true,
    },
  });

  // Member Bambang Pamungkas: Nama Lengkap sebagai username / TukuluhJaya
  const memberUser = await prisma.user.upsert({
    where: { username: 'Bambang Pamungkas' },
    update: {
      password: hashedPasswordTukuluhJaya,
      role: Role.MEMBER,
      isApproved: true,
    },
    create: {
      username: 'Bambang Pamungkas',
      email: 'bambang.pamungkas@taruna-setyabakti.id',
      password: hashedPasswordTukuluhJaya,
      role: Role.MEMBER,
      isApproved: true,
    },
  });

  // 3. Create 25 realistic members (Dusun Tuk Uluh, Desa Sringin, Jumantono)
  const dummyMembersData = [
    {
      memberNumber: 'KT-SB-001',
      name: 'Rustam Aji',
      gender: Gender.MALE,
      phone: '081234567801',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-01-10'),
      status: MemberStatus.ACTIVE,
      userId: rustamAjiMemberUser.id,
    },
    {
      memberNumber: 'KT-SB-002',
      name: 'Bambang Pamungkas',
      gender: Gender.MALE,
      phone: '081234567802',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-01-10'),
      status: MemberStatus.ACTIVE,
      userId: memberUser.id,
    },
    {
      memberNumber: 'KT-SB-003',
      name: 'Dewi Lestari',
      gender: Gender.FEMALE,
      phone: '081234567803',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-02-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-004',
      name: 'Eko Prasetyo',
      gender: Gender.MALE,
      phone: '081234567804',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-02-20'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-005',
      name: 'Siti Rahayu',
      gender: Gender.FEMALE,
      phone: '081234567805',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-03-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-006',
      name: 'Agus Setiawan',
      gender: Gender.MALE,
      phone: '081234567806',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-03-05'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-007',
      name: 'Tri Wahyuni',
      gender: Gender.FEMALE,
      phone: '081234567807',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-04-12'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-008',
      name: 'Bayu Saputra',
      gender: Gender.MALE,
      phone: '081234567808',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-04-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-009',
      name: 'Rina Anggraini',
      gender: Gender.FEMALE,
      phone: '081234567809',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-05-10'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-010',
      name: 'Dwi Nugroho',
      gender: Gender.MALE,
      phone: '081234567810',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-05-20'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-011',
      name: 'Nur Hidayah',
      gender: Gender.FEMALE,
      phone: '081234567811',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-06-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-012',
      name: 'Fajar Maulana',
      gender: Gender.MALE,
      phone: '081234567812',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-06-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-013',
      name: 'Sri Wahyuningsih',
      gender: Gender.FEMALE,
      phone: '081234567813',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-07-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-014',
      name: 'Hendra Gunawan',
      gender: Gender.MALE,
      phone: '081234567814',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-07-20'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-015',
      name: 'Indah Permatasari',
      gender: Gender.FEMALE,
      phone: '081234567815',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-08-05'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-016',
      name: 'Joko Susilo',
      gender: Gender.MALE,
      phone: '081234567816',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-08-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-017',
      name: 'Kurnia Sari',
      gender: Gender.FEMALE,
      phone: '081234567817',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-09-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-018',
      name: 'Luki Wibowo',
      gender: Gender.MALE,
      phone: '081234567818',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-09-25'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-019',
      name: 'Mega Puspita',
      gender: Gender.FEMALE,
      phone: '081234567819',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-10-10'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-020',
      name: 'Nanang Riyadi',
      gender: Gender.MALE,
      phone: '081234567820',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-11-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-021',
      name: 'Oki Setiawan',
      gender: Gender.MALE,
      phone: '081234567821',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-11-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-022',
      name: 'Putri Wulandari',
      gender: Gender.FEMALE,
      phone: '081234567822',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-12-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-023',
      name: 'Rendi Saputra',
      gender: Gender.MALE,
      phone: '081234567823',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2024-01-10'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-024',
      name: 'Sinta Bella',
      gender: Gender.FEMALE,
      phone: '081234567824',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2024-02-05'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-025',
      name: 'Wahyu Pratama',
      gender: Gender.MALE,
      phone: '081234567825',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2024-03-01'),
      status: MemberStatus.ACTIVE,
    },
  ];

  // Unlink legacy users from members before re-linking
  await prisma.member.updateMany({
    data: { userId: null },
  });
  await prisma.user.deleteMany({
    where: { username: 'member' },
  });

  const createdMembers: any[] = [];
  for (const m of dummyMembersData) {
    let assignedUserId = m.userId || null;

    // Otomatis buatkan akun User untuk setiap member agar bisa login dengan Nama Lengkap & TukuluhJaya
    if (!assignedUserId) {
      const email = `${m.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@taruna-setyabakti.id`;
      const u = await prisma.user.upsert({
        where: { username: m.name },
        update: {
          password: hashedPasswordTukuluhJaya,
          role: Role.MEMBER,
          isApproved: true,
        },
        create: {
          username: m.name,
          email,
          password: hashedPasswordTukuluhJaya,
          role: Role.MEMBER,
          isApproved: true,
        },
      });
      assignedUserId = u.id;
    }

    const member = await prisma.member.upsert({
      where: { memberNumber: m.memberNumber },
      update: {
        name: m.name,
        userId: assignedUserId,
        phone: m.phone,
        address: m.address,
        gender: m.gender,
        status: m.status,
      },
      create: {
        ...m,
        userId: assignedUserId,
      },
    });
    createdMembers.push(member);
  }

  console.log(`✅ Seeded ${createdMembers.length} members successfully.`);

  // 4. Create Jimpitan Groups 1 to 7
  const jimpitanGroupsData = [
    { groupNumber: 1, name: 'Kelompok 1 (RT 01 Dusun Tuk Uluh Barat)' },
    { groupNumber: 2, name: 'Kelompok 2 (RT 01 Dusun Tuk Uluh Timur)' },
    { groupNumber: 3, name: 'Kelompok 3 (RT 02 Dusun Tuk Uluh Utara)' },
    { groupNumber: 4, name: 'Kelompok 4 (RT 02 Dusun Tuk Uluh Selatan)' },
    { groupNumber: 5, name: 'Kelompok 5 (RT 03 Dusun Tuk Uluh Krajan)' },
    { groupNumber: 6, name: 'Kelompok 6 (RT 03 Dusun Tuk Uluh Wetan)' },
    { groupNumber: 7, name: 'Kelompok 7 (Dusun Tuk Uluh Perbatasan)' },
  ];

  const createdGroups: any[] = [];
  for (const g of jimpitanGroupsData) {
    const group = await prisma.jimpitanGroup.upsert({
      where: { groupNumber: g.groupNumber },
      update: {},
      create: g,
    });
    createdGroups.push(group);
  }

  // Seed monthly records for each group (Bulan 8, 9, 10 Tahun 2026)
  for (const g of createdGroups) {
    await prisma.jimpitanRecord.createMany({
      data: [
        {
          groupId: g.id,
          month: 8,
          year: 2026,
          amount: 145000,
          notes: 'Lunas terekap pada pertemuan Agustus',
        },
        {
          groupId: g.id,
          month: 9,
          year: 2026,
          amount: 155000,
          notes: 'Lunas terekap pada pertemuan September',
        },
        {
          groupId: g.id,
          month: 10,
          year: 2026,
          amount: 130000,
          notes: 'Pencatatan berjalan bulan Oktober',
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log(`✅ Seeded 7 Jimpitan Groups with monthly records.`);

  // 5. Create Events
  const meetingEvent = await prisma.event.create({
    data: {
      title: 'Pertemuan Rutin & Arisan Pemuda Oktober 2026',
      description: 'Pertemuan rutin bulanan Karang Taruna Setya Bakti, evaluasi kas, dan penarikan undian arisan.',
      eventDate: new Date('2026-10-05T19:30:00Z'),
      location: 'Balai Dusun Tuk Uluh',
      type: EventType.MEETING,
    },
  });

  const kerjaBaktiEvent = await prisma.event.create({
    data: {
      title: 'Kerja Bakti Bersih Lingkungan Dusun',
      description: 'Pembersihan saluran air dan pengecatan gapura Dusun Tuk Uluh menjelang musim hujan.',
      eventDate: new Date('2026-10-12T06:30:00Z'),
      location: 'Area Lapangan & Gapura Tuk Uluh',
      type: EventType.COMMUNITY_SERVICE,
    },
  });

  const tournamentEvent = await prisma.event.create({
    data: {
      title: 'Turnamen Bola Voli Antar RT Sringin',
      description: 'Pertandingan persahabatan bola voli pemuda antar RT Desa Sringin.',
      eventDate: new Date('2026-10-25T15:30:00Z'),
      location: 'Lapangan Olahraga Sringin',
      type: EventType.SPORTS,
    },
  });

  console.log('✅ Seeded 3 Events.');

  // 6. Seed Attendance for meeting event
  for (let i = 0; i < createdMembers.length; i++) {
    const member = createdMembers[i];
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    let notes: string | null = null;

    if (i === 23) {
      status = AttendanceStatus.EXCUSED;
      notes = 'Izin sedang ujian kuliah di Surakarta';
    } else if (i === 24) {
      status = AttendanceStatus.ABSENT;
      notes = 'Tanpa keterangan';
    }

    await prisma.attendance.create({
      data: {
        memberId: member.id,
        eventId: meetingEvent.id,
        status,
        notes,
      },
    });
  }

  console.log(`✅ Seeded Attendance records for ${createdMembers.length} members.`);

  // 7. Finance Transactions
  await prisma.financeTransaction.createMany({
    data: [
      {
        type: TransactionType.INCOME,
        amount: 640000,
        description: 'Iuran wajib anggota periode September 2026 (64 pemuda)',
        transactionDate: new Date('2026-09-28'),
        createdById: adminUser.id,
      },
      {
        type: TransactionType.EXPENSE,
        amount: 350000,
        description: 'Pembelian cat gapura & konsumsi rapat koordinasi',
        transactionDate: new Date('2026-09-25'),
        createdById: adminUser.id,
      },
      {
        type: TransactionType.INCOME,
        amount: 920000,
        description: 'Setoran jimpitan seluruh kelompok RT 01-RT 03 Dusun Tuk Uluh',
        transactionDate: new Date('2026-09-20'),
        createdById: adminUser.id,
      },
      {
        type: TransactionType.INCOME,
        amount: 2500000,
        description: 'Bantuan dana pembinaan kepemudaan dari Kas Desa Sringin',
        transactionDate: new Date('2026-09-01'),
        createdById: adminUser.id,
      },
    ],
  });

  // 8. Cash Withdrawal and its single linked expense
  await prisma.$transaction(async (tx) => {
    const expense = await tx.financeTransaction.create({
      data: {
        type: TransactionType.EXPENSE,
        amount: 500000,
        description: '[Pengambilan Kas] Anggota 2 - Penerimaan hak arisan anggota',
        category: 'Pengambilan Kas',
        transactionDate: new Date('2026-09-15'),
        createdById: adminUser.id,
      },
    });

    await tx.cashWithdrawal.create({
      data: {
        withdrawerName: createdMembers[1].name,
        memberId: createdMembers[1].id,
        amount: 500000,
        withdrawalDate: new Date('2026-09-15'),
        purpose: 'Penerimaan hak arisan anggota',
        description: 'Pemenang undian arisan putaran ke-8',
        financeTransactionId: expense.id,
        createdById: adminUser.id,
      },
    });
  });

  console.log('✅ Seeded 5 Finance Transactions.');

  // 9. Announcements
  await prisma.announcement.deleteMany(); // Clear existing to seed fresh types
  await prisma.announcement.createMany({
    data: [
      {
        title: 'PERHATIAN: Rapat Pleno & Pembentukan Panitia Turnamen 2026',
        content: 'Diharapkan kehadiran SELURUH anggota pemuda-pemudi Karang Taruna Setya Bakti Dusun Tuk Uluh. Agenda sangat krusial: Pembentukan panitia turnamen voli antardusun dan pembahasan laporan pertanggungjawaban kas periode kuartal 3.',
        type: AnnouncementType.RAPAT,
        isAttention: true,
        announcementDate: new Date('2026-10-01T08:00:00'),
        eventDate: new Date('2026-10-05T19:30:00'),
        createdById: adminUser.id,
      },
      {
        title: 'Iuran Wajib Bulanan Periode Oktober 2026',
        content: 'Diberitahukan kepada seluruh anggota Karang Taruna Setya Bakti bahwa iuran wajib sebesar Rp 10.000 dapat disetorkan kepada bendahara dusun paling lambat tanggal 10 Oktober 2026.',
        type: AnnouncementType.PENGUMUMAN,
        isAttention: true,
        announcementDate: new Date('2026-09-29T10:00:00'),
        eventDate: new Date('2026-10-10T23:59:00'),
        createdById: adminUser.id,
      },
      {
        title: 'Pelaksanaan Kerja Bakti Pembersihan Lingkungan & Gorong-Gorong',
        content: 'Dalam rangka menjaga kebersihan lingkungan dan mengantisipasi musim penghujan, seluruh pemuda diharapkan hadir pada kerja bakti hari Minggu pukul 06.30 WIB dengan membawa cangkul dan sabit.',
        type: AnnouncementType.KERJA_BAKTI,
        isAttention: false,
        announcementDate: new Date('2026-09-28T09:00:00'),
        eventDate: new Date('2026-10-12T06:30:00'),
        createdById: adminUser.id,
      },
      {
        title: 'Undian Arisan Pemuda Putaran Ke-9',
        content: 'Undian arisan putaran ke-9 akan diselenggarakan di kediaman Sdr. Bambang (RT 01) bersamaan dengan kumpul rutin malam Minggu. Harap menyelesaikan setoran arisan sebelum pengundian dimulai.',
        type: AnnouncementType.ARISAN,
        isAttention: false,
        announcementDate: new Date('2026-09-25T14:00:00'),
        eventDate: new Date('2026-10-15T20:00:00'),
        createdById: adminUser.id,
      },
      {
        title: 'Informasi Pendaftaran Turnamen Bulutangkis Antardusun',
        content: 'Bagi rekan-rekan anggota yang berminat mewakili Dusun Tuk Uluh dalam turnamen bulutangkis kecamatan, pendaftaran dibuka sampai 8 Oktober 2026 melalui koordinator seksi olahraga.',
        type: AnnouncementType.INFORMASI,
        isAttention: false,
        announcementDate: new Date('2026-09-20T11:00:00'),
        eventDate: new Date('2026-10-08T18:00:00'),
        createdById: adminUser.id,
      },
      {
        title: 'Inventarisasi Perlengkapan Tenda & Sound System Dusun',
        content: 'Diberitahukan kepada anggota yang saat ini menyimpan kabel roll, mikrofon, atau inventaris sound dusun harap mengembalikannya ke posko pemuda untuk dilakukan pengecekan kondisi berkala.',
        type: AnnouncementType.LAINNYA,
        isAttention: false,
        announcementDate: new Date('2026-09-18T16:00:00'),
        eventDate: null,
        createdById: adminUser.id,
      },
    ],
  });

  // 10. Meeting Minutes
  await prisma.meetingMinute.deleteMany();
  await prisma.meetingMinute.createMany({
    data: [
      {
        meetingDate: new Date('2026-09-10T19:30:00'),
        dayOfWeek: 'Kamis',
        title: 'Rapat Pleno & Evaluasi Program Kerja September 2026',
        location: 'Balai Dusun Tuk Uluh, Desa Sringin',
        meetingLeader: 'Rustam Aji (Super Admin)',
        noteTaker: 'Siti Nurhaliza (Sekretaris 1)',
        content: `1. Pembukaan oleh Super Admin Karang Taruna Setya Bakti (Sdr. Rustam Aji) pukul 19.45 WIB.
2. Sambutan dari Penasihat Karang Taruna Dusun Tuk Uluh mengenai ketertiban pemuda dan keaktifan siskamling.
3. Laporan Kas Keuangan oleh Bendahara (Sdri. Dewi Lestari):
   - Saldo awal: Rp 4.500.000
   - Pemasukan periode berjalan: Rp 3.620.000
   - Pengeluaran operasional & sosial: Rp 1.700.000
   - Saldo akhir kas: Rp 6.420.000
4. Evaluasi Kegiatan Agustusan & Peringatan HUT RI ke-81:
   - Pelaksanaan berjalan lancar dan sukses.
   - Sisa anggaran kegiatan telah dikembalikan ke kas umum organisasi.
5. Pembahasan Agenda Kerja Bakti & Pembersihan Lingkungan Saluran Air Dusun menghadapi musim hujan.
6. Rencana Partisipasi Turnamen Bola Voli Tingkat Kecamatan Jumantono.`,
        conclusion: `1. Seluruh anggota menyetujui laporan pertanggungjawaban keuangan kas periode September 2026.
2. Kerja bakti saluran air disepakati pada hari Minggu, 12 Oktober 2026 pukul 06.30 WIB.
3. Tim bola voli Karang Taruna Setya Bakti akan didaftarkan dengan alokasi dana subsidi kas maksimal Rp 500.000.`,
        followUp: `1. Seksi Perlengkapan (Sdr. Eko & Bambang) mempersiapkan cangkul dan gerobak dorong dusun sebelum tanggal 12 Oktober.
2. Seksi Olahraga (Sdr. Fajar) mengadakan seleksi pemain voli pada hari Jumat sore di lapangan desa.
3. Bendahara membagikan rekapitulasi iuran wajib ke grup WhatsApp anggota.`,
        createdById: adminUser.id,
      },
      {
        meetingDate: new Date('2026-08-10T19:30:00'),
        dayOfWeek: 'Senin',
        title: 'Rapat Koordinasi Persiapan Malam Tirakatan & Pentas Seni Dusun',
        location: 'Kediaman Sdr. Bambang (RT 01 Dusun Tuk Uluh)',
        meetingLeader: 'Rustam Aji (Super Admin)',
        noteTaker: 'Eko Prasetyo (Sekretaris 2)',
        content: `1. Rapat dibuka pukul 20.00 WIB di kediaman Sdr. Bambang RT 01.
2. Pembentukan kepanitiaan malam tirakatan HUT RI ke-81.
3. Susunan acara malam tirakatan: tahlil bersama, sambutan kepala dusun, pemotongan tumpeng, pembagian hadiah lomba anak-anak, dan ramah tamah.
4. Rincian anggaran konsumsi dan sound system dusun.`,
        conclusion: `1. Panitia pelaksana diketuai oleh Sdr. Bambang.
2. Iuran sukarela warga dikoordinasikan bersama pengurus RT 01, 02, dan 03.
3. Gladi bersih panggung pada tanggal 15 Agustus malam.`,
        followUp: `1. Pembelian terpal dan sewa sound system diselesaikan paling lambat 14 Agustus 2026.
2. Konsumsi dikoordinasikan dengan kelompok ibu-ibu PKK Dusun Tuk Uluh.`,
        createdById: adminUser.id,
      },
    ],
  });

  // 11. Arisan Records
  await prisma.arisan.createMany({
    data: [
      {
        memberId: createdMembers[0].id,
        month: 7,
        year: 2026,
        drawDate: new Date('2026-07-10'),
        status: ArisanStatus.WON,
      },
      {
        memberId: createdMembers[1].id,
        month: 8,
        year: 2026,
        drawDate: new Date('2026-08-10'),
        status: ArisanStatus.WON,
      },
      {
        memberId: createdMembers[2].id,
        month: 9,
        year: 2026,
        drawDate: new Date('2026-09-10'),
        status: ArisanStatus.WON,
      },
      {
        memberId: createdMembers[3].id,
        month: 10,
        year: 2026,
        drawDate: new Date('2026-10-05'),
        status: ArisanStatus.PENDING,
      },
      {
        memberId: createdMembers[4].id,
        month: 11,
        year: 2026,
        drawDate: null,
        status: ArisanStatus.PENDING,
      },
    ],
  });

  // 12. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'Pertemuan Rutin Minggu Ini',
        message: 'Pertemuan bulanan Karang Taruna Setya Bakti dijadwalkan pada hari Minggu, 05 Oktober 2026 di Balai Dusun Tuk Uluh.',
        type: NotificationType.EVENT,
        isRead: false,
      },
      {
        userId: adminUser.id,
        title: 'Rekapitulasi Jimpitan Masuk',
        message: 'Setoran jimpitan RT 01 dan RT 02 telah berhasil dicatat dalam kas organisasi.',
        type: NotificationType.FINANCE,
        isRead: false,
      },
      {
        userId: memberUser.id,
        title: 'Pengingat Iuran Kas Oktober',
        message: 'Jangan lupa untuk melunasi iuran wajib kas bulanan sebelum tanggal 10 Oktober.',
        type: NotificationType.INFO,
        isRead: true,
      },
    ],
  });

  console.log('🎉 Database seeding completed successfully for SI-TARUNA!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
