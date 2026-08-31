# Design: "Our Students" — the August 2026 PD data page

**Date:** 2026-08-31
**Status:** approved, ready for implementation planning

## Context

Alderwood received the district's *Data Template for PD August 2026* handout
(16 pages, PDF) for the August 31 professional learning session. A standalone
HTML summary of it already exists: ten sections of charts and written analysis
built as one 1,400-line file with its own visual system — Archivo/Public Sans,
rounded cards, drop shadows, a full dark theme, and a green/yellow/orange/red
traffic-light palette.

Every figure in that summary was checked against all 16 PDF pages and matches.

The task is to bring that page into the AMS Interventions site so it reads as
part of the toolkit rather than a guest. That means the visual system, the file
structure, and the accessibility floor all have to change; the analysis does
not.

### One resolved question

PDF page 5 carries a highlighted template note — "SAMPLE DATA BELOW - PLEASE
REPLACE WITH YOUR SCHOOL'S DATA" — above the Sense of Belonging chart. The
principal left the boilerplate in when pasting Alderwood's real figures. The
belonging data is genuine and needs no caveat on the page.

## Decisions

| Question | Decision | Why |
|---|---|---|
| How far to conform to the house rules | Full conformance | The page should read as page six of the site, not a different site sharing a colour scheme |
| Dark mode | Drop it | No other AMS page has one; the toggle would appear on exactly one page |
| File structure | Split to repo conventions | Matches every other page and makes the transcription checkable |
| Ordered-scale colour | Navy ↔ terracotta diverging | The house rules explicitly rejected traffic-light colour; this reuses the site's own escalation vocabulary and is legible with colour-vision deficiency |
| Placement | `data.html`, nav label "Our Students", last position | Names the subject, not the artifact; reads as context you consult |

## Architecture

The current page generates every paragraph from JavaScript. This design inverts
that: **prose is HTML, charts are JavaScript.**

```
data.html                    Markup, nav, footer, and all prose — headings,
                             deks, takeaways, notes. Chart mount points are
                             <div class="chart" data-chart="<id>"></div>.

data/school-data.js          window.AMSData — the transcription only. No
                             prose, no presentation.

js/ams-scales.js             Pure functions: band classification, ramp
                             position, percentage→count, label parsing.
                             No DOM access, so it runs under plain node.

js/ams-charts.js             The eight drawing primitives. Takes data and
                             options, returns DOM nodes or SVG strings.

js/ams-data.js               Page composition: finds each mount point, picks
                             the primitive, hands it the right slice of
                             AMSData.

css/style.css                +~250 lines of chart styles, appended in the
                             existing house style.

tools/test-scales.js         Unit tests for js/ams-scales.js.
tools/check-school-data.js   Transcription integrity checks.
```

Three reasons for this split:

1. **The analysis survives with JavaScript off.** Right now the page is empty
   without it. The written argument is the most valuable part and should not
   depend on a script.
2. **Prose becomes diffable.** Changing a sentence is currently editing a
   JavaScript string literal. In HTML it is a normal one-line diff.
3. **It matches `departments.html`.** That page is hand-written prose with
   generated data blocks. Same shape, same mental model.

`js/ams-scales.js` mirrors the existing `js/ams-core.js` / `tools/test-core.js`
pattern — a pure module with its own node-runnable test file — rather than
growing `ams-core.js`, which is scoped to intervention logic and should stay
that way.

### Data flow

```
data/school-data.js  →  window.AMSData
                             ↓
data.html mount points  →  js/ams-data.js  →  js/ams-charts.js
                                    ↓                ↓
                           js/ams-scales.js    DOM / SVG
```

## Data model

`window.AMSData` carries the transcription, keyed by handout section:

| Key | Shape | Source |
|---|---|---|
| `growthSchool` | `[{g, grp, ela, math}]` | Alderwood SBA median SGP, 2024–25 |
| `growthDistrict` | `[{g, ela, math, flag}]` | **Edmonds district**, not Alderwood |
| `prof` | `{race, gender, prog}` each `[{g, ela, math, sci}]` | Alderwood SBA/WCAS Level 3+, 2024–25 |
| `wsif` | `[{g, v:[2023, 2024, 2025]}]` | WSIF final score 1–10 |
| `att` | `{all, gender, race, prog}` each `[{g, v}]` | Alderwood attendance, 2024–25 |
| `iready` | `{ela, math}` each `[{g, v:[5 steps], n}]` | i-Ready placement, Spring 2026 |
| `fnc` | `{prog, race}` each `[{g, a, b}]` | F/NC grades, S2 24–25 → S2 25–26 |
| `survey` | `{overall, rows:[{g, belong, rel}]}` | Edmonds Student Survey, Spring 2026 |

`null` means the handout reported `N<10` or left the cell blank. Nulls are
never estimated, never interpolated, and render as "not reported".

`growthDistrict` is district-wide, not Alderwood. Every chart drawing from it
must say so on the chart, not only in a footnote.

## Palette

The i-Ready scale is not a true divergence. It has **two** on-grade categories
and **three** below-grade ones, so a symmetric five-step ramp around a neutral
midpoint misrepresents its shape. The ramp is asymmetric instead, splitting at
the on-grade/below-grade boundary, with depth carrying severity in both
directions:

