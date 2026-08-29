// Decorative Tibetan-inspired accents. Kept abstract/geometric rather than
// literal reproductions of sacred symbols, in the same spirit as the
// endless-knot (dpal be'u) motif: continuous interwoven line work.

export function EndlessKnot({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className={className}
      {...props}
    >
      <path d="M20 30 Q20 20 30 20 Q50 20 50 40 Q50 60 70 60 Q80 60 80 70 Q80 80 70 80 Q50 80 50 60 Q50 40 30 40 Q20 40 20 30Z" />
      <path d="M50 20 Q50 40 30 40 M50 80 Q50 60 70 60" opacity="0.6" />
    </svg>
  );
}

export function CloudDivider({ className = "" }) {
  return (
    <svg
      viewBox="0 0 400 20"
      className={className}
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M0 10 Q10 2 20 10 T40 10 T60 10 T80 10 T100 10 T120 10 T140 10 T160 10 T180 10 T200 10 T220 10 T240 10 T260 10 T280 10 T300 10 T320 10 T340 10 T360 10 T380 10 T400 10" />
    </svg>
  );
}

// Subtle repeating cloud-scroll background, meant to be applied at very low
// opacity as a page texture rather than a foreground graphic.
export function CloudPatternBackground({ className = "" }) {
  return (
    <svg
      className={className}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="cloud-scroll" width="60" height="60" patternUnits="userSpaceOnUse">
          <path
            d="M0 30 Q7.5 20 15 30 T30 30 T45 30 T60 30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M0 45 Q7.5 35 15 45 T30 45 T45 45 T60 45"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            opacity="0.6"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cloud-scroll)" />
    </svg>
  );
}
