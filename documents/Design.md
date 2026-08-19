# Design Document
## Autoemail — Desain Fungsional & Antarmuka

**Versi:** 1.0
**Fokus:** Desain spreadsheet (UI utama pengguna), desain template surat, dan desain isi email

---

## 1. Filosofi Desain

Autoemail sengaja tidak membangun antarmuka baru. Prinsip desainnya adalah **"zero learning curve"** — HR yang sudah terbiasa memakai Google Sheets dan Google Docs bisa langsung memakai sistem ini tanpa pelatihan tambahan. Semua interaksi terjadi di dalam spreadsheet yang sudah dikenal, dan semua keluaran berupa email yang formatnya sudah familiar.

## 2. Desain Struktur Spreadsheet

### 2.1 Tata Letak Umum
Sheet tunggal bernama **"Applicants"** dibagi menjadi tiga zona visual:

**Zona A — Tabel Referensi Status (baris 2–6, kolom B–C)**
Header berwarna biru tua (`Status` | `Message Link`), berisi 4 baris tetap: Shortlisted, For Interview, Not Selected, Under Review. Kolom Message Link berisi formula `HYPERLINK` yang mengarah ke Google Docs template masing-masing status — desain ini memungkinkan HR mengklik langsung untuk membuka/mengedit template tanpa mencari file secara manual.

**Zona B — Field Interview Global (D3/E3)**
Dua sel terpisah untuk Date dan Time, diposisikan berdampingan dengan tabel referensi. Field ini bersifat global (satu nilai berlaku untuk seluruh kandidat berstatus "For Interview" dalam satu sesi), bukan per-baris — desain ini menyiratkan asumsi bahwa satu batch interview terjadi pada tanggal/jam yang sama.

**Zona C — Tabel Kandidat (mulai baris 8/9, kolom A–F)**
Header hijau tua dengan tujuh kolom:
| Kolom | Isi | Tipe Interaksi |
|---|---|---|
| Name | Nama kandidat | Teks bebas |
| Email Address | Alamat email tujuan | Teks bebas (perlu validasi format) |
| Position Applied For | Posisi yang dilamar | Teks bebas |
| Status | Status lamaran | Dropdown warna-kode |
| Send | Pemicu pengiriman | Checkbox |
| Remarks | Log status pengiriman | Read-only (ditulis otomatis oleh sistem) |

### 2.2 Desain Dropdown Status (Color-Coded)
Setiap pilihan status memiliki warna latar berbeda pada dropdown:
- **For Interview** → hijau tua (asosiasi positif/lanjut)
- **Not Selected** → merah (asosiasi negatif/berakhir)
- **Shortlisted** → hijau muda (positif tahap awal)
- **Under Review** → kuning (netral/menunggu)

Pilihan desain ini memungkinkan HR memindai puluhan baris secara visual dalam hitungan detik tanpa harus membaca teks satu per satu — pola warna traffic-light yang umum dipahami secara intuitif.

### 2.3 Desain Checkbox "Send" sebagai Trigger Tunggal
Alih-alih tombol "Kirim" terpisah atau menu custom, desain memakai checkbox sederhana per baris. Pilihan ini punya dua keuntungan: pertama, checkbox adalah kontrol native Google Sheets yang tidak butuh scripting UI tambahan; kedua, checkbox yang tercentang menjadi indikator visual permanen bahwa baris tersebut "sudah diproses", berbeda dari tombol yang tidak meninggalkan jejak status.

### 2.4 Desain Kolom "Remarks" sebagai Live Status Log
Kolom ini berfungsi sebagai umpan balik real-time kepada HR, dengan dua kondisi teramati:
- **"PROCESSING..."** — ditampilkan segera setelah checkbox dicentang, sebagai indikasi sistem sedang bekerja (mencegah HR mencentang berulang kali karena mengira tidak ada respons).
- **"SENT - [tanggal] [jam] [AM/PM]"** — ditampilkan setelah email berhasil terkirim, menjadi bukti audit trail yang bisa dilihat kapan saja tanpa perlu membuka Gmail.

## 3. Desain Template Surat (Google Docs)

Setiap status memiliki satu dokumen Google Docs terpisah berisi placeholder yang digantikan otomatis (lihat Schema Document untuk daftar token). Desain terpisah-dari-kode ini adalah keputusan penting: tim HR yang tidak bisa coding tetap punya kendali penuh atas redaksi, nada bahasa, dan format surat resmi — perubahan kebijakan bahasa perusahaan tidak memerlukan sentuhan developer sama sekali.

## 4. Desain Isi Email

Berdasarkan hasil yang teramati di inbox kandidat, email yang terkirim memiliki struktur konsisten:

1. **Header berwarna** — judul "Application Status Update" dengan latar biru tua, memberi kesan resmi/institusional.
2. **Sapaan personal** — "Dear [Nama]," diikuti kalimat pembuka standar.
3. **Tabel ringkasan** — tiga baris data kunci (Name, Position Applied For, Status) ditampilkan dalam format tabel agar mudah dipindai.
4. **Blok kondisional** — khusus status "For Interview", muncul kotak highlight biru muda berisi Interview Schedule (Date & Time) yang tidak muncul pada status lain. Ini adalah satu-satunya elemen dinamis berdasarkan status di luar teks utama.
5. **Rujukan lampiran** — kalimat penutup mengarahkan kandidat untuk melihat "attached personalized letter" untuk detail lengkap, memisahkan ringkasan cepat (di badan email) dari detail resmi (di lampiran).
6. **Penutup formal** — "Regards, Human Resources Department".

Desain dua-lapis ini (ringkasan di email + detail di lampiran resmi) meniru pola korespondensi HR konvensional, sehingga kandidat tidak merasa menerima "email otomatis generik", melainkan surat resmi yang diantar lewat email.

## 5. Prinsip Desain yang Bisa Direplikasi

Untuk konteks UMKM yang ingin meniru pola ini di proses bisnis lain (misalnya update status pesanan, konfirmasi pembayaran), tiga prinsip desain di atas tetap berlaku:
1. Pisahkan **data** (spreadsheet), **konten** (dokumen template), dan **logika** (script) ke tiga tempat berbeda.
2. Gunakan kontrol native (dropdown, checkbox) alih-alih membangun UI custom.
3. Selalu sediakan kolom status/log yang terlihat langsung oleh pengguna non-teknis, bukan hanya di execution log Apps Script yang jarang dibuka.
