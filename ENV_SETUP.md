# Environment Variables Setup Guide

## Local Development

### Frontend (Next.js) - `.env.local`

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration (for client-side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (FastAPI) - `backend/.env`

Create a `.env` file in the `backend/` directory:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# CORS Configuration (comma-separated list of allowed origins)
ALLOWED_ORIGINS=http://localhost:3000
```

## Production Setup

### Vercel (Frontend)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

**Important**: Make sure to set these for **Production**, **Preview**, and **Development** environments as needed.

### Render (Backend) or Other Backend Hosting

1. Go to your Render service dashboard (or your hosting provider)
2. Navigate to **Environment** or **Environment Variables**
3. Add the following variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

**Important Notes**:
- Replace `https://your-app.vercel.app` with your actual Vercel deployment URL
- If you have a custom domain, add it to `ALLOWED_ORIGINS` as well
- Use comma-separated values for multiple origins

## Getting Your API Keys

### Google Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key and add it to your `.env` file as `GEMINI_API_KEY`

### Supabase Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL` (frontend) and `SUPABASE_URL` (backend)
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (backend only - keep this secret!)

**⚠️ Security Warning**: Never commit `.env` or `.env.local` files to git. The service role key has admin access to your database.

## Environment Variable Reference

### Frontend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL (local or production) | Yes |

### Backend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes (for AI features) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | Yes |

## Testing Your Setup

### Frontend
```bash
npm run dev
```
Visit http://localhost:3000 - should load without errors

### Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```
Visit http://localhost:8000/docs - should show API documentation

If you see errors about missing environment variables, double-check your `.env` files.


