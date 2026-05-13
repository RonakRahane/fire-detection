export default function BrandMark({ size = 18, className }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 6V1h5M12 1h5v5M17 12v5h-5M6 17H1v-5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6.5" y="6.5" width="5" height="5" fill="#d97757" />
    </svg>
  );
}
