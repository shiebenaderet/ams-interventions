# AMS Interventions Toolkit — Navigation Redesign

**Date:** 2026-08-28
**Status:** Approved design, ready for implementation planning

---

## Summary

Restructure the AMS MTSS Interventions site around **three doors into one
library**: a global search palette, a filterable index of all 26
interventions, and a problem-first triage tool. All three render from a
single shared data file, which also becomes the source of truth for the
existing tier pages.

The 26 intervention detail pages are not changed by this work.

---

## Context

### Audience and use

The site is used by **AMS staff, not students**, primarily during
**department and staff meetings** where **everyone is on their own
laptop**. It is maintained by one person (Mr. B) who updates it as
strategies are developed and implemented.

This makes the dominant failure mode **wayfinding**, not legibility.
When someone in a meeting says "pull up Chunking" or "look at what
Science put down," thirty people need to get to the same place quickly.
It is not a projected presentation, so type scale and contrast do not
need to survive a room; navigation does need to survive a conversation.

### What is wrong today

1. **Search is per-page, not site-wide.** `filterInterventions()` only
   hides cards on the tier page you are already on. From the homepage,
   searching for "Chunking" is impossible — you must already know it is
   Tier 2.
2. **Every intervention is at least two clicks deep** with no way to jump
   directly.
3. **Intervention facts are smeared across HTML.** Ratings, categories,
   and department badges live in tier-page markup; commitments live in
   `departments.html`. There is no structured record of an intervention
   anywhere, so any new view means writing the same 26 facts again.
4. **The homepage is an MTSS framework explainer** — orientation content
   read once or twice a year, standing between a teacher and the thing
   they opened the site for.

### Constraints

- **No build step.** The README promises the site opens by
  double-clicking `index.html`; QUICKSTART documents that path for
  Windows users. This must remain true.
- **No dependencies.** Plain HTML, CSS, and JavaScript. Maintained solo
  by a teacher between classes.
- **GitHub Pages**, served from `main` at
  `https://shiebenaderet.github.io/ams-interventions/`.
- **Preserve existing accessibility work**: skip links, focusable
  `<main>`, keyboard-operable filters with `aria-pressed`.

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Directions chosen | Index + Triage + Search | Three doors matching three states of knowing: know the name, want to scan, know only the problem. |
| Data layer | Single shared data file | The expensive part is shared; each door is then a small view. Also makes maintenance easier than today. |
| File format | `data/interventions.js`, not `.json` | `fetch()` of a `.json` file is blocked over `file://` by all modern browsers. A `<script>` tag is not. Preserves the double-click path. |
| Homepage | Becomes a landing describing the site and its purpose | Serves a staff meeting and first-time colleagues better than dropping into a table. |
| MTSS framework | Moves to `framework.html` | Read annually; should not gate weekly use. Nothing is deleted. |
| Triage | Own page, `start.html` | Room to grow into follow-up questions and "what have you tried" later. |
| Triage endpoints | Strategies **and** referrals | Not every problem is solved by a technique. Safety and attendance answer with a person, not a page. |
| Detail pages | Unchanged | Direction 04 (Playbook) was not selected. Addable later without redoing this work. |

### Known accepted tradeoffs

- **Tier pages will require JavaScript to render content.** They are
  static HTML today. Leaving them static would reintroduce the data
  drift this design exists to remove. Acceptable: staff use modern
  browsers, and the site already depends on JS for search and filtering.
- **No JSON schema validation** in editors, since the data file is `.js`.
  Mitigated by `tools/check-data.js` (see Verification).
- **The three doors improve routes, not destinations.** Detail pages
  remain uneven (358–2,614 words). Tracked separately in
  `CONTENT-STATUS.md`.

---

## Data model

### `data/interventions.js`

```js
window.AMS = {
  interventions: [ /* 26 records */ ],
  problems:      [ /* 10 records */ ]
};
```

Loaded via `<script src="...">` on every page that needs it.

### Intervention record

```js
{
  "id": "chunking",                    // slug; matches detail page filename
  "name": "Chunking",
  "icon": "🧩",
  "tier": 2,                           // 1 | 2 | 3
  "url": "interventions/tier2/chunking.html",  // relative to site root
  "rating": 4,                         // 1-5 integer; stars rendered from it
  "categories": ["instruction"],       // from existing data-tags
  "description": "Break complex tasks into smaller, manageable steps.",
  "bestFor": "Executive functioning, task completion",
  "departments": [
    { "name": "ELA",            "status": "using" },
    { "name": "Math",           "status": "using" },
    { "name": "Science",        "status": "using" },
    { "name": "Social Studies", "status": "using" }
  ],
  "problems": ["wont-start", "cant-focus"]
}
```

**Field notes**

- `rating` is an integer, not a star string. The Index sorts by
  effectiveness; `"★★★★☆"` cannot be sorted meaningfully.
