# 💰 Catatan Keuangan (Personal Expense Tracker)

Aplikasi **Catatan Keuangan Pribadi** full-stack untuk mencatat pemasukan dan pengeluaran. Dibangun dengan **React + Firebase**, siap di-deploy ke **GitHub Pages** secara gratis.

**🌐 Live Demo:** https://korifcan.github.io/Expense-Tracker/

---

## ✨ Fitur Lengkap

### 👤 Autentikasi
- Login dengan **Email & Password**
- Login dengan **Google** (satu klik)
- **Account Linking** — jika daftar via email, bisa login via Google dan akun tetap sama
- Data setiap user **terpisah dan aman**

### 📊 Dashboard
- Ringkasan **pemasukan, pengeluaran, dan saldo** bulan ini
- **Filter** berdasarkan bulan, tahun, dan kategori
- **Grafik Pie Chart** — visualisasi pengeluaran per kategori
- **Budget Planner** — progress bar perbandingan pengeluaran vs target (Rp1jt/kategori)
- **Pagination** — otomatis jika transaksi lebih dari 10

### 💳 Manajemen Transaksi
- **Tambah** transaksi (pemasukan/pengeluaran)
- **Edit** transaksi yang sudah ada
- **Hapus** transaksi
- Pilih kategori (Makanan, Transportasi, Belanja, Hiburan, dll)
- Input tanggal, jumlah, dan deskripsi

### 📁 Export Data
- **Export CSV** — download semua transaksi terfilter ke file CSV

### 🎨 Tampilan
- **Dark Mode** 🌙 / Light Mode ☀️ — toggle switch
- **Responsive** — mobile, tablet, dan desktop
- **Gradient UI** — navbar dan background gradien
- **Animasi** — loading skeleton, fade-in, toast notification
- Font Inter modern

### 🔔 Notifikasi
- **Toast Notification** — notifikasi sukses/error setiap aksi
- **Error Message** — tampilan error yang menarik dengan icon

### 👑 Admin Panel (khusus admin)
- Lihat **semua pengguna** yang terdaftar
- Lihat **total pemasukan/pengeluaran** setiap user
- **Expand** user untuk lihat detail transaksi
- **Naikkan/turunkan role** admin
- Dashboard admin dengan warna ungu khas

### ⚙️ Lainnya
- **Edit nama profil** — klik nama di navbar
- Loading skeleton saat memuat data
- Refresh data otomatis

---

## 🛠️ Tech Stack

| Bagian | Teknologi |
|--------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Auth** | Firebase Authentication (Email + Google) |
| **Database** | Firebase Firestore (NoSQL) |
| **Chart** | Recharts (PieChart) |
| **Deploy** | GitHub Pages |
| **Font** | Inter (Google Fonts) |

---

## 📋 Cara Setup Firebase

Aplikasi ini membutuhkan **Firebase project** untuk autentikasi dan database.

### 1. Buat Project Firebase
1. Buka https://console.firebase.google.com
2. Klik **"Add project"** → nama `expense-tracker` → **Create** (matikan Analytics)

### 2. Aktifkan Authentication
1. Menu kiri → **Authentication** → **Get started**
2. **Sign-in providers**:
   - **Email/Password** → Enable → Save
   - **Google** → Enable → pilih Support Email → Save
3. **Settings** (gear) → **Authorized domains** → **Add domain**
   - Tambahkan: `korifcan.github.io`

### 3. Buat Firestore Database
1. Menu kiri → **Firestore Database** → **Create database**
2. Pilih **"Start in test mode"** → Next → Pilih region → Enable

### 4. Atur Security Rules (PENTING!)
Firestore → **Rules** → paste ini:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;

      match /transactions/{txId} {
        allow read: if request.auth != null && (
          request.auth.uid == userId ||
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
        );
        allow create: if request.auth != null && request.auth.uid == userId;
        allow update: if request.auth != null && request.auth.uid == userId;
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 5. Ambil Config Firebase
1. Project Settings (gear ⚙) → **General** → **Your apps**
2. Klik Web `</>` → Register app → **Copy** config object

### 6. Paste Config ke Kode
Edit file **`client/src/firebase/config.js`** — ganti value placeholder dengan config kamu.

---

## 🚀 Cara Deploy

### Via npm (lokal)
```bash
# Clone repo
git clone https://github.com/KoRifCan/Expense-Tracker.git
cd Expense-Tracker

# Install dependencies
cd client && npm install

# Build & deploy ke GitHub Pages
npm run deploy
```

### Via GitHub Actions (auto deploy)
Setiap push ke branch `main` akan otomatis:
1. Build aplikasi
2. Deploy ke branch `gh-pages`
3. Live di GitHub Pages

---

## 🎯 Cara Jadi Admin

1. Register/login sebagai user biasa
2. Buka Firebase Console → **Firestore** → **users** collection
3. Cari dokumen dengan email kamu
4. Ubah field `role` dari `"user"` menjadi `"admin"`
5. Refresh aplikasi → otomatis masuk Admin Panel

---

## 📁 Struktur Proyek

```
expense-tracker/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── api/
│   │   │   ├── admin.js       # Admin API (semua user + transaksi)
│   │   │   ├── transactions.js # API transaksi (CRUD via Firestore)
│   │   │   └── users.js       # API user (create, get, role)
│   │   ├── components/
│   │   │   ├── AdminDashboard.jsx   # Dashboard admin
│   │   │   ├── ErrorMessage.jsx     # Komponen error styling
│   │   │   ├── ExpenseChart.jsx     # PieChart pengeluaran
│   │   │   ├── ExportButton.jsx     # Tombol export CSV
│   │   │   ├── Login.jsx            # Halaman login
│   │   │   ├── Register.jsx         # Halaman daftar
│   │   │   ├── ThemeToggle.jsx      # Toggle dark/light mode
│   │   │   ├── Toast.jsx            # Toast notifikasi
│   │   │   ├── TransactionForm.jsx  # Form tambah/edit transaksi
│   │   │   ├── TransactionList.jsx  # Daftar transaksi
│   │   │   └── UserDashboard.jsx    # Dashboard user
│   │   ├── firebase/
│   │   │   └── config.js       # Firebase config (isi sendiri)
│   │   ├── App.jsx             # Root component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles + animasi
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── firestore.rules             # Aturan keamanan Firestore
├── .gitignore
├── package.json                # Root scripts
└── README.md                   # File ini
```

---

## 📄 Lisensi

Proyek ini bersifat **open source**. Silakan gunakan, modifikasi, dan sebarkan.

---

Dibuat dengan ❤️ oleh [KoRifCan](https://github.com/KoRifCan)
