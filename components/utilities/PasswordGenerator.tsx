"use client";

import { useId, useState } from "react";
import { type PasswordSet, makePassword } from "@/lib/engines/text";
import { CopyButton, fieldClass, panelClass, primaryButton } from "./parts";

const SETS: [PasswordSet, string][] = [
  ["upper", "Uppercase letters, A to Z"],
  ["lower", "Lowercase letters, a to z"],
  ["numbers", "Numbers, 0 to 9"],
  ["symbols", "Symbols, like ! # $ %"],
];

function strengthWord(bits: number): string {
  if (bits < 50) return "weak";
  if (bits < 80) return "fair";
  if (bits < 110) return "strong";
  return "very strong";
}

export default function PasswordGenerator() {
  const [lengthText, setLengthText] = useState("20");
  const [sets, setSets] = useState<PasswordSet[]>(["upper", "lower", "numbers", "symbols"]);
  const [noLookAlikes, setNoLookAlikes] = useState(false);
  const [result, setResult] = useState<{ password: string; bits: number } | null>(null);
  const lengthId = useId();
  const outputId = useId();
  const lookId = useId();

  const length = Number(lengthText);
  const lengthOk = Number.isInteger(length) && length >= 8 && length <= 128;
  const problem = !lengthOk
    ? "Type a length from 8 to 128."
    : sets.length === 0
      ? "Choose at least one kind of character."
      : null;

  function make() {
    if (problem) return;
    setResult(makePassword(length, sets, noLookAlikes));
  }

  // Passwords are only made on the visitor's device, when they ask, so no
  // password is ever part of the page HTML.
  return (
    <div className={panelClass}>
      <label htmlFor={outputId} className="block text-sm text-muted">
        Password
      </label>
      <input
        id={outputId}
        type="text"
        readOnly
        value={result?.password ?? ""}
        spellCheck={false}
        autoComplete="off"
        placeholder="Press Make password"
        className={`${fieldClass} font-semibold tracking-wide`}
      />
      <p aria-live="polite" className="mt-1 min-h-5 text-sm text-muted">
        {result ? `About ${result.bits} bits, which is ${strengthWord(result.bits)}.` : ""}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className={primaryButton} disabled={problem !== null} onClick={make}>
          {result ? "Make new password" : "Make password"}
        </button>
        <CopyButton text={result?.password ?? ""} tool="password-generator" label="Copy password" />
      </div>

      <div className="mt-4">
        <label htmlFor={lengthId} className="block text-sm text-muted">
          Length, 8 to 128
        </label>
        <input
          id={lengthId}
          type="text"
          inputMode="numeric"
          value={lengthText}
          onChange={(event) => setLengthText(event.target.value)}
          className={`${fieldClass} w-28`}
        />
      </div>
      <fieldset className="mt-3">
        <legend className="text-sm text-muted">Characters to use</legend>
        {SETS.map(([set, label]) => (
          <label key={set} className="mt-1 flex items-center gap-2">
            <input
              type="checkbox"
              checked={sets.includes(set)}
              onChange={(event) =>
                setSets((current) =>
                  event.target.checked ? [...current, set] : current.filter((item) => item !== set),
                )
              }
              className="h-4 w-4 accent-[var(--accent)]"
            />
            {label}
          </label>
        ))}
        <label htmlFor={lookId} className="mt-2 flex items-center gap-2">
          <input
            id={lookId}
            type="checkbox"
            checked={noLookAlikes}
            onChange={(event) => setNoLookAlikes(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Leave out look-alike characters, such as 0, O, l, 1 and I
        </label>
      </fieldset>
      <p role="status" className="mt-2 min-h-5 text-sm text-over">
        {problem}
      </p>
    </div>
  );
}
