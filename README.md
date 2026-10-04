# SI-TARUNA
### Sistem Informasi Karang Taruna Springin - Jumantono

Aplikasi tata kelola organisasi modern, transparan, dan terintegrasi untuk pemuda-pemudi **Karang Taruna Springin - Jumantono** (Dusun Tuk Uluh, Desa Sringin, Kecamatan Jumantono, Kabupaten Karanganyar, Jawa Tengah).

SI-TARUNA mendigitalisasi seluruh administrasi organisasi: transparansi pembukuan kas & penarikan dana, presensi kegiatan warga, rekapitulasi iuran jimpitan 7 kelompok, jadwal pengundian arisan, notulensi rapat, serta pengiriman pengumuman realtime berbasis WebSockets.

---

## 📑 Daftar Isi
1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Database](#5-database)
6. [Installation](#6-installation)
7. [Environment Variables](#7-environment-variables)
8. [Running Frontend](#8-running-frontend)
9. [Running Backend](#9-running-backend)
10. [Database Migration](#10-database-migration)
11. [Seed Data](#11-seed-data)
12. [API Documentation](#12-api-documentation)
13. [User Roles](#13-user-roles)
14. [Screenshots](#14-screenshots)
15. [Development Guide](#15-development-guide)

---

## 1. Project Overview

Karang Taruna di tingkat pedukuhan dan desa mengemban tanggung jawab kemasyarakatan yang luas, mulai dari pengelolaan kas pemuda, pengumpulan iuran jimpitan ronda, pengundian arisan warga, hingga penyelenggaraan rapat dan kerja bakti rutin. Sebelumnya, seluruh pencatatan dilakukan secara manual di buku kas fisik dan grup pesan singkat yang rentan hilang, tercecer, atau menimbulkan kecurigaan terkait saldo kas.

**SI-TARUNA** hadir sebagai solusi sistem informasi web terpadu dengan prinsip:
- **Transparansi Penuh:** Seluruh anggota (*MEMBER*) dapat memantau keluar-masuk dana kas pemuda, saldo saat ini, serta perbandingan kontribusi jimpitan tiap kelompok.
- **Keteraturan Administrasi:** Agenda kegiatan, presensi warga, notulensi rapat, dan periode arisan tercatat rapi di database PostgreSQL.
- **Komunikasi Cepat:** Pengumuman mendesak dari pengurus (*ADMIN*) disiarkan secara instan ke layar anggota yang sedang aktif tanpa perlu me-refresh peramban (realtime via Socket.IO).
- **Aksesibilitas Multi-Perangkat:** Responsif di smartphone, tablet, laptop, dengan dukungan tema Terang (*Light Mode*) dan Gelap (*Dark Mode*).

---

## 2. Features

### 🔐 1. Autentikasi & Keamanan (RBAC)
- Autentikasi berbasis **JSON Web Token (JWT)** dengan enkripsi kata sandi **bcrypt** (salt rounds 10).
- Perlindungan serangan umum via **Helmet**, **CORS origin whitelist**, dan **Rate Limiting** login.
- Pencegahan SQL Injection melalui abstraksi type-safe **Prisma ORM**.
- Role-Based Access Control ketat: membatasi aksi pengelolaan mutlak hanya untuk `ADMIN`, dengan hak baca transparan bagi `MEMBER`.
- Proteksi kekebalan role (*role immutability*): anggota biasa dilarang keras mengubah role dirinya sendiri menjadi admin melalui API profil.

### 👥 2. Manajemen Anggota & Profil Pribadi
- Pengelolaan data anggota lengkap: Nomor Induk Anggota, Nama, Jenis Kelamin, Nomor HP, Alamat, Tanggal Bergabung, dan Status (Aktif/Nonaktif).
- Pencarian cerdas multi-kolom (*name, memberNumber, phone, address*) dan filter status.
- Halaman **Profil Saya** untuk anggota mandiri: melihat statistik kehadiran pribadi, riwayat presensi lampau, serta memperbarui kontak telepon dan alamat domisili.

### 💰 3. Transparansi Keuangan Kas & Penarikan Dana
- Pencatatan pemasukan (*Income*) dan pengeluaran (*Expense*) dengan kalkulasi saldo otomatis:
  $$\text{Saldo Kas Saat Ini} = \text{Total Pemasukan} - \text{Total Pengeluaran}$$
- Validasi nominal ketat (menolak nominal nol atau negatif).
- **Pengambilan Kas (*Cash Withdrawal*):** Modul khusus pertanggungjawaban penarikan dana kas tunai oleh perwakilan anggota/panitia, terhubung satu-ke-satu dengan catatan pengeluaran kas tanpa risiko perhitungan ganda.
- Grafik analitik keuangan (bar chart arus kas bulanan & pie chart proporsi kategori pengeluaran).
- Ekspor & Cetak Laporan Keuangan format ramah cetak (*print-friendly*).

### 📋 4. Absensi & Keaktifan Warga
- Pembuatan event kegiatan karang taruna (Rapat, Kerja Bakti, Pentas Seni, Peringatan HUT RI, Arisan).
- Pengisian lembar absensi terpadu (*Hadir / Sakit-Izin / Alpa*) per anggota.
- Statistik persentase kehadiran dan ringkasan keaktifan seluruh warga.
- Riwayat kehadiran pribadi untuk masing-masing anggota.

### 📢 5. Pengumuman & Notulensi Rapat
- Papan pengumuman publik dengan lencana urgensi (*Penting / Attention*).
- Siaran otomatis notifikasi ke database saat pengumuman baru diterbitkan.
- Arsip notulensi rapat resmi: mencakup judul rapat, waktu, pimpinan rapat, notulis, uraian isi, kesimpulan, dan daftar tindak lanjut (*action items*).

### 🎁 6. Pengelolaan Arisan
- Penjadwalan periode arisan bulanan warga.
- Penentuan pemenang kocokan arisan pada bulan berjalan (`UPCOMING` $\rightarrow$ `WON`).
- Widget otomatis **"Arisan Terdekat"** pada dashboard.
- Riwayat lengkap pemenang arisan periode sebelumnya.

### 🪙 7. Pengelolaan Jimpitan (7 Kelompok)
- Terdapat 7 kelompok ronda jimpitan resmi (Kelompok 1 s.d. Kelompok 7).
- Setiap kelompok menyetorkan total uang jimpitan satu kali setiap bulan.
- **Aturan Integritas Data:** Larangan duplikasi pencatatan untuk kelompok yang sama pada bulan dan tahun yang sama (`@@unique([groupId, month, year])`).
- Dashboard Jimpitan: menampilkan rincian setoran per kelompok, total jimpitan bulan berjalan, dan grafik perbandingan kontribusi.

### 🔔 8. Notifikasi & Pengingat Otomatis
- Pusat notifikasi pribadi dengan counter belum dibaca (*unread count badge*).
- Fitur *Mark as Read* per item dan *Mark All Read*.
- **Scheduler Pengingat Event Otomatis:** Pengecekan terjadwal di backend untuk kegiatan mendatang (H-3 dan H-1) serta arisan (H-1) tanpa membuat duplikasi notifikasi.
- **Notifikasi Realtime (Socket.IO):** Broadcast pengumuman penting langsung memunculkan toast banner pada layar anggota yang sedang online tanpa refresh halaman.

### ⚙️ 9. Pengaturan Organisasi & Audit Keamanan
- Kustomisasi profil organisasi: Nama Organisasi, Logo, Kontak WhatsApp, Email, Alamat Sekretariat, dan Tahun Kepengurusan.
- Indikator status keamanan lingkungan aplikasi (*Bcrypt OK, JWT Secret OK, DB Connected OK*).

---

## 3. Tech Stack

### Frontend
| Komponen | Teknologi |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, React 19) |
| **Bahasa** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) (Custom Taruna Theme + Dark Mode) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Grafik / Chart** | [Recharts](https://recharts.org/) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Realtime Client** | [Socket.IO Client](https://socket.io/) |

### Backend
| Komponen | Teknologi |
| :--- | :--- |
| **Runtime** | [Node.js](https://nodejs.org/) (v20+ / LTS) |
| **Web Framework** | [Express.js](https://expressjs.com/) |
| **Bahasa** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) |
| **ORM** | [Prisma ORM](https://www.prisma.io/) |
| **Keamanan** | `bcrypt`, `jsonwebtoken`, `helmet`, `cors`, `express-rate-limit` |
| **Realtime Server** | [Socket.IO Server](https://socket.io/) |
| **Penjadwal Cron** | [node-cron](https://github.com/node-cron/node-cron) |
| **Testing** | Node.js native test runner (`node:test`, `node:assert`), `supertest` |

---

## 4. System Architecture

```mermaid
flowchart TD
    subgraph Client_Layer ["Client Layer (Peramban / Browser)"]
        UI["Next.js 15 UI (React + Tailwind CSS)"]
        WSClient["Socket.IO Client (Realtime Listener)"]
        Storage["Local Storage (JWT Token & Sesi)"]
    end

    subgraph Security_Gateway ["Security & Gateway Layer"]
        CORS["CORS Policy & Helmet Security Headers"]
        RateLimit["Express Rate Limiter (Brute-force Shield)"]
        AuthMiddleware["JWT Authentication & RBAC Middleware"]
    end

    subgraph API_Services ["Backend Application Services (Express.js)"]
        AuthSvc["Auth Service"]
        MemberSvc["Member & Profile Service"]
        FinanceSvc["Finance & Cash Withdrawal Service"]
        AttendanceSvc["Attendance & Activity Service"]
        AnnounceSvc["Announcement & Meeting Minute Service"]
        ArisanSvc["Arisan Scheduler Service"]
        JimpitanSvc["Jimpitan 7 Groups Service"]
        ReminderCron["Automatic Reminder Scheduler (Cron)"]
        SocketServer["Socket.IO Broadcast Server"]
    end

    subgraph Database_Layer ["Data Persistence Layer"]
        PrismaClient["Prisma ORM Client"]
        PostgreSQL[("PostgreSQL Database")]
    end

    UI -->|"HTTP / REST API"| CORS
    WSClient <-->|"WebSocket Handshake"| SocketServer
    CORS --> RateLimit --> AuthMiddleware
    AuthMiddleware --> API_Services
    ReminderCron -->|"Emit Notification"| SocketServer
    API_Services --> PrismaClient
    PrismaClient --> PostgreSQL
```

---

## 5. Database

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o| members : "has profile"
    users ||--o{ finance_transactions : "creates"
    users ||--o{ cash_withdrawals : "records"
    users ||--o{ announcements : "publishes"
    users ||--o{ meeting_minutes : "authors"
    users ||--o{ notifications : "receives"

    members ||--o{ attendances : "participates"
    members ||--o{ cash_withdrawals : "withdraws"
    members ||--o{ arisans : "wins"

    events ||--o{ attendances : "has"

    jimpitan_groups ||--o{ jimpitan_records : "deposits"

    finance_transactions ||--o| cash_withdrawals : "links expense"

    users {
        string id PK
        string username UK
        string email UK
        string password
        enum role "ADMIN | MEMBER"
        datetime createdAt
    }

    members {
        string id PK
        string userId FK
        string memberNumber UK
        string name
        enum gender "MALE | FEMALE"
        string phone
        string address
        enum status "ACTIVE | INACTIVE"
        datetime joinDate
    }

    finance_transactions {
        string id PK
        enum type "INCOME | EXPENSE"
        decimal amount
        string description
        string source
        string category
        datetime transactionDate
        string createdById FK
    }

    cash_withdrawals {
        string id PK
        string memberId FK
        string withdrawerName
        decimal amount
        datetime withdrawalDate
        string purpose
        string financeTransactionId FK
    }

    events {
        string id PK
        string title
        string location
        datetime eventDate
        enum type "MEETING | COMMUNITY_SERVICE | ARISAN | etc"
    }

    attendances {
        string id PK
        string memberId FK
        string eventId FK
        enum status "PRESENT | ABSENT | EXCUSED"
        string notes
    }

    arisans {
        string id PK
        string memberId FK
        int month
        int year
        datetime drawDate
        enum status "PENDING | UPCOMING | WON | PAID"
        decimal amount
    }

    jimpitan_groups {
        string id PK
        int groupNumber UK
        string name
    }

    jimpitan_records {
        string id PK
        string groupId FK
        int month
        int year
        decimal amount
        datetime inputDate
    }

    notifications {
        string id PK
        string userId FK
        string title
        string message
        enum type
        boolean isRead
        datetime createdAt
    }
```

---

## 6. Installation

Ikuti panduan instalasi langkah-demi-langkah berikut untuk menjalankan SI-TARUNA pada komputer lokal:

### Prasyarat Perangkat Lunak
1. **Node.js** v20.x atau lebih baru ([Unduh Node.js](https://nodejs.org/))
2. **npm** v10.x atau lebih baru
3. **PostgreSQL** Server v14+ aktif di port `5432` ([Unduh PostgreSQL](https://www.postgresql.org/))
4. **Git** ([Unduh Git](https://git-scm.com/))

### Langkah 1: Clone Repositori
```bash
git clone https://github.com/rstaamaji/SI-TARUNA.git
cd SI-TARUNA
```

### Langkah 2: Instalasi Dependensi Backend
```bash
cd backend
npm install
```

### Langkah 3: Instalasi Dependensi Frontend
Buka terminal baru di direktori utama `SI-TARUNA`:
```bash
cd frontend
npm install
```

---

## 7. Environment Variables

Pastikan file konfigurasi `.env` telah disiapkan di masing-masing direktori `backend/` dan `frontend/`. Salin file contoh yang disediakan:

### 1. Konfigurasi Backend (`backend/.env`)
Salin dari template `.env.example`:
```bash
# Di dalam folder backend/
cp .env.example .env
```

Contoh isi `backend/.env` (gunakan kredensial database lokal Anda):
```env
# Port Server Backend
PORT=5000
NODE_ENV=development

# URL Asal Klien Frontend (untuk CORS dan Socket.IO)
CLIENT_URL=http://localhost:3000

# PostgreSQL Database Connection String
# Format: postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?schema=public
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/si_taruna?schema=public"

# Kunci Rahasia JWT (Gunakan string acak yang kuat di lingkungan produksi)
JWT_SECRET="si_taruna_demo_jwt_secret_key_change_me_in_production"
JWT_EXPIRES_IN="7d"
```

### 2. Konfigurasi Frontend (`frontend/.env.local`)
Salin dari template `.env.example`:
```bash
# Di dalam folder frontend/
cp .env.example .env.local
```

Contoh isi `frontend/.env.local`:
```env
# Alamat REST API Backend
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Alamat Server Socket.IO Realtime
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

> [!IMPORTANT]
> Jangan pernah memasukkan file `.env` atau `.env.local` yang berisi kredensial asli ke dalam Git. File `.gitignore` telah dikonfigurasi untuk mengecualikan file sensitif ini.

---

## 8. Running Frontend

Jalankan perintah berikut di dalam direktori `frontend/`:

```bash
cd frontend

# Mode Pengembangan (Development)
npm run dev

# Membangun Paket Produksi (Production Build)
npm run build

# Menjalankan Server Produksi
npm start
```

Aplikasi frontend Next.js akan berjalan di: **`http://localhost:3000`**

---

## 9. Running Backend

Jalankan perintah berikut di dalam direktori `backend/`:

```bash
cd backend

# Mode Pengembangan dengan Hot-Reload (ts-node-dev)
npm run dev

# Kompilasi TypeScript ke JavaScript (dist/)
npm run build

# Menjalankan Server Hasil Kompilasi
npm start

# Menjalankan Seluruh Integration Test Suite
npm test
```

Server backend REST API & Socket.IO akan berjalan di: **`http://localhost:5000`**

---

## 10. Database Migration

Gunakan Prisma CLI untuk mengelola skema database PostgreSQL:

```bash
cd backend

# 1. Generate Prisma Client TypeScript
npx prisma generate

# 2. Terapkan Migrasi ke Database PostgreSQL
npx prisma migrate dev --name init

# (Opsional) Sinkronisasi Cepat Skema ke Database (Prototype)
npx prisma db push

# (Opsional) Membuka GUI Prisma Studio untuk Inspeksi Data
npx prisma studio
```
Prisma Studio dapat diakses di `http://localhost:5555`.

---

## 11. Seed Data

SI-TARUNA dilengkapi skrip pengisian data awal (*seeding*) yang mencakup 25 anggota realistis Dusun Tuk Uluh, 7 kelompok jimpitan, transaksi kas, pengundian arisan, dan kegiatan warga.

Jalankan perintah seed di folder `backend/`:
```bash
cd backend
npm run prisma:seed
```

### Akun Bawaan (Default Seed Credentials)

| Role | Username | Kata Sandi | Hak Akses |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin123` | Akses penuh: keuangan, anggota, arisan, jimpitan, absensi, pengaturan |
| **MEMBER** | `member` | `member123` | Akses baca transparan, dashboard ringkasan, riwayat presensi & profil pribadi |

---

## 12. API Documentation

Seluruh endpoint REST API menggunakan prefix `/api`. Header otentikasi menggunakan standar Bearer token:
`Authorization: Bearer <TOKEN_JWT>`

### 🔑 Autentikasi (`/api/auth`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Publik | Masuk dengan username & kata sandi |
| `GET` | `/api/auth/me` | Terautentikasi | Mengambil data sesi pengguna aktif |

### 👥 Anggota & Profil (`/api/members`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/members` | Terautentikasi | Daftar anggota dengan paginasi, search & filter |
| `GET` | `/api/members/:id` | Terautentikasi | Detail anggota berdasarkan ID |
| `POST` | `/api/members` | **ADMIN** | Menambahkan anggota baru |
| `PUT` | `/api/members/:id` | **ADMIN** | Memperbarui profil data anggota |
| `PATCH`| `/api/members/:id/status`| **ADMIN** | Mengubah status keaktifan anggota |
| `DELETE`| `/api/members/:id` | **ADMIN** | Menghapus data anggota |
| `GET` | `/api/members/profile/me` | Terautentikasi | Statistik kehadiran & riwayat profil diri sendiri |
| `PUT` | `/api/members/profile/me` | Terautentikasi | Memperbarui kontak/alamat profil mandiri |

### 💵 Keuangan & Kas (`/api/finance`, `/api/withdrawals`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/finance/overview` | Terautentikasi | Total kas, pemasukan, pengeluaran & saldo saat ini |
| `GET` | `/api/finance/incomes` | Terautentikasi | Daftar catatan pemasukan kas |
| `POST` | `/api/finance/incomes` | **ADMIN** | Mencatat pemasukan kas baru |
| `PUT` | `/api/finance/incomes/:id` | **ADMIN** | Mengubah catatan pemasukan |
| `DELETE`| `/api/finance/incomes/:id`| **ADMIN** | Menghapus pemasukan |
| `GET` | `/api/finance/expenses` | Terautentikasi | Daftar catatan pengeluaran kas |
| `POST` | `/api/finance/expenses` | **ADMIN** | Mencatat pengeluaran kas baru |
| `PUT` | `/api/finance/expenses/:id`| **ADMIN** | Mengubah pengeluaran |
| `DELETE`| `/api/finance/expenses/:id`| **ADMIN** | Menghapus pengeluaran |
| `GET` | `/api/withdrawals` | Terautentikasi | Riwayat pengambilan dana kas tunai |
| `POST` | `/api/withdrawals` | **ADMIN** | Mencatat pengambilan kas (otomatis jadi EXPENSE) |
| `GET` | `/api/withdrawals/summary` | Terautentikasi | Rekap total dana kas yang diambil |

### 📅 Absensi & Kegiatan (`/api/attendance`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/attendance` | Terautentikasi | Daftar rekap absensi |
| `GET` | `/api/attendance/events` | Terautentikasi | Daftar jadwal kegiatan |
| `POST` | `/api/attendance/events` | **ADMIN** | Membuat kegiatan baru |
| `GET` | `/api/attendance/events/:id` | Terautentikasi | Lembar presensi kegiatan |
| `POST` | `/api/attendance/events/:id` | **ADMIN** | Input kehadiran anggota |
| `GET` | `/api/attendance/my-history` | Terautentikasi | Riwayat kehadiran user login |
| `GET` | `/api/attendance/statistics` | **ADMIN** | Statistik persentase kehadiran seluruh anggota |

### 🎁 Arisan (`/api/arisan`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/arisan` | Terautentikasi | Seluruh periode arisan |
| `GET` | `/api/arisan/upcoming` | Terautentikasi | Jadwal arisan terdekat |
| `GET` | `/api/arisan/history` | Terautentikasi | Riwayat pemenang arisan lampau |
| `POST` | `/api/arisan` | **ADMIN** | Menjadwalkan periode arisan baru |
| `POST` | `/api/arisan/:id/winner` | **ADMIN** | Menetapkan anggota pemenang arisan |

### 🪙 Jimpitan 7 Kelompok (`/api/jimpitan`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/jimpitan/groups` | Terautentikasi | Daftar 7 kelompok jimpitan |
| `GET` | `/api/jimpitan/dashboard` | Terautentikasi | Dashboard setoran per kelompok & total bulan ini |
| `GET` | `/api/jimpitan/records` | Terautentikasi | Riwayat setoran iuran jimpitan bulanan |
| `POST` | `/api/jimpitan` | **ADMIN** | Input iuran (validasi tolak duplikasi per bulan/tahun) |
| `PUT` | `/api/jimpitan/:id` | **ADMIN** | Mengubah catatan iuran jimpitan |
| `DELETE`| `/api/jimpitan/:id` | **ADMIN** | Menghapus catatan iuran jimpitan |

### 🔔 Notifikasi (`/api/notifications`)
| Metode | Endpoint | Akses | Deskripsi |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/notifications` | Terautentikasi | Daftar notifikasi masuk pengguna |
| `GET` | `/api/notifications/unread-count` | Terautentikasi | Jumlah notifikasi yang belum dibaca |
| `PATCH`| `/api/notifications/:id/read` | Terautentikasi | Menandai 1 notifikasi telah dibaca |
| `POST` | `/api/notifications/read-all` | Terautentikasi | Menandai semua notifikasi telah dibaca |
| `POST` | `/api/notifications/broadcast` | **ADMIN** | Mengirim siaran notifikasi ke seluruh warga |

---

## 13. User Roles

Aplikasi menerapkan sistem pembagian hak akses (*Role-Based Access Control*):

| Fitur / Modul | Administrator (`ADMIN`) | Anggota (`MEMBER`) |
| :--- | :---: | :---: |
| Masuk ke Sistem (Login) | ✅ | ✅ |
| Dashboard Ringkasan & Status Arisan Terdekat | ✅ | ✅ |
| Melihat Saldo Kas & Riwayat Pemasukan / Pengeluaran | ✅ | ✅ |
| Menambah / Mengubah / Menghapus Transaksi Keuangan | ✅ | ❌ |
| Mencatat & Mengelola Pengambilan Kas Tunai | ✅ | ❌ |
| Melihat Rekapitulasi Jimpitan 7 Kelompok | ✅ | ✅ |
| Input & Edit Iuran Jimpitan Bulanan | ✅ | ❌ |
| Mengikuti Jadwal Arisan & Melihat Pemenang | ✅ | ✅ |
| Menentukan Pemenang Kocokan Arisan | ✅ | ❌ |
| Melihat Jadwal & Notulensi Rapat | ✅ | ✅ |
| Membuat Agenda Kegiatan & Mengisi Lembar Absensi | ✅ | ❌ |
| Melihat Statistik Keaktifan Warga | ✅ (Seluruh Warga) | ✅ (Diri Sendiri) |
| Menyiarkan Notifikasi Realtime / Pengumuman Penting | ✅ | ❌ |
| Menerima Toast & Badge Notifikasi Realtime | ✅ | ✅ |
| Mengubah Profil Kontak & Alamat Pribadi | ✅ | ✅ |
| Mengubah Role Akun Sendiri atau Anggota Lain | ✅ | ❌ (Diblokir API) |
| Mengatur Konfigurasi Organisasi & Sekretariat | ✅ | ❌ |

---

## 14. Screenshots

Aplikasi dirancang menggunakan identitas resmi Karang Taruna (kuning emas, merah marun, dan dark slate):

- **Login Page:** Dilengkapi tombol demo akun cepat (*quick demo buttons*) untuk kemudahan evaluasi penguji.
- **Admin Dashboard:** Menampilkan metrik total kas, status arisan terdekat, chart perbandingan iuran jimpitan 7 kelompok, daftar kegiatan, dan shortcut cepat.
- **Member Dashboard:** Tampilan personal anggota dengan kartu persentase kehadiran kegiatan, jadwal arisan mendatang, dan notifikasi penting.
- **Financial Center:** Tabel pemasukan & pengeluaran kas dengan visual badge, indikator saldo dinamis, serta modal penarikan kas terpadu.
- **Responsive Mobile Drawer:** Sidebar yang meluncur mulus pada perangkat smartphone dengan backdrop blur dan auto-close saat navigasi.
- **Dark Mode Support:** Seluruh halaman mendukung transisi kontras tinggi yang nyaman di mata pada malam hari.

---

## 15. Development Guide

### Struktur Direktori Repositori
```text
SI-TARUNA/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Skema database PostgreSQL
│   │   └── seed.ts             # Skrip data inisial realistis
│   ├── src/
│   │   ├── controllers/        # Handler HTTP Request/Response
│   │   ├── middleware/         # Auth JWT, Role check, Error handling
│   │   ├── routes/             # Definisi rute Express API
│   │   ├── services/           # Logika bisnis inti & cron reminders
│   │   ├── utils/              # Prisma client, token helper, response formatter
│   │   ├── app.ts              # Inisialisasi Express & middleware
│   │   └── server.ts           # Entrypoint HTTP & Socket.IO server
│   ├── tests/                  # Integration & unit test suites (Node native)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/                    # Next.js 15 App Router (24 rute halaman)
│   ├── components/
│   │   ├── dashboard/          # Komponen Admin & Member Dashboard
│   │   ├── layout/             # Sidebar, Navbar, Footer, DashboardLayout
│   │   ├── providers/          # Socket.IO & Realtime Notification Provider
│   │   ├── theme/              # ThemeProvider (Dark / Light mode)
│   │   └── ui/                 # Reusable UI (Button, Card, Modal, Table, Toast, dll)
│   ├── context/                # OrganizationContext
│   ├── services/               # Axios API client & endpoints
│   ├── public/assets/          # Logo resmi Karang Taruna
│   ├── package.json
│   └── tailwind.config.ts
│
└── README.md
```

### Menjalankan Pengujian Backend (Test Suite)
Untuk memverifikasi keandalan seluruh logika bisnis backend (autentikasi, otorisasi, keuangan, absensi, arisan, jimpitan, notifikasi):

```bash
cd backend
npm test
```
*Hasil uji akan mengeksekusi 63 skenario pengujian di 9 modul secara berurutan dan harus menghasilkan 0 failure.*

### Konvensi Kode & Kontribusi
1. **Branching:** Gunakan branch fitur untuk setiap modul baru (`git checkout -b feature/nama-fitur`).
2. **Linting & Type Safety:** Pastikan `npm run build` berhasil tanpa error TypeScript di backend maupun frontend.
3. **Commit Messages:** Gunakan format conventional commits (contoh: `feat: add jimpitan group comparison chart`, `fix: prevent duplicate attendance record`).

---

**SI-TARUNA** &bull; Karang Taruna Springin - Jumantono  
*Membangun generasi pemuda yang mandiri, tertib administrasi, dan berintegritas tinggi.*
