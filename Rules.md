# Rules Document
## Autoemail — Aturan Bisnis & Validasi

**Versi:** 1.0
**Tujuan:** Mendefinisikan aturan yang harus dipatuhi sistem maupun pengguna agar Autoemail berjalan konsisten dan aman digunakan.

---

## 1. Aturan Data Kandidat

**R1.1 — Kolom wajib sebelum pengiriman**
Baris kandidat hanya boleh diproses (checkbox Send bisa dicentang secara sah) jika kolom Name, Email Address, Position Applied For, dan Status sudah terisi. Baris dengan field kosong harus ditolak sistem dan kolom Remarks diisi pesan error, bukan diproses sebagai "SENT".

**R1.2 — Validasi format email**
Alamat di kolom Email Address harus melewati validasi format standar (mengandung `@` dan domain valid) sebelum pengiriman dieksekusi. Kesalahan ketik email adalah risiko dengan dampak tertinggi karena data pribadi kandidat lain berpotensi terkirim ke alamat yang salah.

**R1.3 — Satu kandidat, satu baris**
Sistem mengasumsikan relasi satu-ke-satu antara baris dan kandidat/posisi. Jika satu kandidat melamar dua posisi berbeda, harus dibuat dua baris terpisah, bukan digabung dalam satu baris.

## 2. Aturan Status (Enum)

**R2.1 — Status harus konsisten di tiga tempat**
Nilai status yang dipilih di dropdown kolom D wajib sama persis (case-sensitive) dengan label di tabel referensi (B3:B6). Ketidakcocokan menyebabkan sistem gagal menemukan template terkait dan pengiriman gagal secara silent tanpa pesan error yang jelas jika tidak ditangani eksplisit.

**R2.2 — Status "For Interview" mewajibkan field tambahan**
Sebelum mengirim email untuk kandidat berstatus "For Interview", sel D3 (Interview Date) dan E3 (Interview Time) wajib terisi. Jika kosong, sistem harus menahan pengiriman dan menandai Remarks dengan pesan error, bukan mengirim email dengan jadwal kosong/null ke kandidat.

**R2.3 — Field interview bersifat global, bukan per-baris**
Karena D3/E3 adalah field tunggal yang berlaku untuk semua baris berstatus "For Interview" dalam satu waktu, HR harus mengirim email untuk satu batch interview (tanggal/jam yang sama) sebelum mengubah D3/E3 untuk batch berikutnya. Mengubah D3/E3 di tengah proses pengiriman batch pertama berisiko mengirim jadwal yang salah ke kandidat yang belum diproses.

## 3. Aturan Pemicu Pengiriman (Send Trigger)

**R3.1 — Checkbox sebagai satu-satunya pemicu**
Pengiriman email hanya boleh terjadi akibat perubahan kolom Send dari tidak tercentang menjadi tercentang. Perubahan pada kolom lain (Name, Status, dll.) tidak boleh memicu pengiriman, agar HR bebas mengoreksi data tanpa risiko mengirim email prematur.

**R3.2 — Anti-duplicate-send**
Jika kolom Remarks pada suatu baris sudah berisi "SENT - [timestamp]", sistem harus menolak pemrosesan ulang meski checkbox di-uncheck lalu dicentang kembali — kecuali HR secara sadar mengosongkan kolom Remarks terlebih dahulu sebagai sinyal eksplisit "kirim ulang". Aturan ini mencegah kandidat menerima email duplikat akibat kesalahan klik.

**R3.3 — State "PROCESSING..." bersifat sementara dan mengunci baris**
Selama Remarks menunjukkan "PROCESSING...", baris tersebut dianggap sedang dikunci sistem. Interaksi lanjutan pada baris yang sama (uncheck/check ulang) selama proses berjalan harus diabaikan untuk menghindari race condition atau pengiriman ganda.

## 4. Aturan Template

**R4.1 — Template harus tersedia sebelum status dipakai**
Status baru tidak boleh ditambahkan ke dropdown validation sebelum template Google Docs terkait dibuat dan link-nya terpasang di tabel referensi. Menambah status tanpa template menyebabkan kegagalan merge saat ada kandidat memakai status tersebut.

**R4.2 — Placeholder di template harus sinkron dengan skema**
Setiap perubahan pada template (menambah/menghapus placeholder) wajib disertai pembaruan pada logika merge di Apps Script. Placeholder yang tidak dikenali sistem akan tampil apa adanya (misalnya teks literal `{{Name}}`) di email kandidat — kegagalan ini sulit terdeteksi otomatis dan berisiko terkirim ke kandidat tanpa disadari HR.

## 5. Aturan Otorisasi & Akses

**R5.1 — Otorisasi wajib sebelum trigger aktif**
Fungsi `createEmailTrigger` wajib dijalankan dan disetujui (authorize) oleh pemilik akun sebelum sistem bisa mengirim email sama sekali. Tanpa langkah ini, checkbox Send tidak akan memicu apa pun.

**R5.2 — Single-owner execution**
Seluruh pengiriman email dilakukan atas nama akun Google yang mengotorisasi script (bukan atas nama masing-masing HR yang mengedit sheet). Jika sheet dipakai oleh banyak HR, seluruh email yang terkirim akan tercatat berasal dari satu alamat Gmail yang sama — ini perlu dikomunikasikan ke tim agar tidak membingungkan saat kandidat membalas email.

**R5.3 — Peringatan aplikasi belum terverifikasi**
Karena proyek belum melalui verifikasi Google, layar otorisasi akan menampilkan peringatan keamanan. HR yang menjalankan otorisasi pertama kali harus diberi tahu sebelumnya bahwa ini normal untuk script internal, agar tidak membatalkan proses karena mengira ini indikasi malware.

## 6. Aturan Kuota & Batas Teknis

**R6.1 — Batas kuota harian**
Jumlah email yang dikirim dalam satu hari tidak boleh melebihi kuota harian akun Google yang menjalankan script. HR yang mengelola rekrutmen dengan volume besar harus menjadwalkan pengiriman dalam beberapa batch harian, bukan mencentang seluruh baris sekaligus.

**R6.2 — Batas waktu eksekusi script**
Jika suatu saat sistem dikembangkan untuk mendukung bulk-send (mencentang banyak baris sekaligus dalam satu aksi), proses harus dipecah menjadi batch kecil untuk menghindari time-out eksekusi Apps Script.

## 7. Aturan Audit Trail

**R7.1 — Setiap pengiriman wajib tercatat**
Tidak boleh ada email yang terkirim tanpa jejak di kolom Remarks. Timestamp yang dicatat harus mencerminkan waktu pengiriman aktual (bukan waktu checkbox dicentang), agar bisa dipertanggungjawabkan bila ada sengketa "kapan email ini dikirim".

**R7.2 — Kegagalan juga wajib tercatat (rekomendasi pengembangan)**
Skema saat ini hanya mencatat jalur sukses ("SENT"). Untuk kepatuhan audit yang lebih baik, setiap kegagalan (template tidak ditemukan, email invalid, kuota habis) wajib menuliskan kode/pesan error ke Remarks — bukan dibiarkan kosong atau tetap "PROCESSING..." tanpa batas waktu.

## 8. Aturan Perubahan Struktur (Change Management)

**R8.1 — Larangan mengubah struktur kolom tanpa memperbarui script**
Menyisipkan atau memindahkan kolom pada tabel kandidat akan merusak referensi konstanta (`START_ROW`, `COL_NAME`, dst.) di kode. Perubahan struktural pada sheet wajib disertai pembaruan konstanta terkait di Apps Script, dan idealnya diuji di sheet salinan (bukan sheet produksi) terlebih dahulu.
