# DesignKu - Website Jasa Desain Grafis

Website pemesanan jasa desain grafis profesional dengan sistem tracking pesanan dan panel admin.

## 🚀 Fitur Utama

### Untuk User:
1. **Landing Page** - Informasi layanan dan harga
2. **Form Pemesanan** - Order desain dengan kalkulasi harga otomatis
3. **Lacak Pesanan** - Tracking status berdasarkan Order ID
4. **Sistem Pembayaran** - Informasi rekening bank dan konfirmasi WA
5. **Review/Ulasan** - User dapat memberikan feedback setelah selesai
6. **Notifikasi Real-time** - Toast notification untuk user feedback
7. **WhatsApp Integration** - Konfirmasi pembayaran langsung ke admin

### Untuk Admin:
1. **Login System** - Halaman login dengan autentikasi
2. **Dashboard Statistik** - Total order, pending, selesai, revenue
3. **CRUD Management** - Create, Read, Update, Delete pesanan
4. **Filter & Search** - Cari berdasarkan nama, ID, atau status
5. **Sorting** - Urutkan orderan terbaru/terlama
6. **Export CSV** - Download data pesanan ke format CSV
7. **Review Management** - Lihat ulasan dari customer

## 🛠️ Teknologi

- **Backend**: Flask (Python)
- **Database**: SQLite (Development) / Azure SQL (Production)
- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **Icons**: Lucide Icons
- **Server**: Gunicorn

## 📁 Struktur Folder

```
ProyekWebsiteSaya/
├── app.py              # Flask application
├── database.db         # SQLite database (auto-generated)
├── requirements.txt    # Python dependencies
├── .gitignore         # Git ignore rules
├── static/
│   ├── admin.js       # Admin panel logic
│   ├── script.js      # User interface logic
│   └── style.css      # Custom styles
└── templates/
    ├── index.html     # User interface
    ├── admin.html     # Admin dashboard
    └── login.html     # Admin login page
```

## 🚀 Cara Menjalankan Lokal

### 1. Clone Repository
```bash
git clone https://github.com/USERNAME/ProyekWebsiteSaya.git
cd ProyekWebsiteSaya
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Jalankan Aplikasi
```bash
python app.py
```

### 4. Buka Browser
```
http://127.0.0.1:5000
```

## 🔐 Kredensial Admin Default

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ PENTING**: Ganti password di production!

## 💾 Database Schema

### Tabel: orders
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| id | TEXT (PK) | Order ID (ORD-XXXXXX-XXX) |
| name | TEXT | Nama customer |
| whatsapp | TEXT | Nomor WhatsApp |
| service | TEXT | Jenis layanan |
| deadline | TEXT | Deadline pengerjaan |
| description | TEXT | Detail pesanan |
| price | INTEGER | Harga dalam Rupiah |
| status | TEXT | Status pengerjaan |
| date | TEXT | Timestamp order |
| review | TEXT | Ulasan customer (nullable) |

## 📊 Daftar Layanan & Harga

| Layanan | Harga |
|---------|-------|
| Desain Logo | Rp 300.000 |
| Desain UI/UX | Rp 800.000 |
| Konten Sosmed | Rp 500.000 |
| Banner/Spanduk | Rp 150.000 |
| Custom | Mulai Rp 100.000 |

## 🌐 Deployment ke Azure

Lihat dokumentasi [DEPLOYMENT.md](DEPLOYMENT.md) untuk panduan lengkap deploy ke Azure.

## 👨‍💻 Developer

Dibuat untuk project akhir semester.

## 📝 License

Educational Project - 2024