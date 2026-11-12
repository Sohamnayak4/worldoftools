import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_PROMISE } from "./site";

// The share image for every page: the site mark, the page title, one line,
// and the ruler gauge with a bar stopping under the limit line.

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Bricolage-Bold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Hanken-Regular.ttf")),
]);

const BG = "#16181D";
const TEXT = "#E8E6E1";
const MUTED = "#9A9FA8";
const LINE = "#2C3038";
const ACCENT = "#F2B84B";

export async function renderOgImage({
  eyebrow,
  title,
  line,
}: {
  eyebrow?: string;
  title: string;
  line: string;
}) {
  const [bold, regular] = await fonts;
  const ticks = Array.from({ length: 41 }, (_, index) => index);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          padding: "64px 72px",
          fontFamily: "Hanken",
          color: TEXT,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: ACCENT,
              borderRadius: 8,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 5, height: 20, background: BG }} />
          </div>
          <div style={{ fontFamily: "Bricolage", fontSize: 34 }}>{SITE_NAME}</div>
          {eyebrow ? (
            <div style={{ marginLeft: "auto", fontSize: 28, color: MUTED }}>{eyebrow}</div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 64,
            fontFamily: "Bricolage",
            fontSize: title.length > 34 ? 66 : 80,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: MUTED, maxWidth: 980 }}>
          {line}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", position: "relative", height: 26, border: `2px solid ${LINE}` }}>
            <div style={{ width: "58%", height: "100%", background: ACCENT }} />
            <div
              style={{
                position: "absolute",
                left: "66%",
                top: -14,
                width: 4,
                height: 50,
                background: TEXT,
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {ticks.map((tick) => (
              <div
                key={tick}
                style={{ width: 2, height: tick % 5 === 0 ? 16 : 9, background: LINE }}
              />
            ))}
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 26, color: MUTED }}>
            {SITE_PROMISE}
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Bricolage", data: bold, style: "normal", weight: 700 },
        { name: "Hanken", data: regular, style: "normal", weight: 400 },
      ],
    },
  );
}
