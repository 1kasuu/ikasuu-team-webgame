# Changelog

## [v1.0.0-alpha.3] - 2026-09-05

### Ditambahkan

Alur kerja 2D Stage Editor bergaya Unity dengan tools Edit / Place / Delete.
Sistem riwayat editor dengan fitur Undo / Redo.
Shortcut keyboard editor untuk Delete, Backspace, Copy, Paste, Duplicate, Undo, Redo, dan Save, serta shortcut cepat untuk berpindah tools.
Marker Spawn Point dan Goal yang dapat digeser.
Pengaturan ukuran arena secara custom untuk stage buatan sendiri.
Kemampuan mengedit custom stage langsung dari Stage List.
Jalur kembali khusus dari mode game/playtest ke Stage Editor.
Dukungan background music melalui audio/background.opus.
Toggle BackSound pada menu Pengaturan.
Bagian tutorial untuk preset command:
!lompatan-pendek
!platform-kanan
!platform-tengah
!platform-kiri
Kontrol mobile/editor yang lebih lengkap.

### Diubah

Ukuran dasar arena official diubah menjadi 720×360 agar lebih sesuai dengan referensi Geometry Dash yang diberikan.
Seluruh 10 layout stage resmi dibangun ulang berdasarkan gambar referensi yang diberikan dan penempatan objek disesuaikan untuk meningkatkan playability serta progression.
Tipe hazard diamond/saw sebelumnya dihapus dari editor dan data level resmi; bentuk yang dimaksud sekarang menggunakan pasangan spike.
Sistem pemuatan level menggunakan Promise.allSettled() sehingga satu file JSON yang bermasalah tidak menyebabkan seluruh level yang valid gagal dimuat.
Renderer stage dan physics sekarang menggunakan ukuran arena yang ditentukan masing-masing stage.
Scaling arena dibuat terpusat sejak frame pertama dan dihitung ulang menggunakan ResizeObserver serta event resize.
Input saat mode Play sekarang otomatis mengembalikan fokus ke arena setelah pergantian dari mode editor.
Tombol Back dalam mode game mengarahkan kembali ke editor ketika berasal dari playtest custom stage.
Stage Editor menggunakan grid snapping untuk mempermudah penempatan objek.
Custom stage sekarang memiliki ID yang stabil sehingga penyimpanan hasil edit memperbarui stage yang sama, bukan membuat duplikat baru.

### Diperbaiki

Icon player tidak lagi berubah menjadi memiliki sudut membulat ketika melompat atau berotasi.
Posisi arena pada perangkat mobile sekarang berada di tengah.
Tampilan arena saat pertama kali dibuka tidak lagi bergantung pada pengguna yang harus menggeser splitter secara manual.
Fokus tombol Play tidak lagi menghalangi input keyboard setelah tombol ditekan.
Kembali dari playtest custom stage tidak lagi langsung mengarahkan pengguna ke Stage List.
Inisialisasi marker editor tidak lagi menghasilkan error null .style.
Scrollbar dan tombol scrollbar sekarang mengikuti tema website dan tidak lagi menampilkan tampilan default browser yang berwarna terang.
Data stage tidak lagi bergantung pada sistem rendering hazard diamond yang sudah dihapus.
