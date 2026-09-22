import json
from datetime import datetime

# Base data from PCC
roles = [
    (1, 'Bendahara Inti'),
    (2, 'Bendahara DivisiDept'),
    (3, 'Superadmin'),
]

jabatans = [
    (1, 'PH', 'INTI'),
    (2, 'Litbang', 'INTI'),
    (3, 'Divisi Humas', 'DIVISI'),
    (4, 'Divisi HRD', 'DIVISI'),
    (5, 'Divisi KRT', 'DIVISI'),
    (6, 'Divisi Redaksi', 'DIVISI'),
    (7, 'Divisi Workshop', 'DIVISI'),
    (8, 'Dept. Danus', 'DEPARTEMEN'),
    (9, 'Dept. Maintenance', 'DEPARTEMEN'),
    (10, 'Dept. Network', 'DEPARTEMEN'),
    (11, 'Dept. Software', 'DEPARTEMEN'),
    (12, 'Dept. Multimedia', 'DEPARTEMEN'),
]

jabatan_name_to_id = {j[1]: j[0] for j in jabatans}

anggotas_raw = [
    ("Abimanyu Gilar Waluyo", "080000000001", "Dept. Software", "0.00.00.0.01"),
    ("Agies Mauranzah", "080000000002", "PH", "0.00.00.0.02"),
    ("Agung Hadi Astanto", "080000000003", "Litbang", "0.00.00.0.03"),
    ("Aisy Tsabita Amru", "080000000004", "Divisi HRD", "0.00.00.0.04"),
    ("Akbar Hakim Muzaky", "080000000005", "Divisi HRD", "0.00.00.0.05"),
    ("Alfin Rozzaq Nirwana", "080000000006", "Dept. Software", "0.00.00.0.06"),
    ("Aliyya Nufaisah Budiyanto", "080000000007", "Dept. Danus", "0.00.00.0.07"),
    ("Annisa Naelil Izati", "080000000008", "Divisi Redaksi", "0.00.00.0.08"),
    ("Atha Renata", "080000000009", "Dept. Software", "0.00.00.0.09"),
    ("Atsiila Arya Nabiih", "080000000010", "Divisi Workshop", "0.00.00.0.10"),
    ("Azzaki Nauval Putra", "080000000011", "Dept. Network", "0.00.00.0.11"),
    ("Bagus Sadewa", "080000000012", "Divisi KRT", "0.00.00.0.12"),
    ("Benayya Nohan Admiraldo", "080000000013", "Dept. Maintenance", "0.00.00.0.13"),
    ("Cantika Alifia Maharani", "080000000014", "Divisi HRD", "0.00.00.0.14"),
    ("Danicha Husna", "080000000015", "Divisi HRD", "0.00.00.0.15"),
    ("Danish Mahdi", "080000000016", "Divisi Workshop", "0.00.00.0.16"),
    ("Danu Alamsyah Putra", "080000000017", "Divisi Workshop", "0.00.00.0.17"),
    ("Davin Alifianda Adytia", "080000000018", "PH", "0.00.00.0.18"),
    ("Diah Dwi Astuti", "080000000019", "Dept. Multimedia", "0.00.00.0.19"),
    ("Dwy Noor Fatimah", "080000000020", "Dept. Danus", "0.00.00.0.20"),
    ("Elvira Eka Nurhayati", "080000000021", "Divisi KRT", "0.00.00.0.21"),
    ("Farrel Sheva Basudewa", "080000000022", "Divisi Redaksi", "0.00.00.0.22"),
    ("Feby Yuanggi Putri", "080000000023", "Divisi Redaksi", "0.00.00.0.23"),
    ("Frea Aline Aurellia", "080000000024", "PH", "0.00.00.0.24"),
    ("Ghufron Ainun Najib", "080000000025", "Dept. Maintenance", "0.00.00.0.25"),
    ("Gilang Maulanata Pramudya", "080000000026", "Litbang", "0.00.00.0.26"),
    ("Hafizh Iman Wicaksono", "080000000027", "Dept. Danus", "0.00.00.0.27"),
    ("Haikal Utomo Putra", "080000000028", "Dept. Danus", "0.00.00.0.28"),
    ("Hany Diah Ramadhani", "080000000029", "Litbang", "0.00.00.0.29"),
    ("Ika Fuji Astuti", "080000000030", "Divisi Workshop", "0.00.00.0.30"),
    ("Ilham Vallian Wardoyo Putra", "080000000031", "Litbang", "0.00.00.0.31"),
    ("Inas Salsabila Firdaus", "080000000032", "PH", "0.00.00.0.32"),
    ("Irine Luthfia Dani", "080000000033", "Dept. Multimedia", "0.00.00.0.33"),
    ("Johar Awal Khoiroti Widyadarma", "080000000034", "Dept. Network", "0.00.00.0.34"),
    ("Jonathan Ordrick Edra Wijaya", "080000000035", "Divisi Humas", "0.00.00.0.35"),
    ("Khilda Salsabila Azka", "080000000036", "Litbang", "0.00.00.0.36"),
    ("Lucky Laurenshia S.", "080000000037", "Dept. Maintenance", "0.00.00.0.37"),
    ("Miftachussurur", "080000000038", "Litbang", "0.00.00.0.38"),
    ("Muhamad Haydar Aydin Alhamdani", "080000000039", "PH", "0.00.00.0.39"),
    ("Muhamad Irfan Ramadhan", "080000000040", "Dept. Multimedia", "0.00.00.0.40"),
    ("Muhammad Ihsan Naufal", "080000000041", "Dept. Maintenance", "0.00.00.0.41"),
    ("Muhammad Ilham Rijal Thaariq", "080000000042", "Divisi KRT", "0.00.00.0.42"),
    ("Muhammad Januar Rifqi Nanda", "080000000043", "Dept. Maintenance", "0.00.00.0.43"),
    ("Nabila Az Zahra Munir", "080000000044", "Divisi Humas", "0.00.00.0.44"),
    ("Nabila Proletariati Azzura", "080000000045", "PH", "0.00.00.0.45"),
    ("Naila Dwista Rastiwi", "080000000046", "Divisi Redaksi", "0.00.00.0.46"),
    ("Nisrina Izdihar", "080000000047", "Litbang", "0.00.00.0.47"),
    ("Paulus Ale Kristiawan", "080000000048", "Divisi KRT", "0.00.00.0.48"),
    ("Putri Levina Agatha", "080000000049", "Dept. Multimedia", "0.00.00.0.49"),
    ("Rafif Ali Fahrezi", "080000000050", "Divisi HRD", "0.00.00.0.50"),
    ("Rahmalyana Ayuningtyas", "080000000051", "Divisi Workshop", "0.00.00.0.51"),
    ("Rahmatul Laila Nuur Arifah", "080000000052", "Dept. Multimedia", "0.00.00.0.52"),
    ("Rajaba Hamim Maududi", "080000000053", "Divisi Humas", "0.00.00.0.53"),
    ("Rameyza Proletariati", "080000000054", "PH", "0.00.00.0.54"),
    ("Ravinka Risdiani Putri", "080000000055", "Divisi HRD", "0.00.00.0.55"),
    ("Renaldi Sahril Hidayat", "080000000056", "Divisi HRD", "0.00.00.0.56"),
    ("Reza Maulana Fatih", "080000000057", "Divisi Redaksi", "0.00.00.0.57"),
    ("Risma Nur Aini", "080000000058", "PH", "0.00.00.0.58"),
    ("Riztika Merista Indriani", "080000000059", "Divisi KRT", "0.00.00.0.59"),
    ("Sabila Anastasia", "080000000060", "Dept. Danus", "0.00.00.0.60"),
    ("Salsabila Rizqi Nurbarokah", "080000000061", "Divisi Humas", "0.00.00.0.61"),
    ("Sausan Fadiya Rizqiya", "080000000062", "Dept. Software", "0.00.00.0.62"),
    ("Shintia Ratna Dewi", "080000000063", "Divisi Humas", "0.00.00.0.63"),
    ("Siti Miftahus Sa'diyah", "080000000064", "Dept. Network", "0.00.00.0.64"),
    ("Suci Wulandari", "080000000065", "Divisi Redaksi", "0.00.00.0.65"),
    ("Ummi Imaroh", "080000000066", "Dept. Network", "0.00.00.0.66"),
    ("Wahyu Prasetyo Wibowo", "080000000067", "Dept. Software", "0.00.00.0.67"),
    ("Warseno Bambang Setyono", "080000000068", "Divisi Workshop", "0.00.00.0.68"),
    ("Wisdom Wahyu Aji", "080000000069", "Dept. Network", "0.00.00.0.69"),
    ("Zalfa Az Zahra", "080000000070", "Dept. Danus", "0.00.00.0.70"),
]

