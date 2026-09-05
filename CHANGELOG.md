# Changelog

Semua perubahan penting pada CodePlatform dicatat di sini.

## [1.2.0] - 2026-09-05

### ✨ Ditambahkan
- Metadata collider yang disimpan langsung di JSON level resmi.
- Tipe collision khusus untuk solid box, rotated solid, spike triangle, diamond hazard, dan lava hazard area.
- Geometri visual spike dibuat eksplisit sehingga ukuran visual dan geometri gameplay mempunyai basis yang sama.

### ⚙️ Diperbaiki / Ditata Ulang
- Collision engine dipisahkan dari koordinat DOM/viewport.
- Physics tetap menggunakan fixed timestep 60 Hz.
- Player menggunakan hurtbox terpisah dari visual icon.
- Solid tanpa rotasi memakai resolusi top/bottom/side agar perilaku landing lebih stabil.
- Solid berotasi menggunakan oriented polygon collision.
- Spike menggunakan triangular hazard collider dengan inset kecil agar tidak terlalu ketat di tepi visual.
- Diamond hazard menggunakan diamond polygon dan mengikuti rotasi object.
- Lava diperlakukan sebagai area hazard, bukan solid biasa.
- Elemen yang dibuat melalui code editor menggunakan layout box dan rotasi CSS sebagai fallback collider.
- Stage Editor mengekspor metadata collider untuk object custom.
- `transform: rotate()` pada object resmi sekarang memengaruhi visual dan collider secara konsisten.
- Renderer spike diubah dari CSS triangle berbasis border menjadi ukuran eksplisit + `clip-path`.

### 🐛 Bug Fix
- Memperbaiki collision yang berubah ketika arena di-resize atau splitter digeser.
- Memperbaiki rotated platform yang masih menggunakan hitbox axis-aligned.
- Memperbaiki spike yang sebelumnya terdeteksi berdasarkan bounding box persegi yang terlalu besar.
- Memperbaiki diamond hazard yang sebelumnya tidak konsisten antara visual dan collision.
- Memisahkan resolusi solid collision dari death collision hazard.
- Memperbaiki kasus visual spike tidak mempunyai ukuran layout yang sama dengan geometri collision.

### 📌 Catatan
- Sistem ini terinspirasi dari prinsip gameplay/collision Geometry Dash, tetapi bukan reproduksi source code atau internal engine Geometry Dash secara identik.

## [1.1.0]

- Memperkenalkan sistem level berbasis JSON.
- Menambahkan Home, Tutorial, Settings, Stage Editor, Play/Code Mode, dan stage lock/unlock.
- Menambahkan layout responsif untuk mobile.
- Menambahkan fixed-step physics dan basic custom hazard collision.
