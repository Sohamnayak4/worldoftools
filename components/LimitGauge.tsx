import { KB, MB, formatBytes } from "@/lib/format";

// The limit gauge: a ruler that shows a file's size against a limit line.
// With no file it shows only the ruler and the limit marker.
// It has no state, so it renders on the server and inside client widgets.

type LimitGaugeProps = {
  limitBytes: number;
  sizeBytes?: number;
  // Size the ruler is scaled to. Pass the original file size so the ticks
  // stay still while the bar moves to the result size.
  scaleBytes?: number;
};

const NICE_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

function buildScale(limitBytes: number, sizeBytes: number) {
  const unit = limitBytes >= MB ? MB : KB;
  const unitLabel = unit === MB ? "MB" : "KB";
  const needed = Math.max(limitBytes * 2.5, sizeBytes * 1.1) / unit;
  const major =
    NICE_STEPS.find((step) => needed / step <= 5) ??
    NICE_STEPS[NICE_STEPS.length - 1];
  const max = Math.ceil(needed / major) * major;
  const minor = major / 5;
  const ticks: { at: number; major: boolean }[] = [];
  for (let i = 0; i <= Math.round(max / minor); i++) {
    ticks.push({ at: i * minor, major: i % 5 === 0 });
  }
  return { unit, unitLabel, max, ticks };
}

export function LimitGauge({
  limitBytes,
  sizeBytes,
  scaleBytes,
}: LimitGaugeProps) {
  const { unit, unitLabel, max, ticks } = buildScale(
    limitBytes,
    Math.max(sizeBytes ?? 0, scaleBytes ?? 0),
  );
  const pct = (bytes: number) => Math.min(100, (bytes / (max * unit)) * 100);
  const hasFile = sizeBytes !== undefined;
  const over = hasFile && sizeBytes > limitBytes;
  const majors = ticks.filter((tick) => tick.major);

  const summary = !hasFile
    ? `Limit ${formatBytes(limitBytes)}. No file picked yet.`
    : over
      ? `${formatBytes(sizeBytes)}. Over the ${formatBytes(limitBytes)} limit.`
      : `${formatBytes(sizeBytes)}. Fits under the ${formatBytes(limitBytes)} limit.`;

  return (
    <div role="img" aria-label={summary} className="select-none">
      <div className="relative h-6 text-sm">
        <span
          className="absolute bottom-1 whitespace-nowrap pl-1.5"
          style={{ left: `${pct(limitBytes)}%` }}
        >
          Limit {formatBytes(limitBytes)}
        </span>
      </div>
      <div className="relative h-4 border border-line bg-surface">
        <div
          className={`gauge-bar absolute inset-y-0 left-0 ${over ? "bg-over" : "bg-accent"}`}
          style={{ width: `${hasFile ? pct(sizeBytes) : 0}%` }}
        />
        <div
          className="absolute -bottom-1 -top-6 w-0.5 bg-text"
          style={{ left: `${pct(limitBytes)}%` }}
        />
      </div>
      <div className="relative h-2.5">
        {ticks.map((tick) => (
          <span
            key={tick.at}
            className={`absolute top-0 w-px bg-line ${tick.major ? "h-2.5" : "h-1.5"}`}
            style={{ left: `min(${(tick.at / max) * 100}%, calc(100% - 1px))` }}
          />
        ))}
      </div>
      <div className="relative h-5 text-xs text-muted">
        {majors.map((tick, i) => {
          const last = i === majors.length - 1;
          const shift = i === 0 ? "0" : last ? "-100%" : "-50%";
          return (
            <span
              key={tick.at}
              className="absolute top-0.5 whitespace-nowrap"
              style={{
                left: `${(tick.at / max) * 100}%`,
                transform: `translateX(${shift})`,
              }}
            >
              {last ? `${tick.at} ${unitLabel}` : tick.at}
            </span>
          );
        })}
      </div>
    </div>
  );
}
