# Vercel Deployment Checklist - Frontend

## ✅ Completed Pre-Deployment Tasks

### Security & Configuration

- [x] **Removed exposed API key** from `frontend/.env`
  - Removed: `VITE_GROQ_API_KEY` (sensitive credential was exposed)
  - Note: `.env` is properly gitignored
- [x] **Cleaned up duplicate Vercel config**
  - Removed `frontend/vercel.json` (was conflicting with root config)
  - Kept root `vercel.json` (correctly configured for monorepo structure)

- [x] **Enhanced root vercel.json** with production settings
  - Added security headers (X-Content-Type-Options, X-Frame-Options, etc.)
  - Added cache control for assets (31536000s = 1 year)
  - Maintains SPA rewrites for React Router

### Code Quality

- [x] **ESLint validation** - ✓ Passed (no warnings)
- [x] **TypeScript type check** - ✓ Passed (no errors)
- [x] **Production build test** - ✓ Successful (18.98s)
  - Total bundle size: ~459 KB (gzip: ~148 KB)
  - All 3181 modules transformed successfully

## 📋 Required Steps Before Deployment

### 1. Environment Variables on Vercel

You must set these environment variables in your Vercel project settings:

```
VITE_API_URL=https://your-backend-domain.com/api/v1
VITE_WS_URL=wss://your-backend-domain.com/ws
VITE_APP_NAME=AI Job Automation
VITE_ENABLE_ANALYTICS=false
VITE_GROQ_API_KEY=<your-production-groq-key>  (if needed)
```

**Important:**

- Replace `your-backend-domain.com` with your actual production backend URL
- Never commit sensitive keys to version control
- Use Vercel's environment variables feature for all secrets

### 2. Domain Configuration

- [ ] Point your domain to Vercel (if using custom domain)
- [ ] Configure DNS records (A and CNAME records)
- [ ] Enable SSL/TLS certificate (automatic on Vercel)

### 3. Backend Integration

Ensure your backend is running and accessible at the URL specified in `VITE_API_URL`:

- Backend must handle CORS for your Vercel domain
- WebSocket connection should be available at `VITE_WS_URL`
- API endpoints should match the expected versions

### 4. Deploy to Vercel

```bash
# Using Vercel CLI
vercel

# Or connect your git repo to Vercel dashboard:
# 1. Go to https://vercel.com/dashboard
# 2. Click "Add New..." > "Project"
# 3. Import your Git repository
# 4. Set root directory: (leave default or set to project root)
# 5. Environment variables: Add the ones from step 1 above
# 6. Deploy
```

## 🔍 Build Configuration

### Root vercel.json

```json
{
  "version": 2,
  "installCommand": "npm install --verbose --no-audit --no-fund",
  "buildCommand": "npm --prefix frontend run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [...],
  "headers": [...]  // Added security headers
}
```

### Frontend Build Process

```bash
npm --prefix frontend run build
# Runs: tsc && vite build
# Output: frontend/dist/
```

## 📊 Build Output Summary

- **HTML:** 3.4 KB (gzip: 1.09 KB)
- **CSS:** 105.87 KB (gzip: 15.90 KB)
- **Main JS:** 459.58 KB (gzip: 148.25 KB)
- **Build Time:** ~19 seconds
- **Total Modules:** 3,181

## 🚀 Post-Deployment Checklist

- [ ] Test homepage loads correctly
- [ ] Verify API calls work (check network tab)
- [ ] Test WebSocket connections
- [ ] Check console for any errors
- [ ] Test authentication flows
- [ ] Verify responsive design on mobile
- [ ] Monitor Vercel analytics/logs for errors

## 🔐 Security Headers Added

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: public, max-age=31536000, immutable (for /assets/)
```

## 📝 Notes

- Frontend is built as a single-page application (SPA)
- All routes rewrites to `/index.html` for React Router
- Assets in `/assets/` are cached for 1 year (immutable)
- `.env` file is never committed (in .gitignore)
- Production environment variables must be set in Vercel dashboard

## ⚠️ Common Issues & Solutions

### Build Fails

- Check that `npm install` completes without errors
- Verify Node version: 20 <= version < 23 (see package.json)
- Check for missing environment variables

### API Calls Fail

- Verify `VITE_API_URL` environment variable is set correctly
- Check CORS headers on backend
- Ensure backend is running and accessible

### WebSocket Connection Fails

- Verify `VITE_WS_URL` environment variable is set correctly
- Enable WebSocket support on your backend
- Check firewall/proxy settings

## ✨ Ready for Deployment!

All pre-deployment checks have passed. Your frontend is ready to deploy to Vercel.

---

Last Updated: April 7, 2026
