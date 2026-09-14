import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIDTH = 1200;
const HEIGHT = 630;

// SVG definitions extracted from favicon.svg
const LOGO_DEFS = `
  <linearGradient id="bg-grad" x1="64" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#4f46e5" />
    <stop offset="50%" stop-color="#7c3aed" />
    <stop offset="100%" stop-color="#db2777" />
  </linearGradient>
  <linearGradient id="shield-grad" x1="128" y1="96" x2="384" y2="416" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#1e1b4b" />
    <stop offset="100%" stop-color="#0f172a" />
  </linearGradient>
  <linearGradient id="wrench-grad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#38bdf8" />
    <stop offset="50%" stop-color="#818cf8" />
    <stop offset="100%" stop-color="#c084fc" />
  </linearGradient>
  <linearGradient id="sword-grad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f43f5e" />
    <stop offset="50%" stop-color="#fb923c" />
    <stop offset="100%" stop-color="#facc15" />
  </linearGradient>
  <linearGradient id="ball-top" x1="160" y1="140" x2="352" y2="256" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#f43f5e" />
    <stop offset="100%" stop-color="#e11d48" />
  </linearGradient>
  <linearGradient id="ball-bottom" x1="160" y1="256" x2="352" y2="372" gradientUnits="userSpaceOnUse">
    <stop offset="0%" stop-color="#f8fafc" />
    <stop offset="100%" stop-color="#cbd5e1" />
  </linearGradient>
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="8" result="blur" />
    <feComposite in="SourceGraphic" in2="blur" operator="over" />
  </filter>
`;

const LOGO_PATHS = `
  <!-- Outer Rounded Badge Frame -->
  <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#bg-grad)" />
  <rect x="36" y="36" width="440" height="440" rx="100" fill="url(#shield-grad)" stroke="url(#bg-grad)" stroke-width="4" />

  <!-- Background Data Hexagon Grid -->
  <polygon points="256,110 376,178 376,334 256,402 136,334 136,178" stroke="#4338ca" stroke-width="3" stroke-dasharray="6 6" fill="none" opacity="0.6" />

  <!-- Crossed Elements (Spanner Wrench & Sword) -->
  <g transform="rotate(-45 256 256)">
    <rect x="243" y="80" width="26" height="352" rx="6" fill="url(#wrench-grad)" stroke="#090d16" stroke-width="4" />
    <rect x="250" y="140" width="12" height="232" rx="4" fill="#0f172a" opacity="0.5" />
    <path d="M 230,104 C 216,90 216,66 234,50 C 248,36 270,36 284,50 C 294,58 298,70 296,82 L 274,86 C 275,80 272,74 266,68 C 258,60 246,62 238,70 C 230,78 232,90 240,98 Z" fill="url(#wrench-grad)" stroke="#090d16" stroke-width="4" />
    <path d="M 246,42 L 276,72 L 262,86 L 232,56 Z" fill="#0f172a" />
    <path d="M 282,408 C 296,422 296,446 278,462 C 264,476 242,476 228,462 C 218,454 214,442 216,430 L 238,426 C 237,432 240,438 246,444 C 254,452 266,450 274,442 C 282,434 280,422 272,414 Z" fill="url(#wrench-grad)" stroke="#090d16" stroke-width="4" />
    <path d="M 266,470 L 236,440 L 250,426 L 280,456 Z" fill="#0f172a" />
  </g>

  <g transform="rotate(45 256 256)">
    <polygon points="256,50 267,85 267,370 256,385 245,370 245,85" fill="url(#sword-grad)" stroke="#090d16" stroke-width="4" />
    <line x1="256" y1="75" x2="256" y2="370" stroke="#ffffff" stroke-width="2.5" opacity="0.7" />
    <rect x="222" y="370" width="68" height="14" rx="4" fill="#fb923c" stroke="#090d16" stroke-width="3" />
    <rect x="250" y="384" width="12" height="42" rx="3" fill="#475569" stroke="#090d16" stroke-width="3" />
    <circle cx="256" cy="436" r="11" fill="#facc15" stroke="#090d16" stroke-width="3" />
  </g>

  <!-- Monster Ball Outer Ring -->
  <circle cx="256" cy="256" r="116" fill="#090d16" stroke="#6366f1" stroke-width="8" />
  <path d="M 144 252 A 112 112 0 0 1 368 252 Z" fill="url(#ball-top)" />
  <path d="M 144 260 A 112 112 0 0 0 368 260 Z" fill="url(#ball-bottom)" />
  <rect x="140" y="248" width="232" height="16" fill="#090d16" />
  <circle cx="256" cy="256" r="38" fill="#090d16" stroke="#4f46e5" stroke-width="5" />
  <polygon points="256,230 282,256 256,282 230,256" fill="#38bdf8" filter="url(#glow)" />
  <polygon points="256,236 276,256 256,276 236,256" fill="#ffffff" />
`;

function generateOgpSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    ${LOGO_DEFS}

    <!-- Background Gradient for Canvas -->
    <linearGradient id="canvas-bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>

    <!-- Card Inner Gradient -->
    <linearGradient id="card-inner-bg" x1="0" y1="0" x2="0" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#111827" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0b0f19" stop-opacity="0.95" />
    </linearGradient>

    <!-- Outer Border Glow / Gradient for High Visibility in Dark & Light modes -->
    <linearGradient id="border-glow" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="30%" stop-color="#6366f1" />
      <stop offset="70%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#ec4899" />
    </linearGradient>

    <!-- Text Gradient for Title -->
    <linearGradient id="title-grad" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="70%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>

    <!-- Badge Gradient -->
    <linearGradient id="badge-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>

    <!-- Ambient Light Circles -->
    <radialGradient id="ambient-left" cx="280" cy="315" r="350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
      <stop offset="60%" stop-color="#4338ca" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>

    <radialGradient id="ambient-right" cx="880" cy="280" r="350" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.2" />
      <stop offset="60%" stop-color="#818cf8" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- 1. Full Canvas Background -->
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#canvas-bg)" />

  <!-- 2. Ambient Light / Radial Glows behind content -->
  <circle cx="280" cy="315" r="350" fill="url(#ambient-left)" />
  <circle cx="880" cy="280" r="350" fill="url(#ambient-right)" />

  <!-- 3. Hexagon Grid pattern in background -->
  <g stroke="#3b82f6" stroke-width="1.2" stroke-dasharray="4 8" opacity="0.15">
    <polygon points="150,60 210,95 210,165 150,200 90,165 90,95" fill="none" />
    <polygon points="1050,420 1110,455 1110,525 1050,560 990,525 990,455" fill="none" />
    <polygon points="620,80 680,115 680,185 620,220 560,185 560,115" fill="none" />
    <polygon points="650,440 710,475 710,545 650,580 590,545 590,475" fill="none" />
  </g>

  <!-- 4. High-Contrast Border Box (Ensures clear visibility on pure black, dark gray, or pure white backgrounds) -->
  <rect x="14" y="14" width="1172" height="602" rx="30" fill="none" stroke="url(#border-glow)" stroke-width="3.5" opacity="0.95" />
  <rect x="20" y="20" width="1160" height="590" rx="24" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.12" />

  <!-- 5. Logo Placement (Left Side, centered vertically at Y=145) -->
  <g transform="translate(105, 145) scale(0.664)">
    ${LOGO_PATHS}
  </g>

  <!-- 6. Typography / Content Section (Right Side) -->
  <!-- Category Badge -->
  <g transform="translate(510, 160)">
    <rect x="0" y="0" width="220" height="32" rx="16" fill="url(#badge-grad)" opacity="0.25" stroke="#6366f1" stroke-width="1.5" />
    <circle cx="16" cy="16" r="4.5" fill="#38bdf8" />
    <text x="30" y="21" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#38bdf8" letter-spacing="1.5">
      POKÉMON CHAMPIONS
    </text>
  </g>

  <!-- Main Title: poke-tool -->
  <g transform="translate(510, 290)">
    <!-- Text Drop Shadow -->
    <text x="3" y="4" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="94" font-weight="900" fill="#000000" opacity="0.7" letter-spacing="-2">
      poke-tool
    </text>
    <!-- Main Text -->
    <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="94" font-weight="900" fill="url(#title-grad)" letter-spacing="-2">
      poke-tool
    </text>
  </g>

  <!-- Subtitle / Tagline -->
  <text x="512" y="348" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="700" fill="#cbd5e1" letter-spacing="0.5">
    Analytics &amp; Party Simulator
  </text>

  <!-- Feature Pills / Badges (Clean, modern 2x2 grid) -->
  <g transform="translate(512, 400)">
    <!-- Feature 1: Party -->
    <g transform="translate(0, 0)">
      <rect x="0" y="0" width="160" height="38" rx="10" fill="#1e1b4b" fill-opacity="0.7" stroke="#4f46e5" stroke-width="1.2" />
      <circle cx="20" cy="19" r="4" fill="#818cf8" />
      <text x="34" y="24" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0">
        パーティ編成
      </text>
    </g>

    <!-- Feature 2: EV Calculator -->
    <g transform="translate(175, 0)">
      <rect x="0" y="0" width="160" height="38" rx="10" fill="#1e1b4b" fill-opacity="0.7" stroke="#7c3aed" stroke-width="1.2" />
      <circle cx="20" cy="19" r="4" fill="#c084fc" />
      <text x="34" y="24" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0">
        努力値計算
      </text>
    </g>

    <!-- Feature 3: Damage Ranking -->
    <g transform="translate(350, 0)">
      <rect x="0" y="0" width="175" height="38" rx="10" fill="#1e1b4b" fill-opacity="0.7" stroke="#db2777" stroke-width="1.2" />
      <circle cx="20" cy="19" r="4" fill="#f43f5e" />
      <text x="34" y="24" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0">
        火力・耐久検索
      </text>
    </g>

    <!-- Row 2 -->
    <g transform="translate(0, 50)">
      <rect x="0" y="0" width="180" height="38" rx="10" fill="#0f172a" fill-opacity="0.7" stroke="#0284c7" stroke-width="1.2" />
      <circle cx="20" cy="19" r="4" fill="#38bdf8" />
      <text x="34" y="24" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0">
        高速ローカル動作
      </text>
    </g>

    <g transform="translate(195, 50)">
      <rect x="0" y="0" width="160" height="38" rx="10" fill="#0f172a" fill-opacity="0.7" stroke="#059669" stroke-width="1.2" />
      <circle cx="20" cy="19" r="4" fill="#34d399" />
      <text x="34" y="24" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="600" fill="#e2e8f0">
        オフライン対応
      </text>
    </g>
  </g>

  <!-- 7. Footer domain badge / bottom right -->
  <g transform="translate(980, 560)">
    <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#64748b" letter-spacing="1">
      poke-tool.pages.dev
    </text>
  </g>
</svg>`;
}

async function main() {
  const svgString = generateOgpSvg();
  const outputPngPath = path.resolve(__dirname, '../public/ogp.png');

  console.log('Generating OGP image (1200x630)...');
  await sharp(Buffer.from(svgString))
    .png({ quality: 95, compressionLevel: 8 })
    .toFile(outputPngPath);

  const stats = fs.statSync(outputPngPath);
  console.log(
    `Successfully generated ${outputPngPath} (${(stats.size / 1024).toFixed(1)} KB)`
  );
}

main().catch((err) => {
  console.error('Error generating OGP image:', err);
  process.exit(1);
});
