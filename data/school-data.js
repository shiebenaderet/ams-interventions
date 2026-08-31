/* AMS student data — the August 2026 PD handout, transcribed.
 *
 * Source: "AMS Copy of Edmonds School Data Template for PD August 2026" (16pp).
 * Every figure here comes from that handout. Nothing is computed, estimated,
 * or pulled from elsewhere.
 *
 * null means the handout reported N<10 or left the cell blank. Never replace a
 * null with a number.
 *
 * After editing, run: node tools/check-school-data.js
 */
window.AMSData = {
  meta: {
    handout: 'AMS Copy of Edmonds School Data Template for PD August 2026',
    session: 'August 31, 2026 Professional Learning',
    school: 'Alderwood Middle School',
    growthDistrictNote:
      'Reports the Edmonds School District as a whole, not Alderwood. It is the ' +
      'only growth data available for program groups, and Alderwood may sit above ' +
      'or below it.',
    sources: [
      { k: 'Growth & proficiency', v: 'SBA/WCAS, 2024-25' },
      { k: 'WSIF', v: '2023, 2024, 2025 cycles' },
      { k: 'Attendance', v: '2024-25' },
      { k: 'i-Ready', v: 'Spring 2026' },
      { k: 'Grades', v: 'S2 24-25 to S2 25-26' },
      { k: 'Survey', v: 'Spring 2026' }
    ]
  },

  /* SBA median student growth percentile — ALDERWOOD, 2024-25 */
  growthSchool: [
    {g:"All Students", grp:"all",  ela:55.0, math:56.0},
    {g:"Female",       grp:"gen",  ela:58.5, math:53.0},
    {g:"Gender X",     grp:"gen",  ela:null, math:null},
    {g:"Male",         grp:"gen",  ela:51.0, math:57.5},
    {g:"American Indian/Alaskan Native", grp:"race", ela:null, math:null},
    {g:"Asian",        grp:"race", ela:55.0, math:68.0},
    {g:"Black/African American", grp:"race", ela:61.5, math:60.5},
    {g:"Hispanic/Latino", grp:"race", ela:47.0, math:47.0},
    {g:"Native Hawaiian/Pacific Islander", grp:"race", ela:null, math:null},
    {g:"Two or More Races", grp:"race", ela:66.0, math:51.0},
    {g:"White",        grp:"race", ela:61.5, math:58.5}
  ],

  /* SBA median SGP — EDMONDS SCHOOL DISTRICT (not Alderwood), 2024-25 */
  growthDistrict: [
    {g:"English Language Learners", ela:44.0, math:52.0, flag:1},
    {g:"Non-English Language Learners", ela:59.0, math:57.0},
    {g:"Homeless", ela:30.0, math:49.0, flag:1},
    {g:"Non-Homeless", ela:56.0, math:56.0},
    {g:"Low-Income", ela:52.0, math:52.0, flag:1},
    {g:"Non-Low Income", ela:59.0, math:58.0},
    {g:"Section 504", ela:63.0, math:53.0},
    {g:"Non-Section 504", ela:55.0, math:56.0},
    {g:"Students with Disabilities", ela:40.0, math:50.0, flag:1},
    {g:"Students without Disabilities", ela:59.0, math:56.0},
    {g:"Non-Foster Care", ela:55.0, math:56.0},
    {g:"Non-Highly Capable", ela:55.0, math:56.0},
    {g:"Non-Migrant", ela:55.0, math:56.0},
    {g:"Non-Military Parent", ela:56.0, math:56.0},
    {g:"Migrant", ela:null, math:null},
    {g:"Military Parent", ela:null, math:null}
  ],

  /* % scoring Level 3 or 4 — ALDERWOOD, 2024-25 */
  prof: {
    race:[
      {g:"All Students", ela:46.7, math:32.3, sci:41.3, all:1},
      {g:"American Indian/Alaskan Native", ela:null, math:null, sci:null},
      {g:"Asian", ela:61.9, math:55.2, sci:47.3},
      {g:"Black/African American", ela:42.5, math:26.3, sci:22.0},
      {g:"Hispanic/Latino", ela:31.2, math:17.6, sci:25.7},
      {g:"Native Hawaiian/Pacific Islander", ela:null, math:null, sci:null},
      {g:"Two or More Races", ela:63.3, math:33.3, sci:69.2},
      {g:"White", ela:54.8, math:37.6, sci:57.6}
    ],
    gender:[
      {g:"Female", ela:49.7, math:29.2, sci:37.2},
      {g:"Male", ela:43.5, math:35.1, sci:44.9},
      {g:"Gender X", ela:null, math:null, sci:null}
    ],
    prog:[
      {g:"English Language Learners", ela:11.9, math:10.2, sci:7.8},
      {g:"Non-English Language Learners", ela:60.6, math:41.2, sci:55.0},
      {g:"Students with Disabilities", ela:12.2, math:8.7, sci:19.6},
      {g:"Students without Disabilities", ela:54.1, math:37.4, sci:45.6},
      {g:"Low-Income", ela:35.4, math:22.3, sci:32.6},
      {g:"Non-Low Income", ela:61.1, math:45.1, sci:53.9},
      {g:"Homeless", ela:15.0, math:20.0, sci:30.0},
      {g:"Non-Homeless", ela:47.7, math:32.7, sci:42.5},
      {g:"Section 504", ela:53.3, math:31.1, sci:41.7},
      {g:"Non-Section 504", ela:46.2, math:32.4, sci:41.3}
    ]
  },

  /* WSIF final score 1-10 by group */
  wsif: [
    {g:"All Students", v:[5.45,4.25,4.95]},
    {g:"Asian", v:[7.85,6.78,7.33]},
    {g:"Two or More Races", v:[7.88,6.35,7.00]},
    {g:"White", v:[6.43,6.45,6.80]},
    {g:"Black/African American", v:[4.83,2.45,3.55]},
    {g:"Low-Income", v:[3.40,2.33,2.83]},
    {g:"Hispanic/Latino", v:[2.38,2.00,2.55]},
    {g:"English Language Learners", v:[2.30,1.15,1.88]},
    {g:"Students with Disabilities", v:[2.20,1.83,1.82]}
  ],
  wsifYears: ["2023 Cycle","2024 Annual","2025 Annual"],

  /* Attendance 2024-25 — % with fewer than two absences per month */
  att: {
    all:[{g:"All Students", v:72.1, all:1}],
    gender:[{g:"Female", v:72.6},{g:"Gender X", v:null},{g:"Male", v:71.7}],
    race:[
      {g:"American Indian/Alaskan Native", v:null},
      {g:"Asian", v:83.9},
      {g:"Black/African American", v:84.9},
      {g:"Hispanic/Latino", v:65.4},
      {g:"Native Hawaiian/Pacific Islander", v:null},
      {g:"Two or More Races", v:68.8},
      {g:"White", v:68.9}
    ],
    prog:[
      {g:"English Language Learners", v:64.8},
      {g:"Non-English Language Learners", v:75.3},
      {g:"Foster Care", v:null},
      {g:"Non-Foster Care", v:72.2},
      {g:"Highly Capable", v:null},
      {g:"Non-Highly Capable", v:72.2},
      {g:"Homeless", v:38.5},
      {g:"Non-Homeless", v:73.4},
      {g:"Low Income", v:66.8},
      {g:"Non-Low Income", v:78.5},
      {g:"Migrant", v:null},
      {g:"Non-Migrant", v:72.1},
      {g:"Military Parent", v:null},
      {g:"Non-Military Parent", v:72.2},
      {g:"Mobile", v:47.4},
      {g:"Non-Mobile", v:72.8},
      {g:"Section 504", v:63.8},
      {g:"Non-Section 504", v:72.7},
      {g:"Students with Disabilities", v:58.2},
      {g:"Students without Disabilities", v:75.4}
    ]
  },

  /* i-Ready overall grade-level placement, Spring 2026.
     Columns: mid/above grade, early on grade, one below, two below, three+ below */
  iready: {
    ela:[
      {g:"Asian", v:[35,21,13,8,23], n:"104/107"},
      {g:"Two or more Races", v:[34,14,24,7,21], n:"29/32"},
      {g:"American Indian or Alaska Native", v:[33,0,33,0,33], n:"3/3"},
      {g:"Black or African American", v:[25,26,19,9,21], n:"68/70"},
      {g:"White", v:[24,24,18,6,28], n:"215/218"},
      {g:"Female", v:[24,24,16,8,28], n:"322/329"},
      {g:"Male", v:[22,16,20,9,34], n:"319/327"},
      {g:"Hispanic or Latino", v:[15,14,19,10,42], n:"217/221"},
      {g:"Native Hawaiian or other Pacific Islander", v:[0,20,0,40,40], n:"5/5"},
      {g:"Special Education", v:[8,6,10,6,70], n:"114/119"},
      {g:"English Learner", v:[6,8,13,9,64], n:"173/177"}
    ],
    math:[
      {g:"Asian", v:[34,26,24,1,15], n:"105/107"},
      {g:"American Indian or Alaska Native", v:[33,0,33,0,33], n:"3/3"},
      {g:"Black or African American", v:[22,13,32,7,26], n:"69/70"},
      {g:"White", v:[20,19,26,7,29], n:"215/218"},
      {g:"Female", v:[20,16,29,6,30], n:"325/329"},
      {g:"Male", v:[17,17,27,5,33], n:"321/327"},
      {g:"Two or more Races", v:[13,13,38,6,31], n:"32/32"},
      {g:"Hispanic or Latino", v:[9,13,29,6,43], n:"217/221"},
      {g:"English Learner", v:[9,9,24,5,54], n:"173/177"},
      {g:"Special Education", v:[4,3,16,6,70], n:"115/119"},
      {g:"Native Hawaiian or other Pacific Islander", v:[0,0,60,0,40], n:"5/5"}
    ]
  },
  iLabels: ["Mid or above grade","Early on grade","One grade below","Two grades below","Three+ grades below"],

  /* % of F / No-Credit grades */
  fnc: {
    prog:[
      {g:"All Students", a:8, b:9},
      {g:"Multilingual Learners", a:15, b:15},
      {g:"Special Education", a:12, b:12},
      {g:"Students experiencing homelessness", a:15, b:22},
      {g:"Students eligible for free/reduced meals", a:12, b:14}
    ],
    race:[
      {g:"American Indian or Alaska Native", a:null, b:null},
      {g:"Asian", a:2, b:2},
      {g:"Black or African American", a:8, b:10},
      {g:"Hispanic/Latino", a:13, b:12},
      {g:"Native Hawaiian or Other Pacific Islander", a:null, b:null},
      {g:"Two or More Races", a:11, b:13},
      {g:"White", a:6, b:8}
    ]
  },

  /* Student survey, Alderwood, Spring 2026. */
  survey: {
    overall:{belong:64, rel:49},
    rows:[
      {g:"Asian", belong:72, rel:58},
      {g:"Black or African American", belong:71, rel:56},
      {g:"White", belong:64, rel:49},
      {g:"Two or More Races", belong:60, rel:44},
      {g:"Hispanic/Latino", belong:59, rel:44},
      {g:"American Indian or Alaska Native", belong:null, rel:null},
      {g:"Native Hawaiian or Other Pacific Islander", belong:null, rel:null},
      {g:"Female", belong:62, rel:44},
      {g:"Male", belong:68, rel:55},
      {g:"Multilingual Learners", belong:65, rel:49},
      {g:"Special Education", belong:62, rel:51},
      {g:"Free/Reduced Meals", belong:62, rel:47},
      {g:"McKinney Vento", belong:null, rel:null}
    ]
  }
};
