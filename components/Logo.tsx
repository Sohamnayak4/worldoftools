// The site mark: a file bar stopping short of the limit line. Same shapes as
// the favicon. The limit line uses the text color, so it works in both themes.
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="2" y="12" width="18" height="8" fill="var(--accent)" />
      <rect x="23" y="5" width="3.5" height="22" fill="currentColor" />
    </svg>
  );
}
