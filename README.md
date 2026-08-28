# AMS Interventions Toolkit

A comprehensive, web-based Multi-Tiered System of Supports (MTSS) intervention guide for Alderwood Middle School educators.

## 🎯 Purpose

This toolkit provides evidence-based interventions organized by tier (1, 2, and 3) with practical, step-by-step implementation guidance. Developed collaboratively by AMS educators, it serves as a living resource for supporting all students across academics, behavior, and life skills.

## ✨ Features

- **Three ways in**: [Find a Strategy](start.html) walks from what you're seeing
  with a student to an escalation ladder of tiered supports; [All Interventions](library.html)
  is a sortable, filterable table of every intervention; the global search
  (⌘K or `/` from any page) jumps straight to an intervention or department by name.
- **Three-Tiered Organization**: Easy navigation by intervention intensity (Universal, Targeted, Intensive)
- **Detailed Implementation Guides**: Each intervention includes:
  - Clear definitions and purpose
  - Quality implementation indicators
  - Step-by-step instructions
  - Multiple implementation approaches
  - Common pitfalls and solutions
  - Research-based effectiveness ratings
  - Printable pages
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Department Attribution**: Intervention cards and the Library table show which
  AMS teams use each intervention, and whether it's a must-have, in use, or
  still being explored
- **Accessible**: Skip-to-content links, keyboard-operable filters, visible focus states
- **Printable**: Each intervention page can be printed for reference
- **No build step**: Plain HTML, CSS, and JavaScript — open `index.html` and it works

## 🧩 How It Works

Every intervention — its name, tier, rating, description, and which
departments use it — lives as one record in `data/interventions.js`. The
tier pages, the Library table, search, and Find a Strategy all read from
that same file and build their own pages/lists on the fly. That means an
intervention only has to be described once: add it to the data file and it
shows up everywhere it should, automatically.

## 📁 Project Structure

```
ams-interventions/
├── index.html              # Landing page — what the site is, three doors in, browse by tier
├── start.html              # Find a Strategy — triage: pick a problem, get an escalation ladder
├── library.html            # All Interventions — sortable, filterable table of all 26
├── framework.html          # MTSS explainer: pyramid, Student Study Team, goals
├── tier1.html              # Tier 1 intervention menu — cards render from data
├── tier2.html              # Tier 2 intervention menu — cards render from data
├── tier3.html              # Tier 3 intervention menu — cards render from data
├── departments.html        # The 10/3 department planning session, in their own words
├── TEMPLATE.html           # Starting point for a new intervention detail page
├── data/
│   └── interventions.js    # Source of truth: the 26 interventions and the 10 triage problems
├── css/
│   └── style.css           # Main stylesheet (per-tier theming)
├── js/
│   ├── ams-core.js         # Pure filter/sort/search logic — no DOM, testable under node
│   ├── ams-cards.js        # Renders the intervention cards on each tier page
│   ├── ams-library.js      # Renders the Library table and its filters
│   ├── ams-search.js       # The global search palette (⌘K / Ctrl+K or /)
│   ├── ams-triage.js       # Renders Find a Strategy's problem list and escalation ladders
│   └── main.js             # Pre-existing: print, back-to-top, per-page search/filter helpers
├── interventions/
│   ├── tier1/              # 10 Tier 1 detail pages
│   ├── tier2/              # 8 Tier 2 detail pages
│   └── tier3/              # 8 Tier 3 detail pages
├── tools/
│   ├── check-data.js       # Validates data/interventions.js (run with node)
│   ├── test-core.js        # Unit tests for js/ams-core.js (32 tests, run with node)
│   └── load.js             # Helper that lets the checks load a browser script under node
├── CONTENT-STATUS.md       # Coverage and content-depth tracking
├── QUICKSTART.md           # Setup and contribution walkthrough
├── README.md               # This file
└── LICENSE                 # License information
```

Every page's `<body>` carries a `data-root` attribute (`""` at the repo root,
`"../../"` for detail pages and `TEMPLATE.html`) that the shared scripts use
to build correct links back to the root — that's what lets the same
`ams-search.js` and `ams-cards.js` work whether a page lives at the root or
two folders deep.

