# PWA Icons for EECOL Wire Tools Suite

## Required Icon Sizes

⚠️ **IMPORTANT**: Create PNG icons in these **exact filenames** and place them in this directory:

- `icon-192.png` - 192x192 pixels (required for PWA install)
- `icon-512.png` - 512x512 pixels (required for PWA install)

## Wire Reel Logo (Official EECOL Icon)

🏭 **Our Icon:** Clean wire reel design representing wire manufacturing operations

```svg
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <circle cx="256" cy="256" r="220" fill="white" stroke="#0058B3" stroke-width="20"/>
  <rect x="120" y="120" width="80" height="272" rx="8" fill="#0058B3"/>
  <path d="M 160,160 C 256,150 352,170 448,160" stroke="#0058B3" stroke-width="32" stroke-linecap="round"/>
  <path d="M 160,256 C 256,246 352,266 448,256" stroke="#0058B3" stroke-width="32" stroke-linecap="round"/>
  <path d="M 160,352 C 256,342 352,362 448,352" stroke="#0058B3" stroke-width="32" stroke-linecap="round"/>
  <circle cx="180" cy="180" r="40" fill="rgba(0,88,179,0.2)"/>
</svg>
```

## Generate PNG Icons

### ✅ **Easy Method: Online Tools** (Recommended)

1. **Copy one SVG above** and paste into a text editor, save as `.svg`
2. **Go to:** https://favicon.io/favicon-converter/
3. **Upload your SVG**
4. **Download the PNG files:**
   - Rename downloaded `android-chrome-192x192.png` → `icon-192.png`
   - Rename downloaded `android-chrome-512x512.png` → `icon-512.png`
5. **Copy both PNG files** into this `icons/` folder

### ✅ **Method 2: Command Line** (If you have imagemagick):
```bash
# Convert SVG to PNG
convert logo.svg -resize 192x192 icon-192.png
convert logo.svg -resize 512x512 icon-512.png
```

### ✅ **Method 3: Any Image Editor:**
- Open SVG in any program (Photoshop, GIMP, etc.)
- Export at 192x192 and 512x512 pixels
- Save as PNG with transparency

## Current Status

❌ **App icons missing** - PWA install prompt won't show yet
📱 **PWA framework ready** - Just add PNG icons to enable installation

**Once you add the PNG icons, your PWA will be fully installable on mobile and desktop!** 🎉
