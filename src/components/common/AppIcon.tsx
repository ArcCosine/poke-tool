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
        <linearGradient id="app-sword-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
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

      <polygon
        points="256,110 376,178 376,334 256,402 136,334 136,178"
        stroke="#4338ca"
        strokeWidth="3"
        strokeDasharray="6 6"
        fill="none"
        opacity="0.6"
      />

      <g opacity="0.45">
        <line
          x1="140"
          y1="140"
          x2="372"
          y2="372"
          stroke="url(#app-sword-grad)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <line
          x1="372"
          y1="140"
          x2="140"
          y2="372"
          stroke="url(#app-sword-grad)"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </g>

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
