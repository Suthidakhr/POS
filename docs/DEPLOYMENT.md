# Deployment Guide

> Shesha Cafe POS — Production Deployment
> Stack: React + Node.js/Express + PostgreSQL (Neon) hosted on Render

---

## Architecture Overview

```
Browser → Render Web Service (Express)
                ↓
         serves /dist (React build)
                ↓
         /api/* routes → Neon PostgreSQL
```

ทั้ง frontend และ backend รันบน Express process เดียวบน Render
Neon ให้บริการ PostgreSQL แบบ serverless ฟรีถาวร

---

## 1. Database — Neon PostgreSQL

**URL:** https://console.neon.tech

### สิ่งที่ต้องรู้
- Free tier: storage 0.5 GB (เพียงพอสำหรับ cafe POS)
- ไม่มีวันหมดอายุ ฟรีถาวร
- Region: ap-southeast-1 (Singapore)
- SSL required: ต้องมี `?sslmode=require` ต่อท้าย connection string เสมอ

### Connection String
```
postgresql://neondb_owner:<password>@<host>.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### Schema
Schema ถูกสร้างอัตโนมัติโดย `initDB()` ใน `server/db.js` ตอน server startup
ไม่มี migration files — ถ้าจะเพิ่ม column ให้เพิ่ม `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` ใน `initDB()`

### Default Seed Data
ตอน startup ครั้งแรก (ถ้า staff table ว่าง) จะ seed:
- **Manager account** — PIN: `1234`

> ⚠️ เปลี่ยน PIN ทันทีหลัง deploy ครั้งแรก

### วิธีดู/แก้ไขข้อมูลโดยตรง
1. ไปที่ [console.neon.tech](https://console.neon.tech)
2. เลือก project → แท็บ **SQL Editor**
3. รัน query ได้เลย เช่น:
```sql
SELECT * FROM staff;
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

---

## 2. Web Service — Render

**URL:** https://dashboard.render.com

### สิ่งที่ต้องรู้
- Free tier: ฟรีถาวร แต่ **sleep หลัง 15 นาทีไม่มีคนใช้**
- ครั้งแรกที่เปิดหลัง sleep จะช้าประมาณ 30 วินาที (cold start)
- Auto-deploy ทุกครั้งที่ push ไป branch `main`
- Region: Singapore

### Build & Start
| | Command |
|---|---|
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `node server/server.js` |

### Environment Variables (ตั้งใน Render Dashboard)

| Variable | ค่า | หมายเหตุ |
|---|---|---|
| `DATABASE_URL` | connection string จาก Neon | รวม `?sslmode=require` |
| `JWT_SECRET` | random hex string | generate ด้วย `openssl rand -hex 32` |
| `NODE_ENV` | `production` | ให้ Express serve static files |

---

## 3. การ Deploy ครั้งแรก (Initial Setup)

### ขั้นตอน Neon
1. สมัครที่ [neon.com](https://neon.com) → สร้าง Project ใหม่
2. เลือก Region: **ap-southeast-1 (Singapore)**
3. Copy **Connection String** (กด Show password ก่อน)
4. ใส่ใน `server/.env` (สำหรับ local dev)

### ขั้นตอน Render
1. สมัครที่ [render.com](https://render.com) → Sign up with GitHub
2. **New +** → **Web Service** → เชื่อม GitHub repo
3. ตั้งค่าตามนี้:

| Field | ค่า |
|---|---|
| Name | shesha-cafe-pos |
| Region | Singapore |
| Branch | main |
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `node server/server.js` |
| Instance Type | **Free** |

4. เพิ่ม Environment Variables ทั้ง 3 ตัว
5. กด **Deploy Web Service**

---

## 4. การ Deploy ครั้งถัดไป (Update)

ไม่ต้องทำอะไรใน Render เลยค่ะ แค่:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

Render จะ auto-deploy ให้อัตโนมัติภายใน 2-3 นาที

---

## 5. Troubleshooting

### Build failed: Cannot find module @types/react
**สาเหตุ:** npm ไม่ install devDependencies เพราะ NODE_ENV=production
**แก้:** ตรวจสอบ Build Command ว่าใช้ `npm install --include=dev`

### Server error: JWT_SECRET environment variable is required
**สาเหตุ:** ลืมตั้ง JWT_SECRET ใน Render
**แก้:** ไป Render Dashboard → Environment → เพิ่ม JWT_SECRET

### Login ไม่ได้ / staff ไม่มีในระบบ
**สาเหตุ:** DB ใหม่ มีแค่ Manager seed account
**แก้:** Login ด้วย Manager (PIN: 1234) → Settings → สร้าง staff เพิ่ม

### App ช้าตอนเปิดครั้งแรก
**สาเหตุ:** Render Free tier sleep หลัง 15 นาที idle
**ปกติ:** รอ ~30 วินาที สำหรับ portfolio/demo ถือว่าโอเค

---

## 6. Local Development

```bash
# ติดตั้ง dependencies
npm install
cd server && npm install && cd ..

# สร้างไฟล์ .env สำหรับ local
cp server/.env.example server/.env
# แก้ DATABASE_URL ใส่ Neon connection string หรือ local PostgreSQL

# รัน dev server
npm run dev:all
# Frontend: http://localhost:5173 (หรือ 5174 ถ้า port ชน)
# Backend:  http://localhost:3001
```

---

_Last updated: 2026-05-24_
