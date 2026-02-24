# ☪ Iftar Meetup 2026 — Full Stack Ticket Booking System

A complete event ticketing platform with Razorpay payment, QR tickets, email automation, and admin dashboard.

---

## 📁 Folder Structure

```
iftar-meetup/
├── frontend/
│   ├── index.html          ← Complete single-page app
│   └── .env.example
│
├── backend/
│   ├── src/
│   │   ├── server.js              ← Express app entry point
│   │   ├── models/
│   │   │   └── Ticket.js          ← MongoDB schema
│   │   ├── routes/
│   │   │   ├── payment.js         ← Razorpay + ticket routes
│   │   │   └── admin.js           ← Admin dashboard routes
│   │   ├── middleware/
│   │   │   └── auth.js            ← JWT middleware
│   │   └── utils/
│   │       ├── ticketIdGenerator.js
│   │       ├── qrGenerator.js
│   │       ├── pdfGenerator.js
│   │       └── emailService.js
│   ├── package.json
│   └── .env.example
│
├── render.yaml             ← Render deployment config
└── README.md
```

---

## 🗄️ Database Schema (MongoDB)

```js
{
  ticketId: "IFTAR2026-4821",      // Unique ticket ID
  name: "Ahmed Khan",
  email: "ahmed@email.com",
  phone: "+91 9876543210",
  quantity: 2,
  totalAmount: 240,
  razorpayOrderId: "order_xxx",
  razorpayPaymentId: "pay_xxx",
  razorpaySignature: "sig_xxx",
  paymentStatus: "paid",           // pending | paid | failed
  qrCodeData: "{...json...}",
  qrCodeImage: "data:image/png;base64,...",
  checkedIn: false,
  checkedInAt: null,
  emailSent: true,
  createdAt: ISODate(...)
}
```

---

## ⚙️ Environment Variables Setup

### Backend `.env`

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/iftar-meetup
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
JWT_SECRET=super_long_random_secret_key_here
ADMIN_PASSWORD=your_secure_admin_password
EMAIL_USER=yourname@gmail.com
EMAIL_PASS=your_google_app_password
FRONTEND_URL=https://iftar-meetup-2026.vercel.app
```

### Frontend (edit `index.html` directly)

Find these lines and update:
```js
const API_URL = 'https://your-backend.onrender.com/api';
const RAZORPAY_KEY = 'rzp_live_XXXXXXXXXX';
const EVENT_DATE = new Date('2026-03-20T18:00:00'); // Set your actual event date
```

---

## 💳 Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys**
3. Generate **Key ID** and **Key Secret**
4. For testing, use `rzp_test_XXXXXXXXXX`
5. For live payments, complete KYC and use `rzp_live_XXXXXXXXXX`
6. Set webhook URL (optional): `https://your-backend.onrender.com/api/payment/webhook`

---

## 📧 Gmail App Password Setup (for Nodemailer)

1. Enable **2-Factor Authentication** on your Google account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Generate an **App Password** for "Mail"
4. Use this 16-character code as `EMAIL_PASS` (not your regular Gmail password)

---

## 🚀 Deployment Guide

### Backend → Render.com

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
5. Add all environment variables from `.env.example`
6. Deploy! Your API will be at: `https://your-app.onrender.com`

### Frontend → Vercel

**Option A — Static HTML (Simplest)**
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Deploy!

**Option B — Vercel CLI**
```bash
npm i -g vercel
cd frontend
vercel --prod
```

**After deployment:**
1. Update `API_URL` in `index.html` with your Render backend URL
2. Update `RAZORPAY_KEY` with your live key
3. Redeploy

---

## 🔌 API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment signature |
| GET | `/api/payment/ticket/:id` | Get ticket details |
| GET | `/api/payment/ticket/:id/pdf` | Download PDF ticket |
| GET | `/api/health` | Health check |

### Admin (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/tickets` | All tickets + stats |
| GET | `/api/admin/export-csv` | Download CSV |
| POST | `/api/admin/checkin` | QR scan check-in |
| PATCH | `/api/admin/tickets/:id/checkin` | Manual check-in |

---

## 🔐 Security Features

- ✅ Razorpay HMAC-SHA256 signature verification
- ✅ JWT-protected admin routes
- ✅ Rate limiting (100 req/15min, stricter on payment)
- ✅ Helmet.js security headers
- ✅ CORS whitelist
- ✅ Duplicate ticket ID prevention
- ✅ Duplicate check-in prevention

---

## 🎨 Design System

| Variable | Value | Usage |
|----------|-------|-------|
| `--dark` | `#0f2f2f` | Primary background |
| `--gold` | `#d4af37` | Primary accent |
| `--gold-light` | `#f0d080` | Gold highlights |
| `--cream` | `#f5e6c8` | Text color |
| Playfair Display | serif | Headings |
| Cormorant Garamond | serif | Body |
| Tajawal | sans-serif | Labels/UI |

---

## 🧪 Testing

```bash
# Test API health
curl https://your-backend.onrender.com/api/health

# Test create order (replace values)
curl -X POST https://your-backend.onrender.com/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","phone":"9876543210","quantity":2}'
```

---

## 📦 Install & Run Locally

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev

# Frontend (just open in browser)
cd frontend
# Open index.html in browser OR:
npx serve . -l 3000
```

---

## 📞 Support

For queries about this codebase, check the inline code comments.  
Ramadan Mubarak! 🌙 May Allah bless this gathering.
