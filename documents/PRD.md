# Product Requirement Document (PRD)
## Autoemail — Sistem Otomasi Email Status Lamaran Kerja Berbasis Google Apps Script

**Versi:** 1.0
**Status:** Aktif / Digunakan
**Pemilik Produk:** Tim HR / Rekrutmen
**Disusun oleh:** Project Manager
**Sumber Analisis:** Rekaman demo produk (screen recording), 5 menit 26 detik

---

## 1. Ringkasan Produk

Autoemail adalah sistem otomasi berbasis Google Sheets dan Google Apps Script yang memungkinkan tim HR mengirim email pemberitahuan status lamaran kerja kepada kandidat secara personal, tanpa perlu menulis email satu per satu. Setiap perubahan status kandidat di spreadsheet (Shortlisted, For Interview, Not Selected, Under Review) dipetakan ke template surat di Google Docs, digabung otomatis dengan data kandidat, lalu dikirim ke alamat email yang bersangkutan hanya dengan mencentang satu checkbox.

Sistem ini lahir dari kebutuhan nyata: proses rekrutmen manual di UMKM maupun perusahaan skala kecil-menengah sering membebani HR dengan pekerjaan repetitif — menyalin nama, posisi, dan status ke template surat, lalu mengirim satu per satu lewat Gmail. Autoemail menghilangkan langkah manual tersebut sepenuhnya.

## 2. Latar Belakang & Masalah

Tim rekrutmen skala kecil umumnya tidak memiliki Applicant Tracking System (ATS) berbayar. Akibatnya:

- Update status kandidat dilakukan manual di spreadsheet, tapi notifikasi ke kandidat sering tertunda atau terlewat.
- Penulisan email personal (nama, posisi, jadwal interview) rentan salah ketik atau salah kirim ke kandidat yang salah.
- Tidak ada jejak audit yang jelas kapan sebuah email benar-benar terkirim.
- Tools ATS komersial terlalu mahal atau terlalu kompleks untuk kebutuhan tim kecil yang hanya menangani puluhan hingga ratusan pelamar per siklus rekrutmen.

## 3. Tujuan (Goals)

1. Mengotomasi pengiriman email status lamaran berdasarkan satu titik input: kolom Status di spreadsheet.
2. Memastikan setiap email yang terkirim personal (nama, posisi, status, dan — khusus status interview — tanggal & jam) tanpa intervensi manual pada isi surat.
3. Menyediakan jejak audit (audit trail) otomatis: kapan email dikirim, dan status pengiriman saat ini (diproses / terkirim).
4. Menggunakan tools yang sudah familiar bagi tim non-teknis (Google Sheets, Google Docs, Gmail) sehingga tidak ada kurva belajar platform baru.
5. Zero-cost implementation — seluruhnya berjalan di atas Google Workspace/akun Google gratis, tanpa biaya lisensi ATS.

### Non-Goals

- Sistem ini bukan ATS penuh (tidak menangani parsing CV, scoring kandidat, atau scheduling interview otomatis ke kalender).
- Tidak menangani pengiriman massal (bulk blast) ke ribuan kandidat sekaligus mengingat batas kuota Gmail harian.
- Tidak menyediakan portal self-service bagi kandidat untuk mengecek status secara mandiri.

## 4. Target Pengguna

**Persona utama: HR Generalist / Recruiter di UMKM atau startup kecil**
- Mengelola rekrutmen untuk beberapa posisi sekaligus.
- Terbiasa dengan Google Sheets, tapi tidak punya latar belakang coding.
- Membutuhkan proses yang cepat, murah, dan minim risiko human error.

**Persona sekunder: Konsultan IT / Automation Specialist**
- Membangun dan memelihara script ini untuk kliennya sebagai bagian dari layanan digitalisasi proses bisnis UMKM.

## 5. User Stories

| # | Sebagai | Saya ingin | Agar |
|---|---------|-----------|------|
| 1 | HR | mengubah status kandidat lewat dropdown | tidak perlu mengetik ulang status secara manual |
| 2 | HR | mencentang satu checkbox untuk mengirim email | tidak perlu membuka Gmail dan menulis email satu per satu |
| 3 | HR | melihat kolom Remarks menunjukkan status "PROCESSING..." lalu "SENT - [tanggal & jam]" | saya tahu email benar-benar sudah terkirim dan kapan |
| 4 | HR | mengisi tanggal & jam interview di satu sel referensi | jadwal itu otomatis muncul di email kandidat yang lolos ke tahap interview |
| 5 | HR | mengganti isi template surat di Google Docs | tidak perlu mengubah kode program setiap kali redaksi surat berubah |
| 6 | Kandidat | menerima email dengan identitas dan posisi yang benar | saya yakin informasi tersebut memang ditujukan untuk saya |