```css
/* Data page — ordered scales. Navy is on grade, terracotta is below, and the
   split between them is the boundary. Never green/red: see house rule 3. */
--scale-on-2:  #14223A;  /* mid or above grade · high growth  */
--scale-on-1:  #4A6B8F;  /* early on grade                    */
--scale-bel-1: #C75B2A;  /* one grade below                   */
--scale-bel-2: #A4462C;  /* two grades below                  */
--scale-bel-3: #7E2E14;  /* three or more below · low growth  */
```

**Contrast requirement, verified.** Every step clears 3:1 against the cream
ground (14.03, 4.88, 3.73, 5.30, 8.09) — the WCAG floor for non-text. An
earlier draft used a neutral stone `#C9C2B4` at the midpoint; it measured
1.56:1 and was replaced. Adjacent steps sit at 1.31–1.53:1, which is low on
its own, so stacked segments keep the 2px cream gap between them: the ground
does the separating, not the hue.

Categorical series (ELA / Math / Science) use `--navy`, `--warm` and `--sage` —
hues the palette already has. Verdict blocks in section 1 lose their coloured
top borders and become left-ruled callouts in the existing `.note` / `.warning`
idiom: `--sage` for strength, `--gold` for mixed, `--warm-d` for urgent.

Nothing gains a radius, a shadow, or a full border.

## Chart inventory

| § | Section | Primitives |
|---|---|---|
| 1 | The headline read | six verdict blocks (no chart) |
| 2 | Growth against achievement | `scatter` ×2 |
| 3 | Where each group has moved, 2023–2025 | `sparkgrid` ×1 (nine panels) |
| 4 | Who is reaching grade level | `gbars` ×2, `divbars` ×1 |
| 5 | How far below grade level, right now | `divstack` ×2, `hbars` ×2, `divbars` ×1 |
| 6 | Growth by program — district figures | `hbars` ×2, `dumbbell` ×1 |
| 7 | Who is in the room | `hbars` ×1, `scatter` ×2 |
| 8 | Failing grades, and which way they moved | `dumbbell` ×2, `scatter` ×1 |
| 9 | What students say about school | `dumbbell` ×1, `divbars` ×1 |
| 10 | What this handout can't tell you | `table` ×9 |

### Primitives (`js/ams-charts.js`)

- `hbars(rows, opts)` — horizontal bars; optional group headers, reference
  line, per-row colour function
- `gbars(rows, series, opts)` — grouped multi-series bars
- `divbars(rows, opts)` — diverging bars centred on zero
- `divstack(rows, opts)` — diverging stacked bars centred on a split point
- `dumbbell(rows, opts)` — two connected dots, before/after
- `sparkgrid(rows, opts)` — small-multiple sparklines on a shared scale
- `scatter(opts)` — labelled scatter with reference lines and quadrant washes
- `table(cols, rows, title)` — collapsible data table

### Pure functions (`js/ams-scales.js`)

- `growthBand(sgp)` → `'low' | 'typical' | 'high'` (1–33 / 34–59 / 60–99)
- `attendanceBand(pct)` → band name
- `placement(v)` → `{onGrade, below, offset, width}` layout for `divstack`
- `pctToCount(pct, assessed)` → rounded headcount
- `parseAssessed('104/107')` → `{assessed: 104, total: 107}`
- `scaleStep(i)` → the CSS custom-property name for step `i` of the ramp
  (`0`–`1` on grade, `2`–`4` below)
- `delta(a, b)` → `{value, direction}`

## Accessibility

The current page's values are reachable only by hovering with a mouse — no
keyboard or touch path. Rather than build a focus-management system for eight
chart types:

- Every chart carries `role="img"` and a descriptive `aria-label`.
- Every chart links to its data table in section 10. The tables become the
  text alternative, not an appendix.
- Ordered scales always print the percentage, so colour is never the only
  channel carrying meaning.
- Tooltips remain, as pure enhancement.
- Suppressed groups render the words "not reported (N<10)", never a zero-length
  bar that could read as zero.

## Testing

1. `tools/test-scales.js` — TDD, tests before implementation, in the style of
   `tools/test-core.js`.
2. `tools/check-school-data.js` — transcription integrity: i-Ready rows sum to
   100 (±1 for rounding), all percentages within 0–100, WSIF scores within
   1–10, assessed counts parse as `n/total` with `n <= total`, no group name
   outside a known vocabulary.
3. `node tools/test-core.js` and `node tools/check-data.js` still pass.
4. Headless Chrome render of `data.html`, confirming every mount point filled
   and no console errors.

## Out of scope

- **Connecting student groups to interventions.** The obvious next idea — "this
  group needs these strategies" — is a larger design question and deserves its
  own conversation.
- Dark mode.
- Indexing the data page in ⌘K search.
- Any change to existing pages beyond the new nav item on all six and one link
  in the `index.html` "Also here" list.

## Open item for the user

`index.html` links this repository publicly on GitHub. The OSPI figures
(growth, proficiency, attendance, WSIF) are already public. The survey,
i-Ready and grade-distribution figures came from internal district reports and
likely are not. Whether this repository stays public is a decision to make
before the page ships; it does not block implementation.
