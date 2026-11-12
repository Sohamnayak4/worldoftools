// Reserved ad positions. Ads are not live yet, so every slot renders
// nothing and takes no space. When ads are turned on, set `enabled` and the
// slot holds `reservedHeight` from first paint so nothing shifts.
type AdSlotProps = {
  position: "below-tool" | "footer" | "sidebar" | "featured";
  reservedHeight?: number;
  enabled?: boolean;
};

export function AdSlot({
  position,
  reservedHeight = 250,
  enabled = false,
}: AdSlotProps) {
  if (!enabled) return null;
  return (
    <div
      data-ad-slot={position}
      style={{ minHeight: reservedHeight }}
      className="my-6 border border-line"
    />
  );
}
