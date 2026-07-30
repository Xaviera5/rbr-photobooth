# Oracle Red Bull Racing — Photo Booth (Django)

Project foto booth bertema Oracle Red Bull Racing. Frontend pakai kamera browser
(`getUserMedia`) + `<canvas>` untuk capture & filter, backend Django menyimpan
setiap foto secara permanen (database `Photo` + file di folder `media/captures/`).

## Struktur Project

```
rbr_photobooth/
├── manage.py
├── requirements.txt
├── rbrproject/          # settings, urls utama
├── booth/                # app Django: models, views, urls, admin
├── templates/booth/       # index.html (tampilan photo booth)
├── static/booth/
│   ├── css/style.css      # tema dark + merah racing
│   └── js/
│       ├── camera.js       # akses kamera, filter, capture, upload
│       └── countdown.js    # countdown ke race berikutnya
└── media/captures/        # foto hasil capture disimpan di sini
```

## Cara Menjalankan (Windows, sesuai workflow kamu)

1. Buka folder project di terminal / VS Code.
2. Buat virtual environment (opsional tapi disarankan):
   ```
   py -3.10 -m venv venv
   venv\Scripts\activate
   ```
3. Install dependency:
   ```
   pip install -r requirements.txt
   ```
4. Jalankan migrasi database (sudah ada 1 migration siap pakai):
   ```
   py -3.10 manage.py migrate
   ```
5. (Opsional) buat superuser untuk lihat foto lewat Django admin:
   ```
   py -3.10 manage.py createsuperuser
   ```
6. Jalankan server:
   ```
   py -3.10 manage.py runserver
   ```
7. Buka `http://127.0.0.1:8000/` di browser. **Wajib pakai `localhost`/`127.0.0.1`**
   atau HTTPS — browser modern blokir akses kamera di HTTP biasa (misal via IP
   Laragon `.test` tanpa SSL, kamera akan ditolak).

## Cara Kerja

- **`camera.js`** minta izin kamera saat halaman dibuka. Kalau ditolak, muncul
  overlay "Camera access denied" + tombol RETRY (persis sesuai desain kamu).
- Tombol filter (**ORIGINAL / RBR MODE / MONO / SPEED**) mengubah CSS `filter`
  pada preview video secara real-time, dan filter yang sama "dibakar" ke dalam
  gambar saat capture lewat `ctx.filter` di canvas.
- Klik tombol shutter (lingkaran merah) → foto diambil dari `<video>`, digambar
  ke `<canvas>`, diubah jadi base64 PNG, lalu di-`POST` ke `/api/save-photo/`.
- Django (`views.save_photo`) decode base64 → simpan sebagai `ImageField` di
  model `Photo` → otomatis masuk folder `media/captures/` + tercatat di DB.
- Galeri di halaman langsung menampilkan foto baru tanpa reload (di-prepend
  lewat JS), dan kalau halaman di-refresh, foto-foto lama tetap muncul karena
  diambil dari database (`views.index` mengirim `photos` ke template).

## Data Statis

Stats driver (championships, race wins, dst) dan tanggal countdown Hungarian
Grand Prix di-hardcode:
- Di `templates/booth/index.html` untuk angka stats.
- Di `static/booth/js/countdown.js` (variabel `RACE_DATE`) untuk tanggal race.

Tinggal edit langsung di dua file itu kalau mau ganti angka/tanggal.

## Catatan Keamanan (untuk tugas kuliah / demo lokal)

- `save_photo` pakai `@csrf_exempt` supaya simpel untuk demo lokal. Untuk
  deployment sungguhan, sebaiknya kirim CSRF token dari JS (`fetch` dengan
  header `X-CSRFToken`) dan hapus `csrf_exempt`.
- `DEBUG = True` dan `SECRET_KEY` masih default — jangan dipakai untuk
  production, cukup aman untuk tugas/demo.

## Menambahkan Bingkai Foto (Frame Overlay)

Sudah disiapkan supaya tinggal drop file gambar:

1. Taruh file bingkai kamu (PNG, **background transparan**) di:
   ```
   static/booth/img/frame-max.png
   ```
2. Selesai — bingkai otomatis muncul di preview kamera live, dan ikut
   "dibakar" ke dalam foto saat capture (lewat `ctx.drawImage(frameImg, ...)`
   di `camera.js`, setelah filter warna diterapkan).

Kalau nama file berbeda, ubah path-nya di `templates/booth/index.html`
pada tag `<img id="frameOverlay" ...>`.

Detail syarat file bingkai ada di `static/booth/img/README_FRAME.txt`.

## Ide Pengembangan Lanjutan

- Simpan nama/NIM sesi tiap capture (tambah field di model `Photo`).
- Tambah tombol "Download" per foto di galeri.
- Ganti filter CSS dengan efek canvas pixel-level yang lebih dramatis
  (misalnya motion-blur asli untuk filter "Speed").
- Tab "RACE RESULTS" masih placeholder — bisa diisi data dari API F1 publik.
