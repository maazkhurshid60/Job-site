/* Long-form hiring guides. These target the informational long-tail keywords in
   SEO.md (Cluster A) — "how to hire civil engineers", "contingency vs retained",
   "hiring engineers for DOT projects" and so on.

   Content rule: these describe how engineering hiring actually works, not what
   JobFolder has done. Nothing here claims a client, a placement count, or a
   result we cannot substantiate. Licensure and certification specifics vary by
   state, and the copy says so rather than asserting a single national rule. */

export type GuideSection = {
  heading: string;
  /** Paragraphs. Rendered in order. */
  body: string[];
  /** Optional bulleted list rendered after the paragraphs. */
  bullets?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  /** Meta description + the card blurb on the index page. */
  summary: string;
  /** Primary keyword this guide is written to rank for. */
  keyword: string;
  keywords: string[];
  /** Rough reading time, shown on the card. */
  readingTime: string;
  /** Lead paragraph under the H1. */
  intro: string;
  sections: GuideSection[];
};

export const guides: Guide[] = [
  {
    slug: "how-to-hire-civil-engineers",
    title: "How to Hire Civil Engineers",
    summary:
      "What actually determines whether a civil engineering role gets filled — licensure, discipline fit, and the scoping mistakes that stall searches before they start.",
    keyword: "how to hire civil engineers",
    keywords: [
      "how to hire civil engineers",
      "civil engineering recruitment",
      "hire PE licensed engineers",
      "civil engineer job description",
    ],
    readingTime: "8 min read",
    intro:
      "Civil engineering roles fail to fill for predictable reasons, and almost none of them are about compensation. They are about a job spec written for an audience that does not exist, a licensure requirement nobody checked against the actual scope of work, and a process slower than the market it is hiring in.",
    sections: [
      {
        heading: "Decide whether you actually need a PE",
        body: [
          "The Professional Engineer licence is the single biggest filter you can apply to a civil talent pool, and it is applied far more often than the work requires. A PE is legally necessary to take responsible charge of engineering work and to seal drawings. It is not necessary to produce those drawings under someone else's seal.",
          "The route to licensure is long: an ABET-accredited degree, the Fundamentals of Engineering exam, a period of qualifying experience under a licensed engineer that is commonly around four years, and then the PE exam itself. That length is exactly why the licensed pool is small and why requiring a PE narrows your candidate set dramatically.",
          "So ask a specific question before writing the spec: will this person seal work? If yes, the PE is non-negotiable and you should budget for a longer, more competitive search. If they will work under a licensed engineer, an EIT or an experienced unlicensed designer opens up a far larger pool — often at a materially lower cost, and often with a candidate who is actively working toward licensure and therefore motivated to stay.",
        ],
      },
      {
        heading: "Check which state's licence you need",
        body: [
          "Licensure is granted state by state, not nationally. An engineer licensed in one state cannot simply practise in another; they need licensure in the state where the work is performed. Most states have comity or reciprocity provisions that let a licensed engineer obtain a licence elsewhere without re-examining, and NCEES records make that transfer administratively easier, but it is still a process with a timeline.",
          "This matters enormously for scheduling. If your project needs a sealed deliverable in ninety days and your best candidate is licensed in a neighbouring state, you need to know how long that state's board takes to process a comity application before you make the offer, not after.",
        ],
      },
      {
        heading: "Be specific about the discipline",
        body: [
          "\"Civil engineer\" is not a job description. It is a category containing people whose day-to-day work has almost nothing in common. A transportation engineer doing roadway geometrics, a structural engineer doing bridge load ratings, a water resources engineer doing hydraulic modelling, and a geotechnical engineer doing foundation design are not interchangeable, and a spec that treats them as such will attract all four and fit none.",
          "Name the discipline, the software, and the deliverable. That single change does more for candidate quality than any amount of employer branding.",
        ],
        bullets: [
          "Transportation / roadway — geometric design, MicroStation and OpenRoads, state DOT design standards",
          "Structural — bridge or building design, load rating, AASHTO LRFD or ACI/AISC codes",
          "Water resources / hydrology — hydraulic and hydrologic modelling, HEC-RAS, stormwater and floodplain work",
          "Geotechnical — subsurface investigation, foundation and slope design, retaining structures",
          "Construction / CEI — inspection, materials testing, contractor oversight in the field",
          "Land development / site — grading, utilities, entitlements and permitting",
        ],
      },
      {
        heading: "Write the spec around the work, not the wish list",
        body: [
          "The most common failure in an engineering job description is the aggregated wish list: every requirement anyone on the hiring panel mentioned, concatenated, with no distinction between essential and desirable. The result reads as a description of a person who does not exist, and the strongest candidates — who read specs carefully and self-select out — are precisely the ones you lose.",
          "Separate must-haves from nice-to-haves explicitly and keep the must-have list short enough to defend. For each item on it, be able to answer why the role fails without it. Anything you cannot defend belongs in the second list.",
          "State the compensation range. Engineers talk to each other and to recruiters constantly; the range is not a secret you are keeping, it is a filter you are declining to apply. Withholding it mostly costs you candidates who would have been in range.",
        ],
      },
      {
        heading: "Fix your process before you blame the market",
        body: [
          "Strong engineering candidates in an active market are usually in more than one process. If your loop involves four rounds spread over six weeks, you will lose to a firm that ran three rounds in ten days, regardless of who offered more.",
          "Compress the loop, decide who the actual decision-maker is before you start, and give feedback within days rather than weeks. If a candidate has to chase you, they have already learned something about what working there is like.",
        ],
        bullets: [
          "Agree the interview loop and the decision-maker before the role is posted",
          "Target days, not weeks, between stages",
          "Have the compensation range signed off before the first conversation",
          "Know your licensure and start-date constraints up front",
        ],
      },
      {
        heading: "Where an outside recruiter helps — and where it doesn't",
        body: [
          "An external recruiter is worth using when the constraint is reach: the people you want are employed, not browsing job boards, and concentrated in a discipline where knowing who is who is the whole job. They are not worth using to fix a broken spec or a slow process — those problems travel with the role.",
          "If you do go external, the question worth asking is how many people will actually be working your role. A single recruiter on a single desk has a finite network. A network model puts many specialists on the same brief at once, which is why it tends to move faster on narrow disciplines — provided someone is still screening the output before it reaches you.",
        ],
      },
    ],
  },
  {
    slug: "hiring-for-dot-projects",
    title: "Hiring Engineers for DOT Projects",
    summary:
      "Prequalification, funding cycles and inspection certifications make public transportation hiring unlike private-sector engineering hiring. Here's what changes.",
    keyword: "hiring engineers for DOT projects",
    keywords: [
      "hiring engineers for DOT projects",
      "DOT staffing",
      "transportation engineering recruitment",
      "state DOT prequalification",
    ],
    readingTime: "7 min read",
    intro:
      "Hiring for state DOT and public transportation work runs on a different clock and a different rulebook than private engineering hiring. The technical skills overlap heavily. Almost everything around them — how work is won, how staff are approved, when the money appears — does not.",
    sections: [
      {
        heading: "Prequalification shapes who you can hire",
        body: [
          "Most state DOTs require consultants to be prequalified in specific work categories before they can be awarded that work. Prequalification generally depends on the firm demonstrating relevant experience and appropriately qualified staff in each category it wants to hold.",
          "That inverts the usual relationship between hiring and work. In the private sector you win the project and then staff it. Here, the staff you hold can determine which categories you can hold, which determines what you are eligible to pursue. A senior hire in a discipline you are trying to enter is not just capacity, it is access.",
          "The practical implication for recruiting: the specific project experience on a candidate's CV matters more than it would elsewhere, because it may have to be documented to a state board rather than just evaluated by you.",
        ],
      },
      {
        heading: "Funding cycles create hiring spikes",
        body: [
          "Public infrastructure work is funded in programmes and lettings, not continuously. When a large programme is authorised or a major letting is scheduled, every consultant pursuing that work needs qualified staff in the same disciplines at the same time — and they are all recruiting from the same regional pool.",
          "This is the single most useful thing to understand about DOT hiring timing. The competitive market for a roadway designer in a given state is not a constant; it spikes hard and predictably around programme announcements. Recruiting into that spike at market pace means losing. Recruiting ahead of it, or having a pipeline already warm, is how firms staff up without overpaying.",
        ],
      },
      {
        heading: "Know the design standards, not just the software",
        body: [
          "Transportation design is governed by published standards, and fluency in them is a real, checkable skill. AASHTO's design guidance and the MUTCD for traffic control devices are national reference points, but each state DOT layers its own design manual, standard drawings and CADD standards on top.",
          "An engineer who has produced plans to one state's standards can usually learn another's, but the ramp-up is real and worth pricing into the hire. If you need someone productive on a specific state's plans immediately, say so in the spec — it is a legitimate and very effective screening criterion.",
        ],
        bullets: [
          "State-specific design manuals and standard drawings",
          "AASHTO geometric design and LRFD bridge design guidance",
          "MUTCD for signing, marking and traffic control",
          "MicroStation / OpenRoads is common on DOT work where private firms may standardise on Civil 3D",
        ],
      },
      {
        heading: "CEI and inspection is a distinct hiring problem",
        body: [
          "Construction Engineering and Inspection staffing behaves nothing like design staffing. The work is field-based, tied to a specific construction schedule and location, and frequently staffed on a contract or project-duration basis rather than as permanent headcount.",
          "The qualifying credentials are certifications rather than licensure. NICET certification in relevant subfields, ACI concrete field testing, IMSA for traffic signals, and state-specific qualification programmes are common requirements — and states maintain their own approved-training programmes that inspectors must hold to work on their projects.",
          "Because inspection staffing follows construction schedules, lead time is short and the requirement is often urgent and geographically fixed. A candidate who is perfect but two states away and uncertified in the relevant state programme is not a candidate for that project. Screening for the specific certifications the project requires, in the state it requires them, is the entire job.",
        ],
      },
      {
        heading: "Expect longer onboarding",
        body: [
          "Public work brings paperwork that private work does not: background checks, project-specific safety training, sometimes security clearance on federal or defence-adjacent work. Clearance in particular can add months and is not something a candidate can accelerate.",
          "If a role genuinely requires an active clearance, treat that as a hard filter and search accordingly, because sponsoring one turns a six-week hire into a much longer project. If it does not, do not put it in the spec — it is one of the most expensive unnecessary requirements you can add.",
        ],
      },
    ],
  },
  {
    slug: "contingency-vs-retained-search",
    title: "Contingency vs Retained Engineering Search",
    summary:
      "The two fee models behind most engineering recruitment, what each one actually buys you, and how to tell which your role needs.",
    keyword: "contingency vs retained engineering search",
    keywords: [
      "contingency vs retained search",
      "engineering recruitment fees",
      "recruitment fee structure",
      "retained search engineering",
    ],
    readingTime: "6 min read",
    intro:
      "Almost every external recruiting arrangement is a variation on two models. The difference is not really about price — the headline percentages are often similar — it is about when you pay, and therefore whose risk it is if the search fails.",
    sections: [
      {
        heading: "Contingency: you pay on the hire",
        body: [
          "Under a contingency arrangement, the recruiter is paid only if you hire someone they introduced. No placement, no fee. The fee is typically calculated as a percentage of the hire's first-year compensation, and it falls due when the placement is confirmed.",
          "The appeal is obvious: your financial risk is close to zero, and you can run more than one contingency firm on the same role. The consequence is equally structural. The recruiter carries all the risk, so they rationally prioritise roles most likely to close. If your role is harder than the other five on their desk, or if they suspect you are slow to decide, their attention goes elsewhere — and you will never be told that is what happened.",
        ],
      },
      {
        heading: "Retained: you pay in stages",
        body: [
          "A retained search is paid in instalments across the engagement, commonly an engagement fee up front with the balance tied to milestones or completion. The recruiter is being paid to run the search rather than to produce a hire, and the engagement is exclusive.",
          "What that buys is committed effort and, usually, a genuine market map rather than whoever answered first. It is the sensible model for roles where the population of qualified people is small enough to enumerate — a principal-level structural engineer with a specific bridge speciality in a specific state, say — because the work is systematic identification rather than sourcing volume.",
          "The trade is that you have paid before you know the outcome, and you have committed to one firm.",
        ],
      },
      {
        heading: "Which one your role needs",
        body: [
          "The useful question is not which model is better but how large the qualified population is and how hard it is to reach.",
          "If there are hundreds of plausible candidates and the constraint is simply reaching them, contingency is efficient and you should not pay a retainer for it. If there are perhaps twenty people in the country who fit and half of them are not looking, contingency will underperform, because no recruiter working at risk will invest weeks in mapping a market they might not be paid for.",
        ],
        bullets: [
          "Large qualified pool, standard requirements → contingency",
          "Small enumerable pool, senior or highly specialised → retained",
          "Confidential replacement of an incumbent → retained, for discretion",
          "Several similar roles at once → negotiate on volume in either model",
        ],
      },
      {
        heading: "The questions worth asking either way",
        body: [
          "Fee percentage is the least interesting term in a recruitment agreement. The terms that actually determine what you get are further down.",
          "Ask what the guarantee period is and whether a departure inside it triggers a replacement or a refund — those are very different things. Ask what the fee is calculated on: base salary alone, or base plus bonus and other elements, which can move the number substantially. Ask how long candidate ownership lasts after an introduction. And ask how many recruiters will genuinely work the role, because \"our team\" and \"one person between other searches\" are both technically true descriptions of the same arrangement.",
        ],
        bullets: [
          "What is the guarantee period, and is it replacement or refund?",
          "Is the fee on base salary or total first-year compensation?",
          "How long does candidate ownership last after an introduction?",
          "How many recruiters actually work the role?",
          "Who screens candidates before they reach me?",
        ],
      },
      {
        heading: "Where a network model sits",
        body: [
          "A crowdsourced or split-fee network is a third arrangement that is contingent in its economics but not single-desk in its reach: many specialist recruiters work the same brief, and the fee is still paid only on a confirmed hire.",
          "That combination addresses contingency's core weakness — one recruiter's limited attention — while keeping your risk on the hire. The thing to verify is who screens. A network without a filter simply forwards you volume, which moves the sorting problem onto your desk. Ask specifically whether candidates are vetted before they reach you, and by whom.",
        ],
      },
    ],
  },
  {
    slug: "writing-an-engineering-job-spec",
    title: "Writing an Engineering Job Spec That Gets Filled",
    summary:
      "A structure for engineering job descriptions that filters accurately instead of describing a person who doesn't exist.",
    keyword: "how to write an engineering job description",
    keywords: [
      "engineering job description",
      "how to write a job spec",
      "civil engineer job description template",
      "engineering role requirements",
    ],
    readingTime: "6 min read",
    intro:
      "A job spec has one job: cause the right people to apply and the wrong people not to. Most engineering specs do neither, because they are written as an internal wish list rather than as a filter — and a filter is the only thing that makes a search fast.",
    sections: [
      {
        heading: "Lead with the work, not the company",
        body: [
          "Engineers evaluate roles by the work. Three paragraphs of company history before the first mention of what the person will actually do loses the readers you most want, because strong candidates are skimming several specs and yours has told them nothing by paragraph three.",
          "Open with the deliverable. What will this person produce, on what kind of project, at what scale? \"Roadway design for state DOT projects, plans through PS&E, typically $5–50M construction value\" tells a qualified candidate more in one line than a page of culture copy.",
        ],
      },
      {
        heading: "Separate must-have from nice-to-have, honestly",
        body: [
          "This is the single highest-leverage change available to most specs. An undifferentiated requirements list reads as fifteen mandatory conditions, and the strongest candidates — who read carefully and self-select out rather than apply speculatively — are exactly the ones you lose to it.",
          "Apply one test to every must-have: does the role genuinely fail without it? If someone could do this job well while lacking it, it is a nice-to-have. Most lists shrink by half under that test, and the search speeds up correspondingly.",
        ],
      },
      {
        heading: "Be precise about licensure and certification",
        body: [
          "\"PE preferred\" is ambiguous in a costly way. Candidates cannot tell whether an unlicensed application will be read, so some qualified people skip it and some unqualified people apply.",
          "State the actual position: PE required at hire, PE required within a defined period, EIT acceptable with a path to licensure, or licensure not required. Name the state if the licence must be held in a particular one. The same precision applies to inspection certifications — say which ones and to which state's programme.",
        ],
        bullets: [
          "PE required in [state] at time of hire",
          "PE required within 12 months; EIT considered",
          "EIT / unlicensed considered — work performed under a licensed engineer",
          "NICET Level [n] in [subfield], or state-specific inspector qualification required",
        ],
      },
      {
        heading: "Publish the range",
        body: [
          "Several states now require pay ranges in postings, and the direction of travel is clear regardless of where you are. But the argument for publishing is practical rather than legal: without a range, you and the candidate discover a mismatch after two interviews instead of before the first.",
          "Post a range you would actually pay within. A range so wide it is meaningless does the same damage as no range, because it fails to filter.",
        ],
      },
      {
        heading: "Say what's true about location",
        body: [
          "\"Hybrid\" and \"flexible\" mean nothing without specifics, and specs that are vague on location generate a predictable volume of wasted conversations. Say how many days on site, at which office, and whether that is negotiable. If the work is field-based, say what proportion and what travel radius.",
          "For inspection and construction roles this is not a preference detail, it is the core requirement — the work happens at a fixed place on a fixed schedule, and a spec that soft-pedals that will surface candidates who cannot take the job.",
        ],
      },
      {
        heading: "A structure that works",
        body: [
          "Nothing here is novel. It is simply ordered by what a candidate needs in order to decide, rather than by what the organisation wants to say.",
        ],
        bullets: [
          "One-line role summary: discipline, project type, location",
          "What you'll work on: three to five bullets of actual deliverables",
          "Must-haves: short, defensible, licensure stated precisely",
          "Nice-to-haves: clearly labelled as such",
          "Compensation range and benefits summary",
          "Location and on-site expectation, stated concretely",
          "The hiring process: how many stages, over what timeframe",
        ],
      },
    ],
  },
  {
    slug: "cei-inspection-staffing",
    title: "Staffing CEI and Construction Inspection Roles",
    summary:
      "Why inspection staffing fails on certification and geography rather than engineering skill — and how to scope the requirement so it doesn't.",
    keyword: "CEI inspection staffing",
    keywords: [
      "CEI inspection staffing",
      "construction inspector recruitment",
      "NICET certified inspectors",
      "DOT construction inspection",
    ],
    readingTime: "5 min read",
    intro:
      "Construction Engineering and Inspection staffing is one of the most time-sensitive requirements in infrastructure hiring, and one of the most commonly mis-scoped. The failure mode is almost never that a candidate cannot do the work. It is that they cannot do it on this project, in this state, starting this month.",
    sections: [
      {
        heading: "Certifications are the gate, not the degree",
        body: [
          "Inspection roles are qualified by certification far more than by degree or licensure. NICET certification in the relevant subfield, ACI concrete field testing grades, IMSA certification for traffic signal and roadway lighting work, and state-administered qualification programmes are the credentials that determine eligibility.",
          "Crucially, states maintain their own approved training and qualification programmes, and an inspector generally has to hold the state's own qualifications to work on that state's projects. A well-credentialed inspector from a neighbouring state may still need to complete specific courses before they can be assigned.",
          "That single fact explains most stalled CEI searches. The requirement is written as \"certified inspector\", the recruiter delivers certified inspectors, and none of them hold the state programme the project actually requires.",
        ],
      },
      {
        heading: "Geography is a hard constraint",
        body: [
          "Design work can be done anywhere. Inspection happens at the job site, daily, on the contractor's schedule. The candidate pool is therefore genuinely limited to people who live within commuting distance or who will relocate for a project of known duration.",
          "Per diem and travel arrangements widen that radius and are standard on many programmes — but they need to be decided and quantified before the search starts, not negotiated at offer stage. \"We might be able to do per diem\" is not something a recruiter can screen against.",
        ],
      },
      {
        heading: "Scope the duration honestly",
        body: [
          "Much inspection work is project-duration rather than permanent, and experienced inspectors are entirely used to that. What loses candidates is ambiguity — a role described as long-term that turns out to end with the construction schedule.",
          "State the expected duration, whether extension is likely, and what happens at the end. Inspectors plan their year around project cycles and will engage with a straight answer far better than an optimistic one.",
        ],
      },
      {
        heading: "Match the level to the work",
        body: [
          "Inspection roles ladder, and specifying the wrong rung is expensive in both directions. A senior inspector on routine observation work will leave; a junior inspector on a role requiring independent judgement on contractor claims will struggle and expose the project.",
          "Describe what the person will decide, not just what they will observe. That distinction sorts the levels more reliably than years of experience does.",
        ],
        bullets: [
          "Inspector / technician — field observation, documentation, materials sampling",
          "Senior inspector — independent judgement on conformance, contractor interface",
          "Lead / project inspector — coordinates inspection staff, owns project documentation",
          "CEI project administrator — contract administration, pay applications, claims",
        ],
      },
      {
        heading: "Start earlier than feels necessary",
        body: [
          "Because the qualified pool is narrowed three times over — by certification, by state programme, and by geography — CEI searches have far less slack than design searches. A requirement identified at notice-to-proceed is already late.",
          "The firms that staff inspection well maintain relationships with inspectors between projects rather than starting from zero each letting. Where that pipeline does not exist internally, a network with existing regional inspection coverage is the practical substitute — the value is specifically in already knowing who is certified where.",
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