- `departments[].status` is one of `must-have` | `using` | `exploring`.
  This already exists in the current markup as free text
  (`Math (must-have)` vs plain `Math`); making it structured lets the
  Index show commitment level, which is what matters in an
  accountability conversation.
- `problems` is an array. Interventions legitimately appear under
  several problems (Chunking under both `wont-start` and `cant-focus`;
  Small Group under three).
- All fields except `problems` are extracted from existing HTML. Only
  `problems` is newly authored.

### Problem record

```js
{
  "id": "wont-start",
  "label": "Won't start tasks / doesn't turn work in",
  "shortLabel": "Won't start work",
  "steps": [
    {
      "tier": 1,
      "framing": "Start here — try for 4–6 weeks",
      "interventions": ["organizational-systems", "modeling"]
    },
    {
      "tier": 2,
      "framing": "If no change — add, don't replace",
      "interventions": ["chunking", "frequent-check-ins", "parent-communication"]
    },
    {
      "tier": 3,
      "framing": "Still stuck — bring to SST",
      "interventions": ["student-collaboration", "paraprofessional-support"]
    }
  ]
}
```

A step holds **either** `interventions` **or** a `referral`:

```js
{
  "tier": 3,
  "framing": "Go now — do not wait",
  "referral": {
    "who": "School counselor or SST",
    "detail": "SST meets Wednesdays at 10:00 AM. Counselors are the point of contact for each student."
  }
}
```

The escalation ladder renders both kinds. A problem whose only step is a
referral (attendance) renders as a single rung, not as empty Tier 1 and
Tier 2 rungs.

---

## Triage taxonomy

Ten problems. Rows 1–9 were confirmed against the site's existing
`bestFor` fields; row 10 is referral-only.

| id | Label | T1 | T2 | T3 |
|---|---|---|---|---|
| `wont-start` | Won't start tasks / doesn't turn work in | Organizational Systems, Modeling | Chunking, Frequent Check-Ins, Parent Communication | Student Collaboration, Para Support |
| `cant-access-text` | Can't access the reading or materials | Text-to-Speech, Graphic Organizers | Differentiated Materials, Small Group | One-on-One Intensive, Modified Curriculum |
| `academic-language` | Struggling with academic language | Vocabulary Support, Turn and Talk, Text-to-Speech | Small Group, Differentiated Materials | One-on-One Intensive |
| `cant-show-it` | Understands it but can't show it | Choice in Learning, Retakes & Corrections | Modified Rubrics | IEP & 504 Accommodations |
| `disengaged` | Disengaged, not participating | Greeting Students, Turn and Talk, Choice in Learning | Frequent Check-Ins, Preferential Seating | Student Collaboration |
| `cant-focus` | Can't focus or stay on task | Organizational Systems | Preferential Seating, Chunking, Behavior Check-Ins | Para Support, BIP |
| `behavior` | Behavior is disrupting learning | Greeting Students | Behavior Check-Ins, Parent Communication | BIP, Student Collaboration |
| `safety` | Safety or mental health concern | — | — | **Referral first**, then Crisis Intervention, Wraparound Services, Student Collaboration |
| `behind-grade-level` | Falling well behind grade level | Progress Monitoring | Small Group, Modified Rubrics | One-on-One Intensive, Modified Curriculum, IEP & 504 |
| `attendance` | Missing a lot of school | — | — | **Referral only** (FRA / attendance secretary / SST) |

**`safety`** leads with a referral rung (counselor / SST, act now) before
listing Tier 3 pages. It must never render a "try this for six weeks"
framing.

**`attendance`** is referral-only: the Family Resource Advocate and
attendance secretary already monitor attendance for all students, and no
intervention page covers it. Rather than omit the row — leaving a teacher
to click the most natural question and find nothing — it answers with the
people who own the process. If an attendance intervention page is written
later, this row gains strategy steps without any structural change.

---

## Information architecture

| Page | Role | Status |
|---|---|---|
| `index.html` | **Landing** — what this is, its purpose, how to use it, routes into the three doors and the three tiers | Rewritten |
| `start.html` | **Find a Strategy** — triage | New |
| `library.html` | **All Interventions** — sortable, filterable index of 26 | New |
| `framework.html` | MTSS explainer, pyramid, SST, data-based decisions, goals | New (content moved from `index.html`) |
| `tier1.html` / `tier2.html` / `tier3.html` | Tier menus; cards render from data. Tier-specific prose retained. | Modified |
| `departments.html` | 10/3 session record | Unchanged |
| `interventions/**` (26 pages) | Detail pages | Unchanged except nav + data-root |
| `TEMPLATE.html` | Starting point for a new intervention page | Modified — must carry the new nav and `data-root` so new pages inherit them |

**Nav:** `Home · Find a Strategy · All Interventions · Departments · Framework`

Tier pages are reached from the landing's tier cards, the Framework
pyramid, and the Library's tier filters. Search is global and therefore
not a nav destination.

### Path resolution

Detail pages sit two directories deep, so a fixed `src` will not resolve
from them. Each page declares its own root:

