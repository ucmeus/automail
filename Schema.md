# Schema Document
## Autoemail — Skema Data & Struktur Kode

**Versi:** 1.0
**Sumber:** Diambil langsung dari komentar header kode sumber Apps Script yang teramati pada rekaman demo, serta struktur sheet yang teramati secara visual.

---

## 1. Skema Sheet "Applicants"

### 1.1 Skema Referensi Global (Non-Tabular)

| Sel/Range | Nama Field | Tipe Data | Keterangan |
|---|---|---|---|
| B3 | Status: Shortlisted | Konstanta | Label status tetap |
| B4 | Status: For Interview | Konstanta | Label status tetap |
| B5 | Status: Not Selected | Konstanta | Label status tetap |
| B6 | Status: Under Review | Konstanta | Label status tetap |
| C3:C6 | Message Link | URL (formula `HYPERLINK`) | Link ke Google Docs template per status |
| D3 | Interview Date | Date | Field global, dipakai untuk merge status "For Interview" |
| E3 | Interview Time | Time | Field global, dipakai untuk merge status "For Interview" |

### 1.2 Skema Tabel Kandidat

**Baris mulai:** Row 9 (`START_ROW = 9` pada kode sumber)
**Header tabel:** Row 8

| Kolom | Konstanta di Kode | Nama Field | Tipe Data | Wajib Diisi | Sumber untuk Merge |
|---|---|---|---|---|---|
| A | `COL_NAME = 1` | Name | Teks | Ya | `{{Name}}` di template |
| B | (mengikuti pola +1) | Email Address | Teks (format email) | Ya | Alamat tujuan pengiriman |
| C | (mengikuti pola +1) | Position Applied For | Teks | Ya | `{{Position}}` di template |
| D | (mengikuti pola +1) | Status | Enum (dropdown) | Ya | Menentukan template mana yang dipakai |
| E | (mengikuti pola +1) | Send | Boolean (checkbox) | — | Trigger pemrosesan baris |
| F | (mengikuti pola +1) | Remarks | Teks (auto-generated) | — | Log status: kosong / "PROCESSING..." / "SENT - [timestamp]" |

> **Catatan analisis:** Kode sumber yang teramati secara eksplisit mendefinisikan `START_ROW = 9` dan `COL_NAME = 1`. Kolom B–F disimpulkan mengikuti pola penomoran berurutan berdasarkan struktur visual tabel; penamaan konstanta persis di kode (misalnya `COL_EMAIL`, `COL_STATUS`, dst.) tidak sepenuhnya terlihat di rekaman dan perlu dikonfirmasi langsung ke source code asli sebelum dijadikan acuan pengembangan lanjutan.

## 2. Skema Enum Status

Status bersifat **case-sensitive dan harus identik persis** antara tiga tempat berikut:
1. Dropdown data validation di kolom D (Status).
2. Tabel referensi B3:B6.
3. Nama/isi placeholder di template Google Docs terkait.

| Nilai Enum | Warna Dropdown | Template Terkait |
|---|---|---|
| `Shortlisted` | Hijau muda | Template Shortlisted |
| `For Interview` | Hijau tua | Template For Interview (memakai field tambahan Date/Time) |
| `Not Selected` | Merah | Template Not Selected |
| `Under Review` | Kuning | Template Under Review |

## 3. Skema Placeholder Template (Google Docs)

Berdasarkan hasil merge yang teramati di email dan lampiran, template diasumsikan memakai placeholder berikut (nama token persis bergantung implementasi `DocumentApp` replaceText, umumnya berbentuk `{{token}}` atau `{{ token }}`):

| Placeholder | Sumber Data | Berlaku di Template |
|---|---|---|
| `{{Name}}` | Kolom A (Name) | Semua status |
| `{{Position}}` | Kolom C (Position Applied For) | Semua status |
| `{{Status}}` | Kolom D (Status) | Semua status |
| `{{InterviewDate}}` | Sel D3 | Khusus "For Interview" |
| `{{InterviewTime}}` | Sel E3 | Khusus "For Interview" |

## 4. Skema Isi Email (Runtime-Generated)

| Elemen Email | Sumber |
|---|---|
| Subject | Kemungkinan pola `"Application Status Update - [Position]"` atau statis, tidak sepenuhnya terverifikasi dari rekaman |
| Body — Sapaan | `Dear {{Name}},` |
| Body — Tabel ringkasan | Name, Position Applied For, Status (dari baris kandidat terkait) |
| Body — Blok Interview (kondisional) | Muncul hanya jika Status = "For Interview"; berisi InterviewDate & InterviewTime |
| Lampiran | Hasil merge Google Docs template, dikonversi menjadi file terlampir (kemungkinan PDF via `DriveApp`/export) |

## 5. Skema Log Status (Kolom Remarks)

| Nilai | Kondisi | Format |
|---|---|---|
| *(kosong)* | Belum pernah diproses | — |
| `PROCESSING...` | Checkbox baru dicentang, script sedang berjalan | Teks statis |
| `SENT - [DD-MMM-YYYY] [HH:MM] [AM/PM]` | Email berhasil terkirim | Contoh teramati: `SENT - 14-Aug-2026 09:04 AM` |

> **Rekomendasi pengembangan:** tambahkan nilai ketiga `ERROR - [pesan singkat]` untuk kegagalan pengiriman (lihat Rules Document, bagian Error Handling), karena skema saat ini hanya mengakomodasi jalur sukses.

## 6. Skema Konfigurasi Trigger

| Nama Fungsi | Jenis Trigger | Event | Keterangan |
|---|---|---|---|
| `createEmailTrigger` | Installable Trigger | On Edit (kemungkinan difilter ke kolom Send) | Harus dijalankan manual sekali oleh HR/admin untuk mengaktifkan otorisasi; simple trigger `onEdit()` bawaan tidak bisa dipakai karena keterbatasan izin pengiriman email |

## 7. Ketergantungan Antar-Skema

```
Kolom Status (Tabel Kandidat)
        │
        ▼
Tabel Referensi (B3:C6) ──► Message Link (Google Docs Template)
        │
        ▼
Field Global D3/E3 (khusus For Interview)
        │
        ▼
Merge Engine (Apps Script) ──► Email + Lampiran ──► Kolom Remarks (log hasil)
```

Perubahan pada satu skema (misalnya menambah status ke-5) mewajibkan pembaruan konsisten di tiga tempat: dropdown validation, tabel referensi, dan template Docs baru — kegagalan sinkronisasi di salah satu titik ini adalah sumber error paling umum pada sistem seperti ini.
