// Reusable DayGig logo — use size prop to scale (default 28)
export default function DayGigLogo({ size = 28, showName = true, className = "" }) {
  return (
    <div className={`daygig-logo ${className}`} style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3 + "px" }}>
      {/* Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#171717" />
        {/* Sun rays */}
        <path
          d="M16 4v2M16 26v2M4 16h2M26 16h2M7.5 7.5l1.4 1.4M23.1 23.1l1.4 1.4M7.5 24.5l1.4-1.4M23.1 8.9l1.4-1.4"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Sun circle */}
        <circle cx="16" cy="16" r="5.5" fill="white" opacity="0.15" />
        <circle cx="16" cy="16" r="5.5" stroke="white" strokeWidth="2" />
        {/* Lightning bolt inside */}
        <path
          d="M17 11.5l-2.5 4h2.5L15 21l4-5.5h-2.5L17 11.5z"
          fill="white"
        />
      </svg>
      {showName && (
        <span
          style={{
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: size * 0.65 + "px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "#111",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          DayGig
        </span>
      )}
    </div>
  );
}
