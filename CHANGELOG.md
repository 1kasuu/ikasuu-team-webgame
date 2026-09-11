# CodePlatform v1.4.3 — Grid & Touch-Control Fix

## 🐛 Diperbaiki

- **Arena Play menampilkan grid blocking yang tidak sesuai reference art** — `#arena::before` menggambar grid 32px di seluruh arena permainan (bukan cuma editor), tidak sesuai dengan reference (`reference/level *.jpeg`) yang bersih tanpa grid. Grid dihapus dari arena Play; grid Stage Editor (`.editor-arena`) tidak berubah dan tetap berfungsi sebagai alat bantu membangun.
- **Spike/hazard tampil biru, bukan merah** — ada 2 rule `.spike` duplikat yang belakangan di file (sekitar baris ~2140 versi lama) menimpa warna dan glow merah spike yang asli dengan `background:#304b72` + `drop-shadow` biru, karena urutan sumber CSS memenangkan rule yang lebih akhir pada specificity yang sama. Akibatnya hazard jadi susah dibedakan dari platform biasa dan terlihat seperti "grid" warna seragam. Rule duplikat dihapus, hanya definisi `.spike` asli (merah) yang tersisa.
- **Tombol panah gerak (touch-controls) muncul di desktop** — sebelumnya `#touch-controls` hanya dicek lewat `(hover:none) and (pointer:coarse)`, yang juga cocok untuk layar sentuh berukuran desktop/laptop hybrid (mouse+keyboard tetap terpasang tapi layar touchscreen). Ditambahkan `and (max-width:900px)` pada media query-nya, sehingga tombol panah hanya muncul di layar selebar HP/tablet, dan selalu tersembunyi (`display:none !important` sebagai default) di lebar desktop berapa pun perangkatnya.

## 📝 Catatan

- Tidak ada perubahan pada data level (`data/levels/*.json`) atau logic gameplay (`js/game.js`) — perbaikan murni di `css/style.css`.


---

# CodePlatform v1.4.2 — Tablet Pass, Touch Controls & Audio

## 🐛 Diperbaiki

- **Panel inspector mobile tidak benar-benar tertutup saat tombol "×" ditekan** — CSS `:focus-within` tetap aktif karena fokus pindah ke tombol close itu sendiri (masih di dalam panel), jadi panel langsung terbuka lagi. Sekarang tombol close memanggil `this.blur()` setelah deselect.
- **Stage List / Tutorial / Settings berpotensi tidak bisa di-scroll dengan benar di tablet** — arsitekturnya sebelumnya membuat elemen `position:fixed` itu sendiri yang discroll (`overflow:auto` langsung di elemen fixed), pola yang dikenal luas menyebabkan scroll "macet" di sejumlah browser mobile setelah momentum/rubber-band. Direfactor ke pola standar: container `position:fixed` di luar (statis, tidak scroll) + wrapper `.screen-scroll` biasa di dalam yang menangani scroll. Berlaku untuk stage-screen, tutorial-screen, dan settings-screen.
- **Shortcut keyboard desktop masih tampil di tablet** (bukan cuma di HP) — sebelumnya hanya disembunyikan di bawah 820px (`#key-hints`), sementara `.btn-kbd` (chip "Ctrl+Alt+Enter" dll) dan panel `.gd-shortcuts` di Stage Editor tidak disembunyikan sama sekali di perangkat manapun. Sekarang semuanya disembunyikan untuk device layar sentuh (`hover:none`+`pointer:coarse`) di lebar berapa pun, plus fallback di bawah 1180px.
- **Home screen berpotensi tidak center di viewport pendek** — sebelumnya pakai flex `align-items:center`+`overflow:hidden` yang memotong konten secara diam-diam kalau kontennya lebih tinggi dari layar. Diganti pola `margin:auto` yang center saat muat, dan otomatis top-align + scrollable (bukan terpotong) saat tidak muat.

## ✨ Ditambahkan

- **Kontrol gerak sentuh (touch controls)** — sebelumnya **tidak ada cara sama sekali** menggerakkan karakter di HP/tablet (hanya via keyboard A/D/Space/Arrow). Sekarang tombol Kiri/Kanan/Lompat muncul otomatis di device layar sentuh, terhubung ke sistem input yang sama (`keys.a`/`keys.d`/`jumpQueued`), lengkap dengan penanganan `pointercancel`/`pointerleave` agar tidak "nyangkut" saat jari meleset dari tombol. Sudah diuji: karakter benar-benar bergerak saat tombol ditahan.
- **Volume audio bisa diatur** — sebelumnya kode sudah membaca `cp_bgm_volume` dari localStorage tapi tidak ada UI untuk mengubahnya (selalu default 45%, dead code). Ditambahkan slider volume di halaman Pengaturan (`setBgmVolume()`), tersimpan otomatis dan langsung berlaku ke elemen audio.

## 🔄 Diubah

- Spacing tombol Home Menu diperlebar (gap 11px→14px, tinggi tombol 54px→56px, margin sekitar link/catatan ditambah) agar tidak terasa terlalu rapat.
- Tinggi minimum tombol Home Menu di mobile dinaikkan (48px→52px) untuk kenyamanan sentuh.

