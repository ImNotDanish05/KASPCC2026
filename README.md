# KAS PCC 2026
Glad you are here — this README walks you through setup, features, and deployment for the KAS PCC 2026 dashboard.

## Project Overview & Features
KAS PCC 2026 is a treasury and financial management system designed for transparent cash flow tracking and role-based workflows. It supports operational roles while providing a modern dashboard experience built on the TailAdmin UI system.

Core features:
- Role-based access control for Superadmin, Bendahara Internal, and Bendahara Eksternal
- KAS transaksi masuk dan keluar dengan alur verifikasi dan persetujuan
- Dashboard ringkasan keuangan dan histori transaksi
- Upload bukti transfer dan nota pengeluaran
- Dark mode and light mode UI

## Local Setup Guide (Windows & Linux)
Follow these steps to run the project locally.

1. Clone the repository and install dependencies.
```bash
git clone https://github.com/ImNotDanish05/KASPCC2026.git
cd kaspcc2026
npm install
```

2. Create a `.env` file and configure environment variables.
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kaspcc2026?schema=public"
AUTH_SECRET="your-strong-random-secret"
```

3. Generate Prisma client and push schema to the database.
```bash
npx prisma generate
npx prisma db push
```

4. Linux only: create and grant permissions for the upload directory.
```bash
mkdir -p public/uploads
chmod 777 public/uploads
```

5. Run the development server.
```bash
npm run dev
```

## Deployment Guide (Vercel & Supabase)
This project is optimized for a serverless hosting setup with a managed PostgreSQL database.

### Supabase (Database)
1. Create a new Supabase project.
2. Go to Database Settings and copy the PostgreSQL connection string.
3. Prisma requires the Transaction pooler connection string for serverless deployments.
4. Use the pooler URL (usually port 6543) as `DATABASE_URL` in production.

### Vercel (Hosting)
1. Import your GitHub repository into Vercel.
2. Set environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
3. Deploy the project.

Important note: `public/uploads` is local storage and will not persist on Vercel. For production uploads, integrate an external storage provider such as Amazon S3 or Supabase Storage.

## Credits / Authors
Developed By

This web application was proudly built by:
- AbimanyuGilar - https://github.com/AbimanyuGilar
- ImNotDanish05 - https://github.com/ImNotDanish05
