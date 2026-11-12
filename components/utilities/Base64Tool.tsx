"use client";

import { useId, useState } from "react";
import { decodeBase64, encodeBase64 } from "@/lib/engines/text";
import { CopyButton, areaClass, panelClass, primaryButton, secondaryButton } from "./parts";

export default function Base64Tool() {
  const [text, setText] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const inputId = useId();
  const outputId = useId();
  const safeId = useId();
  return (
    <div className={panelClass}>
      <label htmlFor={inputId} className="block text-sm text-muted">
        Text or Base64
      </label>
      <textarea
        id={inputId}
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
        className={areaClass}
      />
      <label htmlFor={safeId} className="mt-3 flex items-center gap-2">
        <input
          id={safeId}
          type="checkbox"
          checked={urlSafe}
          onChange={(event) => setUrlSafe(event.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        URL-safe: use - and _ and leave out the = padding
      </label>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          className={primaryButton}
          onClick={() => {
            setError(text === "" ? "Type or paste some text first." : "");
            setOutput(text === "" ? "" : encodeBase64(text, urlSafe));
          }}
        >
          Encode to Base64
        </button>
        <button
          type="button"
          className={secondaryButton}
          onClick={() => {
            const result = decodeBase64(text);
            setOutput(result.ok ? result.text : "");
            setError(result.ok ? "" : result.message);
          }}
        >
          Decode from Base64
        </button>
      </div>
      <p role="status" className="mt-3 min-h-5 text-sm text-over">
        {error}
      </p>
      <label htmlFor={outputId} className="mt-2 block text-sm text-muted">
        Result
      </label>
      <textarea id={outputId} value={output} readOnly spellCheck={false} className={areaClass} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <CopyButton text={output} tool="base64-encode-decode" />
      </div>
    </div>
  );
}
