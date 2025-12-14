# Favicon Generation Instructions

The SVG favicon (`favicon.svg`) has been created and will work in modern browsers. To generate the additional icon formats needed for full cross-platform support, you have a few options:

## Option 1: Use an Online Tool (Recommended)

1. Visit https://realfavicongenerator.net/
2. Upload the `favicon.svg` file from `public/favicon.svg`
3. Configure settings:
   - iOS: Use the default settings
   - Android: Use the default settings
   - Windows: Use the default settings
4. Generate and download the favicon package
5. Extract and place all files in the `public/` directory:
   - `favicon.ico`
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `apple-touch-icon.png`
   - `android-chrome-192x192.png`
   - `android-chrome-512x512.png`

## Option 2: Use ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
cd public

# Generate PNG files from SVG
convert -background "#F7F6F3" -density 300 favicon.svg -resize 16x16 favicon-16x16.png
convert -background "#F7F6F3" -density 300 favicon.svg -resize 32x32 favicon-32x32.png
convert -background "#F7F6F3" -density 300 favicon.svg -resize 180x180 apple-touch-icon.png
convert -background "#F7F6F3" -density 300 favicon.svg -resize 192x192 android-chrome-192x192.png
convert -background "#F7F6F3" -density 300 favicon.svg -resize 512x512 android-chrome-512x512.png

# Generate ICO file (requires multiple sizes)
convert favicon-16x16.png favicon-32x32.png favicon.ico
```

## Option 3: Use Node.js Script

Create a script using `sharp` or `jimp` to convert the SVG to PNG at different sizes.

## Current Status

- ✅ SVG favicon created (`favicon.svg`) - works in modern browsers
- ✅ `site.webmanifest` created
- ✅ `index.html` updated with all favicon links
- ⏳ PNG/ICO files need to be generated (use one of the options above)

The SVG favicon will work immediately in most modern browsers. The additional formats are for:
- Older browsers (favicon.ico)
- iOS home screen (apple-touch-icon.png)
- Android home screen (android-chrome-*.png)
