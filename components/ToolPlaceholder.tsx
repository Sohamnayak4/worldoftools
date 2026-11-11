// Stands in for the tool widget until step 2. The height is fixed so the
// page does not shift when the real widget replaces it.
export function ToolPlaceholder() {
  return (
    <div className="flex min-h-[180px] items-center rounded-ctl border border-line bg-surface p-4">
      <p className="text-muted">
        The tool goes here. The file picker is built in step 2.
      </p>
    </div>
  );
}
