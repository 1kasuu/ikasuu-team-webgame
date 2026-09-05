# Changelog

Semua perubahan penting pada CodePlatform dicatat di sini.

## [1.1.0] - 2026-09-05

### ✨ Ditambahkan
- Sistem level berbasis JSON eksternal.
- `manifest.json` sebagai daftar level resmi.
- Satu file JSON untuk setiap level resmi.
- Home Menu baru dengan navigasi Mulai, Tutorial, dan Pengaturan.
- Tutorial pengenalan dasar HTML/CSS dan cara bermain.
- Stage Editor untuk membuat custom stage.
- Penyimpanan custom stage menggunakan `localStorage`.
- Import dan export custom stage dalam format JSON.
- Playtest untuk custom stage.
- Sistem lock/unlock untuk stage resmi.
- Progress stage disimpan menggunakan `localStorage`.
- Play Mode dan Code Mode.
- Responsive layout untuk perangkat mobile.
- Fixed-step physics 60 Hz.
- Player hurtbox terpisah dari visual player.
- Basic custom hazard collision.

### ⚙️ Diperbaiki / Ditata Ulang
- Data layout stage dipisahkan dari logic utama game.
- Collision arena dinormalisasi ke logical game coordinates 720×480.
- Sistem input dipisahkan antara gameplay dan editor/UI.
- Restart stage mempertahankan kode yang sedang dibuat.
- Run counter tidak bertambah untuk kode yang ditolak validator.
- Reset level mereset state run/death sesuai fungsi reset.
- Stage selection menerapkan progression lock/unlock.

### 🐛 Bug Fix
- Memperbaiki collision yang sebelumnya tidak konsisten saat arena di-resize atau splitter digeser.
- Memperbaiki collision solid yang terlalu agresif ketika player overlap object.
- Memperbaiki penggunaan koordinat top/bottom yang tidak konsisten pada collision.
- Mengurangi gangguan input keyboard ketika user berinteraksi dengan editor/UI.
- Memperbaiki kehilangan kode ketika melakukan restart stage.

### 📌 Catatan
- Versi ini merupakan transisi arsitektur besar dari versi awal menuju sistem level modular.
- Collision dan physics pada versi ini belum dimaksudkan sebagai reproduksi internal Geometry Dash secara identik.
