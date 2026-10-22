# Mantram360 — cPanel Deployment Guide

## Architecture
```
public_html/          ← React build (static files)
  index.html
  assets/
  .htaccess           ← SPA routing + /api proxy

nodejs_app/           ← Node.js Express backend
  app.js              ← Passenger entry point
  dist/               ← Compiled TypeScript
  node_modules/
  prisma/
  .env
```

---

## Step 1 — MySQL Database

1. cPanel → MySQL Databases → Create DB: `mantram360`
2. Create user, assign ALL PRIVILEGES to the DB
3. Note: `DB_USER`, `DB_PASS`, DB name

---

## Step 2 — Backend Deployment

### Local build
```bash
cd mantram360-backend
npm install
npx prisma generate
npm run build       # outputs to dist/
```

### Upload to cPanel
1. Upload the entire folder to e.g. `/home/username/nodejs_app/`
   (Do NOT put inside `public_html`)
2. Upload: `app.js`, `dist/`, `node_modules/`, `prisma/`, `package.json`

### cPanel Node.js App setup
1. cPanel → Software → Setup Node.js App → Create Application
2. Node.js version: **20** (LTS)
3. Application mode: Production
4. Application root: `nodejs_app`
5. Application URL: `api` (makes it available at `yourdomain.com/api`)
   — OR use a subdomain `api.yourdomain.com`
6. Application startup file: `app.js`
7. Click "Create" → "Run NPM Install"

### Environment variables (in cPanel Node.js App → ENV vars)
```
NODE_ENV=production
DATABASE_URL=mysql://DB_USER:DB_PASS@localhost:3306/mantram360
JWT_SECRET=<long random string>
ADMIN_JWT_SECRET=<another long random string>
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+91xxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
FRONTEND_URL=https://yourdomain.com
TZ=Asia/Kolkata
PORT=3000
```

### Run migrations + seed
In cPanel Terminal (or SSH):
```bash
cd ~/nodejs_app
node -e "require('./dist/config/prisma').prisma.\$connect()"
npx prisma migrate deploy
npx tsx prisma/seed.ts    # or: node dist/prisma/seed.js
```

---

## Step 3 — Frontend Deployment

### Local build
```bash
cd "Mantram360 final"
# Set the API URL (create .env.production)
echo "VITE_API_URL=https://yourdomain.com/api" > .env.production
npm run build
```

### Upload
Upload contents of `dist/` to `public_html/`

### .htaccess for React Router + API proxy
Create `public_html/.htaccess`:
```apache
# React SPA routing
RewriteEngine On
RewriteBase /

# Serve existing files/dirs directly
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Proxy /api/* to Node.js backend (if backend on same domain)
RewriteRule ^api/(.*) http://localhost:3000/api/$1 [P,L]

# All other routes → index.html (React Router)
RewriteRule ^ index.html [L]
```

---

## Step 4 — Razorpay Webhook

In Razorpay Dashboard → Settings → Webhooks:
- URL: `https://yourdomain.com/api/bookings/webhook`
- Events: `payment.captured`, `payment.failed`
- Secret: same as `RAZORPAY_WEBHOOK_SECRET`

---

## Step 5 — Verify

1. `https://yourdomain.com/api/health` → `{"status":"ok"}`
2. `https://yourdomain.com/api/poojas/one-to-one` → list of poojas
3. `https://yourdomain.com` → React app loads
4. Login with OTP, make a test booking

---

## Frontend service updates needed

The React frontend services currently use localStorage (mock). 
Update each service to call the real API:

**authService.ts** → calls `/api/auth/send-otp`, `/api/auth/verify-otp`  
**bookingService.ts** → calls `/api/account/bookings/*`, `/api/bookings/*`  
**slotService.ts** → calls `/api/poojas/one-to-one/:slug/slots`  
**poojaPassService.ts** → calls `/api/pooja-pass/*`  

Set `VITE_API_URL` in frontend `.env.production` and create a shared 
`src/lib/api.ts` axios/fetch wrapper that reads `import.meta.env.VITE_API_URL`.
