# worldof.tools build prompt

Nov 11, 2026 · @Soham

## How to use this

Paste the master prompt and the design rules into Claude Code once, then run the build steps one at a time.

1. Start a new repo and open Claude Code in it.
2. Paste the Master prompt and the Design rules sections together as the first message. Ask it to save both as `CLAUDE.md` so every later step follows them.
3. Paste Step 1. When its done check passes, paste Step 2, and so on.
4. Do not skip the done checks. Step 3 (video in the browser) is the one most likely to fail, so test it on your phone before going further.
5. Ads are out of scope for launch. The layout only reserves the space.

## Master prompt

This sets the project context and the rules every later step must follow.

```text
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
```

## Design rules

Dark-first, minimal, and built around one idea: a tape measure. The site is about fitting a file under a limit, so the one memorable element is a ruler-style gauge that shows the file's size against the limit line. Everything else stays quiet.

The don't list comes from the patterns that make a page read as AI-generated: default fonts, gradients, glow, glass, identical rounded cards, eyebrow labels, and scroll animations.

```text
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

LAYOUT
- Left-aligned, single column, max width about 720px on tool pages.
- The tool sits directly under the h1 and short answer, above the fold on mobile.
- Homepage is the tool index itself: a search box and a plain grouped list of
  tool names by category. No hero section, no marketing headline, no feature grid.
- Borders (1px, --line) separate things. No shadows.
- Radius: 6px on buttons and inputs, 0 on the gauge. Nothing fully rounded.

DO NOT
- No gradients, glow, blur, glassmorphism, or background patterns.
- No grid of identical rounded cards. No card inside a card.
- No all-caps eyebrow labels above headings. No pills or badges for decoration.
- No emoji or decorative icons. A small file-type label in text is enough.
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
```

## Build steps

Eleven steps, run in order. Each one ends with a done check you verify yourself before pasting the next.

### Step 1: Skeleton and preview deploy

```text
Step 1. Scaffold the project per CLAUDE.md.
- Next.js, TypeScript, Tailwind, design tokens, fonts, dark default with a
  light toggle.
- lib/tools.ts with the registry type and ONE entry: compress-video-to-size.
- The dynamic tool route and the page template, with a placeholder where the
  tool widget will go.
- A bare homepage that lists registry entries by category.
- Show me the design plan first (tokens and ASCII wireframes), then build.
Done check: the build passes, and I can deploy to a Vercel preview URL and
see the tool page with all template sections in dark theme on my phone.
```

### Step 2: Shared tool shell

```text
Step 2. Build the shared tool shell every tool will reuse.
- Dropzone (drag, click, and paste), file info row, limit gauge, progress
  with percent, result row with before and after size, download button,
  "start over", and clear error states.
- A Web Worker wrapper with progress messages and cancel.
- Wire it with a fake engine that just waits 3 seconds and returns the file.
Done check: on phone and desktop I can drop a file, watch the gauge and
progress, cancel, hit an error state, and download the result.
```

### Step 3: Video engine (riskiest step)

```text
Step 3. Build the video engine and the compress-video-to-size tool.
- First read the current docs and compare two paths: ffmpeg.wasm and a
  WebCodecs-based approach. Tell me the tradeoffs (speed, browser support,
  bundle size, required headers) and recommend one. Wait for my OK.
- Target-size logic: work out the bitrate from target bytes and duration,
  leave a safety margin, and downscale resolution when the bitrate is too low
  to look acceptable. After encoding, check the output size. If it is over the
  target, retry lower.
- Load the engine only after a file is picked. Cache it for repeat visits.
- If cross-origin isolation headers are needed, apply them only where
  required and confirm nothing else on the site breaks.
- Set a sensible max input size per device and explain it in the UI.
Done check: a real phone video over 50 MB comes out under 10 MB and plays,
on desktop Chrome, iPhone Safari, and Android Chrome. Tell me the encode
time on each. If any of the three fails, stop and tell me why.
```

### Step 4: Video and audio tools

```text
Step 4. Add the rest of the video and audio tools from the registry seed,
reusing the Step 3 engine: the platform presets (Discord, WhatsApp, email and
others), MP4 to MP3, video to GIF, trim video, MOV to MP4, WebM to MP4,
mute video, compress audio, trim audio, WAV to MP3, M4A to MP3.
- Fill lib/limits.ts by looking up each platform's limit on its official help
  page. Show me the table with source links before using the values.
Done check: each tool works with a real file, and each preset page shows its
own limit and its own facts.
```

### Step 5: Image tools

```text
Step 5. Build the image engine (canvas or OffscreenCanvas in a worker) and
the image tools from the registry seed.
- Compress to target KB: search on quality first, then reduce dimensions,
  and verify the output is under the target.
- Resize, crop, format conversions, HEIC to JPG (check current decoder
  options), image to PDF, strip metadata.
Done check: an iPhone HEIC photo converts, and a 4 MB photo compresses to
under 50 KB and still looks acceptable.
```

### Step 6: PDF tools

```text
Step 6. Add merge PDF, split PDF, and PDF to JPG using current, maintained
browser libraries. Keep it to these three for launch.
Done check: merging three PDFs and splitting one both produce files that
open correctly.
```

### Step 7: Text and utility tools

```text
Step 7. Add the text and utility tools from the registry seed. These need no
worker and no upload UI, so give them a lighter input-and-output layout that
still uses the same page template.
Done check: every one works with keyboard only.
```

### Step 8: Homepage, categories, and static pages

