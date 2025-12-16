# Cache Busting Guide

## Overview
This project uses a centralized version system for cache busting static assets. The version is defined in a single location and automatically injected into all asset references.

## How It Works

1. **Version Definition**: The app version is defined in `src/config/version.ts`
   ```typescript
   export const APP_VERSION = '1.0.0';
   ```

2. **Automatic Injection**: The Vite build process automatically:
   - Reads the version from `src/config/version.ts`
   - Replaces `{{APP_VERSION}}` placeholders in `index.html` with the actual version
   - Makes the version available in code via `import.meta.env.APP_VERSION`

3. **Asset Versioning**: All static assets in `index.html` use the version query parameter:
   ```html
   <link rel="icon" href="/favicon.svg?v={{APP_VERSION}}">
   ```

## How to Update the Version

### Option 1: Semantic Versioning (Recommended)
Update `src/config/version.ts`:
```typescript
export const APP_VERSION = '1.0.1'; // Increment for bug fixes
export const APP_VERSION = '1.1.0'; // Increment for new features
export const APP_VERSION = '2.0.0'; // Increment for breaking changes
```

### Option 2: Date-Based Versioning
```typescript
export const APP_VERSION = '20251216.1430'; // YYYYMMDD.HHMM format
```

### Option 3: Build Number
```typescript
export const APP_VERSION = 'build-123';
```

## What Gets Cache-Busted

✅ **Automatically versioned** (via `{{APP_VERSION}}` placeholder):
- Favicons (`/favicon.svg`, `/favicon.ico`, etc.)
- Apple touch icons
- Web manifest (`/site.webmanifest`)
- Any other static assets referenced in `index.html`

✅ **Automatically hashed by Vite** (no manual versioning needed):
- JavaScript bundles (e.g., `index-CQqIdVyG.js`)
- CSS bundles (e.g., `index-QFjVlT4s.css`)
- All assets imported in React components

## Usage in Code

You can also access the version in your React code:

```typescript
const version = import.meta.env.APP_VERSION;
console.log(`App version: ${version}`);
```

## Best Practices

1. **Update version before each deployment** to ensure users get the latest assets
2. **Use semantic versioning** for better tracking of changes
3. **Increment version** even for small fixes to ensure cache invalidation
4. **Test locally** by running `npm run build` and checking the generated HTML in `dist/index.html`

## Example Workflow

1. Make changes to your code
2. Update version in `src/config/version.ts`:
   ```typescript
   export const APP_VERSION = '1.0.1';
   ```
3. Build and deploy:
   ```bash
   npm run build
   ```
4. The built HTML will have all assets versioned:
   ```html
   <link rel="icon" href="/favicon.svg?v=1.0.1">
   ```

