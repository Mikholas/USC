# 🛒 Aplikasi Kasir Toko Kelontong

Aplikasi kasir sederhana untuk toko kelontong yang dibuat dengan HTML, CSS, dan JavaScript murni. Aplikasi ini dapat digunakan langsung di browser tanpa perlu instalasi server.

## ✨ Fitur

- **Kasir Transaksi**
  - Pencarian produk berdasarkan nama atau barcode
  - Keranjang belanja dengan kontrol jumlah
  - Perhitungan total otomatis
  - Sistem pembayaran dengan kembalian
  - Validasi stok produk

- **Manajemen Produk**
  - Tambah produk baru (nama, harga, stok, barcode)
  - Edit produk yang sudah ada
  - Hapus produk
  - Tampilan daftar produk yang rapi

- **Riwayat Transaksi**
  - Menyimpan semua transaksi
  - Statistik total transaksi dan pendapatan
  - Detail setiap transaksi (item, jumlah, total, pembayaran, kembalian)

- **Penyimpanan Data**
  - Data tersimpan di browser (localStorage)
  - Data tidak hilang saat refresh halaman
  - Tidak perlu database atau server

## 🚀 Cara Menggunakan

1. **Buka Aplikasi**
   - Buka file `index.html` di browser web Anda (Chrome, Firefox, Edge, dll)
   - Atau gunakan live server jika Anda menggunakan VS Code

2. **Menambah Produk**
   - Klik tombol "📦 Produk" di header
   - Isi form: Nama Produk, Harga, Stok, dan Barcode (opsional)
   - Klik "Tambah Produk"
   - Produk akan muncul di daftar produk

3. **Melakukan Transaksi**
   - Klik tombol "💰 Kasir" di header
   - Masukkan nama produk atau barcode di kotak pencarian
   - Tekan Enter atau klik "Tambah" untuk menambahkan ke keranjang
   - Atur jumlah dengan tombol + dan -
   - Masukkan jumlah pembayaran
   - Klik "Bayar" untuk menyelesaikan transaksi
   - Stok produk akan otomatis berkurang

4. **Melihat Riwayat**
   - Klik tombol "📋 Riwayat" di header
   - Lihat statistik dan daftar semua transaksi yang pernah dilakukan

## 💳 Metode Pembayaran Modern (simulasi)

- Pilih metode: Cash, QRIS (1%), E-Wallet (1.5%), Kartu (2%).
- Biaya pembayaran dihitung otomatis dan menambah Grand Total.
- Non-cash: kolom bayar otomatis diisi grand total; kembalian 0.
- Riwayat menampilkan metode, fee, dan grand total.

## 📤 Ekspor CSV

- Di tab Riwayat, tekan tombol "Ekspor CSV" untuk unduh semua transaksi.
- Format kolom: Tanggal, Metode, Subtotal, Fee, Grand Total, Bayar, Kembalian, Item.

## 📊 Dashboard Ringkas

- Tampilkan Total Transaksi, Total Pendapatan, Produk Terlaris, dan grafik penjualan harian (7 hari terakhir).

## 🤖 Sistem Cerdas (AI-Powered Insights)

Dashboard dilengkapi dengan 8 fitur analisis cerdas:

1. **📦 Rekomendasi Restock**
   - Analisis laju penjualan per produk berdasarkan histori transaksi
   - Menghitung kebutuhan stok untuk 7 hari ke depan
   - Menampilkan produk yang perlu restock dengan prioritas tertinggi

2. **🛍️ Produk Sering Dibeli Bersama**
   - Analisis pola pembelian menggunakan co-occurrence analysis
   - Mengidentifikasi produk yang sering dibeli dalam transaksi yang sama
   - Berguna untuk strategi bundling dan penempatan produk

3. **⚠️ Deteksi Anomali Transaksi**
   - Mengidentifikasi transaksi dengan nilai tidak biasa (menggunakan statistik standar deviasi)
   - Mendeteksi pembelian dengan quantity besar
   - Membantu identifikasi pola penjualan khusus atau potensi masalah

4. **📊 Prediksi Penjualan**
   - Forecasting penjualan untuk besok dan 7 hari ke depan
   - Menggunakan moving average dan analisis tren
   - Menampilkan prediksi dengan range ketidakpastian

5. **⏰ Analisis Tren Waktu**
   - Mengidentifikasi jam dan hari paling ramai berdasarkan histori
   - Membantu optimasi jadwal operasional dan penempatan staf
   - Menampilkan waktu peak hours dan peak days

6. **💰 Rekomendasi Diskon**
   - Mengidentifikasi produk dengan pergerakan lambat
   - Menghitung estimasi hari stok tersisa
   - Memberikan rekomendasi diskon (10-20%) berdasarkan umur stok

7. **📈 Analisis Profitabilitas**
   - Menampilkan produk dengan revenue tertinggi
   - Menghitung total pendapatan per produk
   - Menampilkan jumlah item terjual untuk analisis volume vs value

