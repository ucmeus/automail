# Architecture Document
## Autoemail — Sistem Otomasi Email Status Lamaran Kerja

**Versi:** 1.0
**Nama Proyek Apps Script:** `Autoemail`
**Model Deployment:** Container-bound Google Apps Script (terikat pada spreadsheet "List of Applicants")

---

## 1. Gambaran Umum Arsitektur

Autoemail adalah arsitektur serverless yang sepenuhnya berjalan di atas infrastruktur Google Workspace. Tidak ada server, database, atau hosting eksternal yang dikelola — semua komponen memakai layanan Google yang sudah tersedia secara gratis.

Empat lapisan utama:

1. **Data Layer** — Google Sheets ("List of Applicants") sebagai sumber data kandidat sekaligus antarmuka input bagi HR.
2. **Logic Layer** — Google Apps Script (proyek "Autoemail") yang menjalankan seluruh logika bisnis: membaca data, mengambil template, menyusun email, dan mencatat status.
3. **Template Layer** — Google Docs, satu dokumen per kategori status, berfungsi sebagai template surat yang bisa diedit tim HR tanpa menyentuh kode.
4. **Delivery Layer** — Gmail (melalui `GmailApp`/`MailApp`) sebagai kanal pengiriman email ke kandidat.

```
┌─────────────────────┐        ┌──────────────────────┐
│   Google Sheets      │        │   Google Docs          │
│  "List of Applicants" │◄──────►│  Template per Status    │
│  (Data & UI Layer)    │  link  │  (Shortlisted, For       │
│                        │        │   Interview, Not         │
│  - Tabel kandidat      │        │   Selected, Under Review)│
│  - Tabel referensi     │        └──────────────────────┘
│    status → template   │                    │
│  - Checkbox trigger     │                    │ dibaca & digabung (merge)
└──────────┬─────────────┘                    │
           │ onEdit / installable trigger      │
           ▼                                   ▼
┌───────────────────────────────────────────────────────┐
│         Google Apps Script — Proyek "Autoemail"          │
│  - createEmailTrigger()  → mendaftarkan trigger           │
│  - fungsi utama pemrosesan baris (merge + kirim)           │
│  - update kolom Remarks (PROCESSING... → SENT)              │
└───────────────────────────┬──────────────────────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │   GmailApp / MailApp  │
                  │   (Delivery Layer)     │
                  └──────────┬─────────────┘
                             ▼
                  ┌────────────────────┐
                  │   Inbox Kandidat      │
                  └────────────────────┘
```

## 2. Komponen Sistem

### 2.1 Google Sheets — "List of Applicants"
Spreadsheet ini berperan ganda sebagai database ringan sekaligus antarmuka pengguna. Tab tunggal "Applicants" menyimpan:
- Tabel referensi status (baris 2–6): memetakan setiap status ke link Google Docs template melalui formula `HYPERLINK`.
- Field global tanggal/jam interview (D3/E3) yang dipakai lintas-kandidat untuk status "For Interview".
- Tabel kandidat (mulai baris 9): data individual per pelamar.

### 2.2 Google Apps Script — Proyek "Autoemail"
Script terikat langsung (container-bound) pada spreadsheet, dapat diakses lewat menu Extensions → Apps Script. Berdasarkan komentar header pada kode sumber, struktur referensi selnya didefinisikan eksplisit di awal script (lihat Schema Document untuk detail konstanta).

Proyek ini memiliki setidaknya dua entry point yang teramati:
- **`createEmailTrigger`** — fungsi untuk mendaftarkan installable trigger. Ini diperlukan karena simple trigger bawaan (`onEdit` otomatis) tidak diizinkan Google untuk memicu layanan yang memerlukan otorisasi seperti pengiriman email; oleh karena itu trigger harus didaftarkan secara manual melalui fungsi ini agar berjalan dengan scope OAuth yang sesuai.
- **Fungsi pemroses baris** — dijalankan saat checkbox "Send" dicentang, bertanggung jawab membaca data baris, mengambil template, melakukan merge, mengirim email, dan memperbarui kolom Remarks.