```text
Step 8. Finish the site around the tools.
- Homepage: search box that filters instantly, tools grouped by category.
- One page per category with a short intro and its tools.
- About page and a privacy page that says plainly: files are processed in
  the browser, what analytics run, and that there are no accounts.
- Header and footer with links to every category.
Done check: I can reach any tool in two taps from the homepage.
```

### Step 9: SEO and AI-citation pass

```text
Step 9. Do the full SEO pass, driven by the registry.
- Unique title, meta description, canonical URL, and Open Graph image per page.
- JSON-LD on every tool page: WebApplication, FAQPage, BreadcrumbList.
- sitemap.xml, robots.txt that allows search and AI crawlers, and an llms.txt
  that lists every tool with a one-line description.
- Audit the registry: no duplicate primary keywords, every page has at least
  3 FAQs and 3 related tools, no two pages share the same body text.
- Confirm with a raw HTML fetch that the h1, short answer, facts, and FAQ are
  present without JavaScript.
Done check: give me the audit report, and validate three pages in a
structured data testing tool with no errors.
```

### Step 10: QA and performance

```text
Step 10. Test and tune.
- Run Lighthouse on the homepage, one video page, and one image page.
  Fix anything under 95 for performance, accessibility, or SEO.
- Check no engine code loads before a file is picked.
- Test wrong file types, huge files, zero-byte files, and going offline
  mid-task.
- Check both themes and 360px width on every template.
Done check: send me the Lighthouse scores and a list of anything you could
not fix.
```

### Step 11: Production

```text
Step 11. Prepare production.
- Tell me the exact DNS records to connect worldof.tools on Vercel.
- Add cookieless analytics only. Ask me which one before adding it.
- Add the verification files or tags for Google Search Console and Bing
  Webmaster Tools, and tell me where to submit the sitemap.
- Add a custom 404 page that links to the tool index.
Done check: the live domain loads over HTTPS, the sitemap is reachable, and
analytics records my visit.
```

## Tool registry seed

These 46 tools are the launch set. Paste this table with Step 1 so the registry type fits them, and again with Steps 4 to 7. The keywords are my best mapping, not checked against volume data, so run them through a keyword tool and adjust before Step 9.

| Slug | Primary keyword | Category |
| --- | --- | --- |
| compress-video-to-size | compress video to specific size | Video |
| compress-video-for-discord | compress video for discord | Video |
| compress-video-for-whatsapp | compress video for whatsapp | Video |
| compress-video-for-email | compress video for email | Video |
| compress-video-for-instagram | compress video for instagram | Video |
| compress-video-for-telegram | compress video for telegram | Video |
| compress-video-for-slack | compress video for slack | Video |
| mp4-to-mp3 | mp4 to mp3 | Video |
| video-to-gif | video to gif | Video |
| trim-video | trim video online | Video |
| mov-to-mp4 | mov to mp4 | Video |
| webm-to-mp4 | webm to mp4 | Video |
| mute-video | remove audio from video | Video |
| compress-gif | compress gif | Video |
| gif-to-mp4 | gif to mp4 | Video |
| compress-mp3 | compress mp3 | Audio |
| trim-audio | trim audio online | Audio |
| wav-to-mp3 | wav to mp3 | Audio |
| m4a-to-mp3 | m4a to mp3 | Audio |
| compress-image-to-20kb | compress image to 20kb | Image |
| compress-image-to-50kb | compress image to 50kb | Image |
| compress-image-to-100kb | compress image to 100kb | Image |
| compress-image-to-200kb | compress image to 200kb | Image |
| resize-image | resize image online | Image |
| resize-photo-for-passport | passport photo resize | Image |
| resize-photo-and-signature | resize photo and signature for form | Image |
| crop-image | crop image online | Image |
| heic-to-jpg | heic to jpg | Image |
| webp-to-jpg | webp to jpg | Image |
| png-to-jpg | png to jpg | Image |
| jpg-to-png | jpg to png | Image |
| image-to-webp | image to webp | Image |
| svg-to-png | svg to png | Image |
| image-to-pdf | image to pdf | Image |
| remove-exif | remove exif data | Image |
| favicon-generator | favicon generator | Image |
| merge-pdf | merge pdf | PDF |
| split-pdf | split pdf | PDF |
| pdf-to-jpg | pdf to jpg | PDF |
| word-counter | word counter | Text |
| case-converter | case converter | Text |
| qr-code-generator | qr code generator | Utility |
| password-generator | password generator | Utility |
| json-formatter | json formatter | Utility |
| base64-encode-decode | base64 encode | Utility |
| percentage-calculator | percentage calculator | Utility |

Held for after launch because they need large model downloads: background remover, image to text (OCR), speech to text.

## Pre-launch checks

Run these by hand after Step 11 and before you post anything.

- [ ] Compress a real phone video on iPhone Safari, Android Chrome, and desktop Chrome
- [ ] Open the browser network tab during a compress and confirm no file data is sent anywhere
- [ ] Every platform limit in the facts blocks matches its official help page today
- [ ] Search the site for duplicate titles and duplicate primary keywords
- [ ] View source on three tool pages and confirm the h1, short answer, and FAQ are in the HTML
- [ ] Sitemap submitted in Google Search Console and Bing Webmaster Tools
- [ ] Privacy page matches what the site really does, including analytics
- [ ] Search "world of tools" on Google to see who you share the name with
- [ ] Record a screen capture of the video compressor for the launch post