# anggota_id maps 1 to 70
nim_to_anggota_id = {}
jabatan_to_anggota_ids = {j[0]: [] for j in jabatans}

for idx, (nama, no_telp, jab_name, nim) in enumerate(anggotas_raw, start=1):
    nim_to_anggota_id[nim] = idx
    j_id = jabatan_name_to_id[jab_name]
    jabatan_to_anggota_ids[j_id].append(idx)

# Hashed password for "password" (bcrypt rounds=10)
PASSWORD_HASH = "$2b$10$FyomZqO3lkHtpSVtbsXeYuv5s0eXhA539bcc0X5a3LsuAo1j6Ckoy"

users_config = [
    # id, username, nim, role_id, jabatan_id
    (1, "superadmin", "0.00.00.0.16", 3, 7), # Danish Mahdi (Workshop)
    (2, "davin.alifianda", "0.00.00.0.18", 1, 1), # PH (Bendahara Inti)
    (3, "nabila.proletariati", "0.00.00.0.45", 1, 1), # PH (Bendahara Inti)
    (4, "agung.hadi", "0.00.00.0.03", 2, 2), # Litbang
    (5, "rameyza.proletariati", "0.00.00.0.54", 2, 1), # PH
    (6, "nabila.munir", "0.00.00.0.44", 2, 3), # Humas
    (7, "danicha.husna", "0.00.00.0.15", 2, 4), # HRD
    (8, "ilham.rijal", "0.00.00.0.42", 2, 5), # KRT
    (9, "hafizh.iman", "0.00.00.0.27", 2, 8), # Danus
    (10, "ihsan.naufal", "0.00.00.0.41", 2, 9), # Maintenance
    (11, "feby.yuanggi", "0.00.00.0.23", 2, 6), # Redaksi
    (12, "warseno.bambang", "0.00.00.0.68", 2, 7), # Workshop
    (13, "ummi.imaroh", "0.00.00.0.66", 2, 10), # Network
    (14, "abimanyu.gilar", "0.00.00.0.01", 2, 11), # Software
    (15, "irine.luthfia", "0.00.00.0.33", 2, 12), # Multimedia
]

