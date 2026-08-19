# automail
Automail — Sistem Otomasi Email Status Lamaran Kerja Berbasis Google Apps Script yang memungkinkan tim HR mengirim email pemberitahuan status lamaran kerja kepada kandidat secara personal, tanpa perlu menulis email satu per satu. Setiap perubahan status kandidat di spreadsheet (Shortlisted, For Interview, Not Selected, Under Review) dipetakan ke template surat di Google Docs, digabung otomatis dengan data kandidat, lalu dikirim ke alamat email yang bersangkutan hanya dengan mencentang satu checkbox.

Terdiri dari 5 dokumen sistem:
1. PRD — masalah, tujuan, user stories, alur penggunaan, success metrics, risiko
2. Architecture Document — 4 lapisan sistem (Sheets → Apps Script → Docs → Gmail), diagram alur, model otorisasi
3. Design Document — desain tabel, color-coded dropdown, checkbox trigger, struktur email
4. Schema Document — skema kolom sheet, enum status, placeholder template, format log Remarks
5. Rules Document — 20+ aturan bisnis (anti-duplicate-send, validasi email, sinkronisasi status-template, kuota, dsb.)

Tutorial penggunaannya dapat dilihat pada file video yang disertakan.
-----

Semoga bermanfaat, barakallahu fiikum......

-Wassalam-
