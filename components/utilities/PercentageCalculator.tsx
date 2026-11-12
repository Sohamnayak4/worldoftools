"use client";

import { useId, useState } from "react";
import { formatNumber, readNumber } from "@/lib/engines/text";
import { fieldClass, panelClass } from "./parts";

type Answer = { text: string; formula: string } | { error: string } | null;

function Calculator({
  title,
  first,
  second,
  solve,
}: {
  title: string;
  first: string;
  second: string;
  solve: (a: number, b: number) => Answer;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const id = useId();
  const x = readNumber(a);
  const y = readNumber(b);
  let answer: Answer = null;
  if (a.trim() !== "" && x === null) answer = { error: `"${a}" is not a number.` };
  else if (b.trim() !== "" && y === null) answer = { error: `"${b}" is not a number.` };
  else if (x !== null && y !== null) answer = solve(x, y);

  return (
    <section className="border-t border-line pt-4 first:border-t-0 first:pt-0">
      <h3 className="font-sans text-base font-semibold">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        <div>
          <label htmlFor={`${id}-a`} className="block text-sm text-muted">
            {first}
          </label>
          <input
            id={`${id}-a`}
            type="text"
            inputMode="decimal"
            value={a}
            onChange={(event) => setA(event.target.value)}
            className={`${fieldClass} w-36`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-b`} className="block text-sm text-muted">
            {second}
          </label>
          <input
            id={`${id}-b`}
            type="text"
            inputMode="decimal"
            value={b}
            onChange={(event) => setB(event.target.value)}
            className={`${fieldClass} w-36`}
          />
        </div>
      </div>
      <div aria-live="polite" className="mt-2 min-h-12">
        {answer && "error" in answer && <p className="text-sm text-over">{answer.error}</p>}
        {answer && "text" in answer && (
          <>
            <p className="font-semibold">{answer.text}</p>
            <p className="text-sm text-muted">{answer.formula}</p>
          </>
        )}
      </div>
    </section>
  );
}

export default function PercentageCalculator() {
  return (
    <div className={`${panelClass} space-y-4`}>
      <Calculator
        title="What is X percent of Y?"
        first="Percent (X)"
        second="Of (Y)"
        solve={(x, y) => ({
          text: `${formatNumber(x)}% of ${formatNumber(y)} is ${formatNumber((x / 100) * y)}.`,
          formula: `${formatNumber(x)} ÷ 100 × ${formatNumber(y)}`,
        })}
      />
      <Calculator
        title="X is what percent of Y?"
        first="Value (X)"
        second="Total (Y)"
        solve={(x, y) =>
          y === 0
            ? { error: "The total cannot be 0." }
            : {
                text: `${formatNumber(x)} is ${formatNumber((x / y) * 100)}% of ${formatNumber(y)}.`,
                formula: `${formatNumber(x)} ÷ ${formatNumber(y)} × 100`,
              }
        }
      />
      <Calculator
        title="Percentage change from X to Y"
        first="From (X)"
        second="To (Y)"
        solve={(x, y) => {
          if (x === 0) return { error: "A change from 0 has no percentage. Start from a number other than 0." };
          const change = ((y - x) / Math.abs(x)) * 100;
          const word = change > 0 ? "an increase" : change < 0 ? "a decrease" : "no change";
          return {
            text:
              change === 0
                ? "There is no change."
                : `From ${formatNumber(x)} to ${formatNumber(y)} is ${word} of ${formatNumber(Math.abs(change))}%.`,
            formula: `(${formatNumber(y)} − ${formatNumber(x)}) ÷ ${formatNumber(Math.abs(x))} × 100`,
          };
        }}
      />
    </div>
  );
}