bendahara_ext_users = users_config[3:] # users 4..15

# Distribution of 32 Pemasukan across 6 months (day offsets from CURRENT_DATE):
# Month -5: ~155 to ~125 days ago
# Month -4: ~124 to ~95 days ago
# Month -3: ~94 to ~65 days ago
# Month -2: ~64 to ~35 days ago
# Month -1: ~34 to ~10 days ago
# Month 0: ~9 to ~1 days ago

pemasukan_plan = [
    # (day_offset, user_id, jabatan_id, status, alasan_tolak, nominal_per_member_list)
    # --- Month -5 (~5 months ago) ---
    (152, 4, 2, 'VERIFIED', None, [20000, 20000, 20000]), # 60,000
    (148, 6, 3, 'VERIFIED', None, [20000, 20000, 20000, 20000]), # 80,000
    (142, 7, 4, 'VERIFIED', None, [20000, 20000, 30000, 20000]), # 90,000
    (135, 9, 8, 'VERIFIED', None, [30000, 30000, 20000]), # 80,000
    (128, 14, 11, 'VERIFIED', None, [30000, 30000, 30000]), # 90,000

    # --- Month -4 (~4 months ago) ---
    (122, 10, 9, 'VERIFIED', None, [20000, 20000, 30000, 20000]), # 90,000
    (116, 11, 6, 'VERIFIED', None, [30000, 30000, 20000, 20000]), # 100,000
    (110, 12, 7, 'VERIFIED', None, [20000, 20000, 20000, 30000]), # 90,000
    (103, 13, 10, 'VERIFIED', None, [30000, 30000, 30000]), # 90,000
    (96, 15, 12, 'VERIFIED', None, [20000, 30000, 30000, 20000]), # 100,000

    # --- Month -3 (~3 months ago) ---
    (91, 5, 1, 'VERIFIED', None, [30000, 30000, 30000, 30000]), # 120,000
    (84, 8, 5, 'VERIFIED', None, [20000, 30000, 20000, 30000]), # 100,000
    (78, 6, 3, 'VERIFIED', None, [30000, 30000, 30000]), # 90,000
    (72, 7, 4, 'VERIFIED', None, [30000, 20000, 30000, 30000]), # 110,000
    (66, 14, 11, 'VERIFIED', None, [30000, 40000, 30000]), # 100,000

    # --- Month -2 (~2 months ago) ---
    (61, 4, 2, 'VERIFIED', None, [30000, 30000, 40000]), # 100,000
    (55, 9, 8, 'VERIFIED', None, [30000, 30000, 30000, 30000]), # 120,000
    (49, 10, 9, 'VERIFIED', None, [30000, 30000, 20000, 30000]), # 110,000
    (44, 11, 6, 'VERIFIED', None, [30000, 30000, 30000, 20000]), # 110,000
    (39, 12, 7, 'VERIFIED', None, [30000, 40000, 30000]), # 100,000
    (36, 13, 10, 'VERIFIED', None, [30000, 30000, 30000, 30000]), # 120,000

    # --- Month -1 (~1 month ago) ---
    (31, 15, 12, 'VERIFIED', None, [30000, 30000, 40000, 30000]), # 130,000
    (26, 5, 1, 'VERIFIED', None, [40000, 30000, 30000]), # 100,000
    (21, 8, 5, 'VERIFIED', None, [30000, 30000, 30000, 30000]), # 120,000
    (17, 6, 3, 'VERIFIED', None, [30000, 30000, 30000, 40000]), # 130,000
    (14, 7, 4, 'REJECTED', 'Nominal transfer tidak sesuai dengan rincian anggota', [20000, 20000]), # 40,000
    (12, 14, 11, 'VERIFIED', None, [30000, 40000, 30000, 40000]), # 140,000

    # --- Month 0 (Current Month) ---
    (8, 4, 2, 'VERIFIED', None, [40000, 30000, 30000]), # 100,000
    (6, 9, 8, 'VERIFIED', None, [30000, 40000, 30000]), # 100,000
    (4, 10, 9, 'PENDING', None, [30000, 30000, 30000]), # 90,000
    (2, 12, 7, 'PENDING', None, [40000, 30000, 30000]), # 100,000
    (1, 13, 10, 'PENDING', None, [30000, 30000, 40000]), # 100,000
]

