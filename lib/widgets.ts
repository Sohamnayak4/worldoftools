// Names of the no-upload tools. Kept outside the client component so the
// server page can check a name before rendering.
export const WIDGET_NAMES = [
  "word-counter",
  "case-converter",
  "qr-code-generator",
  "password-generator",
  "json-formatter",
  "base64-encode-decode",
  "percentage-calculator",
] as const;

export type WidgetName = (typeof WIDGET_NAMES)[number];

export function isWidgetName(name: string): name is WidgetName {
  return (WIDGET_NAMES as readonly string[]).includes(name);
}
