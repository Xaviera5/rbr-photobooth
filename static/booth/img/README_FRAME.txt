Taruh file bingkai kamu di folder ini dengan nama persis: frame-max.png

Syarat file bingkai:
- Format PNG dengan background TRANSPARAN (bukan JPG, bukan PNG solid putih/hitam)
- Bagian tengah (area wajah/badan orang) dibiarkan transparan, cuma pinggirannya
  (logo, garis, teks "MAX VERSTAPPEN", dll) yang punya isi warna
- Rasio/aspect ratio idealnya sama dengan area kamera di UI, sekitar 16:8.5
  (kalau beda, bingkai akan sedikit stretch karena pakai object-fit: cover)

Kalau nama file / lokasi beda, tinggal ubah:
1. templates/booth/index.html -> src="{% static 'booth/img/NAMA_FILE_KAMU.png' %}"