8. **⏳ Prediksi Stok Habis**
   - Prediksi kapan stok akan habis berdasarkan laju penjualan
   - Menghitung estimasi hari tersisa sebelum stok habis
   - Prioritas untuk produk yang akan habis dalam 30 hari ke depan

## 🛠️ Impor/Ekspor Produk (CSV)

- Di tab Produk: "Ekspor Produk (CSV)" dan "Impor Produk (CSV)" (khusus admin).
- Format kolom: Nama, Harga, Stok, Barcode.

## 🧾 Struk

- Setelah transaksi, tombol "Struk" muncul di kasir.
- Bisa "Salin Struk" (text) atau "Cetak" (buka tab print sederhana).
- Format sederhana: daftar item, subtotal, fee, grand total, bayar, kembalian, metode.
- Struk digital: kirim via WhatsApp (buka wa.me) atau salin untuk email.

## 🔔 Notifikasi & Reset Data

- Semua aksi sukses menampilkan notifikasi (toast) tanpa mengganggu alur kerja.
- Admin punya tombol "Reset Data" untuk menghapus produk, transaksi, dan keranjang (langsung refresh tampilan).

## 💾 Backup / Restore JSON

- Tombol "Backup JSON" (header) untuk unduh file `.json` berisi produk & transaksi.
- Tombol "Restore JSON" memuat file backup dan mengganti data saat ini (butuh konfirmasi admin).

## 📦 Status Katalog

- Katalog di halaman Kasir kini menampilkan "Terakhir diperbarui" dan ringkasan jumlah produk & transaksi.
- Data tersinkron otomatis setelah tambah/edit/hapus/restore.

## 🔐 Login Admin

- Hanya admin yang bisa menambah, mengedit, dan menghapus produk.
- Kredensial default:
  - Username: `admin`
  - Password: `admin123`
- Tombol login ada di header. Setelah login, form produk aktif dan tombol edit/hapus akan bisa digunakan.
- Klik "Keluar" di header untuk keluar dari mode admin.

## 📱 PWA & Offline

- Aplikasi sudah mendukung PWA dan cache offline (butuh akses awal saat online).
- Untuk instalasi: buka di browser (via server lokal seperti Live Server), lalu pilih "Add to Home Screen" atau "Install App".
- Service Worker tidak aktif di `file://`, jadi jalankan via server (contoh: ekstensi Live Server di VS Code).
- Aset utama (HTML, CSS, JS, ikon) akan dicache agar tetap bisa dibuka saat offline. Data tetap memakai `localStorage`.

## 📋 Struktur File

```
UAS SISTEM CERDAS/
├── index.html      # File HTML utama
├── style.css       # File CSS untuk styling
├── script.js       # File JavaScript untuk logika aplikasi
└── README.md       # Dokumentasi ini
```

## 🎨 Fitur UI/UX

- Desain modern dengan gradient yang menarik
- Responsif untuk berbagai ukuran layar
- Animasi halus untuk transisi
- Warna yang jelas untuk status (hijau untuk sukses, merah untuk peringatan)
- Scrollbar yang di-styling
- Modal untuk edit produk

## 💾 Penyimpanan Data

Aplikasi menggunakan `localStorage` browser untuk menyimpan:
- Daftar produk
- Keranjang belanja (sementara)
- Riwayat transaksi

**Catatan:** Data akan hilang jika:
- Cache browser dihapus
- Mode incognito/private digunakan
- Browser di-uninstall

Untuk backup data, Anda bisa:
1. Buka Developer Tools (F12)
2. Pilih tab "Application" atau "Storage"
3. Pilih "Local Storage"
4. Copy data yang ada

## 🔧 Teknologi yang Digunakan

- **HTML5** - Struktur halaman
- **CSS3** - Styling dan layout (Grid, Flexbox, Animations)
- **JavaScript (Vanilla)** - Logika aplikasi
- **LocalStorage API** - Penyimpanan data

## 📱 Kompatibilitas

Aplikasi ini kompatibel dengan:
- Chrome (rekomendasi)
- Firefox
- Edge
- Safari
- Opera

## 🎯 Penggunaan untuk Toko Kelontong

Aplikasi ini cocok untuk:
- Toko kelontong kecil
- Warung
- Minimarket kecil
- Toko sembako

## ⚠️ Catatan Penting

1. **Backup Data**: Lakukan backup data secara berkala karena data tersimpan di browser
2. **Stok**: Pastikan stok produk selalu terupdate
3. **Barcode**: Gunakan barcode scanner jika tersedia untuk mempercepat proses
4. **Browser**: Gunakan browser modern untuk pengalaman terbaik

## 🚀 Pengembangan Selanjutnya

Fitur yang bisa ditambahkan:
- Export data ke Excel/PDF
- Pencetakan struk
- Login dan multi-user
- Laporan penjualan harian/bulanan
- Kategori produk
- Diskon/promo
- Backup otomatis ke cloud

## 📝 Lisensi

Aplikasi ini dibuat untuk keperluan edukasi dan penggunaan pribadi.

---

**Selamat menggunakan aplikasi kasir toko kelontong! 🎉**

"# USC" 
