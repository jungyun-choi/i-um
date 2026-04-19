#!/bin/bash
# 이음 앱 아이콘 생성 스크립트 (ImageMagick 사용)
set -e
ASSETS="$(dirname "$0")/../assets"

# SVG without text (font dependency issue)
cat > /tmp/ium-icon.svg << 'SVG_EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#F5896A"/>
      <stop offset="100%" stop-color="#D95F3B"/>
    </radialGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="rgba(0,0,0,0.2)"/>
    </filter>
  </defs>

  <!-- Rounded background -->
  <rect width="1024" height="1024" rx="220" ry="220" fill="url(#bg)"/>
  <rect width="1024" height="1024" rx="220" ry="220"
    fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>

  <!-- Two overlapping hearts = "이음" (connection) -->
  <!-- Left heart -->
  <g filter="url(#shadow)">
    <path transform="translate(370,510)"
      d="M0,-140 C-28,-196 -126,-196 -154,-112 C-182,-28 -112,56 0,140
         C112,56 182,-28 154,-112 C126,-196 28,-196 0,-140Z"
      fill="rgba(255,255,255,0.92)"/>
    <!-- Right heart -->
    <path transform="translate(654,510)"
      d="M0,-140 C-28,-196 -126,-196 -154,-112 C-182,-28 -112,56 0,140
         C112,56 182,-28 154,-112 C126,-196 28,-196 0,-140Z"
      fill="rgba(255,255,255,0.92)"/>
  </g>

  <!-- Connecting bridge between hearts -->
  <rect x="370" y="430" width="284" height="80" rx="40"
    fill="rgba(255,255,255,0.92)" filter="url(#shadow)"/>

  <!-- Small sparkle dots -->
  <circle cx="512" cy="260" r="22" fill="rgba(255,255,255,0.5)"/>
  <circle cx="512" cy="200" r="13" fill="rgba(255,255,255,0.3)"/>
  <circle cx="300" cy="300" r="12" fill="rgba(255,255,255,0.25)"/>
  <circle cx="724" cy="300" r="12" fill="rgba(255,255,255,0.25)"/>
</svg>
SVG_EOF

echo "▶ Generating app icons..."
magick -background none /tmp/ium-icon.svg -resize 1024x1024 "$ASSETS/icon.png"
magick -background none /tmp/ium-icon.svg -resize 1024x1024 "$ASSETS/adaptive-icon.png"
magick -size 1284x2778 xc:"#FEF7F0" \
  \( /tmp/ium-icon.svg -resize 500x500 \) \
  -gravity center -composite "$ASSETS/splash-icon.png"
magick -background none /tmp/ium-icon.svg -resize 48x48 "$ASSETS/favicon.png"

echo "✅ Done!"
ls -lh "$ASSETS/"*.png
