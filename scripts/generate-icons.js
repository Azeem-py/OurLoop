const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Full artwork SVG (for standard icons & apple touch icon)
const fullIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#181524"/>
      <stop offset="100%" stop-color="#0E0D13"/>
    </linearGradient>
    <linearGradient id="loopGrad" x1="120" y1="160" x2="392" y2="352" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF7E67"/>
      <stop offset="50%" stop-color="#E26D54"/>
      <stop offset="100%" stop-color="#E5B268"/>
    </linearGradient>
    <filter id="glow" x="60" y="100" width="392" height="312" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="120" fill="url(#bg)"/>
  <rect width="512" height="512" rx="120" stroke="#292536" stroke-width="4"/>

  <!-- Glowing Infinity Heart Loop -->
  <g filter="url(#glow)">
    <!-- Interlocking Infinity Loops representing two lovers -->
    <path d="M176 186 C124 186 96 220 96 256 C96 292 124 326 176 326 C232 326 280 256 336 256 C388 256 416 290 416 326 C416 362 388 396 336 396 C288 396 256 362 256 336" 
          stroke="url(#loopGrad)" stroke-width="32" stroke-linecap="round" fill="none" opacity="0.3"/>
    
    <!-- Left loop (Partner 1) -->
    <path d="M256 256 C220 200 180 180 144 180 C98 180 64 214 64 256 C64 298 98 332 144 332 C186 332 224 300 256 256 Z" 
          stroke="url(#loopGrad)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <!-- Right loop (Partner 2) -->
    <path d="M256 256 C288 212 326 180 368 180 C414 180 448 214 448 256 C448 298 414 332 368 332 C332 332 292 312 256 256 Z" 
          stroke="url(#loopGrad)" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <!-- Center Love Spark / Heart Accent -->
    <circle cx="256" cy="256" r="14" fill="#FFE5D9"/>
    <circle cx="256" cy="256" r="24" fill="#E26D54" opacity="0.4"/>
  </g>
</svg>
`;

// 2. Maskable SVG with safe area padding (Android adaptive icons)
const maskableIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgMask" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#181524"/>
      <stop offset="100%" stop-color="#0E0D13"/>
    </linearGradient>
    <linearGradient id="loopGradMask" x1="150" y1="180" x2="362" y2="332" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF7E67"/>
      <stop offset="50%" stop-color="#E26D54"/>
      <stop offset="100%" stop-color="#E5B268"/>
    </linearGradient>
  </defs>

  <!-- Full bleed background for masking -->
  <rect width="512" height="512" fill="url(#bgMask)"/>

  <!-- Centered emblem scaled to fit within 66% safe zone (center 338x338) -->
  <g transform="translate(77, 77) scale(0.7)">
    <path d="M256 256 C220 200 180 180 144 180 C98 180 64 214 64 256 C64 298 98 332 144 332 C186 332 224 300 256 256 Z" 
          stroke="url(#loopGradMask)" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M256 256 C288 212 326 180 368 180 C414 180 448 214 448 256 C448 298 414 332 368 332 C332 332 292 312 256 256 Z" 
          stroke="url(#loopGradMask)" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="256" cy="256" r="16" fill="#FFE5D9"/>
    <circle cx="256" cy="256" r="28" fill="#E26D54" opacity="0.4"/>
  </g>
</svg>
`;

// 3. Monochrome Badge SVG (for Android status bar)
const badgeSvg = `
<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M36 36 C30 27 24 24 19 24 C12 24 7 29 7 36 C7 43 12 48 19 48 C25 48 31 43 36 36 Z" 
        stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M36 36 C41 29 47 24 53 24 C60 24 65 29 65 36 C65 43 60 48 53 48 C48 48 42 45 36 36 Z" 
        stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="36" cy="36" r="3" fill="#FFFFFF"/>
</svg>
`;

async function run() {
  const fullSvgBuf = Buffer.from(fullIconSvg);
  const maskableSvgBuf = Buffer.from(maskableIconSvg);
  const badgeSvgBuf = Buffer.from(badgeSvg);

  // 512x512
  await sharp(fullSvgBuf).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  // 192x192
  await sharp(fullSvgBuf).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  // 180x180 Apple Touch Icon
  await sharp(fullSvgBuf).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  // 512x512 Maskable
  await sharp(maskableSvgBuf).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-maskable.png'));
  // 72x72 Badge
  await sharp(badgeSvgBuf).resize(72, 72).png().toFile(path.join(iconsDir, 'badge-72.png'));

  // Copy root fallbacks
  fs.copyFileSync(path.join(iconsDir, 'icon-512.png'), path.join(__dirname, '..', 'public', 'icon.png'));
  fs.copyFileSync(path.join(iconsDir, 'apple-touch-icon.png'), path.join(__dirname, '..', 'public', 'apple-touch-icon.png'));

  console.log('Successfully generated all PWA icons!');
}

run().catch(console.error);
