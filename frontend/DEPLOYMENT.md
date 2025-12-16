# Deployment Checklist

## Before Each Deployment

1. **Update the version number** in `src/config/version.ts`:
   ```typescript
   export const APP_VERSION = '1.0.1'; // Increment this!
   ```

2. **Build the project**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy to Cloudflare Pages**

## Why This Matters

The version number is used for:
- Cache busting static assets (favicons, manifest, etc.)
- Detecting stale cached versions in users' browsers
- Forcing automatic reloads when a new version is deployed

## Cache Busting Strategy

This project uses a multi-layered approach to prevent caching issues:

1. **HTML is never cached** (via `_headers` file and meta tags)
2. **Static assets are versioned** (via `?v={{APP_VERSION}}` query params)
3. **JS/CSS bundles are hashed** (automatically by Vite)
4. **Version check script** detects stale versions and forces reloads

## If Users Still See Old Versions

If users report seeing old versions after deployment:

1. **Check Cloudflare Pages cache settings**:
   - Go to Cloudflare Dashboard → Pages → Your Project → Settings
   - Ensure "Browser Cache TTL" is set appropriately
   - Check if "Always Use HTTPS" is enabled

2. **Verify `_headers` file is deployed**:
   - The `_headers` file in `public/` should be copied to `dist/` during build
   - Check `dist/_headers` after building

3. **Check version number was updated**:
   - Verify `src/config/version.ts` has the new version
   - Check `dist/index.html` has the new version in the inline script

4. **Test in incognito mode**:
   - If incognito works but regular doesn't, it's a browser cache issue
   - The version check script should handle this automatically

5. **Manual cache clear** (if needed):
   - Users can do a hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache for your site

## Quick Version Update Script

You can create a simple script to auto-increment the version:

```bash
# Update version with current date/time
VERSION=$(date +%Y%m%d.%H%M)
sed -i '' "s/export const APP_VERSION = .*/export const APP_VERSION = '$VERSION';/" src/config/version.ts
```