### 2.3 Google Docs — Template Layer
Empat dokumen terpisah, satu per status, memuat placeholder yang digantikan otomatis oleh script saat proses merge (misalnya nama, posisi, status, dan — khusus template "For Interview" — tanggal/jam). Pemisahan template dari kode memungkinkan tim HR mengubah redaksi surat tanpa menyentuh Apps Script sama sekali.

### 2.4 Gmail — Delivery Layer
Pengiriman email memakai layanan Gmail bawaan akun Google yang menjalankan script (teramati dari proses otorisasi OAuth ke akun `marcusdigitalhub@gmail.com` dengan scope "Read, compose, send, and permanently delete all your email from Gmail"). Isi email berupa ringkasan status dalam format terstruktur (nama, posisi, status, jadwal interview jika relevan) dengan lampiran surat resmi hasil merge dari template Google Docs.

## 3. Integration Points & API yang Digunakan

| Layanan Google | Peran dalam Sistem |
|---|---|
| `SpreadsheetApp` | Membaca/menulis data sheet, mendeteksi baris yang diedit |
| `DocumentApp` | Membuka template Google Docs dan melakukan text-replacement placeholder |
| `DriveApp` | Kemungkinan dipakai untuk menyalin/mengonversi dokumen hasil merge menjadi lampiran |
| `GmailApp` / `MailApp` | Mengirim email ke alamat kandidat |
| Apps Script Trigger Service | Menjalankan `createEmailTrigger` sebagai installable trigger berbasis edit pada sheet |

## 4. Model Otorisasi & Keamanan

- Sistem meminta izin OAuth penuh terhadap Gmail pengguna (scope pengiriman email) dan Google Docs/Drive (scope baca-tulis dokumen).
- Karena proyek belum melalui proses verifikasi Google Cloud, pengguna akan melihat peringatan "Google hasn't verified this app" saat otorisasi pertama — ini normal untuk script internal skala kecil, namun perlu dikomunikasikan ke pengguna agar tidak dikira aplikasi berbahaya.
- Akses dibatasi pada akun Google yang menjalankan script (single-owner execution model) — tidak ada multi-user authentication terpisah.

## 5. Batasan Skalabilitas

- **Kuota pengiriman harian**: `GmailApp`/`MailApp` memiliki batas jumlah email per hari yang berbeda antara akun Gmail konsumen dan akun Google Workspace berbayar.
- **Batas waktu eksekusi script**: Apps Script membatasi waktu eksekusi per pemanggilan (maksimal beberapa menit), sehingga pengiriman massal dalam jumlah sangat besar perlu dipecah menjadi beberapa batch.
- **Concurrency**: Karena trigger berbasis edit pada satu spreadsheet, pengeditan simultan oleh banyak HR pada baris berbeda berisiko menimbulkan race condition ringan pada penulisan kolom Remarks.

## 6. Alur Penanganan Error (Observed & Direkomendasikan)

Dari rekaman, alur normal menunjukkan transisi status Remarks: kosong → "PROCESSING..." → "SENT - [timestamp]". Untuk kondisi gagal (template tidak ditemukan, email tidak valid, kuota habis), arsitektur perlu menambahkan state ketiga (misalnya "ERROR - [pesan]") agar HR tahu baris mana yang butuh penanganan ulang — detail aturan ada di Rules Document.

## 7. Ketergantungan Eksternal

Tidak ada dependency pihak ketiga (no external npm/pip packages, no external server). Seluruh proyek berjalan 100% dalam ekosistem Google, yang menjadi keunggulan sekaligus batasan: mudah dan gratis untuk dijalankan, tapi terikat sepenuhnya pada kebijakan kuota dan keamanan Google.
