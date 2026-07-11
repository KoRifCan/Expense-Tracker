# 💰 Catatan Keuangan

Aplikasi pencatat pemasukan & pengeluaran pribadi dengan panel admin, multi-user, dark mode, dan grafik interaktif.

**🌐 Live Demo:** https://korifcan.github.io/Expense-Tracker/

---

## ✨ Fitur

### 👤 Autentikasi
- Login Email/Password & Google (satu klik)
- Account Linking (email + Google akun tetap sama)
- Verifikasi email wajib
- Auto-detect verifikasi email (tanpa reload)

### 📊 Dashboard
- Ringkasan pemasukan, pengeluaran, saldo, rata-rata/hari
- Filter bulan, tahun, kategori, tipe (semua/pemasukan/pengeluaran)
- Grafik interaktif: Pie (pemasukan, pengeluaran, gabungan), Area (tren harian)
- Budget planner per kategori (progress bar)
- Pagination otomatis
- Export CSV

### 💳 Transaksi
- Tambah, edit, hapus transaksi
- Format rupiah otomatis (1.000) saat mengetik nominal
- 10 kategori (Makanan, Transportasi, Belanja, dll)
- Hapus semua riwayat dengan konfirmasi

### ⚙️ Pengaturan Akun
- Foto profil (upload, hapus, kompres otomatis, simpan di Firestore)
- Ubah nama tampilan
- Ubah email (dengan verifikasi ulang password + kirim verifikasi)
- Ubah password (min 6 karakter, dengan verifikasi ulang)
- Hapus akun (hapus semua data + auth)

### 🌙 Tampilan
- Dark/Light mode (toggle di navbar)
- Responsive (mobile, tablet, desktop)
- Gradient UI, skeleton loading, toast notification

### 👑 Panel Admin
- Daftar semua pengguna (search + sort)
- Lihat total pemasukan/pengeluaran tiap user
- Expand detail transaksi tiap user
- Promosi/turunkan role admin
- **Nonaktifkan/aktifkan akun** user
- Hapus akun user + transaksinya
- Hapus semua riwayat transaksi semua user

### 🔒 Keamanan
- Firestore Security Rules ketat
  - User hanya bisa baca/tulis data miliknya sendiri
  - User tidak bisa mengubah `role` atau `disabled` sendiri
  - Hanya admin yang bisa ubah role/status/nonaktifkan
- Real-time `onSnapshot`:
  - Role/status berubah → dashboard langsung beradaptasi
  - Akun dinonaktifkan/dihapus → auto-logout instan
- Notifikasi di halaman login jika akun dinonaktifkan

---

## 🛠️ Tech Stack

| Bagian | Teknologi |
|--------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Auth** | Firebase Authentication |
| **Database** | Cloud Firestore |
| **Storage** | Base64 via Firestore (foto profil) |
| **Chart** | Recharts (Pie, Area, Donut) |
| **Deploy** | GitHub Actions → GitHub Pages |
| **Font** | Inter (Google Fonts) |

---

## 🚀 Cara Menjalankan

```bash
git clone https://github.com/KoRifCan/Expense-Tracker.git
cd Expense-Tracker

cd client
npm install
npm run dev
```

### Setup Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com)
2. Aktifkan **Authentication** (Email/Password + Google)
3. Buat **Firestore Database**
4. Copy konfigurasi Firebase ke `client/src/firebase/config.js`
5. Deploy **Firestore Rules** dari file `firestore.rules`

### Deploy

Push ke `main` → GitHub Actions otomatis build & deploy ke GitHub Pages.

Atau manual:
```bash
npm run deploy
```

---

## 📁 Struktur Proyek

```
expense-tracker/
├── client/src/
│   ├── api/           # API calls ke Firestore
│   │   ├── admin.js
│   │   ├── transactions.js
│   │   └── users.js
│   ├── components/    # React components
│   │   ├── AdminDashboard.jsx
│   │   ├── ConfirmModal.jsx
│   │   ├── Login.jsx
│   │   ├── Navbar.jsx
│   │   ├── Register.jsx
│   │   ├── SettingsModal.jsx
│   │   ├── UserDashboard.jsx
│   │   ├── UserMenu.jsx
│   │   └── ... (chart, form, list, toast, dll)
│   ├── firebase/
│   │   └── config.js
│   ├── hooks/
│   │   └── useTheme.js
│   ├── App.jsx
│   └── main.jsx
├── firestore.rules    # Firestore security rules
├── firebase.json
└── README.md
```

---

## 🤝 Kontribusi

Pull request dipersilakan. Untuk perubahan besar, buka issue dulu.

---

Dibuat oleh [KoRifCan](https://github.com/KoRifCan)