# Distribution of 18 Pengeluaran across 6 months (3 per month):
pengeluaran_plan = [
    # (day_offset, user_id, nama_kegiatan, [(keterangan, nominal), ...])
    # Month -5
    (150, 2, "Beli ATK & Keperluan Administrasi PCC", [("Kertas HVS A4 & Folio", 110000), ("Tinta Printer Epson Hitam & Warna", 140000)]), # 250k
    (138, 2, "Snack & Konsumsi Rapat Koordinasi Awal", [("Snack Box Rapat Koordinasi (30 pax)", 180000), ("Air Mineral Gelas 2 Dus", 50000)]), # 230k
    (126, 3, "Pengadaan Kabel Jaringan Dept. Network", [("Kabel UTP Cat6 1 Roll (50m)", 150000), ("Konektor RJ45 & Tang Crimping", 75000)]), # 225k

    # Month -4
    (118, 2, "Cetak Banner & Poster Open Recruitment", [("Cetak Spanduk Oprec 3x1m", 75000), ("Cetak Poster A3 Oprec (20 lbr)", 60000)]), # 135k
    (107, 3, "Biaya Sewa Cloud Server & Domain PCC", [("Perpanjangan Domain pcc.or.id", 175000), ("Cloud VPS Hosting 3 Bulan", 250000)]), # 425k
    (98, 2, "Konsumsi Rapat Evaluasi Proker Divisi", [("Konsumsi Makanan Ringan Rapat Pleno", 120000), ("Minuman Kopi & Teh", 45000)]), # 165k

    # Month -3
    (88, 2, "Pengadaan Logistik & Kebersihan Sekretariat", [("Tempat Sampah & Sapu Pel", 65000), ("Cairan Pembersih & Pewangi Ruangan", 55000)]), # 120k
    (76, 3, "Maintenance & Upgrade PC Lab Software", [("Thermal Paste Arctic MX-4 (2 pcs)", 90000), ("Obeng Set Presisi & Kuas Pembersih", 60000)]), # 150k
    (68, 2, "Konsumsi Rapat Kerja Tengah Periode", [("Konsumsi Nasi Kotak Raker (25 pax)", 375000), ("Air Mineral Botol 1 Dus", 45000)]), # 420k

    # Month -2
    (58, 2, "Produksi Merchandise Stiker & Totebag Danus", [("Cetak Stiker Die-Cut Vinyl (100 pcs)", 120000), ("Sablon Totebag Canvas (25 pcs)", 250000)]), # 370k
    (47, 3, "Pembelian Komponen Elektronika Workshop", [("Arduino Uno R3 & Sensor Kit", 185000), ("Breadboard & Jumper Wire 1 Set", 65000)]), # 250k
    (38, 2, "Snack & Minum Sharing Session Alumni", [("Kue Basah & Snack Box (20 pax)", 140000), ("Kopi & Gula Rapat", 35000)]), # 175k

    # Month -1
    (28, 2, "Transportasi & Akomodasi Delegasi Lomba", [("Bantuan BBM Mobil Operasional Lomba", 150000), ("Konsumsi Tim Delegasi (4 org)", 120000)]), # 270k
    (19, 3, "Pembelian Perangkat Lighting & Audio Multimedia", [("Ring Light 26cm & Mini Tripod", 115000), ("Clip-on Wireless Mic", 175000)]), # 290k
    (13, 2, "Beli Tinta Stempel & Kebutuhan Kearsipan KRT", [("Tinta Flash Stempel & Bantalan", 45000), ("Map Snelhecter & Ordner Dokumen", 70000)]), # 115k

    # Month 0
    (8, 2, "Konsumsi Rapat Rutin Bulanan Anggota", [("Snack Box & Air Minum Gelas", 160000)]), # 160k
    (4, 3, "Service Printer Sekretariat & Refill Toner", [("Biaya Service Pembersihan Head Printer", 85000), ("Refill Toner Laserjet", 110000)]), # 195k
    (2, 2, "Pengadaan Stopkontak & Kabel Roll Lab", [("Stopkontak 5 Lubang Uticon 2 pcs", 90000), ("Kabel Roll 10 meter", 75000)]), # 165k
]

