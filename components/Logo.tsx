// The site mark: a yellow square with one ruler tick. Same shapes as the
// favicon. Fixed colors, so it reads the same in both themes.
export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="5" fill="#F2B84B" />
      <rect x="14.5" y="0" width="3" height="13" fill="#16181D" />
    </svg>
  );
}
