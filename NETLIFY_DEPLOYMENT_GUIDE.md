# Netlify Deployment Guide

## Overview
This guide will help you deploy the World Staffing Awards 2026 application to Netlify as a static site with serverless functions.

## Prerequisites
- Netlify account
- GitHub/GitLab repository
- Supabase project (for database and storage)
- HubSpot account (optional, for integrations)

## Deployment Steps

### 1. Prepare Your Repository
```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### 2. Connect to Netlify
1. Log in to your Netlify dashboard
2. Click "New site from Git"
3. Choose your Git provider (GitHub/GitLab)
4. Select your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `out`
   - **Node version**: `18`

### 3. Environment Variables
Set these environment variables in Netlify Dashboard → Site Settings → Environment Variables:

#### Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Optional Variables
```
HUBSPOT_ACCESS_TOKEN=your_hubspot_access_token
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
```

### 4. Build Configuration
The project includes a `netlify.toml` file with the following configuration:
- Static site generation
- API route handling via serverless functions
- Proper redirects and headers
- Security headers

### 5. Deploy
1. Click "Deploy site" in Netlify
2. Wait for the build to complete
3. Your site will be available at `https://your-site-name.netlify.app`

## Build Process

### What Happens During Build
1. **Dependencies Installation**: `npm ci` installs all required packages
2. **Static Generation**: Next.js generates static HTML/CSS/JS files
3. **Image Optimization**: Images are processed for web delivery
4. **Asset Optimization**: CSS and JS are minified and optimized
5. **Output Generation**: All files are placed in the `out` directory

### Build Configuration
- **Output**: Static export (`output: 'export'`)
- **Images**: Unoptimized for static hosting
- **Trailing Slashes**: Enabled for better SEO
- **TypeScript/ESLint**: Errors ignored during build for deployment

## Features Supported

### ✅ Fully Supported
- Homepage with all sections
- Nomination form (all steps)
- Directory and nominee listings
- Individual nominee pages
- Dark/light mode toggle
- Responsive design
- SEO optimization
- Image galleries and uploads (via Supabase)

### ⚠️ Limited Support (Static Mode)
- API routes (converted to serverless functions)
- Real-time features (polling instead of WebSockets)
- Server-side rendering (pre-rendered at build time)

### 🔧 Requires External Services
- Database operations (Supabase)
- File uploads (Supabase Storage)
- Email notifications (via Supabase/third-party)
- HubSpot integrations (serverless functions)

## Performance Optimizations

### Implemented Optimizations
- Static site generation for fast loading
- Image optimization and lazy loading
- CSS and JavaScript minification
- Gzip compression via Netlify
- CDN delivery worldwide
- Caching headers for static assets

### Recommended Netlify Settings
- **Asset optimization**: Enable in Netlify dashboard
- **Form handling**: Enable for contact forms
- **Analytics**: Enable Netlify Analytics
- **Branch deploys**: Enable for staging environments

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Netlify dashboard
# Common fixes:
1. Verify Node.js version (18+)
2. Check environment variables
3. Review dependency versions
4. Clear build cache and retry
```

#### Missing Environment Variables
```bash
# Error: Missing required environment variables
# Solution: Add variables in Netlify dashboard
# Site Settings → Environment Variables
```

#### API Route Issues
```bash
# Error: API routes not working
# Solution: Check netlify.toml redirects
# Ensure serverless functions are properly configured
```

#### Image Loading Issues
```bash
# Error: Images not displaying
# Solution: Check Supabase configuration
# Verify NEXT_PUBLIC_SUPABASE_URL is correct
```

### Debug Steps
1. Check Netlify build logs
2. Verify environment variables
3. Test locally with `npm run build`
4. Check browser console for errors
5. Verify Supabase connection

## Post-Deployment

### Testing Checklist
- [ ] Homepage loads correctly
- [ ] Navigation works on all pages
- [ ] Dark/light mode toggle functions
- [ ] Nomination form submits successfully
- [ ] Directory displays nominees
- [ ] Individual nominee pages load
- [ ] Images display properly
- [ ] Mobile responsiveness works
- [ ] SEO meta tags are present

### Monitoring
- Set up Netlify Analytics
- Monitor Core Web Vitals
- Check error logs regularly
- Monitor Supabase usage
- Track form submissions

### Updates
```bash
# To update the site:
1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to repository
4. Netlify will auto-deploy from main branch
```

## Security Considerations

### Implemented Security
- Environment variables for sensitive data
- HTTPS enforcement via Netlify
- Security headers in netlify.toml
- Input validation and sanitization
- CORS configuration for API routes

### Best Practices
- Keep environment variables secure
- Regularly update dependencies
- Monitor for security vulnerabilities
- Use Supabase RLS (Row Level Security)
- Implement proper authentication

## Support

### Resources
- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Supabase Documentation](https://supabase.com/docs)

### Getting Help
1. Check Netlify build logs
2. Review this deployment guide
3. Test locally first
4. Check environment configuration
5. Contact support if needed

## Conclusion

Your World Staffing Awards 2026 application is now ready for production deployment on Netlify. The static site generation ensures fast loading times and excellent performance, while Supabase handles all dynamic functionality.

The deployment is optimized for:
- **Performance**: Fast loading with CDN delivery
- **Scalability**: Handles traffic spikes automatically
- **Reliability**: 99.9% uptime with Netlify
- **Security**: HTTPS and security headers enabled
- **SEO**: Optimized for search engines