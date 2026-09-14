import type React from 'react';

interface AppIconProps {
  className?: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({
  className = 'w-6 h-6',
  size,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Poke-Tool Logo"
    >
      <defs>
        <linearGradient
          id="app-bg-grad"
          x1="64"
          y1="64"
          x2="448"
          y2="448"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient
          id="app-shield-grad"
          x1="128"
          y1="96"
          x2="384"
          y2="416"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="app-wrench-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="app-sword-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
        <linearGradient
          id="app-ball-top"
          x1="160"
          y1="140"
          x2="352"
          y2="256"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient
          id="app-ball-bottom"
          x1="160"
          y1="256"
          x2="352"
          y2="372"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Outer Rounded Frame */}
      <rect
        x="24"
        y="24"
        width="464"
        height="464"
        rx="112"
        fill="url(#app-bg-grad)"
      />
      <rect
        x="36"
        y="36"
        width="440"
        height="440"
        rx="100"
        fill="url(#app-shield-grad)"
        stroke="url(#app-bg-grad)"
        strokeWidth="4"
      />

      {/* Tech Grid */}
      <polygon
        points="256,110 376,178 376,334 256,402 136,334 136,178"
        stroke="#4338ca"
        strokeWidth="3"
        strokeDasharray="6 6"
        fill="none"
        opacity="0.6"
      />

      {/* 1. Spanner / Wrench (Top-Left to Bottom-Right) */}
      <g transform="rotate(-45 256 256)">
        <rect
          x="243"
          y="80"
          width="26"
          height="352"
          rx="6"
          fill="url(#app-wrench-grad)"
          stroke="#090d16"
          strokeWidth="4"
        />
        <rect
          x="250"
          y="140"
          width="12"
          height="232"
          rx="4"
          fill="#0f172a"
          opacity="0.5"
        />
        <path
          d="M 230,104 C 216,90 216,66 234,50 C 248,36 270,36 284,50 C 294,58 298,70 296,82 L 274,86 C 275,80 272,74 266,68 C 258,60 246,62 238,70 C 230,78 232,90 240,98 Z"
          fill="url(#app-wrench-grad)"
          stroke="#090d16"
          strokeWidth="4"
        />
        <path d="M 246,42 L 276,72 L 262,86 L 232,56 Z" fill="#0f172a" />
        <path
          d="M 282,408 C 296,422 296,446 278,462 C 264,476 242,476 228,462 C 218,454 214,442 216,430 L 238,426 C 237,432 240,438 246,444 C 254,452 266,450 274,442 C 282,434 280,422 272,414 Z"
          fill="url(#app-wrench-grad)"
          stroke="#090d16"
          strokeWidth="4"
        />
        <path d="M 266,470 L 236,440 L 250,426 L 280,456 Z" fill="#0f172a" />
      </g>

      {/* 2. Battle Sword (Top-Right to Bottom-Left) */}
      <g transform="rotate(45 256 256)">
        <polygon
          points="256,50 267,85 267,370 256,385 245,370 245,85"
          fill="url(#app-sword-grad)"
          stroke="#090d16"
          strokeWidth="4"
        />
        <line
          x1="256"
          y1="75"
          x2="256"
          y2="370"
          stroke="#ffffff"
          strokeWidth="2.5"
          opacity="0.7"
        />
        <rect
          x="222"
          y="370"
          width="68"
          height="14"
          rx="4"
          fill="#fb923c"
          stroke="#090d16"
          strokeWidth="3"
        />
        <rect
          x="250"
          y="384"
          width="12"
          height="42"
          rx="3"
          fill="#475569"
          stroke="#090d16"
          strokeWidth="3"
        />
        <circle
          cx="256"
          cy="436"
          r="11"
          fill="#facc15"
          stroke="#090d16"
          strokeWidth="3"
        />
      </g>

      {/* Monster Ball */}
      <circle
        cx="256"
        cy="256"
        r="116"
        fill="#090d16"
        stroke="#6366f1"
        strokeWidth="8"
      />
      <path d="M 144 252 A 112 112 0 0 1 368 252 Z" fill="url(#app-ball-top)" />
      <path
        d="M 144 260 A 112 112 0 0 0 368 260 Z"
        fill="url(#app-ball-bottom)"
      />
      <rect x="140" y="248" width="232" height="16" fill="#090d16" />

      {/* Ball Center Button */}
      <circle
        cx="256"
        cy="256"
        r="38"
        fill="#090d16"
        stroke="#4f46e5"
        strokeWidth="5"
      />
      <polygon points="256,230 282,256 256,282 230,256" fill="#38bdf8" />
      <polygon points="256,236 276,256 256,276 236,256" fill="#ffffff" />
    </svg>
  );
};
