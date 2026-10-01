import { PrismaClient, Role, Gender, MemberStatus, TransactionType, AttendanceStatus, ArisanStatus, EventType, NotificationType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for SI-TARUNA...');

  // 1. Password Hashing
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordMember = await bcrypt.hash('member123', 10);

  // 2. Create Users
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@taruna-setyabakti.id',
      password: hashedPasswordAdmin,
      role: Role.ADMIN,
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { username: 'member' },
    update: {},
    create: {
      username: 'member',
      email: 'member@taruna-setyabakti.id',
      password: hashedPasswordMember,
      role: Role.MEMBER,
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
      userId: adminUser.id,
    },
    {
      memberNumber: 'KT-SB-002',
      name: 'Anggota 2',
      gender: Gender.MALE,
      phone: '081234567802',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-01-10'),
      status: MemberStatus.ACTIVE,
      userId: memberUser.id,
    },
    {
      memberNumber: 'KT-SB-003',
      name: 'Anggota 3',
      gender: Gender.FEMALE,
      phone: '081234567803',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-02-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-004',
      name: 'Anggota 4',
      gender: Gender.MALE,
      phone: '081234567804',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-02-20'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-005',
      name: 'Anggota 5',
      gender: Gender.FEMALE,
      phone: '081234567805',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-03-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-006',
      name: 'Anggota 6',
      gender: Gender.MALE,
      phone: '081234567806',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-03-05'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-007',
      name: 'Anggota 7',
      gender: Gender.MALE,
      phone: '081234567807',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-04-12'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-008',
      name: 'Anggota 8',
      gender: Gender.FEMALE,
      phone: '081234567808',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-04-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-009',
      name: 'Anggota 9',
      gender: Gender.MALE,
      phone: '081234567809',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-05-10'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-010',
      name: 'Anggota 10',
      gender: Gender.MALE,
      phone: '081234567810',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-05-20'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-011',
      name: 'Anggota 11',
      gender: Gender.FEMALE,
      phone: '081234567811',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-06-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-012',
      name: 'Anggota 12',
      gender: Gender.MALE,
      phone: '081234567812',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-06-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-013',
      name: 'Anggota 13',
      gender: Gender.FEMALE,
      phone: '081234567813',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-07-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-014',
      name: 'Anggota 14',
      gender: Gender.MALE,
      phone: '081234567814',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-07-20'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-015',
      name: 'Anggota 15',
      gender: Gender.FEMALE,
      phone: '081234567815',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-08-05'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-016',
      name: 'Anggota 16',
      gender: Gender.MALE,
      phone: '081234567816',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-08-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-017',
      name: 'Anggota 17',
      gender: Gender.FEMALE,
      phone: '081234567817',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-09-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-018',
      name: 'Anggota 18',
      gender: Gender.MALE,
      phone: '081234567818',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-09-25'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-019',
      name: 'Anggota 19',
      gender: Gender.FEMALE,
      phone: '081234567819',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-10-10'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-020',
      name: 'Anggota 20',
      gender: Gender.MALE,
      phone: '081234567820',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-11-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-021',
      name: 'Anggota 21',
      gender: Gender.FEMALE,
      phone: '081234567821',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-11-15'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-022',
      name: 'Anggota 22',
      gender: Gender.MALE,
      phone: '081234567822',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2023-12-01'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-023',
      name: 'Anggota 23',
      gender: Gender.FEMALE,
      phone: '081234567823',
      address: 'RT 01 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2024-01-10'),
      status: MemberStatus.ACTIVE,
    },
    {
      memberNumber: 'KT-SB-024',
      name: 'Anggota 24',
      gender: Gender.MALE,
      phone: '081234567824',
      address: 'RT 02 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2024-02-05'),
      status: MemberStatus.INACTIVE, // Mahasiswa rantau
    },
    {
      memberNumber: 'KT-SB-025',
      name: 'Anggota 25',
      gender: Gender.FEMALE,
      phone: '081234567825',
      address: 'RT 03 / RW 01, Dusun Tuk Uluh, Desa Sringin',
      joinDate: new Date('2024-03-01'),
      status: MemberStatus.INACTIVE, // Bekerja di luar kota
    },
  ];

  const createdMembers = [];
  for (const m of dummyMembersData) {
    const member = await prisma.member.upsert({
      where: { memberNumber: m.memberNumber },
      update: { name: m.name },
      create: m,
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

  const createdGroups = [];
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
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Iuran Wajib Bulanan Periode Oktober 2026',
        content: 'Diberitahukan kepada seluruh anggota Karang Taruna Setya Bakti bahwa iuran wajib sebesar Rp 10.000 dapat disetorkan kepada bendahara dusun paling lambat tanggal 10 Oktober 2026.',
        announcementDate: new Date('2026-09-29'),
        eventDate: new Date('2026-10-10'),
        createdById: adminUser.id,
      },
      {
        title: 'Pelaksanaan Kerja Bakti Dusun Tuk Uluh',
        content: 'Dalam rangka menjaga kebersihan lingkungan dan mengantisipasi musim penghujan, seluruh pemuda diharapkan hadir pada kerja bakti hari Minggu, 12 Oktober 2026 pukul 06.30 WIB dengan membawa cangkul dan sabit.',
        announcementDate: new Date('2026-09-24'),
        eventDate: new Date('2026-10-12'),
        createdById: adminUser.id,
      },
    ],
  });

  // 10. Meeting Minutes
  await prisma.meetingMinute.create({
    data: {
      meetingDate: new Date('2026-09-10'),
      title: 'Notulensi Rapat Pleno Evaluasi Kegiatan September 2026',
      content: '1. Pembukaan oleh Ketua (Rustam Aji).\n2. Laporan keuangan kas oleh Bendahara: Saldo akhir per 10 September adalah Rp 7.500.000.\n3. Rencana pengadaan jersey olahraga Karang Taruna Setya Bakti disetujui dengan iuran mandiri 50% dan subsidi kas 50%.\n4. Rapat ditutup pukul 22.00 WIB.',
      createdById: adminUser.id,
    },
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
