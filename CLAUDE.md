# worldof.tools

Project rules. Every step must follow them. The full build plan, the step list and the 46-tool registry seed are in docs/build-prompt.md.

## Master prompt

You are building worldof.tools, a free website of small file tools.
Every tool runs fully in the visitor's browser. No file ever leaves the device.
The site's promise, shown on every page: "Your files never leave your device."

GOAL
Rank on Google and get recommended by AI assistants for specific queries like
"compress video for discord" or "compress image to 50kb". SEO and AI citation
are the product, so every page must be fast, static, and full of real facts.

STACK
- Next.js (latest stable, App Router), TypeScript, Tailwind CSS.
- Every page statically generated. No database, no auth, no accounts.
- No server route may ever receive a user's file.
- Deployed on Vercel. Domain: worldof.tools.
- No third-party scripts, trackers, or ad networks. Fonts self-hosted via next/font.
  The one exception, decided by the owner on 2026-11-12, is the owner's
  self-hosted Pixelmoth analytics (lib/site.ts, loaded in app/layout.tsx). It
  sets two first-party cookies: pm_vid (visitor id, 1 year) and pm_sid
  (session id, 30 minutes). The privacy page must name both. No other
  analytics, and no consent banner.
- Before using any library (ffmpeg.wasm, pdf-lib, pdf.js, HEIC decoders, WebCodecs
  helpers), read its current docs. Do not rely on memory for versions, APIs,
  or required headers.

ARCHITECTURE
1. Tool registry: one typed file (lib/tools.ts) is the single source of truth.
   Each entry has: slug, category, engine, preset (for example targetBytes),
   primaryKeyword, secondaryKeywords[], title, h1, metaDescription,
   shortAnswer (one or two sentences), howItWorks[], faqs[{q, a}], relatedSlugs[].
   Adding a tool must mean adding one registry entry, not a new page file.
2. One dynamic route renders every tool page from the registry at build time.
3. Page template, in this order:
   h1 (contains the primary keyword)
   shortAnswer (plain text, in the HTML, quotable by an AI answer)
   the tool itself
   "How it works" (3 to 5 short steps)
   Facts block (the real platform limit, supported formats, max file size)
   FAQ (real questions people search)
   Related tools (internal links)
4. All text content must be server-rendered HTML. Only the tool widget is a
   client component. Heavy engines load only after the visitor picks a file.
5. Engines live in lib/engines/ and run in Web Workers so the page never freezes:
   video and audio, image, pdf, text.
6. Platform limits (Discord, WhatsApp, Gmail and others) live in lib/limits.ts.
   Each has: value, source URL, date checked. Look each one up on the platform's
   official help page. Never write a limit from memory. Show me the list to confirm.
7. Reserve an empty AdSlot component below the tool and in the footer.
   It renders nothing at launch but holds its layout space rules for later.

KEYWORD RULES
- One primary keyword per page. No two pages share a primary keyword.
- The slug, title, and h1 all contain the primary keyword.
- Secondary keywords appear naturally in the how-it-works and facts text.
- FAQ questions are written the way people type them.
- Variant pages (for example 50kb and 100kb) must differ in preset and facts,
  not just in the number in the title.

PRODUCT RULES
- Works on phones. Cap file size per tool and explain the cap in plain words.
- Always show: original size, target, result size, and whether it fits the limit.
- Never fail silently. Every error says what went wrong and what to do next.
- Target-size tools must verify the output is under the limit and retry lower if not.

COPY RULES
- Plain, short sentences. Sentence case. No hype words. No em dashes.
- Buttons say what happens: "Compress video", "Download file".

WORKING RULES
- I will give you one step at a time. Finish it, run the build, and tell me
  exactly how to verify the done check. Do not start the next step.
- If something in a step is risky or unclear, stop and ask before building.
- Save this message and the design rules below as CLAUDE.md.

## Design rules

DESIGN DIRECTION: "workshop ruler"
A dark workbench surface, tape-measure yellow as the only accent, and a ruler
gauge as the signature element. Minimal. No decoration that carries no information.

TOKENS (define as CSS variables, dark is the default theme)
--bg:        #16181D   graphite surface
--surface:   #1E2128   raised areas (dropzone, result)
--line:      #2C3038   1px borders and ruler ticks
--text:      #E8E6E1   warm off-white
--muted:     #9A9FA8   secondary text
--accent:    #F2B84B   tape-measure yellow: primary button, gauge fill, focus ring
--over:      #E5604D   only for "over the limit" and errors
Light theme exists as a second set of the same tokens behind a toggle.
Dark loads by default for everyone.

TYPE
- Headings: Bricolage Grotesque. Body and UI: Hanken Grotesk.
  Load both with next/font. If either is unavailable, pick the closest
  non-default grotesque and tell me. Never Inter, Roboto, Arial, Space Grotesk
  or Geist.
- Sizes and numbers use tabular figures so they do not jump while updating.
- Sentence case everywhere. Body lines under 75 characters.

SIGNATURE ELEMENT: the limit gauge
- A horizontal ruler with tick marks and MB or KB labels.
- A marker shows the limit (for example 10 MB). A bar shows the file's size.
- Before processing the bar runs past the marker in --over.
  After processing it sits under the marker in --accent.
- This is the only place with animation: the bar moving to its new size.

LAYOUT (revised by the owner on 2026-11-12, after the first UI pass)
- App shell: a left sidebar on wide screens with the logo, a Cmd K / Ctrl K
  tool search, every category with its tool count and tools, and links to
  About and Privacy. On phones the sidebar opens from a menu button.
- Homepage: a short headline and line, a large search box, a "Start with"
  row of featured tool tiles, then every tool grouped by category in
  columns, each with its icon, name and one-line blurb.
- Tool pages: the tool is centered, about 880px wide, directly under the
  breadcrumb, h1 and short answer, above the fold on mobile. Under it, a
  strip of three short fact tiles, then the page content.
- Borders (1px, --line) separate things. No shadows.
- Radius: 6px on buttons, inputs and tiles, 0 on the gauge. Nothing fully
  rounded.
- Ad spaces are reserved in the sidebar and above the homepage tool list.
  They render nothing until ads are set up.

DO NOT
- No gradients, glow, blur, glassmorphism, or background patterns.
- Bordered tiles only for the "Start with" row and the facts strip. No card
  inside a card, and no tiles elsewhere.
- No all-caps eyebrow labels above headings. No pills or badges for decoration.
- No emoji. Icons (lucide-react, outline only) are allowed where they label
  something: one per tool and one per category, plus functional icons on
  controls such as search, menu and upload. No decorative icons.
- No arrows appended to links or buttons.
- No fade-in or slide-up on scroll. No hover effects beyond a color change.
- No stock illustrations, no fake testimonials, no stats counters.
- No headline with one word in a different color or italic.
- No monospace font used just to look technical.

QUALITY FLOOR
- Works at 360px wide. Visible keyboard focus in --accent.
- Respects prefers-reduced-motion (gauge jumps instead of animating).
- Text contrast passes WCAG AA in both themes.
- No layout shift when the tool loads or when results appear.

Before writing UI code, show me a short plan: the tokens, an ASCII wireframe
of the tool page and the homepage, and anything you changed from these rules
and why. Wait for my OK.
