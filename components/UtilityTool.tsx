"use client";

import dynamic from "next/dynamic";
import type { WidgetName } from "@/lib/widgets";

// The no-upload tools. Each one is its own chunk, so a page loads only the
// tool it shows. They still render on the server, so nothing shifts.
const WIDGETS = {
  "word-counter": dynamic(() => import("./utilities/WordCounter")),
  "case-converter": dynamic(() => import("./utilities/CaseConverter")),
  "qr-code-generator": dynamic(() => import("./utilities/QrCodeGenerator")),
  "password-generator": dynamic(() => import("./utilities/PasswordGenerator")),
  "json-formatter": dynamic(() => import("./utilities/JsonFormatter")),
  "base64-encode-decode": dynamic(() => import("./utilities/Base64Tool")),
  "percentage-calculator": dynamic(() => import("./utilities/PercentageCalculator")),
} satisfies Record<WidgetName, unknown>;

export function UtilityTool({ widget }: { widget: WidgetName }) {
  const Widget = WIDGETS[widget];
  return <Widget />;
}
