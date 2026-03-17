# Perjalanan Bombardilo

**Perjalanan Bombardilo** adalah sebuah mini-game web berbasis _endless runner_ bergaya retro. Bantu Bombardilo sang buaya untuk melompat sejauh mungkin melintasi rintangan awan, pelangi, dan petir! 

🎮 **[MAIN SEKARANG DI SINI!](https://erman4u.github.io/PerjalananBombardilo/)** 🎮

---

## 🌟 Fitur Utama

- **Responsive Design**: Bisa dimainkan di Komputer (Desktop), Laptop, maupun di HP (Mobile) dengan lancar. Layar akan otomatis menyesuaikan ukuran kanvas.
- **Difficulty Levels**: Tersedia tingkat kesulitan **Easy, Normal, dan Hard** yang mempengaruhi kecepatan *scroll*, tarikan gravitasi, dan frekuensi rintangan.
- **Evolution System**: Karakter Bombardilo (buaya) akan berevolusi (berganti wujud/gambar) menjadi semakin keren setiap berhasil melewati **200 poin**.
- **Dynamic Scoring & Backgrounds**: Latar belakang permainan akan berganti secara otomatis setiap **200 poin**. Mulai dari pagi, sore, hingga malam hari dengan transisi mulus (*seamless looping*).
- **Dynamic Difficulty**: Semakin jauh perjalanan Bombardilo (setiap melewati kelipatan 200 poin), jarak kemunculan rintangan (*spawn rate*) akan menjadi semakin padat dan menantang!
- **Variasi Rintangan Khusus**:
  - ☁️ **Awan Normal**: Rintangan standar yang muncul sepanjang permainan.
  - ⚡ **Petir**: Rintangan tinggi yang hanya muncul di area-area spesifik (Background 2 & 4). 
  - 🌈 **Pelangi**: Rintangan cantik namun mematikan yang dibatasi oleh dua awan penyangga di bawahnya.
- **Batas Fisik (Barier)**: Menabrak atap (langit) atau dasar layar (lantai) tidak akan membuat Game Over. Namun, berhati-hatilah karena rintangan sengaja di-setting untuk lebih banyak menyergap bagian tepi (atas dan bawah) layar dibanding di tengah!
- **Kondisi Menang (Win State)**: Bertahanlah hingga mencapai **1000 Poin** untuk memenangkan permainan dan membuka layar kemenangan (*Victory Screen*)! 🏆
- **Music & Sound**: Dilengkapi dengan background music yang asyik. Tekan ikon 🔊 (pojok kanan atas) untuk me-_mute_ atau menyalakan suara. Audio juga otomatis terjeda (pause) jika Anda berpindah _tab_ browser.

---

## 🕹️ Cara Bermain

### Di Komputer / Laptop
- **Spasi / Klik Kiri**: Tekan tombol `SPASI` di keyboard atau klik kiri pada *mouse/trackpad* untuk melompat.
- Tahan ritme lompatan agar Bombardilo tidak menabrak rintangan!

### Di HP / Tablet
- **Tap Layar**: Ketuk layar di bagian manapun untuk melompat. Tersedia juga opsi *overlay* tombol Mute dan tingkat kesulitan yang ramah navigasi sentuhan (*Touch-friendly*).

---

## 🛠️ Teknologi yang Digunakan
Mini game ini sepenuhnya dikembangkan menggunakan teknologi web standar tanpa *framework* eksternal tambahan:
- **HTML5 Canvas**: Digunakan untuk me-render grafik 2D performa tinggi.
- **CSS3**: Untuk *styling* dan membuat tampilan *UI overlay* (judul, skor, menu).
- **Vanilla JavaScript**: Untuk kalkulasi *hitbox* (Collision Detection), gravitasi, *sprite manipulation*, responsivitas, dan _game loop_ seutuhnya.

---

## 🚀 Menjalankan Game Secara Lokal (Development)
Ingin memodifikasi game ini di komputer Anda sendiri?
1. *Clone* repositori ini menggunakan Git:
   ```bash
   git clone https://github.com/Erman4u/PerjalananBombardilo.git
   ```
   Atau Anda juga bisa mendownloadnya dalam bentuk ZIP dan mengekstraknya.
2. Buka folder/direktori proyek hasil ekstrak/clone.
3. Buka file `index.html` menggunakan web browser pilihan Anda (Chrome, Firefox, Edge, Safari, dll). *Tidak memerlukan instalasi server atau NodeJS.*

---

## 🤝 Kontribusi
Bebas melakukan *fork* repositori ini jika Anda ingin menambahkan karakter baru, efek rintangan lain, fitur *highscore board* menggunakan *Local Storage*, atau mengembangkan tata grafis menjadi lebih menarik!

> *"Follow IG: [@reman_entahlah](https://instagram.com/reman_entahlah) untuk update atau tanya jawab seputar game ini!"*
