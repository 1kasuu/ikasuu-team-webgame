# CodePlatform — JSON Level Edition

## Struktur
- `index.html` — Home, Stage List, Tutorial, Settings, Stage Editor, dan Game.
- `css/style.css` — seluruh tampilan + responsive mobile.
- `js/game.js` — game engine, physics, hitbox, input, editor, progression.
- `data/levels/manifest.json` — daftar level resmi.
- `data/levels/level-XX.json` — satu file JSON untuk satu stage.
- `reference/` — screenshot layout level dari referensi.

## Menjalankan
Karena level dibaca dengan `fetch()` dari JSON, buka project lewat local server, bukan double-click `index.html`. Contoh: VS Code + Live Server atau `python -m http.server`.

## Membuat stage
Buka Home → **Buat Stage Sendiri**. Stage Editor mendukung tambah/drag object, inspector posisi/ukuran/rotasi, save ke localStorage, import JSON, export JSON, dan playtest. Stage custom tidak membutuhkan progress stage resmi.

## Progression
Stage resmi dibuka berurutan. Stage 1 selalu terbuka; Stage berikutnya terbuka setelah stage sebelumnya selesai. Custom Stage selalu dapat dimainkan.

## Collision Engine
- Physics berjalan pada fixed timestep 60 Hz.
- Player memakai hurtbox terpisah dari visual.
- Solid axis-aligned memakai resolusi top/bottom/side; solid berotasi memakai oriented polygon.
- Spike memakai triangular hazard collider dengan inset; diamond memakai diamond polygon; lava memakai box hazard area.
- Collision object berasal dari data level, bukan dari `getBoundingClientRect()` viewport. CSS/DOM hanya digunakan sebagai fallback collider untuk elemen buatan pemain di editor kode.
- Rotasi object pada JSON memengaruhi visual dan collider secara konsisten.

## Patch Notes
Lihat [`CHANGELOG.md`](CHANGELOG.md) untuk riwayat versi dan bug fix.

## GitHub Releases
- Tag versi mengikuti pola `vMAJOR.MINOR.PATCH`, misalnya `v1.2.0`.
- `CHANGELOG.md` menyimpan riwayat lengkap perubahan.
- `.github/release.yml` dapat dipakai GitHub untuk mengelompokkan release notes otomatis berdasarkan label issue/PR.