## 📝 Catatan

- Perbaikan arsitektur scroll (`.screen-scroll`) sudah diverifikasi lewat wheel-scroll dan pengukuran `scrollHeight`/`clientHeight` — simulasi touch-swipe via automated testing tool sempat tidak konsisten, kemungkinan besar keterbatasan tool testing headless itu sendiri (bukan pola yang sama dengan bug aslinya), tapi belum bisa dipastikan 100% tanpa pengujian di tablet asli.
- Tidak ada perubahan pada sistem simpan/ekspor stage maupun isi file level resmi pada rilis ini.


---

# CodePlatform v1.4.1 — Bugfix & Mobile Pass

## 🐛 Diperbaiki

- **Transform editor**: object bisa hancur/terbalik saat resize pakai handle selain kanan-bawah (se) — rumus anchor `left`/`top` salah untuk 3 dari 4 sudut, sekarang diperbaiki jadi `Math.min(anchor, pointer)` sehingga benar untuk semua arah, termasuk pada object yang sudah diputar (rotated).
- **Hitbox tidak terlihat** untuk object Spike — sebelumnya pakai `outline` yang mengikuti bounding box persegi, bukan bentuk segitiga (`clip-path`) sehingga hitbox nyaris tak terlihat. Sekarang pakai teknik stacked `drop-shadow` yang mengikuti siluet asli object.
- **Input A/D mati saat Caps Lock aktif** — `keydown`/`keyup` sebelumnya menyimpan `e.key` apa adanya (jadi `"A"`/`"D"` uppercase saat Caps Lock nyala), sementara gerakan mengecek huruf kecil. Sekarang key dinormalisasi ke lowercase sebelum disimpan.
- **Arena Stage Editor terpotong ~50% di layar mobile** — arena (720×360 atau custom) sebelumnya di-render 100% zoom lalu di-center oleh flexbox tanpa auto-fit, sehingga sisi kiri/kanan arena terpotong di luar viewport pada layar sempit. Sekarang arena otomatis fit + center ke viewport saat editor dibuka, saat ukuran arena diubah, dan saat resize layar mobile.
- **Panel inspector mobile menutupi hampir seluruh layar tanpa cara menutupnya** — ditambahkan tombol "×" eksplisit untuk menutup panel (deselect) di layar mobile.
- **Level JSON tanpa `id` didiamkan dibuang dari daftar** oleh loader — sekarang dinormalisasi dengan default yang konsisten (id dari posisi manifest, `objects: []`, arena/spawn/goal default) sehingga level yang datanya belum lengkap/kosong tetap dianggap valid dan bisa dilanjutkan lewat Stage Editor.
- Penguatan scroll di iOS Safari (`-webkit-overflow-scrolling:touch`, `overscroll-behavior:contain`) pada Stage List dan panel inspector mobile.
- `touch-action:none` pada splitter horizontal mobile agar drag tidak bentrok dengan gesture scroll browser.

## ✨ Ditambahkan

- **8 resize handle** pada transform editor: 4 sudut (nw/ne/sw/se) + 4 tepi (n/s/e/w), lengkap dengan style dan cursor masing-masing.
- **Resize satu arah**: menarik handle tepi (n/s/e/w) sekarang hanya mengubah sisi yang ditarik, sisi lain tidak ikut berubah.
- **Free Mode**: toggle baru (tombol toolbar + checkbox di panel Options) untuk menggeser object dengan presisi 1px tanpa Snap/Grid.
- Warna hitbox dibedakan sesuai tipe: **hijau** untuk Solid/Block, **merah** untuk Hazard (Spike & Lava).

## 🔄 Diubah

- Stage baru dari "Buat Stage Sendiri" sekarang dimulai benar-benar kosong (`objects: []`), tidak lagi otomatis diisi 1 block solid default — supaya level sepenuhnya dibangun sendiri lewat Stage Editor.

## 📝 Catatan

- Tidak ada perubahan pada sistem simpan/ekspor stage (`saveCustomStages`, `saveCustomStage`, `exportEditorJSON`, `importStageJSON`) maupun isi file `data/levels/level-01.json` s/d `level-10.json` — perubahan loader hanya membuat proses **pembacaan** manifest lebih toleran terhadap level yang datanya belum lengkap.
- Grid toggle vs Snap to Grid, splitter horizontal mobile, dan centering Home Menu sudah diverifikasi berfungsi dengan benar sebelum perubahan ini — tidak memerlukan perbaikan lebih lanjut.


---

# CodePlatform v1.4.0 — Editor v2

## ✨ Ditambahkan

