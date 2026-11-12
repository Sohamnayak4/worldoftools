"use client";

import { useId, useState } from "react";
import { type JsonResult, formatJson } from "@/lib/engines/text";
import { CopyButton, areaClass, fieldClass, panelClass, primaryButton, secondaryButton } from "./parts";

type Indent = "2" | "4" | "tab";

export default function JsonFormatter() {
  const [text, setText] = useState("");
  const [indent, setIndent] = useState<Indent>("2");
  const [sort, setSort] = useState(false);
  const [result, setResult] = useState<JsonResult | null>(null);
  const inputId = useId();
  const outputId = useId();
  const indentId = useId();
  const sortId = useId();

  const output = result?.ok ? result.text : "";
  return (
    <div className={panelClass}>
      <label htmlFor={inputId} className="block text-sm text-muted">
        Your JSON
      </label>
      <textarea
        id={inputId}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={'{"name": "Ada", "tags": ["math", "code"]}'}
        spellCheck={false}
        className={`${areaClass} font-mono text-sm`}
      />
      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div>
          <label htmlFor={indentId} className="block text-sm text-muted">
            Indent with
          </label>
          <select
            id={indentId}
            value={indent}
            onChange={(event) => setIndent(event.target.value as Indent)}
            className={fieldClass}
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tabs</option>
          </select>
        </div>
        <label htmlFor={sortId} className="flex items-center gap-2 pb-2.5">
          <input
            id={sortId}
            type="checkbox"
            checked={sort}
            onChange={(event) => setSort(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Sort keys from A to Z
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" className={primaryButton} onClick={() => setResult(formatJson(text, indent, sort))}>
          Format JSON
        </button>
        <button type="button" className={secondaryButton} onClick={() => setResult(formatJson(text, "none", sort))}>
          Minify JSON
        </button>
      </div>
      <p role="status" className="mt-3 min-h-5 text-sm text-over">
        {result && !result.ok
          ? result.line !== undefined
            ? `Not valid JSON at line ${result.line}, column ${result.column}. ${result.message}`
            : `Not valid JSON. ${result.message}`
          : ""}
      </p>
      <label htmlFor={outputId} className="mt-2 block text-sm text-muted">
        Result
      </label>
      <textarea
        id={outputId}
        value={output}
        readOnly
        spellCheck={false}
        className={`${areaClass} font-mono text-sm`}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <CopyButton text={output} />
      </div>
    </div>
  );
}