## 🚀 Getting Started

### Viewing Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shiebenaderet/ams-interventions.git
   cd ams-interventions
   ```

2. **Open in browser**:
   - Simply open `index.html` in your web browser
   - No server or build process required!

### Hosting on GitHub Pages

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "main" branch as source
   - Your site will be available at: `https://shiebenaderet.github.io/ams-interventions/`

## 📝 Adding New Interventions

Tier pages, the Library, search, and Find a Strategy all render from
`data/interventions.js` — **there is no card to hand-edit into a tier page
anymore.** A card added directly to `tier1.html`, `tier2.html`, or
`tier3.html` would be wiped the next time that page renders, and an
intervention added that way would be invisible everywhere else (the
Library, search, Find a Strategy). Add every new intervention through the
data file instead:

### Adding a new intervention

1. Add a record to `data/interventions.js` (keep it alphabetical within its
   tier, and give it the next `order` value for that tier — or renumber so
   the tier's `order` values stay exactly 1..N with no gaps).
2. Copy `TEMPLATE.html` to `interventions/tierN/your-id.html`. The filename
   must match the record's `id`.
3. Fill in the page content, following the template's structure (What It
   Is, Quality Implementation, Implementation Approaches, Step-by-Step
   Instructions, Common Pitfalls, Adaptations, Monitoring Success).
4. If this intervention should show up in Find a Strategy, add its id to
   the relevant problem's `steps` in the `problems` array at the bottom of
   `data/interventions.js`, then regenerate every record's `problems`
   array using the node snippet documented in that file's header comment.
   An intervention's own `problems` field is derived output, not something
   Find a Strategy reads directly — editing only the record does nothing.
5. Run `node tools/check-data.js` to confirm the record is valid, the page
   exists, and (if you touched `problems`) both directions agree.

The intervention then appears automatically on its tier page, in the
Library, in search, and, once step 4 is done, in Find a Strategy. No other
file needs to change.

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `css/style.css`:

```css
:root {
    --tier1-color: #4A90E2;  /* Blue for Tier 1 */
    --tier2-color: #F5A623;  /* Orange for Tier 2 */
    --tier3-color: #7ED321;  /* Green for Tier 3 */
    /* ... other colors ... */
}
```

### Adding New Features

Where a change belongs depends on what it touches:
- Filtering, sorting, or search *logic* (how a query matches an
  intervention) lives in `js/ams-core.js` — it has no DOM code, so it's
  covered by `node tools/test-core.js`.
- How the tier-page cards, the Library table, the search palette, or the
  Find a Strategy ladders are *drawn* lives in `js/ams-cards.js`,
  `js/ams-library.js`, `js/ams-search.js`, and `js/ams-triage.js` respectively.
- Print, back-to-top, smooth scrolling, and the older per-page
  search/filter helpers live in `js/main.js`.

Add your own functions following the existing patterns.

## 🤝 Contributing

We welcome contributions from all AMS educators!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b new-intervention`
3. **Make your changes**
4. **Test locally** to ensure everything works
5. **Commit your changes**: `git commit -m "Add new intervention: [name]"`
6. **Push to your fork**: `git push origin new-intervention`
7. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing page structure for consistency
- Include research citations when available
- Use clear, educator-friendly language
- Test on multiple devices (desktop, tablet, mobile)
- Proofread for spelling and grammar

## 📚 Current Interventions

All 26 intervention pages are written — every link in the tier menus
leads to a real implementation guide. See [CONTENT-STATUS.md](CONTENT-STATUS.md)
for content-depth tracking and where the next writing pass should go.

### Tier 1 (Universal — All Students)
- Organizational Systems
- Text-to-Speech & Speech-to-Text
- Vocabulary Support
- Graphic Organizers
- Turn and Talk / Think-Pair-Share
- Modeling: I Do, We Do, You Do
- Progress Monitoring
- Greeting Students at the Door
- Choice in Demonstration of Learning
- Retakes and Corrections

### Tier 2 (Targeted — Some Students)
- Small Group Instruction
- Frequent Check-Ins
- Modified Rubrics
- Chunking
- Differentiated Materials
- Preferential Seating
- Individualized Parent Communication
- Behavior Check-Ins

### Tier 3 (Intensive — Few Students)
- IEP & 504 Accommodations
- Collaboration About Specific Students
- Modified Curriculum/Assessment
- One-on-One Intensive Intervention
- Paraprofessional Support
- Behavior Intervention Plan (BIP)
- Crisis Intervention
- Wraparound Services

### By Department
The [Departments page](departments.html) records what each AMS team
inventoried, chose as must-haves, and flagged as still needing support
during the 10/3 "Building an Intervention Menu" session — in their own
words, not a generic list.

## 🔧 Technical Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No server or database required
- Works offline once loaded

**Note on the data file:** `data/interventions.js` is a JavaScript file, not
JSON, on purpose. Browsers block `fetch()` of local `.json` files over
`file://`, which would break opening the site by double-clicking
`index.html`. Keep it as a `<script>`-loaded file.

