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

