/* AMS Interventions — single source of truth.
 *
 * To add an intervention:
 *   1. Add a record below (keep the list alphabetical within its tier).
 *   2. Create the detail page at the path in `url`.
 *   3. Run: node tools/check-data.js
 *
 * id          must match the detail page filename without ".html"
 * tier        1, 2 or 3
 * rating      integer 1-5 (stars are rendered from this)
 * ratingNote  optional string shown after the stars, e.g. "(Legally Required)"
 * status      "must-have" | "using" | "exploring"
 */
window.AMS = {
  interventions: [
    // ---- Tier 1 ----
    {
      id: 'choice-in-learning',
      name: 'Choice in Demonstration of Learning',
      icon: '🎨',
      tier: 1,
      url: 'interventions/tier1/choice-in-learning.html',
      rating: 4,
      categories: ['instruction'],
      description: 'Students show understanding through different formats while meeting the same standard.',
      bestFor: 'Student agency, differentiation, engagement',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Social Studies', status: 'using' }
      ],
      problems: []
    },
    {
      id: 'graphic-organizers',
      name: 'Graphic Organizers',
      icon: '🗂️',
      tier: 1,
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
      problems: []
    },
    {
      id: 'greeting-students',
      name: 'Greeting Students at the Door',
      icon: '👋',
      tier: 1,
      url: 'interventions/tier1/greeting-students.html',
      rating: 4,
      categories: ['relationship'],
      description: 'Personal greetings as students enter to build relationships and set positive tone.',
      bestFor: 'Relationships, classroom climate, behavior',
      departments: [
        { name: 'PE', status: 'using' },
        { name: 'Electives', status: 'must-have' }
      ],
      problems: []
    },
    {
      id: 'modeling',
      name: 'Modeling: I Do, We Do, You Do',
      icon: '👨‍🏫',
      tier: 1,
      url: 'interventions/tier1/modeling.html',
      rating: 5,
      categories: ['instruction'],
      description: 'Gradual release of responsibility from teacher demonstration to independent practice.',
      bestFor: 'Skill development, building independence',
      departments: [
        { name: 'Math', status: 'must-have' },
        { name: 'Electives', status: 'using' }
      ],
      problems: []
    },
    {
      id: 'organizational-systems',
      name: 'Organizational Systems',
      icon: '📋',
      tier: 1,
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
      problems: []
    },
    {
      id: 'progress-monitoring',
      name: 'Progress Monitoring',
      icon: '📊',
      tier: 1,
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
      problems: []
    },
    {
      id: 'retakes-corrections',
      name: 'Retakes and Corrections',
      icon: '🔄',
      tier: 1,
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
      problems: []
    },
    {
      id: 'text-to-speech',
      name: 'Text-to-Speech & Speech-to-Text',
      icon: '🔊',
      tier: 1,
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
      problems: []
    },
    {
      id: 'turn-and-talk',
      name: 'Turn and Talk / Think-Pair-Share',
      icon: '💬',
      tier: 1,
      url: 'interventions/tier1/turn-and-talk.html',
      rating: 4,
      categories: ['instruction'],
      description: 'Structured partner discussion for processing thinking and practicing academic language.',
      bestFor: 'Engagement, language development, comprehension',
      departments: [
        { name: 'Math', status: 'using' },
        { name: 'Science', status: 'using' }
      ],
      problems: []
    },
    {
      id: 'vocabulary-support',
      name: 'Vocabulary Support',
      icon: '📝',
      tier: 1,
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
      problems: []
    },

    // ---- Tier 2 ----
    {
      id: 'behavior-check-ins',
      name: 'Behavior Check-Ins',
      icon: '📋',
      tier: 2,
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
      problems: []
    },
    {
      id: 'chunking',
      name: 'Chunking',
      icon: '🧩',
      tier: 2,
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
      problems: []
    },
    {
      id: 'differentiated-materials',
      name: 'Differentiated Materials',
      icon: '📚',
      tier: 2,
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
      problems: []
    },
    {
      id: 'frequent-check-ins',
      name: 'Frequent Check-Ins',
      icon: '✅',
      tier: 2,
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
      problems: []
    },
    {
      id: 'parent-communication',
      name: 'Individualized Parent Communication',
      icon: '📞',
      tier: 2,
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
      problems: []
    },
    {
      id: 'modified-rubrics',
      name: 'Modified Rubrics',
      icon: '📝',
      tier: 2,
      url: 'interventions/tier2/modified-rubrics.html',
      rating: 4,
      categories: ['assessment'],
      description: 'Scaffolded assessments that fade support over time.',
      bestFor: 'Students who understand content but struggle with format',
      departments: [
        { name: 'ELA', status: 'using' },
        { name: 'Social Studies', status: 'using' }
      ],
      problems: []
    },
    {
      id: 'preferential-seating',
      name: 'Preferential Seating',
      icon: '💺',
      tier: 2,
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
      problems: []
    },
    {
      id: 'small-group-instruction',
      name: 'Small Group Instruction',
      icon: '👥',
      tier: 2,
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
      problems: []
    },

    // ---- Tier 3 ----
    {
      id: 'behavior-intervention-plan',
      name: 'Behavior Intervention Plan (BIP)',
      icon: '📊',
      tier: 3,
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
      problems: []
    },
    {
      id: 'student-collaboration',
      name: 'Collaboration About Specific Students',
      icon: '🤝',
      tier: 3,
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
      problems: []
    },
    {
      id: 'crisis-intervention',
      name: 'Crisis Intervention',
      icon: '🚨',
      tier: 3,
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
      problems: []
    },
    {
      id: 'iep-504-accommodations',
      name: 'IEP & 504 Accommodations',
      icon: '📋',
      tier: 3,
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
      problems: []
    },
    {
      id: 'modified-curriculum',
      name: 'Modified Curriculum/Assessment',
      icon: '📖',
      tier: 3,
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
      problems: []
    },
    {
      id: 'one-on-one-intensive',
      name: 'One-on-One Intensive Intervention',
      icon: '👤',
      tier: 3,
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
      problems: []
    },
    {
      id: 'paraprofessional-support',
      name: 'Paraprofessional Support',
      icon: '🧑‍🏫',
      tier: 3,
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
      problems: []
    },
    {
      id: 'wraparound-services',
      name: 'Wraparound Services',
      icon: '🌐',
      tier: 3,
      url: 'interventions/tier3/wraparound-services.html',
      rating: 5,
      categories: ['team'],
      description: 'Coordination with outside agencies (mental health, medical, social services).',
      bestFor: 'Complex needs requiring multiple service providers',
      departments: [
        { name: 'Counseling', status: 'using', note: 'leads' },
        { name: 'FRA', status: 'using' }
      ],
      problems: []
    }
  ],

  problems: []
};
