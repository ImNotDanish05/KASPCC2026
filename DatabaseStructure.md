### 1. Master Data

**Tabel `jabatans**`

* `id` (Primary Key)
* `nama_jabatan` (String) -> *Contoh: "Divisi Humas", "Departemen IT"*
* `kategori` (Enum: `DIVISI`, `DEPARTEMEN`, `INTI`)

**Tabel `anggotas**`

* `id` (Primary Key)
* `nim` (String, Unique)
* `nama` (String)
* `no_telepon` (String)
* `jabatan_id` (Foreign Key ke `jabatans.id`)

### 2. Autentikasi & Manajemen Akses (REVISI M2M)

**Tabel `users**`

* `id` (Primary Key)
* `anggota_id` (Foreign Key ke `anggotas.id`, Unique)
* `username` (String, Unique)
* `password` (String, Hashed)
*(Kolom `role` dihapus dari sini)*

**Tabel `roles**`
Menyimpan daftar hak akses yang tersedia di aplikasi.

* `id` (Primary Key)
* `name` (String) -> *Isinya misal: "Bendahara Internal", "Bendahara Eksternal", "Superadmin"*

**Tabel `model_has_roles` (Pivot Table / M2M)**
Menghubungkan *user* dengan *role* mereka.

* `user_id` (Foreign Key ke `users.id`)
* `role_id` (Foreign Key ke `roles.id`)
*(Bisa ditambah *composite primary key* dari kedua kolom ini biar nggak ada duplikat data).*

### 3. Transaksi KAS (Tetap Sama)

**Tabel `pemasukan_kas` (Header Setoran)**

* `id` (Primary Key)
* `user_id` (Foreign Key ke `users.id`)
* `nominal_total` (Integer)
* `bukti_transfer` (String)
* `status` (Enum: `PENDING`, `VERIFIED`, `REJECTED`)
* `alasan_tolak` (Text, Nullable)
* `created_at` (Timestamp)

**Tabel `detail_pemasukan_kas` (Isi Setoran / Yang Dicetak Lunas)**

* `id` (Primary Key)
* `pemasukan_kas_id` (Foreign Key ke `pemasukan_kas.id`)
* `anggota_id` (Foreign Key ke `anggotas.id`)
* `nominal_bayar` (Integer)

**Tabel `pengeluaran_kas` (Tarik Dana)**

* `id` (Primary Key)
* `user_id` (Foreign Key ke `users.id`)
* `nominal` (Integer)
* `keterangan` (Text)
* `bukti_nota` (String) -> *Nota asli, foto barang, atau kuitansi tulis tangan.*
* `status` (Enum: `PENDING`, `APPROVED`, `REJECTED`)
* `alasan_tolak` (Text, Nullable)
* `created_at` (Timestamp)
