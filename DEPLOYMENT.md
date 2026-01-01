# Deployment Guide

This guide covers deploying the LabMind application to production.

## Architecture Overview

- **Frontend**: Next.js application deployed on Vercel
- **Backend**: FastAPI application deployed on Render (or similar)
- **Database & Auth**: Supabase (hosted service)
- **Storage**: Supabase Storage

## Prerequisites

1. Accounts on:
   - [Vercel](https://vercel.com) (for frontend)
   - [Render](https://render.com) (for backend)
   - [Supabase](https://supabase.com) (for database and auth)

2. Environment variables configured in each service (see [ENV_SETUP.md](./ENV_SETUP.md))

## Frontend Deployment (Vercel)

### Step 1: Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js configuration

### Step 2: Configure Environment Variables

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add the following variables for **Production**, **Preview**, and **Development** environments:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

**Important Notes**:
- Replace `https://your-backend.onrender.com` with your actual Render backend URL
- `NEXT_PUBLIC_*` variables are embedded at build time, so they must be set before building
- After adding variables, trigger a new deployment to apply them

### Step 3: Build Configuration

Vercel automatically detects Next.js projects, so no special build configuration is needed. However, if you need custom settings, you can create a `vercel.json` file:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Step 4: Deploy

1. Vercel will automatically deploy when you push to your main branch
2. Each deployment gets a unique URL (e.g., `your-app.vercel.app`)
3. You can add custom domains in **Settings** → **Domains**

## Backend Deployment (Render)

### Step 1: Create a Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Select the repository and branch

### Step 2: Configure Build Settings

- **Name**: Choose a name (e.g., `labmind-backend`)
- **Region**: Select closest region to your users
- **Branch**: `main` (or your production branch)
- **Root Directory**: `backend` (if backend is in a subdirectory)
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Note**: Render automatically sets the `PORT` environment variable.

### Step 3: Configure Environment Variables

1. In your Render service, go to **Environment**
2. Add the following variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

**Important Notes**:
- Replace `https://your-app.vercel.app` with your actual Vercel deployment URL
- Add all domains (Vercel preview URLs, custom domains) to `ALLOWED_ORIGINS` (comma-separated)
- Render will restart the service when environment variables change

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will build and deploy your backend
3. Your backend will be available at `https://your-service.onrender.com`
4. Test the API at `https://your-service.onrender.com/docs`

## Post-Deployment Checklist

### Frontend (Vercel)

- [ ] Environment variables are set correctly
- [ ] Build completes without errors
- [ ] Application loads at the deployment URL
- [ ] Authentication works (sign in/sign up)
- [ ] API calls are reaching the backend (check browser console)

### Backend (Render)

- [ ] Environment variables are set correctly
- [ ] Build completes without errors
- [ ] API documentation is accessible at `/docs`
- [ ] CORS is configured correctly (check browser console for CORS errors)
- [ ] Health check endpoint responds (if implemented)

### Integration

- [ ] Frontend can successfully call backend APIs
- [ ] Authentication tokens are passed correctly
- [ ] Database operations work (projects, notebooks, files)
- [ ] File uploads/downloads work
- [ ] AI agent features work (quiz, plan generation, chat)

## Troubleshooting

### Frontend: "Failed to connect to backend"

**Symptoms**: Error message showing backend connection failed

**Solutions**:
1. Check that `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Verify the backend URL is accessible (try opening it in a browser)
3. Check browser console for CORS errors
4. Ensure backend is running and healthy
5. Redeploy frontend after updating environment variables

### Backend: CORS Errors

**Symptoms**: Browser console shows CORS policy errors

**Solutions**:
1. Add your frontend URL(s) to `ALLOWED_ORIGINS` in Render
2. Include all variants: `https://your-app.vercel.app`, `https://www.your-domain.com`
3. Restart the Render service after updating environment variables
4. Check backend logs for CORS-related errors

### Build Failures

**Frontend (Vercel)**:
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Ensure TypeScript compilation succeeds
- Check for missing environment variables (especially `NEXT_PUBLIC_*`)

**Backend (Render)**:
- Check build logs in Render dashboard
- Verify `requirements.txt` is correct
- Ensure Python version is compatible
- Check for syntax errors in Python code

### Environment Variables Not Working

**Frontend**:
- `NEXT_PUBLIC_*` variables are embedded at build time
- You must redeploy after changing these variables
- Check that variables are set for the correct environment (Production/Preview/Development)

**Backend**:
- Environment variables take effect after service restart
- Render automatically restarts on environment variable changes
- Check that variable names match exactly (case-sensitive)

## Monitoring

### Vercel

- **Analytics**: Available in Vercel dashboard
- **Logs**: View function logs in the deployment view
- **Performance**: Monitor Core Web Vitals in dashboard

### Render

- **Logs**: View live logs in the service dashboard
- **Metrics**: CPU, Memory, and Network usage graphs
- **Alerts**: Set up email alerts for service failures

## Updating the Deployment

### Frontend

1. Push changes to your Git repository
2. Vercel automatically builds and deploys
3. Preview deployments are created for pull requests

### Backend

1. Push changes to your Git repository
2. Render automatically detects changes and redeploys
3. Monitor logs during deployment

## Rollback

### Vercel

1. Go to your project → **Deployments**
2. Find the previous successful deployment
3. Click the three dots → "Promote to Production"

### Render

1. Go to your service → **Events**
2. Find the previous successful deployment
3. Click "Rollback" (if available) or manually redeploy from a specific commit

## Security Considerations

1. **Never commit** `.env` files or environment variable values to Git
2. **Use service role keys** only in backend environment (never expose to frontend)
3. **Restrict CORS** to only your frontend domains
4. **Enable RLS** (Row Level Security) in Supabase
5. **Use HTTPS** only (enforced by Vercel and Render)
6. **Rotate API keys** periodically
7. **Monitor** for unauthorized access or unusual activity

## Cost Optimization

### Vercel

- Free tier includes generous limits for personal projects
- Consider upgrading for production workloads
- Monitor bandwidth and function execution time

### Render

- Free tier has limitations (spins down after inactivity)
- Upgrade to paid tier for always-on service
- Consider using environment variables to enable/disable features

### Supabase

- Free tier includes database and storage quotas
- Monitor usage in Supabase dashboard
- Consider upgrading for production workloads

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ENV_SETUP.md](./ENV_SETUP.md) - Detailed environment variable setup

