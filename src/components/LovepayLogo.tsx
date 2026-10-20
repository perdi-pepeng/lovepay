interface Props {
  size?: number
  className?: string
}

export default function LovepayLogo({ size = 40, className = '' }: Props) {
  const id = 'lp-grad'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main gradient: deep pink → hot pink → rose */}
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff1f6e" />
          <stop offset="50%" stopColor="#f43f8e" />
          <stop offset="100%" stopColor="#fb7bb0" />
        </linearGradient>
        {/* Shine overlay */}
        <linearGradient id={`${id}-shine`} x1="10" y1="8" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Glow filter */}
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Drop shadow */}
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f43f8e" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Rounded square background */}
      <rect width="40" height="40" rx="12" fill="url(#lp-grad-fill)" filter={`url(#${id}-shadow)`} />

      {/* Subtle inner border */}
      <rect width="40" height="40" rx="12" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

      {/* Heart shape — centered, proportional */}
      <path
        d="M20 30.5
           C20 30.5 8.5 23.2 8.5 15.8
           C8.5 12.0 11.5 9.0 15.2 9.0
           C17.2 9.0 19.0 9.9 20 11.3
           C21.0 9.9 22.8 9.0 24.8 9.0
           C28.5 9.0 31.5 12.0 31.5 15.8
           C31.5 23.2 20 30.5 20 30.5Z"
        fill={`url(#${id}-fill)`}
        filter={`url(#${id}-glow)`}
      />

      {/* White heart (slightly smaller) for layered depth */}
      <path
        d="M20 28.0
           C20 28.0 10.5 21.8 10.5 15.8
           C10.5 13.1 12.8 11.0 15.5 11.0
           C17.3 11.0 18.9 11.9 20 13.2
           C21.1 11.9 22.7 11.0 24.5 11.0
           C27.2 11.0 29.5 13.1 29.5 15.8
           C29.5 21.8 20 28.0 20 28.0Z"
        fill="white"
        opacity="0.18"
      />

      {/* Shine highlight on top-left of heart */}
      <path
        d="M20 28.0
           C20 28.0 10.5 21.8 10.5 15.8
           C10.5 13.1 12.8 11.0 15.5 11.0
           C17.3 11.0 18.9 11.9 20 13.2
           C21.1 11.9 22.7 11.0 24.5 11.0
           C27.2 11.0 29.5 13.1 29.5 15.8
           C29.5 21.8 20 28.0 20 28.0Z"
        fill={`url(#${id}-shine)`}
      />
    </svg>
  )
}