## ✅ Checks

Two optional scripts catch mistakes before they reach a page. Node is
needed only to run these — never to build or serve the site itself.

- `node tools/check-data.js` — validates `data/interventions.js`: every
  intervention has a real detail page, tiers and `order` values are
  consistent, ids are unique, and each intervention's `problems` list
  agrees with the triage steps that reference it (run the regeneration
  snippet described in the data file's header comment if it doesn't).
- `node tools/test-core.js` — runs the 32 unit tests for the filtering,
  sorting, and search logic in `js/ams-core.js`.

## 📖 Resources

This toolkit is based on:
- Panorama Education's MTSS Framework
- What Works Clearinghouse research
- Hattie's Visible Learning research
- AMS collaborative planning sessions

### External Links
- [Panorama MTSS Platform](https://www.panoramaed.com/)
- [What Works Clearinghouse](https://ies.ed.gov/ncee/wwc/)
- [Evidence for ESSA](https://www.evidenceforessa.org/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Credits

Developed collaboratively by educators at Alderwood Middle School:
- English/Language Arts Department
- Mathematics Department
- Science Department
- Social Studies Department
- PE/Health Department
- Electives Department
- Counseling Department

Special thanks to all AMS staff who contributed their expertise and classroom experience to this toolkit.

## 📧 Contact

Questions or suggestions? Contact:
- Room 1610 (Mr. B - Social Studies)
- Your department chair
- MTSS Coordinator

## 🔄 Version History

- **v1.0** (December 2025) — Initial release with Tier 1 interventions
- **v1.1** (2025–2026 school year) — Added Tier 2 and Tier 3 overviews, detail pages, and counselor-aligned MTSS framework language; incorporated department-level planning from the 10/3 "Building an Intervention Menu" session
- **v1.2** (2025–2026 school year) — **Full coverage.** All 26 intervention pages written across all three tiers. Added the Departments page. Accessibility pass: skip-to-content links, keyboard-operable filter buttons with `aria-pressed` state, focusable main landmark, and per-tier color theming driven by a single body class.
- **v1.3** (2025–2026 school year) — **Data-driven rebuild.** All 26
  interventions and the 10 triage problems now live in one source-of-truth
  file, `data/interventions.js`, validated by `node tools/check-data.js`
  and covered in part by `node tools/test-core.js`. Tier pages, the new
  Library table, the new global search palette, and the new Find a
  Strategy triage tool all render from that same file instead of
  hand-written cards. The homepage was split in two: `index.html` is now a
  short landing page with three doors in (Find a Strategy, All
  Interventions, Search), and the MTSS explainer moved to its own
  `framework.html`. Continued the accessibility work: a labeled search
  dialog, live-region status updates for triage and search results, and
  keyboard support throughout.
- Future updates will add:
  - Deeper content on the thinner intervention pages (see [CONTENT-STATUS.md](CONTENT-STATUS.md))
  - A UI/UX pass focused on fast lookup for staff
  - Video demonstrations
  - Downloadable templates
  - Student data tracking tools

---

**Note**: This is a living document. As we learn more about effective interventions and gather data on what works at AMS, we'll continue to update and improve this resource.