def generate_sql():
    sql = []
    sql.append("-- ===========================================================================")
    sql.append("-- DUMMY SEEDER UNTUK KAS PCC 2026 (SUPABASE POSTGRESQL)")
    sql.append("-- Total 50 Transaksi (32 Pemasukan + 18 Pengeluaran)")
    sql.append("-- Terdistribusi dinamis selama 6 bulan terakhir (CURRENT_DATE - INTERVAL)")
    sql.append("-- Cocok untuk mengetes grafik bar chart dashboard, statistik saldo, & badge pending")
    sql.append("-- ===========================================================================\n")

    # 1. ROLES
    sql.append("-- 1. ROLES")
    for r_id, r_name in roles:
        sql.append(f"INSERT INTO roles (id, name) VALUES ({r_id}, '{r_name}') ON CONFLICT (name) DO NOTHING;")
    sql.append("")

    # 2. JABATANS
    sql.append("-- 2. JABATANS")
    for j_id, j_name, j_kat in jabatans:
        sql.append(f"INSERT INTO jabatans (id, nama_jabatan, kategori) VALUES ({j_id}, '{j_name}', '{j_kat}'::\"JabatanKategori\") ON CONFLICT (id) DO NOTHING;")
    sql.append("")

    # 3. PENGATURAN
    sql.append("-- 3. PENGATURAN")
    sql.append("INSERT INTO pengaturan (id, target_kas_per_bulan, tanggal_mulai, tanggal_akhir)")
    sql.append("VALUES (1, 10000, '2026-03-01 00:00:00', '2027-03-01 00:00:00')")
    sql.append("ON CONFLICT (id) DO UPDATE SET target_kas_per_bulan = EXCLUDED.target_kas_per_bulan;\n")

    # 4. ANGGOTAS
    sql.append("-- 4. ANGGOTAS (70 Anggota Asli PCC)")
    for idx, (nama, no_telp, jab_name, nim) in enumerate(anggotas_raw, start=1):
        j_id = jabatan_name_to_id[jab_name]
        nama_escaped = nama.replace("'", "''")
        sql.append(f"INSERT INTO anggotas (id, nim, nama, tabungan, lunas_sampai, no_telepon, jabatan_id, status_aktif) "
                   f"VALUES ({idx}, '{nim}', '{nama_escaped}', 0, '2026-03-01 00:00:00', '{no_telp}', {j_id}, true) "
                   f"ON CONFLICT (nim) DO NOTHING;")
    sql.append("")

    # 5. USERS
    sql.append("-- 5. USERS (Default Password: 'password')")
    for u_id, username, nim, role_id, jab_id in users_config:
        ang_id = nim_to_anggota_id[nim]
        sql.append(f"INSERT INTO users (id, anggota_id, username, password) "
                   f"VALUES ({u_id}, {ang_id}, '{username}', '{PASSWORD_HASH}') "
                   f"ON CONFLICT (username) DO NOTHING;")
    sql.append("")

    # 6. MODEL_HAS_ROLES
    sql.append("-- 6. MODEL HAS ROLES")
    for u_id, username, nim, role_id, jab_id in users_config:
        sql.append(f"INSERT INTO model_has_roles (user_id, role_id) VALUES ({u_id}, {role_id}) ON CONFLICT DO NOTHING;")
    sql.append("")

    # 7. PEMASUKAN KAS & DETAIL PEMASUKAN KAS (32 Transaksi)
    sql.append("-- 7. PEMASUKAN KAS (32 Transaksi terbagi rata 6 bulan)")
    detail_pemasukan_id = 1
    for p_id, (days_ago, u_id, j_id, status, alasan, member_nominals) in enumerate(pemasukan_plan, start=1):
        nominal_total = sum(member_nominals)
        alasan_val = f"'{alasan}'" if alasan else "NULL"
        bukti_url = f"https://picsum.photos/seed/kas_pemasukan_{p_id}/600/400"
        
        sql.append(f"INSERT INTO pemasukan_kas (id, user_id, jabatan_id, nominal_total, bukti_transfer, status, alasan_tolak, created_at) "
                   f"VALUES ({p_id}, {u_id}, {j_id}, {nominal_total}, '{bukti_url}', '{status}'::\"PemasukanStatus\", {alasan_val}, CURRENT_DATE - INTERVAL '{days_ago} days') "
                   f"ON CONFLICT (id) DO UPDATE SET nominal_total = EXCLUDED.nominal_total, status = EXCLUDED.status, created_at = EXCLUDED.created_at;")
        
        # assign to members of this jabatan
        possible_members = jabatan_to_anggota_ids[j_id]
        for m_idx, nominal_bayar in enumerate(member_nominals):
            member_id = possible_members[m_idx % len(possible_members)]
            sql.append(f"INSERT INTO detail_pemasukan_kas (id, pemasukan_kas_id, anggota_id, nominal_bayar, link_bukti) "
                       f"VALUES ({detail_pemasukan_id}, {p_id}, {member_id}, {nominal_bayar}, '{bukti_url}') "
                       f"ON CONFLICT (id) DO UPDATE SET nominal_bayar = EXCLUDED.nominal_bayar;")
            detail_pemasukan_id += 1
    sql.append("")

    # 8. PENGELUARAN KAS & DETAILS & BUKTIS (18 Transaksi)
    sql.append("-- 8. PENGELUARAN KAS (18 Transaksi terbagi rata 6 bulan)")
    detail_pengeluaran_id = 1
    bukti_nota_id = 1
    for peng_id, (days_ago, u_id, nama_kegiatan, details_list) in enumerate(pengeluaran_plan, start=1):
        total_nominal = sum(d[1] for d in details_list)
        nama_escaped = nama_kegiatan.replace("'", "''")
        nota_url = f"https://picsum.photos/seed/kas_pengeluaran_{peng_id}/600/400"

        sql.append(f"INSERT INTO pengeluaran_kas (id, user_id, nama_kegiatan, total_nominal, created_at) "
                   f"VALUES ({peng_id}, {u_id}, '{nama_escaped}', {total_nominal}, CURRENT_DATE - INTERVAL '{days_ago} days') "
                   f"ON CONFLICT (id) DO UPDATE SET total_nominal = EXCLUDED.total_nominal, created_at = EXCLUDED.created_at;")
        
        for ket, nom in details_list:
            ket_escaped = ket.replace("'", "''")
            sql.append(f"INSERT INTO detail_pengeluaran_kas (id, pengeluaran_kas_id, keterangan, nominal) "
                       f"VALUES ({detail_pengeluaran_id}, {peng_id}, '{ket_escaped}', {nom}) "
                       f"ON CONFLICT (id) DO UPDATE SET nominal = EXCLUDED.nominal;")
            detail_pengeluaran_id += 1

        sql.append(f"INSERT INTO bukti_nota_pengeluaran (id, pengeluaran_kas_id, url_bukti) "
                   f"VALUES ({bukti_nota_id}, {peng_id}, '{nota_url}') "
                   f"ON CONFLICT (id) DO UPDATE SET url_bukti = EXCLUDED.url_bukti;")
        bukti_nota_id += 1
    sql.append("")

    # 9. RESTART SEQUENCES
    sql.append("-- 9. RESTART SEQUENCES (Biar kalau buat transaksi baru lewat UI tidak error ID collision)")
    sql.append("SELECT setval(pg_get_serial_sequence('roles', 'id'), coalesce(max(id), 1)) FROM roles;")
    sql.append("SELECT setval(pg_get_serial_sequence('jabatans', 'id'), coalesce(max(id), 1)) FROM jabatans;")
    sql.append("SELECT setval(pg_get_serial_sequence('anggotas', 'id'), coalesce(max(id), 1)) FROM anggotas;")
    sql.append("SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1)) FROM users;")
    sql.append("SELECT setval(pg_get_serial_sequence('pemasukan_kas', 'id'), coalesce(max(id), 1)) FROM pemasukan_kas;")
    sql.append("SELECT setval(pg_get_serial_sequence('detail_pemasukan_kas', 'id'), coalesce(max(id), 1)) FROM detail_pemasukan_kas;")
    sql.append("SELECT setval(pg_get_serial_sequence('pengeluaran_kas', 'id'), coalesce(max(id), 1)) FROM pengeluaran_kas;")
    sql.append("SELECT setval(pg_get_serial_sequence('detail_pengeluaran_kas', 'id'), coalesce(max(id), 1)) FROM detail_pengeluaran_kas;")
    sql.append("SELECT setval(pg_get_serial_sequence('bukti_nota_pengeluaran', 'id'), coalesce(max(id), 1)) FROM bukti_nota_pengeluaran;\n")

    # 10. STORAGE BUCKETS
    sql.append("-- 10. STORAGE BUCKETS (Jika tabel storage.buckets tersedia di Supabase)")
    sql.append("DO $$")
    sql.append("BEGIN")
    sql.append("  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN")
    sql.append("    INSERT INTO storage.buckets (id, name, public)")
    sql.append("    VALUES ('bukti_pemasukan_kas', 'bukti_pemasukan_kas', true), ('bukti_pengeluaran_kas', 'bukti_pengeluaran_kas', true)")
    sql.append("    ON CONFLICT (id) DO NOTHING;")
    sql.append("  END IF;")
    sql.append("END $$;\n")

    return "\n".join(sql)

if __name__ == "__main__":
    content = generate_sql()
    with open("supabase/seed.sql", "w", encoding="utf-8") as f:
        f.write(content)
    print("Berhasil membuat supabase/seed.sql!")

