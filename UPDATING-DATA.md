# Updating the student data

The "Our Students" page (`data.html`) is built from one file. When a new
handout arrives, edit that file and let the tools tell you what else moved.

## The one file to edit

`data/school-data.js` — the whole transcription. Nothing else holds a figure.

Two rules that matter more than anything else here:

- **`null` means the district suppressed the group** for small size (N<10),
  or left the cell blank. Never replace a `null` with a number, never
  estimate, never interpolate. The entire page is built so that data the
  district withheld is not presented as if it were measured.
- **`growthDistrict` is Edmonds School District data, not Alderwood.** It is
  the one page of the handout where the unit of analysis changes. Section 6
  says so on the chart; keep it that way.

## Then run these, in this order

```bash
node tools/check-school-data.js     # the transcription holds together
node tools/check-prose-figures.js   # the written analysis still matches it
node tools/test-scales.js           # the band logic
node tools/test-core.js             # the intervention toolkit, unrelated but cheap
```

### `check-school-data.js`

Bounds every percentage, growth percentile and WSIF score; confirms each
i-Ready row's five steps total 100 within rounding; parses every assessed
count; catches a group named twice, or one half of a paired measure
suppressed while its partner is not.

It also re-derives the figures that `js/ams-data.js` writes down rather than
looking up, so a chart cannot quietly disagree with its own table.

**What it cannot catch:** a mistyped digit that stays in range. 55.0 typed as
65.0 passes everything except inside an i-Ready row. Check the transcription
against the PDF yourself; no tool substitutes for that.

### `check-prose-figures.js`

The analysis in `data.html` is hand-written and does not update itself. This
reads every number out of the prose and reports the ones that no longer
appear in the data, quoting the sentences that contain them so you can go
fix them.

Some prose figures are computed rather than transcribed — a gap between two
measures, a headcount from a percentage. Those are listed in `DERIVED` at
the top of the tool, each with the sum that produces it. If you add a new
computed figure to the prose, add it there too.

**What it cannot catch:** a sentence whose number is right but whose claim
has gone wrong. "The highest attendance in the school" is a statement about
rank, and rank is not a number in the prose. After a data update, re-read
any sentence that names a group as highest, lowest, only, or first.

## Reference lines take care of themselves

Every crosshair and dashed reference line on the page marks a school-wide
figure and looks it up from `AMSData` at render time (`REF` in
`js/ams-data.js`). They cannot go stale. If an "All Students" row ever
disappears from the data, the page throws a named error rather than drawing
a reference line in the wrong place.

## Check it in a browser before you publish

```bash
python3 -m http.server 8000
# then open http://localhost:8000/data.html
```

Look for: every chart drawn, no empty gaps, suppressed groups reading
"not reported (N<10)" rather than showing as zero, and the nine data tables
at the bottom opening when a chart's "See these figures as a table" link is
followed.

## Publishing

`main` is served directly by GitHub Pages at
<https://shiebenaderet.github.io/ams-interventions/>. Pushing to `main`
publishes. There is no build step and no deploy pipeline — what is in the
repo is what is live, within about a minute.
