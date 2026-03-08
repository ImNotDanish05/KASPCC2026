### 🔑 1. Authentication

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `POST` | `/api/login` | Login user (username & password). |
| `POST` | `/api/logout` | Menghapus session/token. |
| `GET` | `/api/me` | Mengambil data profil dan role user yang login. |

### 👥 2. Master Data (Untuk Dropdown BE)

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `GET` | `/api/anggotas` | List semua anggota untuk checklist bayar KAS. |
| `GET` | `/api/jabatans` | List divisi/departemen (untuk filter). |

### 💰 3. Pemasukan KAS (Role: Bendahara Eksternal & Internal)

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `POST` | `/api/kas/setor` | BE mengirim setoran (Total nominal, foto bukti, & list ID anggota). |
| `GET` | `/api/kas/history` | Melihat riwayat setoran (Filter status: pending/verified/rejected). |
| `PUT` | `/api/kas/verify/{id}` | **(BI Only)** Verifikasi setoran atau menolak dengan alasan. |
| `PUT` | `/api/kas/resubmit/{id}` | **(BE Only)** Mengirim ulang data yang sempat ditolak. |

### 💸 4. Pengeluaran KAS (Role: Bendahara Eksternal & Internal)

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `POST` | `/api/tarik-dana` | BE mengajukan dana (Nominal, alasan, foto bukti wajib). |
| `GET` | `/api/tarik-dana/history` | Melihat riwayat pengajuan tarik dana. |
| `PUT` | `/api/tarik-dana/approve/{id}` | **(BI Only)** Menyetujui atau menolak penarikan uang. |

### 📊 5. Dashboard (Role: All Admin)

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `GET` | `/api/dashboard/stats` | Mengambil total saldo, jumlah yang nunggak, dan grafik kas. |
| `GET` | `/api/dashboard/nunggak` | List anggota yang statusnya belum lunas bulan ini. |

---

### 💡 Tips untuk Long-term:

* **Documentation:** Karena ini untuk organisasi, pastikan kalian tulis `README.md` yang lengkap di GitHub/GitLab kalian. Jadi kalau nanti kalian demisioner (lulus/pensiun), adik tingkat yang nerusin kodingannya nggak bakal pusing.
* **Soft Delete:** Untuk data penting seperti `anggotas` atau `pemasukan_kas`, pertimbangkan pakai fitur *Soft Delete* agar datanya tidak benar-benar hilang dari *database* kalau tidak sengaja terhapus.
