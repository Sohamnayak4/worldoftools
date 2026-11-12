"use client";

import { useId, useState } from "react";
import { type CaseName, convertCase } from "@/lib/engines/text";
import { CopyButton, areaClass, panelClass, secondaryButton } from "./parts";

const BUTTONS: [CaseName, string][] = [
  ["sentence", "Sentence case"],
  ["lower", "lower case"],
  ["upper", "UPPER CASE"],
  ["title", "Title Case"],
  ["camel", "camelCase"],
  ["snake", "snake_case"],
  ["kebab", "kebab-case"],
];

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [last, setLast] = useState<string | null>(null);
  const inputId = useId();
  const outputId = useId();
  return (
    <div className={panelClass}>
      <label htmlFor={inputId} className="block text-sm text-muted">
        Your text
      </label>
      <textarea
        id={inputId}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste the text you want to change."
        className={areaClass}
      />
      <div role="group" aria-label="Convert to" className="mt-3 flex flex-wrap gap-2">
        {BUTTONS.map(([name, label]) => (
          <button
            key={name}
            type="button"
            className={secondaryButton}
            aria-pressed={last === name}
            onClick={() => {
              setResult(convertCase(text, name));
              setLast(name);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <label htmlFor={outputId} className="mt-4 block text-sm text-muted">
        Result
      </label>
      <textarea
        id={outputId}
        value={result}
        readOnly
        placeholder="Press a button above to see the result here."
        className={areaClass}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <CopyButton text={result} tool="case-converter" />
      </div>
    </div>
  );
}