```html
<body class="tier-2" data-root="../../">
```

Root-level pages use `data-root=""`. Shared JS reads this to build
correct URLs for both the data file and every intervention link. This is
explicit and survives files being moved later.

---

## The three doors

### Search (global)

- Opens with `Cmd/Ctrl-K` or `/` from **any** page, including detail
  pages; also via a visible affordance in the nav.
- Matches against `name`, `description`, `bestFor`, and department names.
- Results grouped: Interventions, then Departments.
- Keyboard: `↑`/`↓` to move, `Enter` to open, `Esc` to close.
- Accessibility: `role="dialog"`, `aria-modal`, focus trapped while open,
  focus returned to the trigger on close, results announced via a live
  region.

### Library (`library.html`)

- Table of all 26: Intervention, Tier, Category, Used by, Rating.
- Sortable by name, tier, and rating.
- Filterable by tier, category, and department; filters combine.
- Filter controls are `<button>` elements with `aria-pressed`, matching
  the pattern already established on the tier pages.
- Shows a live result count ("Showing 8 of 26").
- Horizontally scrollable container so the page body never scrolls
  sideways on narrow screens.

### Triage (`start.html`)

- Lists the 10 problems as the entry point.
- Selecting one expands its escalation ladder in place: Tier 1, then
  Tier 2, then Tier 3, each with its framing text.
- Strategy steps link to detail pages; referral steps name the person or
  process.
- Referral-only problems render a single rung.
- Selection is reflected in the URL (`start.html#wont-start`) so a
  specific problem can be linked to directly from a meeting chat or
  email.

---

## Build phases

Each phase leaves the site working and publishable.

**Phase 1 — Data layer and Library**
Extract 26 records into `data/interventions.js`. Build `library.html`.
Convert `tier1/2/3.html` to render cards from the data. Add
`tools/check-data.js`.
*Shippable alone: removes drift and delivers the Index.*

**Phase 2 — Search**
`js/search.js` with the palette, keyboard handling, and accessibility.
Wire into every page along with `data-root`: 26 detail pages, `index`,
`tier1/2/3`, `departments`, `library`, plus `TEMPLATE.html`.

**Phase 3 — Triage**
Author the `problems` data. Build `start.html` with the escalation
ladder, supporting both strategy and referral steps.

**Phase 4 — Landing and Framework split**
Rewrite `index.html` as the landing. Move MTSS content to
`framework.html`. Update nav across all pages.

**Phase 5 — Documentation**
Update `README.md`, `CONTENT-STATUS.md`, and `QUICKSTART.md` to describe
what exists, including how to add an intervention under the new model:
add one record to `data/interventions.js`, copy `TEMPLATE.html`, and run
`node tools/check-data.js`. The old instruction to hand-edit a tier-page
card no longer applies and must be removed.

---

## Verification

There is no test framework in this repo and adding one is out of scope.
Verification is a data-validation script plus explicit manual checks.

### `tools/check-data.js`

Run with `node tools/check-data.js`. Node is needed only for this
optional check, never to build or serve the site. It asserts:

- Every record has all required fields, with `tier` in 1–3 and `rating`
  in 1–5.
- Every `id` is unique.
- Every `url` resolves to a file on disk.
- Every intervention id referenced by a problem exists.
- Every problem id referenced by an intervention exists.
- Every step has exactly one of `interventions` or `referral`.
- Record count is 26.

### Migration fidelity (Phase 1)

Records are extracted **programmatically** from the existing tier pages,
not retyped. After extraction, verify that every card currently rendered
on `tier1/2/3.html` has a matching record with the same name, rating,
tags, and department badges — no additions, no drops.

### Manual checks

- Open `index.html` directly from the filesystem (`file://`) and confirm
  the data loads and all three doors work. This is the check that would
  catch a regression to `fetch()`.
- Operate the search palette by keyboard only: open, navigate, select,
  dismiss, and confirm focus returns to the trigger.
- Confirm every internal link resolves (existing link-check pass).
- Confirm tier pages render the same interventions they do today.

---

## Out of scope

- **Direction 04 (Playbook)** — detail page redesign. Deliberately
  deferred; can be added later without altering the data layer.
- **Direction 03 (Department Home)** and **06 (Living Log)** — not
  selected.
- `departments.html` — untouched by this work.
- Deepening thin intervention pages — tracked in `CONTENT-STATUS.md`.
- Any build step, framework, package manager, or dependency.
- Dark mode.

---

## Open questions

1. **Tier pages are off the top nav.** Reachable from the landing,
   Framework, and Library filters. If "let's look at Tier 2" turns out to
   be a frequent meeting sentence, they may need to return — tier fluency
   is an explicit 2025–26 goal.
2. **Triage wording** is drafted in the designer's words, not AMS's.
   Labels should be revised to match how staff actually describe these
   situations.
3. **Attendance** may warrant its own intervention page later, at which
   point the `attendance` row gains strategy steps.
