# Form Studio — JSON Schema Form Builder

Buat pratinjau formulir dari subset JSON Schema, periksa isian dan unduh hasil JSON. Dibuat untuk pembelajaran dan prototipe lokal, tanpa dependensi runtime.

```console
python server.py --port 8769
```

Buka `http://127.0.0.1:8769/`. Tulis schema di editor, pilih **Buat pratinjau**, isi field dan pilih **Periksa isian** atau **Ekspor JSON**. Tab dan Shift+Tab menavigasi kontrol; label terhubung ke input dan pesan status diumumkan untuk pembaca layar. Contoh awal tersedia melalui tombol **Contoh awal**. Gunakan data sintetis.

Format yang didukung: root `type: object`, `properties`, opsional `title` dan `required`. Field bertipe `string` atau `number`, opsional `title`; pilihan menggunakan `enum` pada string. Maksimal 20 field dan 30 pilihan per enum. Nama field hanya huruf ASCII di awal, diikuti huruf, angka atau underscore, maksimal 64 karakter. Kata kunci lain, tipe nested/array, `$ref`, dan properti tambahan ditolak; ini bukan implementasi penuh JSON Schema. Nilai string maksimal 1000 karakter; nilai number harus finite.

Pratinjau dan ekspor melakukan validasi di browser. `server.py` juga menyediakan contoh validasi terpisah `POST /validate` dengan body `{"schema": {...}, "values": {...}}`, respons JSON `valid` dan `errors`. Contoh server hanya bind `127.0.0.1`, tidak menyimpan data, tidak ada autentikasi/TLS/rate limiting, dan bukan server produksi. Contoh browser tidak otomatis mengirim data ke endpoint tersebut. Validasi browser tidak dapat menggantikan validasi server pada aplikasi nyata.

```console
node --test tests/schema.test.cjs
python -m unittest -v
```

Tes Node 20+ mencakup schema/validasi client; tes Python 3.10+ mencakup contoh validasi server. Ekspor membuat unduhan browser; penanganan nama file bergantung pada browser. Jangan memasukkan data pribadi pada schema atau contoh publik.

Owner/maintainer: Muhammad Zidane Naufal Azzam (ZidaneNaufal1). Kode, tes dan dokumentasi dibuat dengan bantuan Ciel/OpenAI Codex. Belum ada klaim adopsi eksternal, audit aksesibilitas independen atau pemahaman manual yang telah diverifikasi. MIT.

## English summary

Local JSON Schema subset form preview with text, number, enum and required fields, client-side validation and JSON export. A separate localhost Python endpoint demonstrates server-side validation. Not a full JSON Schema implementation or production server.