## 6. Ruang Lingkup Fitur

### Dalam cakupan (In Scope)
- Input data kandidat (nama, email, posisi yang dilamar) di sheet "Applicants".
- Empat kategori status baku: Shortlisted, For Interview, Not Selected, Under Review — masing-masing berwarna berbeda pada dropdown untuk memudahkan pemindaian visual.
- Tabel referensi (Status → Message Link) yang menghubungkan setiap status ke template surat di Google Docs melalui formula `HYPERLINK`.
- Field global untuk tanggal dan jam interview (dipakai khusus template "For Interview").
- Checkbox "Send" per baris kandidat sebagai pemicu pengiriman.
- Kolom "Remarks" sebagai log status pengiriman real-time.
- Email otomatis berisi ringkasan status (nama, posisi, status) dengan lampiran surat resmi personal.

### Di luar cakupan (Out of Scope)
- Integrasi dengan job portal (LinkedIn, JobStreet, dsb.) untuk menarik data pelamar otomatis.
- Notifikasi WhatsApp/SMS.
- Manajemen multi-user dengan role & permission berjenjang.

## 7. Alur Penggunaan (User Flow)

1. HR menambahkan data kandidat baru di sheet Applicants (mulai baris 9): Nama, Email, Posisi.
2. HR memilih Status dari dropdown berwarna untuk kandidat tersebut.
3. Jika status "For Interview", HR mengisi tanggal & jam interview pada sel referensi (D3/E3).
4. HR mencentang checkbox di kolom "Send" pada baris kandidat.
5. Sistem (via trigger) mendeteksi perubahan, kolom Remarks berubah menjadi "PROCESSING...".
6. Sistem mengambil template surat sesuai status dari Google Docs, menyisipkan data kandidat, mengonversinya menjadi lampiran, dan mengirim email ke alamat kandidat.
7. Kolom Remarks diperbarui menjadi "SENT - [tanggal, jam]" sebagai bukti pengiriman berhasil.
8. Kandidat menerima email di inbox berisi ringkasan status dan lampiran surat personal.

## 8. Kriteria Keberhasilan (Success Metrics)

- Waktu pemrosesan satu email (dari checkbox dicentang hingga status "SENT") di bawah 15 detik.
- 100% email yang terkirim memiliki data kandidat yang sesuai (tidak ada mismatch nama/posisi).
- Nol pengiriman ganda (duplicate send) untuk baris yang sama.
- Pengurangan waktu HR dalam proses notifikasi kandidat, dari hitungan menit per kandidat menjadi hitungan detik.

## 9. Asumsi & Batasan

- Pengguna memiliki akun Google (Gmail/Workspace) dan mengizinkan (authorize) akses OAuth ke Gmail dan Google Docs.
- Karena aplikasi belum diverifikasi Google ("This app hasn't been verified"), pengguna harus melewati layar peringatan keamanan saat otorisasi pertama kali.
- Volume pengiriman tunduk pada kuota harian MailApp/GmailApp bawaan Google (bervariasi antara akun gratis dan Google Workspace).
- Template surat harus sudah dibuat lebih dulu di Google Docs sebelum status terkait digunakan.

## 10. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Email terkirim ke alamat yang salah karena typo di kolom Email | Tinggi | Validasi format email sebelum pengiriman |
| Checkbox tercentang tidak sengaja dua kali | Sedang | Rule anti-duplicate-send berbasis status Remarks |
| Kuota Gmail harian terlampaui saat rekrutmen massal | Sedang | Batasi jumlah pengiriman per batch, jadwalkan ulang sisa baris |
| Perubahan struktur kolom sheet merusak referensi script | Tinggi | Dokumentasi schema (lihat Schema Document) dan penguncian header |

## 11. Roadmap Selanjutnya (Future Enhancements)

- Validasi otomatis format email sebelum baris bisa dicentang untuk dikirim.
- Log pengiriman terpisah (sheet "Log") agar kolom Remarks tetap ringkas.
- Dukungan multi-bahasa template (Indonesia/Inggris) berdasarkan preferensi kandidat.
- Notifikasi Slack/WhatsApp ke tim HR saat pengiriman selesai atau gagal.
