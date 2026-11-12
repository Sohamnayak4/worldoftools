"use client";

import { useId, useState } from "react";
import { countText, formatMinutes } from "@/lib/engines/text";
import { areaClass, panelClass } from "./parts";

const READ_WPM = 200;
const SPEAK_WPM = 130;

export default function WordCounter() {
  const [text, setText] = useState("");
  const id = useId();
  const counts = countText(text);
  const rows: [string, string][] = [
    ["Words", counts.words.toLocaleString()],
    ["Characters", counts.characters.toLocaleString()],
    ["Characters without spaces", counts.charactersNoSpaces.toLocaleString()],
    ["Sentences", counts.sentences.toLocaleString()],
    ["Paragraphs", counts.paragraphs.toLocaleString()],
    [`Reading time at ${READ_WPM} words a minute`, formatMinutes(counts.words / READ_WPM)],
    [`Speaking time at ${SPEAK_WPM} words a minute`, formatMinutes(counts.words / SPEAK_WPM)],
  ];
  return (
    <div className={panelClass}>
      <label htmlFor={id} className="block text-sm text-muted">
        Your text
      </label>
      <textarea
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type or paste your text here."
        className={areaClass}
      />
      <dl aria-live="polite" className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
