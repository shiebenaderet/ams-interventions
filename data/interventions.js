/* AMS Interventions — single source of truth.
 *
 * To add an intervention:
 *   1. Add a record below (keep the list alphabetical within its tier).
 *   2. Create the detail page at the path in `url`.
 *   3. Run: node tools/check-data.js
 *
 * id          must match the detail page filename without ".html"
 * tier        1, 2 or 3
 * order       integer >= 1, controls the tier page's display sequence. 1-based
 *             within a tier — the records with tier: 2 must carry order 1..N
 *             with no gaps or duplicates (N = how many interventions share
 *             that tier). The record list itself stays alphabetical (see
 *             above); `order` is what tier pages actually sort by. The
 *             Library page sorts independently and ignores this field.
 * rating      integer 1-5 (stars are rendered from this)
 * ratingNote  optional string shown after the stars, e.g. "(Legally Required)"
 * status      "must-have" | "using" | "exploring"
 * problems    array of problem ids (see below) that list this intervention in
 *              one of their steps. Derived, not hand-designed — after editing
 *              `problems` below, regenerate each intervention's list with:
 *                node -e '
 *                const { loadBrowserGlobal } = require("./tools/load");
 *                const AMS = loadBrowserGlobal("data/interventions.js", "AMS");
 *                const map = {};
 *                AMS.problems.forEach(function (p) {
 *                  p.steps.forEach(function (s) {
 *                    (s.interventions || []).forEach(function (id) {
 *                      (map[id] = map[id] || []);
 *                      if (map[id].indexOf(p.id) === -1) map[id].push(p.id);
 *                    });
 *                  });
 *                });
 *                AMS.interventions.forEach(function (iv) {
 *                  console.log(iv.id + ": " + JSON.stringify(map[iv.id] || []));
 *                });'
 *              then run `node tools/check-data.js` to confirm both directions agree.
 *
 * `problems` (bottom of this file) is the triage taxonomy a teacher walks
 * through to go from "what am I seeing" to "what do I try." Each problem has:
 *   id          short, stable, used only internally (URLs, cross-references)
 *   label       full sentence shown as the problem's heading
 *   shortLabel  compact form for narrow UI (e.g. a breadcrumb or chip)
 *   steps       ordered list, normally one per tier, each shaped as either:
 *     - a strategy step:
 *         { tier, framing, interventions: [id, id, ...] }
 *       `framing` is the short instruction shown above the intervention
 *       list (e.g. "Start here — try for 4–6 weeks").
 *     - a referral step (used when the right move is a person, not a
 *       classroom strategy — safety concerns, attendance):
 *         { tier, framing, referral: { who, detail } }
 *       `who` is the person/role to contact; `detail` is a short sentence
 *       of context (when they're available, what they own).
 *       A step has exactly one of `interventions` or `referral`, never both.
 */
