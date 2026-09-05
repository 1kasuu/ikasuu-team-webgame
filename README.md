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