- Stage Editor dengan workflow Build / Edit / Delete bergaya Geometry Dash.
- Object palette untuk Block, Spike, Lava, Spawn, dan Goal.
- Swipe / Paint Placement untuk menaruh banyak object.
- Multi-select, selection box, dan selection indicator.
- Transform handles untuk Move, Resize, dan Rotate.
- Transform dengan modifier Shift dan Alt.
- Flip X / Flip Y.
- Align dan Distribute.
- Grid dan Snap dengan ukuran grid 8 px.
- Copy, Paste, Duplicate, Delete, Undo, dan Redo.
- Editor history hingga 200 langkah.
- Object lock dan visibility.
- Layer property untuk object.
- Pan dan zoom pada editor viewport.
- Playtest dari awal dan Play From Selection.
- Show Hitboxes untuk debugging editor.
- Pengaturan ukuran arena custom hingga 2000×1200.
- Shortcut editor context-aware.
- Shortcut game yang tidak lagi memakai Ctrl+E/Ctrl+R yang rawan bentrok browser:
  - Run Code: Ctrl + Alt + Enter
  - Restart: Ctrl + Alt + Backspace

## 🔄 Diubah

- UI Stage Editor diubah menjadi lebih mirip editor Geometry Dash.
- Transform object menggunakan interaksi langsung dengan drag/handle seperti editor desain modern.
- Object baru mengikuti ukuran default yang konsisten dengan official stage.
- Spawn dan Goal menjadi object yang dapat dipindahkan di editor.
- Custom stage mempertahankan ID stabil saat disimpan ulang.

## 🐛 Diperbaiki

- Selection tidak lagi hanya bergantung pada satu object.
- Spike, Block, dan Lava dapat diedit melalui workflow editor yang sama.
- Shortcut editor tidak mengambil alih ketika user sedang mengetik di field input.

## 📝 Catatan

- UI editor mengambil inspirasi workflow Geometry Dash, sedangkan interaksi resize/rotate dibuat nyaman seperti Canva/Figma.
- Physics dan collision tetap ditangani engine CodePlatform dan tidak bergantung pada DOM editor.


---

# CodePlatform v1.4.0 — Editor v2

## ✨ Ditambahkan

- Stage Editor dengan workflow Build / Edit / Delete bergaya Geometry Dash.
- Object palette untuk Block, Spike, Lava, Spawn, dan Goal.
- Swipe / Paint Placement untuk menaruh banyak object.
- Multi-select, selection box, dan selection indicator.
- Transform handles untuk Move, Resize, dan Rotate.
- Transform dengan modifier Shift dan Alt.
- Flip X / Flip Y.
- Align dan Distribute.
- Grid dan Snap dengan ukuran grid 8 px.
- Copy, Paste, Duplicate, Delete, Undo, dan Redo.
- Editor history hingga 200 langkah.
- Object lock dan visibility.
- Layer property untuk object.
- Pan dan zoom pada editor viewport.
- Playtest dari awal dan Play From Selection.
- Show Hitboxes untuk debugging editor.
- Pengaturan ukuran arena custom hingga 2000×1200.
- Shortcut editor context-aware.
- Shortcut game yang tidak lagi memakai Ctrl+E/Ctrl+R yang rawan bentrok browser:
  - Run Code: Ctrl + Alt + Enter
  - Restart: Ctrl + Alt + Backspace

## 🔄 Diubah

- UI Stage Editor diubah menjadi lebih mirip editor Geometry Dash.
- Transform object menggunakan interaksi langsung dengan drag/handle seperti editor desain modern.
- Object baru mengikuti ukuran default yang konsisten dengan official stage.
- Spawn dan Goal menjadi object yang dapat dipindahkan di editor.
- Custom stage mempertahankan ID stabil saat disimpan ulang.

## 🐛 Diperbaiki

- Selection tidak lagi hanya bergantung pada satu object.
- Spike, Block, dan Lava dapat diedit melalui workflow editor yang sama.
- Shortcut editor tidak mengambil alih ketika user sedang mengetik di field input.

## 📝 Catatan

- UI editor mengambil inspirasi workflow Geometry Dash, sedangkan interaksi resize/rotate dibuat nyaman seperti Canva/Figma.
- Physics dan collision tetap ditangani engine CodePlatform dan tidak bergantung pada DOM editor.


---

# CodePlatform v1.3.0


## 🔧 Pembaruan Perbaikan

- Ukuran default **Spike** di Stage Editor sekarang sama dengan spike pada stage official, yaitu **24×24**.
- Spike sekarang dapat dipilih, digeser, diubah ukuran, dan dihapus dalam **Edit Mode**.
- Player icon tidak lagi menampilkan mata dan tetap berbentuk kotak sempurna saat melompat/berotasi.
- Posisi dan ukuran marker **Goal** di editor dibuat tetap sehingga tidak melebar saat digeser.
- Glow Goal dirapikan agar tetap sejajar dengan frame goal.
- Shortcut **Run Code** diubah dari `Ctrl+R` menjadi `Ctrl+Q`.
- BackSound sekarang mencoba melakukan playback kembali setelah interaksi pertama pengguna untuk mengatasi pembatasan autoplay browser.
- Penanganan error BackSound dibuat lebih jelas ketika file `audio/background.opus` tidak tersedia atau gagal dimuat.
- Posisi menu Home dipusatkan kembali.
- Splitter pada mode mobile sekarang tersedia dan dapat digeser **atas/bawah** untuk mengatur tinggi arena dan editor.
- Scaling arena diberi beberapa tahap reflow/resize agar arena langsung tampil saat level pertama kali dibuka.

