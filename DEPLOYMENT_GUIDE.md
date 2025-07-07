# GitHub Pages Deployment Guide

## Overview

This document describes the GitHub Pages deployment setup for the Archi Site project. The site is successfully deployed at:

**🌐 Live Site: https://bob-takuya.github.io/archi-site/**

## Deployment Methods

### Method 1: Automated GitHub Actions (Recommended for CI/CD)

The repository includes an automated GitHub Actions workflow that deploys to the `gh-pages` branch:

**File:** `.github/workflows/deploy-gh-pages.yml`

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Process:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies with legacy peer deps
4. Prepare static database
5. Build application with Vite
6. Deploy to `gh-pages` branch using `peaceiris/actions-gh-pages`

### Method 2: Manual Deployment Script

For local deployment or manual control:

```bash
# Use the comprehensive deployment script
npm run deploy:gh-pages

# Or use the simple command
npm run deploy
```

**Script:** `scripts/deploy-gh-pages.js`

**Features:**
- Pre-deployment validation
- Database preparation
- Automated build process
- GitHub Pages file preparation (.nojekyll, 404.html)
- Deployment verification

## Configuration

### Vite Configuration

**Key settings in `vite.config.ts`:**

```typescript
export default defineConfig({
  base: '/archi-site/', // Critical for GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: true,
    // ... other options
  }
});
```

### GitHub Pages Setup

**Repository Settings:**
- Source: Deploy from a branch
- Branch: `gh-pages`
- Folder: `/ (root)`

**Required Files:**
- `.nojekyll` - Disables Jekyll processing
- `404.html` - Handles SPA client-side routing

## Database Integration

The site includes a SQLite database that's optimized for static deployment:

**Source:** `Archimap_database.sqlite`
**Output:** `public/db/archimap.sqlite` + `.suffix` file
**Size:** ~12MB with 195 chunks (64KB each)

**Preparation script:** `scripts/prepare-static-db.js`
- Creates optimized indexes
- Generates metadata for sql.js-httpvfs
- Chunks database for efficient loading

## Deployment Verification

### Automated Verification

```bash
npm run verify-deployment
```

**Script:** `scripts/verify-deployment.js`

**Checks:**
- Site accessibility (200 status)
- Content structure validation
- Asset path verification
- SPA routing (404.html fallback)

### E2E Testing

```bash
npx playwright test tests/e2e/production-deployment.spec.ts
```

**Tests:**
- Site loading and content visibility
- Asset loading without errors
- SPA routing functionality
- Basic security headers

## Troubleshooting

### Common Issues

1. **404 on deployment**
   - Check if `base` path is correctly set in `vite.config.ts`
   - Verify gh-pages branch was created
   - Wait 5-10 minutes for GitHub Pages to process

2. **Assets not loading**
   - Ensure base path matches repository name
   - Check that build includes all necessary files
   - Verify .nojekyll file is present

3. **SPA routing issues**
   - Confirm 404.html exists and mirrors index.html
   - Check that React Router is configured for hash routing or has proper fallback

4. **Database loading issues**
   - Verify database files are included in build
   - Check CORS headers for database requests
   - Ensure sql.js WASM files are properly copied

### Debugging Commands

```bash
# Check build output
ls -la dist/

# Verify database files
ls -la dist/db/

# Test deployment locally
npm run preview

# Check git branches
git branch -a

# Verify remote deployment
curl -I https://bob-takuya.github.io/archi-site/
```

## Performance Optimization

### Build Optimization

- **Code Splitting:** Vendor, UI, Map, and Database chunks
- **Tree Shaking:** Unused code elimination
- **Minification:** CSS and JavaScript compression
- **Source Maps:** Available for debugging

### Database Optimization

- **Chunked Loading:** 64KB chunks for progressive loading
- **Indexes:** Optimized for common queries
- **Compression:** SQLite VACUUM for size reduction

### Monitoring

- **Lighthouse CI:** Automated performance auditing
- **Bundle Analysis:** Size tracking and optimization
- **E2E Testing:** Functional validation

## Security

### Headers

GitHub Pages provides basic security headers automatically:
- Content-Type validation
- HTTPS enforcement
- Basic XSS protection

### Additional Security

- `.nojekyll` prevents Jekyll security issues
- Asset integrity through build process
- No sensitive data in repository

## Maintenance

### Updates

1. **Code Changes:**
   ```bash
   git push origin main  # Triggers automatic deployment
   ```

2. **Database Updates:**
   - Replace `Archimap_database.sqlite`
   - Redeploy to rebuild optimized version

3. **Dependency Updates:**
   ```bash
   npm update
   npm run deploy:gh-pages
   ```

### Monitoring

- Check GitHub Actions for deployment status
- Monitor site availability with verification script
- Review Lighthouse reports for performance

## Success Metrics

✅ **Site Accessibility:** https://bob-takuya.github.io/archi-site/  
✅ **React App Structure:** Proper SPA initialization  
✅ **Asset Loading:** All resources load correctly  
✅ **SPA Routing:** Client-side navigation works  
✅ **Database Integration:** SQLite data accessible  
✅ **Performance:** Optimized build and delivery  

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Run verification script
3. Review browser console for errors
4. Test locally with `npm run preview`

---

**Last Updated:** 2025-07-07  
**Deployment Status:** ✅ Live and Operational