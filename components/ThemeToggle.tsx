"use client";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked. The theme still changes for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-ctl border border-line px-3 py-1.5 text-sm text-muted hover:text-text"
    >
      <span className="when-dark">Light theme</span>
      <span className="when-light">Dark theme</span>
    </button>
  );
}