window.AMS = {
  interventions: [
    // ---- Tier 1 ----
    {
      id: 'choice-in-learning',
      name: 'Choice in Demonstration of Learning',
      icon: '🎨',
      tier: 1,
      order: 9,
      url: 'interventions/tier1/choice-in-learning.html',
      rating: 4,
      categories: ['instruction'],
      description: 'Students show understanding through different formats while meeting the same standard.',
      bestFor: 'Student agency, differentiation, engagement',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Social Studies', status: 'using' }
      ],
      problems: ['cant-show-it', 'disengaged']
    },
    {
      id: 'graphic-organizers',
      name: 'Graphic Organizers',
      icon: '🗂️',
      tier: 1,
      order: 4,
      url: 'interventions/tier1/graphic-organizers.html',
      rating: 5,
      categories: ['instruction'],
      description: 'Visual frameworks that help students organize information and see relationships.',
      bestFor: 'Note-taking, planning, comprehension',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Science', status: 'using' },
        { name: 'Social Studies', status: 'using' },
        { name: 'Electives', status: 'using' }
      ],
      problems: ['cant-access-text']
    },
    {
      id: 'greeting-students',
      name: 'Greeting Students at the Door',
      icon: '👋',
      tier: 1,
      order: 8,
      url: 'interventions/tier1/greeting-students.html',
      rating: 4,
      categories: ['relationship'],
      description: 'Personal greetings as students enter to build relationships and set positive tone.',
      bestFor: 'Relationships, classroom climate, behavior',
      departments: [
        { name: 'PE', status: 'using' },
        { name: 'Electives', status: 'must-have' }
      ],
      problems: ['disengaged', 'behavior']
    },
    {
      id: 'modeling',
      name: 'Modeling: I Do, We Do, You Do',
      icon: '👨‍🏫',
      tier: 1,
      order: 6,
      url: 'interventions/tier1/modeling.html',
      rating: 5,
      categories: ['instruction'],
      description: 'Gradual release of responsibility from teacher demonstration to independent practice.',
      bestFor: 'Skill development, building independence',
      departments: [
        { name: 'Math', status: 'must-have' },
        { name: 'Electives', status: 'using' }
      ],
      problems: ['wont-start']
    },
    {
      id: 'organizational-systems',
      name: 'Organizational Systems',
      icon: '📋',
      tier: 1,
      order: 1,
      url: 'interventions/tier1/organizational-systems.html',
      rating: 4,
      categories: ['organization'],
      description: 'Consistent structures that help all students track assignments, materials, and deadlines.',
      bestFor: 'Executive functioning, time management',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Social Studies', status: 'using' },
        { name: 'Electives', status: 'using' }
      ],
      problems: ['wont-start', 'cant-focus']
    },
    {
      id: 'progress-monitoring',
      name: 'Progress Monitoring',
      icon: '📊',
      tier: 1,
      order: 7,
      url: 'interventions/tier1/progress-monitoring.html',
      rating: 5,
      categories: ['assessment'],
      description: 'Regular, systematic checking of student understanding to guide instruction.',
      bestFor: 'Data-driven instruction, tracking growth',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Math', status: 'using' },
        { name: 'Social Studies', status: 'using' }
      ],
      problems: ['behind-grade-level']
    },
    {
      id: 'retakes-corrections',
      name: 'Retakes and Corrections',
      icon: '🔄',
      tier: 1,
      order: 10,
      url: 'interventions/tier1/retakes-corrections.html',
      rating: 4,
      categories: ['assessment'],
      description: 'Opportunities to demonstrate improved mastery after initial assessment.',
      bestFor: 'Growth mindset, mastery learning, reducing anxiety',
      departments: [
        { name: 'Math', status: 'using' },
        { name: 'Social Studies', status: 'must-have' },
        { name: 'Electives', status: 'using' }
      ],
      problems: ['cant-show-it']
    },
    {
      id: 'text-to-speech',
      name: 'Text-to-Speech & Speech-to-Text',
      icon: '🔊',
      tier: 1,
      order: 2,
      url: 'interventions/tier1/text-to-speech.html',
      rating: 5,
      categories: ['technology'],
      description: 'Technology tools that read text aloud or convert spoken words to written text.',
      bestFor: 'Reading support, writing support, ELL',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Math', status: 'using' },
        { name: 'Science', status: 'using' },
        { name: 'Social Studies', status: 'using' },
        { name: 'PE', status: 'using' }
      ],
      problems: ['cant-access-text', 'academic-language']
    },
    {
      id: 'turn-and-talk',
      name: 'Turn and Talk / Think-Pair-Share',
      icon: '💬',
      tier: 1,
      order: 5,
      url: 'interventions/tier1/turn-and-talk.html',
      rating: 4,
      categories: ['instruction'],
      description: 'Structured partner discussion for processing thinking and practicing academic language.',
      bestFor: 'Engagement, language development, comprehension',
      departments: [
        { name: 'Math', status: 'using' },
        { name: 'Science', status: 'using' }
      ],
      problems: ['academic-language', 'disengaged']
    },
    {
      id: 'vocabulary-support',
      name: 'Vocabulary Support',
      icon: '📝',
      tier: 1,
      order: 3,
      url: 'interventions/tier1/vocabulary-support.html',
      rating: 4,
      categories: ['instruction'],
      description: 'Systematic teaching of academic vocabulary through cards, word walls, and games.',
      bestFor: 'Academic language, content comprehension',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Math', status: 'using' },
        { name: 'Science', status: 'using' },
        { name: 'Social Studies', status: 'using' }
      ],
      problems: ['academic-language']
    },

    // ---- Tier 2 ----
    {
      id: 'behavior-check-ins',
      name: 'Behavior Check-Ins',
      icon: '📋',
      tier: 2,
      order: 8,
      url: 'interventions/tier2/behavior-check-ins.html',
      rating: 4,
      categories: ['behavior'],
      description: 'Structured monitoring with point sheets or daily reports.',
      bestFor: 'Behavior goals, self-monitoring',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Social Studies', status: 'using' },
        { name: 'PE', status: 'using' },
        { name: 'Science', status: 'exploring' }
      ],
      problems: ['cant-focus', 'behavior']
    },
    {
      id: 'chunking',
      name: 'Chunking',
      icon: '🧩',
      tier: 2,
      order: 4,
      url: 'interventions/tier2/chunking.html',
      rating: 4,
      categories: ['instruction'],
      description: 'Break complex tasks into smaller, manageable steps.',
      bestFor: 'Executive functioning, task completion',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Math', status: 'using' },
        { name: 'Science', status: 'using' },
        { name: 'Social Studies', status: 'using' }
      ],
      problems: ['wont-start', 'cant-focus']
    },
    {
      id: 'differentiated-materials',
      name: 'Differentiated Materials',
      icon: '📚',
      tier: 2,
      order: 5,
      url: 'interventions/tier2/differentiated-materials.html',
      rating: 4,
      categories: ['instruction'],
      description: 'Same content at different complexity/reading levels.',
      bestFor: 'Reading comprehension, content access',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Math', status: 'using' },
        { name: 'Science', status: 'using' },
        { name: 'Social Studies', status: 'must-have' }
      ],
      problems: ['cant-access-text', 'academic-language']
    },
    {
      id: 'frequent-check-ins',
      name: 'Frequent Check-Ins',
      icon: '✅',
      tier: 2,
      order: 2,
      url: 'interventions/tier2/frequent-check-ins.html',
      rating: 5,
      categories: ['assessment', 'relationship'],
      description: 'Brief, structured conversations to monitor progress and build relationships.',
      bestFor: 'Accountability, goal-setting, academic/behavioral progress',
      departments: [
        { name: 'Math', status: 'must-have' },
        { name: 'Science', status: 'using' },
        { name: 'Social Studies', status: 'using' },
        { name: 'PE', status: 'must-have' },
        { name: 'Electives', status: 'using' }
      ],
      problems: ['wont-start', 'disengaged']
    },
    {
      id: 'parent-communication',
      name: 'Individualized Parent Communication',
      icon: '📞',
      tier: 2,
      order: 7,
      url: 'interventions/tier2/parent-communication.html',
      rating: 4,
      categories: ['relationship'],
      description: 'Regular, targeted updates beyond whole-class communication.',
      bestFor: 'Building partnerships, monitoring progress',
      departments: [
        { name: 'Social Studies', status: 'using' },
        { name: 'PE', status: 'using' },
        { name: 'Electives', status: 'must-have' }
      ],
      problems: ['wont-start', 'behavior']
    },
    {
      id: 'modified-rubrics',
      name: 'Modified Rubrics',
      icon: '📝',
      tier: 2,
      order: 3,
      url: 'interventions/tier2/modified-rubrics.html',
      rating: 4,
      categories: ['assessment'],
      description: 'Scaffolded assessments that fade support over time.',
      bestFor: 'Students who understand content but struggle with format',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Social Studies', status: 'using' }
      ],
      problems: ['cant-show-it', 'behind-grade-level']
    },
    {
      id: 'preferential-seating',
      name: 'Preferential Seating',
      icon: '💺',
      tier: 2,
      order: 6,
      url: 'interventions/tier2/preferential-seating.html',
      rating: 3,
      categories: ['behavior'],
      description: 'Strategic seat placement based on student needs.',
      bestFor: 'Attention, behavior, engagement',
      departments: [
        { name: 'Science', status: 'using' },
        { name: 'Social Studies', status: 'must-have' },
        { name: 'PE', status: 'using' }
      ],
      problems: ['disengaged', 'cant-focus']
    },
    {
      id: 'small-group-instruction',
      name: 'Small Group Instruction',
      icon: '👥',
      tier: 2,
      order: 1,
      url: 'interventions/tier2/small-group-instruction.html',
      rating: 5,
      categories: ['instruction'],
      description: 'Targeted teaching for 3-6 students with the same skill need.',
      bestFor: 'Specific skill gaps, reading, math, writing',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Social Studies', status: 'using' },
        { name: 'PE', status: 'using' }
      ],
      problems: ['cant-access-text', 'academic-language', 'behind-grade-level']
    },

    // ---- Tier 3 ----
    {
      id: 'behavior-intervention-plan',
      name: 'Behavior Intervention Plan (BIP)',
      icon: '📊',
      tier: 3,
      order: 6,
      url: 'interventions/tier3/behavior-intervention-plan.html',
      rating: 5,
      categories: ['behavior', 'legal'],
      description: 'Formal plan based on functional assessment (legally required if behavior impedes learning).',
      bestFor: 'Persistent, significant behavior challenges',
      departments: [
        { name: 'Social Studies', status: 'using' },
        { name: 'PE', status: 'using', note: 'ABC tracking' },
        { name: 'Counseling & Psych', status: 'using', note: 'lead' }
      ],
      problems: ['cant-focus', 'behavior']
    },
    {
      id: 'student-collaboration',
      name: 'Collaboration About Specific Students',
      icon: '🤝',
      tier: 3,
      order: 2,
      url: 'interventions/tier3/student-collaboration.html',
      rating: 5,
      categories: ['team'],
      description: 'Structured team meetings to coordinate intensive support.',
      bestFor: 'Complex needs, wraparound support, problem-solving',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Math', status: 'must-have' },
        { name: 'Social Studies', status: 'must-have' },
        { name: 'Counseling', status: 'using', note: 'leads' }
      ],
      problems: ['wont-start', 'disengaged', 'behavior', 'safety']
    },
    {
      id: 'crisis-intervention',
      name: 'Crisis Intervention',
      icon: '🚨',
      tier: 3,
      order: 7,
      url: 'interventions/tier3/crisis-intervention.html',
      rating: 5,
      categories: ['behavior'],
      description: 'Safety plan for students with self-harm, aggression, or severe dysregulation.',
      bestFor: 'Safety concerns, mental health crises',
      departments: [
        { name: 'Counseling', status: 'using', note: 'leads' },
        { name: 'PE', status: 'using', note: 'safety plans' },
        { name: 'Admin + Psych', status: 'using' }
      ],
      problems: ['safety']
    },
    {
      id: 'iep-504-accommodations',
      name: 'IEP & 504 Accommodations',
      icon: '📋',
      tier: 3,
      order: 1,
      url: 'interventions/tier3/iep-504-accommodations.html',
      rating: 5,
      ratingNote: 'Legally Required',
      categories: ['legal', 'academic'],
      description: 'Mandated supports for students with documented disabilities.',
      bestFor: 'Students with IEPs or 504 plans',
      departments: [
        { name: 'All core subjects', status: 'using' },
        { name: 'Electives', status: 'using' }
      ],
      problems: ['cant-show-it', 'behind-grade-level']
    },
    {
      id: 'modified-curriculum',
      name: 'Modified Curriculum/Assessment',
      icon: '📖',
      tier: 3,
      order: 3,
      url: 'interventions/tier3/modified-curriculum.html',
      rating: 4,
      categories: ['academic', 'legal'],
      description: 'Changes to WHAT student learns, not just HOW (IEP-specified).',
      bestFor: 'Significant cognitive disabilities',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Math', status: 'must-have' },
        { name: 'Social Studies', status: 'must-have' }
      ],
      problems: ['cant-access-text', 'behind-grade-level']
    },
    {
      id: 'one-on-one-intensive',
      name: 'One-on-One Intensive Intervention',
      icon: '👤',
      tier: 3,
      order: 4,
      url: 'interventions/tier3/one-on-one-intensive.html',
      rating: 5,
      categories: ['academic'],
      description: 'Daily individual instruction by specialist (20-40 min).',
      bestFor: 'Severe skill deficits (dyslexia, dyscalculia)',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Math', status: 'using' },
        { name: 'Science', status: 'using' },
        { name: 'PE', status: 'using' },
        { name: 'Electives', status: 'using' }
      ],
      problems: ['cant-access-text', 'academic-language', 'behind-grade-level']
    },
    {
      id: 'paraprofessional-support',
      name: 'Paraprofessional Support',
      icon: '🧑‍🏫',
      tier: 3,
      order: 5,
      url: 'interventions/tier3/paraprofessional-support.html',
      rating: 4,
      categories: ['legal'],
      description: 'Dedicated aide for student (IEP-specified).',
      bestFor: 'Significant support needs across settings',
      departments: [
        { name: 'Math', status: 'using' },
        { name: 'Science', status: 'using' },
        { name: 'PE', status: 'using' }
      ],
      problems: ['wont-start', 'cant-focus']
    },
    {
      id: 'wraparound-services',
      name: 'Wraparound Services',
      icon: '🌐',
      tier: 3,
      order: 8,
      url: 'interventions/tier3/wraparound-services.html',
      rating: 5,
      categories: ['team'],
      description: 'Coordination with outside agencies (mental health, medical, social services).',
      bestFor: 'Complex needs requiring multiple service providers',
      departments: [
        { name: 'Counseling', status: 'using', note: 'leads' },
        { name: 'FRA', status: 'using' }
      ],
      problems: ['safety']
    }
  ],

  problems: [
    {
      id: 'wont-start',
      label: "Won't start tasks / doesn't turn work in",
      shortLabel: "Won't start work",
      steps: [
        { tier: 1, framing: 'Start here — try for 4–6 weeks',
          interventions: ['organizational-systems', 'modeling'] },
        { tier: 2, framing: "If no change — add, don't replace",
          interventions: ['chunking', 'frequent-check-ins', 'parent-communication'] },
        { tier: 3, framing: 'Still stuck — bring to SST',
          interventions: ['student-collaboration', 'paraprofessional-support'] }
      ]
    },
    {
      id: 'cant-access-text',
      label: "Can't access the reading or materials",
      shortLabel: "Can't access text",
      steps: [
        { tier: 1, framing: 'Start here — try for 4–6 weeks',
          interventions: ['text-to-speech', 'graphic-organizers'] },
        { tier: 2, framing: "If no change — add, don't replace",
          interventions: ['differentiated-materials', 'small-group-instruction'] },
        { tier: 3, framing: 'Still stuck — bring to SST',
          interventions: ['one-on-one-intensive', 'modified-curriculum'] }
      ]
    },
    {
      id: 'academic-language',
      label: 'Struggling with academic language',
      shortLabel: 'Academic language',
      steps: [
        { tier: 1, framing: 'Start here — try for 4–6 weeks',
          interventions: ['vocabulary-support', 'turn-and-talk', 'text-to-speech'] },
        { tier: 2, framing: "If no change — add, don't replace",
          interventions: ['small-group-instruction', 'differentiated-materials'] },
        { tier: 3, framing: 'Still stuck — bring to SST',
          interventions: ['one-on-one-intensive'] }
      ]
    },
    {
      id: 'cant-show-it',
      label: "Understands it but can't show it",
      shortLabel: "Can't show learning",
      steps: [
        { tier: 1, framing: 'Start here — try for 4–6 weeks',
          interventions: ['choice-in-learning', 'retakes-corrections'] },
        { tier: 2, framing: "If no change — add, don't replace",
          interventions: ['modified-rubrics'] },
        { tier: 3, framing: 'Still stuck — bring to SST',
          interventions: ['iep-504-accommodations'] }
      ]
    },
    {
      id: 'disengaged',
      label: 'Disengaged, not participating',
      shortLabel: 'Disengaged',
      steps: [
        { tier: 1, framing: 'Start here — try for 4–6 weeks',
          interventions: ['greeting-students', 'turn-and-talk', 'choice-in-learning'] },
        { tier: 2, framing: "If no change — add, don't replace",
          interventions: ['frequent-check-ins', 'preferential-seating'] },
        { tier: 3, framing: 'Still stuck — bring to SST',
          interventions: ['student-collaboration'] }
      ]
    },
    {
      id: 'cant-focus',
      label: "Can't focus or stay on task",
      shortLabel: "Can't focus",
      steps: [
        { tier: 1, framing: 'Start here — try for 4–6 weeks',
          interventions: ['organizational-systems'] },
        { tier: 2, framing: "If no change — add, don't replace",
          interventions: ['preferential-seating', 'chunking', 'behavior-check-ins'] },
        { tier: 3, framing: 'Still stuck — bring to SST',
          interventions: ['paraprofessional-support', 'behavior-intervention-plan'] }
      ]
    },
    {
      id: 'behavior',
      label: 'Behavior is disrupting learning',
      shortLabel: 'Disruptive behavior',
      steps: [
        { tier: 1, framing: 'Start here — try for 4–6 weeks',
          interventions: ['greeting-students'] },
        { tier: 2, framing: "If no change — add, don't replace",
          interventions: ['behavior-check-ins', 'parent-communication'] },
        { tier: 3, framing: 'Still stuck — bring to SST',
          interventions: ['behavior-intervention-plan', 'student-collaboration'] }
      ]
    },
    {
      id: 'safety',
      label: 'Safety or mental health concern',
      shortLabel: 'Safety concern',
      steps: [
        { tier: 3, framing: 'Go now — do not wait',
          referral: { who: 'School counselor or SST',
                      detail: 'Counselors are the point of contact for each student. SST meets Wednesdays at 10:00 AM.' } },
        { tier: 3, framing: 'Formal supports',
          interventions: ['crisis-intervention', 'wraparound-services', 'student-collaboration'] }
      ]
    },
    {
      id: 'behind-grade-level',
      label: 'Falling well behind grade level',
      shortLabel: 'Behind grade level',
      steps: [
        { tier: 1, framing: 'Start here — try for 4–6 weeks',
          interventions: ['progress-monitoring'] },
        { tier: 2, framing: "If no change — add, don't replace",
          interventions: ['small-group-instruction', 'modified-rubrics'] },
        { tier: 3, framing: 'Still stuck — bring to SST',
          interventions: ['one-on-one-intensive', 'modified-curriculum', 'iep-504-accommodations'] }
      ]
    },
    {
      id: 'attendance',
      label: 'Missing a lot of school',
      shortLabel: 'Attendance',
      steps: [
        { tier: 1, framing: 'This is already tracked — talk to the people who own it',
          referral: { who: 'Family Resource Advocate or attendance secretary',
                      detail: 'Attendance is monitored for all students. Bring persistent concerns to SST, Wednesdays at 10:00 AM.' } }
      ]
    }
  ]
};
