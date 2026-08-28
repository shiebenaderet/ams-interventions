# AMS Interventions — Content Status

**Last updated:** 2026-08-28
**Coverage:** 26 of 26 intervention pages written (100%)

Every intervention linked from a tier page has a real detail page behind
it. There are no broken links and no placeholder pages.

---

## Where the metadata lives

Each intervention's name, tier, rating, description, "best for" summary,
department attribution, and detail-page URL live as one record in
[`data/interventions.js`](data/interventions.js) — not in the tier pages
themselves, which render their cards from that file. Run
`node tools/check-data.js` any time you add or edit a record; it confirms
every intervention has a real detail page, ids are unique, and tier/order
values are consistent. This file tracks the writing on the detail pages
themselves, which `check-data.js` does not check.

---

## Coverage by tier

| Tier | Interventions | Status |
|------|---------------|--------|
| Tier 1 — Universal | 10 | ✅ Complete |
| Tier 2 — Targeted | 8 | ✅ Complete |
| Tier 3 — Intensive | 8 | ✅ Complete |

### Tier 1 — Universal (all students)
Organizational Systems · Text-to-Speech & Speech-to-Text · Vocabulary
Support · Graphic Organizers · Turn and Talk / Think-Pair-Share ·
Modeling (I Do, We Do, You Do) · Progress Monitoring · Greeting Students
at the Door · Choice in Demonstration of Learning · Retakes and
Corrections

### Tier 2 — Targeted (some students)
Small Group Instruction · Frequent Check-Ins · Modified Rubrics ·
Chunking · Differentiated Materials · Preferential Seating ·
Individualized Parent Communication · Behavior Check-Ins

### Tier 3 — Intensive (few students)
IEP & 504 Accommodations · Collaboration About Specific Students ·
Modified Curriculum/Assessment · One-on-One Intensive Intervention ·
Paraprofessional Support · Behavior Intervention Plan (BIP) · Crisis
Intervention · Wraparound Services

---

## Provenance — which pages are placeholder

Thirteen of the 26 intervention pages were **drafted with AI assistance**, not taken
from AMS documentation or department planning, and no AMS staff member has reviewed
them. Each carries a visible notice at the top of the page.

**AI-drafted (placeholder):**
Turn and Talk · Behavior Check-Ins · Chunking · Differentiated Materials ·
Individualized Parent Communication · Preferential Seating · Behavior Intervention
Plan · Crisis Intervention · Modified Curriculum · One-on-One Intensive ·
Paraprofessional Support · Collaboration About Specific Students · Wraparound Services

Four of those — Crisis Intervention, Behavior Intervention Plan, Modified Curriculum
and Paraprofessional Support — touch safety or legal obligations and carry an
additional warning.

The **10-problem triage taxonomy** on `start.html`, including which interventions each
question routes to, was also AI-drafted. Its safety pathway wording is generic advice,
**not AMS's crisis protocol**, and is flagged as such on the page.

Not AI-drafted: `departments.html` (the 10/3 session record), the department
attributions on intervention cards, the MTSS framework content on `framework.html`,
and the 13 intervention pages written before this work.

To clear a notice: review the page, correct it against AMS practice, and delete its
`<div class="provenance">` block.

## The real remaining work: depth, not coverage

Coverage is done. Depth is uneven. Pages range from ~350 to ~2,600 words,
and the shorter ones cover the core sections but lack the worked
examples, scripts, and pitfall tables that make the strongest pages
genuinely usable during a prep period.

**Deepest pages** (use these as the quality bar):
IEP & 504 Accommodations (2,614w) · Frequent Check-Ins (2,180w) ·
Modified Rubrics (2,089w) · Small Group Instruction (1,803w) ·
Modeling (1,509w) · Progress Monitoring (1,446w)

**Thinnest pages** (best candidates for the next content pass):

| Page | Words | Tier |
|------|-------|------|
| Preferential Seating | 358 | 2 |
| One-on-One Intensive | 386 | 3 |
| Differentiated Materials | 406 | 2 |
| Modified Curriculum | 411 | 3 |
| Student Collaboration | 447 | 3 |
| Text-to-Speech | 462 | 1 |
| Chunking | 463 | 2 |
| Wraparound Services | 465 | 3 |
| Paraprofessional Support | 478 | 3 |
| Parent Communication | 481 | 2 |

Prioritize by how often a page gets used, not by how short it is —
Text-to-Speech and Chunking are high-traffic, everyday strategies;
Wraparound Services is consulted rarely but matters when it is.

---

## Suggested next steps

1. **Deepen the high-traffic thin pages** — Text-to-Speech, Chunking,
   Differentiated Materials, Preferential Seating.
2. **Get teacher feedback before writing more.** Coverage is complete;
   the next round of content should be driven by what colleagues
   actually reach for and find missing.
3. **Design pass.** The stylesheet has accumulated duplicate rules and
   the information architecture was built for an orientation audience
   rather than for quick lookup by staff.
