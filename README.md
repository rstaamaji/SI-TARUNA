# SI-TARUNA

Sistem Informasi Karang Taruna Springin - Jumantono

Aplikasi berbasis web modern untuk pengelolaan organisasi Karang Taruna Springin - Jumantono, mencakup manajemen anggota, transparansi keuangan, absensi, pengumuman & notulensi, jadwal kegiatan (arisan, kerja bakti), jimpitan, serta notifikasi realtime.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma ORM
- **Authentication:** JWT & bcrypt
- **Realtime:** Socket.IO

---

## 🎨 Palet Desain
- **Primary Color:** Gold/Yellow (`#F59E0B` / `#D97706` / `#EAB308`)
- **Secondary/Accent Color:** Red (`#DC2626` / `#B91C1C`)
- **Text Color:** Charcoal/Dark (`#1F2937`)
- **Background Utama:** White (`#FFFFFF`)
- **Card/Section Background:** Light Gray (`#F9FAFB` / `#F3F4F6`)

---

## 📁 Struktur Direktori
```text
SI-TARUNA/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── public/
│       └── assets/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── server.ts
│   └── prisma/
│       └── schema.prisma
│
└── README.md
```

---

## 🚀 Rencana Pengembangan Bertahap (Modul)
1. **Modul 1: Inisialisasi & Setup Fondasi (Backend, Frontend, Prisma, Git Baseline)**
2. **Modul 2: Skema Database & Autentikasi (JWT, Register/Login Admin & Member, Role-based Access Control)**
3. **Modul 3: Manajemen Anggota & Profil**
4. **Modul 4: Manajemen Keuangan & Kas (Pemasukan, Pengeluaran, Pengambilan Kas)**
5. **Modul 5: Absensi & Keaktifan Anggota**
6. **Modul 6: Pengumuman & Notulensi**
7. **Modul 7: Jadwal Kegiatan & Arisan**
8. **Modul 8: Jimpitan Kelompok**
9. **Modul 9: Dashboard, Statistik, & Notifikasi Realtime (Socket.IO)**
