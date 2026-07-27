"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Container } from "./ui";

export type JobListing = {
  id: string;
  title: string;
  location: string;
  type: string;
  remoteType: string;
  country: string;
  datePosted: string;
  daysAgo: number;
  featured: boolean;
  commission: number;
  description: string;
  requirements: string[];
};

// 26 detailed engineering and technical job listings with real commission commissions
const INITIAL_JOBS: JobListing[] = [
  {
    id: "1",
    title: "Senior Engineer (PE) CTDOT/RIDOT",
    location: "North Haven, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "1 day ago",
    daysAgo: 1,
    featured: true,
    commission: 5000,
    description: "We are seeking a Senior Project Engineer (PE) to oversee key CTDOT and RIDOT structural bridge engineering and paving projects. You will act as the principal designer, coordinate with state transportation officials, and lead design reviews.",
    requirements: [
      "Active PE License (Connecticut or Rhode Island)",
      "8+ years of structural bridge design experience",
      "Familiarity with CTDOT/RIDOT design standards and procedures"
    ]
  },
  {
    id: "2",
    title: "Traffic Engineer / Traffic PE – CT",
    location: "Hamden, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "2 days ago",
    daysAgo: 2,
    featured: true,
    commission: 4500,
    description: "Seeking a Traffic Engineer to design intersection layouts, signal systems, and conduct traffic impact studies for municipalities and state agencies across CT.",
    requirements: [
      "Active PE License in Connecticut or EIT on track for PE",
      "5+ years in traffic analysis, signal optimization, and Synchro modeling",
      "Experience with Highway Capacity Manual (HCM) standards"
    ]
  },
  {
    id: "3",
    title: "PE SR Civil Site Project Mang or a Project Engineer – CT",
    location: "Hamden, Connecticut",
    type: "Direct Hire",
    remoteType: "Hybrid",
    country: "United States",
    datePosted: "3 days ago",
    daysAgo: 3,
    featured: true,
    commission: 6000,
    description: "Lead site development projects from initial feasibility studies through planning board approvals. Supervise junior designers and coordinate utility plans.",
    requirements: [
      "Connecticut PE License required",
      "6+ years of civil site development experience (residential/commercial)",
      "Expertise in local zoning regulations and storm water management (SWPPP)"
    ]
  },
  {
    id: "4",
    title: "Inspector – Bridge or Paving CTDOT - Colchester",
    location: "Colchester, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "4 days ago",
    daysAgo: 4,
    featured: true,
    commission: 2500,
    description: "Provide field construction inspection for active bridge repair and paving operations on state highway contracts around Colchester.",
    requirements: [
      "NETTCP Concrete / Hot Mix Asphalt certifications preferred",
      "4+ years of CTDOT highway/bridge construction inspection experience",
      "Ability to read and interpret bridge construction drawings and specs"
    ]
  },
  {
    id: "5",
    title: "Inspector – Bridge or Paving CTDOT - Windsor",
    location: "Windsor, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "4 days ago",
    daysAgo: 4,
    featured: true,
    commission: 2500,
    description: "Oversee roadway subbase preparation, paving layout, and structural concrete pours on state infrastructure projects near Windsor.",
    requirements: [
      "NICET Level II or higher in Highway Construction inspection",
      "Experience documenting daily reports using CTDOT SiteManager system",
      "Strong safety compliance background on active highway corridors"
    ]
  },
  {
    id: "6",
    title: "Structural Bridge Engineer",
    location: "Hartford, Connecticut",
    type: "Direct Hire",
    remoteType: "Hybrid",
    country: "United States",
    datePosted: "5 days ago",
    daysAgo: 5,
    featured: true,
    commission: 4800,
    description: "Design structural steel and prestressed concrete components for highway bridge rehabilitation projects throughout New England.",
    requirements: [
      "BS in Civil Engineering, MS in Structures preferred",
      "4+ years experience in bridge analysis using MicroStation/LARS",
      "PE license is a strong plus, EIT required"
    ]
  },
  {
    id: "7",
    title: "Mechanical Design Engineer (Manufacturing)",
    location: "Stamford, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "5 days ago",
    daysAgo: 5,
    featured: false,
    commission: 4000,
    description: "Develop CAD designs and manufacturing tolerances for precision aerospace mechanical assemblies.",
    requirements: [
      "BS in Mechanical Engineering",
      "SolidWorks certification with 4+ years of industrial mold/injection tooling",
      "Understanding of GD&T (Geometric Dimensioning and Tolerancing)"
    ]
  },
  {
    id: "8",
    title: "Water Resources Engineer",
    location: "New Haven, Connecticut",
    type: "Full-time",
    remoteType: "Hybrid",
    country: "United States",
    datePosted: "6 days ago",
    daysAgo: 6,
    featured: false,
    commission: 4200,
    description: "Model regional drainage basins, design stormwater retention reservoirs, and coordinate environmental impact documentation.",
    requirements: [
      "Degree in Civil/Environmental Engineering",
      "Experience with HEC-RAS, HMS, and CAD software suites",
      "Knowledge of CT DEEP stormwater compliance requirements"
    ]
  },
  {
    id: "9",
    title: "Electrical MEP Engineer",
    location: "Boston, Massachusetts",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "6 days ago",
    daysAgo: 6,
    featured: false,
    commission: 4700,
    description: "Design high-voltage distribution, interior lighting, and emergency power systems for high-tech clinical facilities and commercial buildings.",
    requirements: [
      "Active PE license in Massachusetts",
      "5+ years Revit MEP drafting experience",
      "Expert knowledge of National Electrical Code (NEC)"
    ]
  },
  {
    id: "10",
    title: "CEI Resident Engineer",
    location: "Providence, Rhode Island",
    type: "Contract",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "1 week ago",
    daysAgo: 7,
    featured: false,
    commission: 5500,
    description: "Lead the construction engineering and inspection team on a major highway interchange upgrade in Providence.",
    requirements: [
      "Rhode Island PE registration required",
      "10+ years managing multi-million dollar highway construction inspection contracts",
      "Excellent client relationship and contract administration skills"
    ]
  },
  {
    id: "11",
    title: "Senior Geotechnical Engineer",
    location: "Newark, New Jersey",
    type: "Direct Hire",
    remoteType: "Hybrid",
    country: "United States",
    datePosted: "1 week ago",
    daysAgo: 7,
    featured: false,
    commission: 5200,
    description: "Lead geotechnical investigation, deep foundation analysis, and soil retention calculations for high-rise building projects.",
    requirements: [
      "MS in Geotechnical Engineering, PE required",
      "7+ years experience evaluating seismic and settlement data",
      "Experience using gINT, Plaxis, or equivalent analysis programs"
    ]
  },
  {
    id: "12",
    title: "Environmental Project Manager",
    location: "Albany, New York",
    type: "Full-time",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "1 week ago",
    daysAgo: 8,
    featured: false,
    commission: 3800,
    description: "Coordinate soil and groundwater remediation plans, manage state environmental licensing, and direct field geologists.",
    requirements: [
      "Degree in Geology or Environmental Science",
      "6+ years directing Phase I/II Environmental Site Assessments (ESA)",
      "Strong communication and report writing capability"
    ]
  },
  {
    id: "13",
    title: "Highway Design Engineer (PE)",
    location: "Providence, Rhode Island",
    type: "Direct Hire",
    remoteType: "Hybrid",
    country: "United States",
    datePosted: "1 week ago",
    daysAgo: 8,
    featured: false,
    commission: 6500,
    description: "Lead roadway and interchange design for state DOT programs — geometric design, drainage, and maintenance-of-traffic plans from preliminary engineering through PS&E.",
    requirements: [
      "Active PE License (or EIT on track for PE)",
      "5+ years in highway/roadway design (MicroStation / OpenRoads)",
      "Familiarity with AASHTO and state DOT design standards"
    ]
  },
  {
    id: "14",
    title: "Bridge Design Engineer (PE)",
    location: "New Haven, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "1 week ago",
    daysAgo: 9,
    featured: false,
    commission: 3500,
    description: "Design and load-rate highway bridges and culverts for CTDOT and municipal programs, from preliminary studies through final structural plans.",
    requirements: [
      "Active PE License (CT) or EIT progressing to PE",
      "4+ years in bridge / structural design",
      "Experience with AASHTO LRFD and bridge load rating"
    ]
  },
  {
    id: "15",
    title: "Civil Site Designer / EIT",
    location: "Hamden, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "2 weeks ago",
    daysAgo: 14,
    featured: false,
    commission: 3000,
    description: "Draft utility layouts, grading files, and hydrological models for commercial development projects.",
    requirements: [
      "EIT Certification completed",
      "2+ years experience drafting in AutoCAD Civil 3D",
      "Understanding of state stormwater detention requirements"
    ]
  },
  {
    id: "16",
    title: "Transportation Planner",
    location: "Bridgeport, Connecticut",
    type: "Full-time",
    remoteType: "Hybrid",
    country: "United States",
    datePosted: "2 weeks ago",
    daysAgo: 15,
    featured: false,
    commission: 3200,
    description: "Develop urban transit expansion frameworks, analyze commuter ridership metrics, and model regional traffic growth scenarios.",
    requirements: [
      "Degree in Urban Planning or Transportation Engineering",
      "Experience conducting public impact briefings and coordinating government stakeholders",
      "Proficiency in GIS analysis software"
    ]
  },
  {
    id: "17",
    title: "Senior Estimator (Heavy Civil)",
    location: "Hartford, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "2 weeks ago",
    daysAgo: 16,
    featured: false,
    commission: 5000,
    description: "Assemble multi-million dollar bidding estimates for complex highway infrastructure and bridge rehabilitation contracts.",
    requirements: [
      "8+ years estimating in heavy highway sectors",
      "Expert knowledge of HCSS HeavyBid bidding software",
      "Established relationships with regional material suppliers"
    ]
  },
  {
    id: "18",
    title: "Hydrologist / Water Modeler",
    location: "Boston, Massachusetts",
    type: "Full-time",
    remoteType: "Remote",
    country: "United States",
    datePosted: "2 weeks ago",
    daysAgo: 16,
    featured: false,
    commission: 4100,
    description: "Perform 1D/2D hydraulic flooding simulations for coastal defense designs and regional master plans.",
    requirements: [
      "Degree in Civil, Hydrological, or Environmental Engineering",
      "Proficient modeling with HEC-RAS 2D or FLO-2D",
      "Understanding of FEMA flood risk mapping procedures"
    ]
  },
  {
    id: "19",
    title: "Construction Project Manager (Heavy Civil)",
    location: "Waterbury, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "2 weeks ago",
    daysAgo: 17,
    featured: false,
    commission: 5500,
    description: "Manage heavy-civil and transportation construction projects — schedule, budget, subcontractors, and DOT coordination from mobilization through closeout.",
    requirements: [
      "10+ years managing heavy-civil / transportation construction",
      "PMP and/or PE preferred",
      "Experience with DOT specifications and prevailing-wage projects"
    ]
  },
  {
    id: "20",
    title: "Water / Wastewater Treatment Engineer",
    location: "Hartford, Connecticut",
    type: "Full-time",
    remoteType: "Hybrid",
    country: "United States",
    datePosted: "3 weeks ago",
    daysAgo: 21,
    featured: false,
    commission: 4000,
    description: "Design water and wastewater treatment upgrades and pump stations for municipal and state clients, from process design through permitting.",
    requirements: [
      "PE License in Civil / Environmental (or EIT)",
      "4+ years in water / wastewater process design",
      "Familiarity with state DEEP / EPA permitting"
    ]
  },
  {
    id: "21",
    title: "Construction Inspector (CTDOT)",
    location: "Norwich, Connecticut",
    type: "Contract",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "3 weeks ago",
    daysAgo: 22,
    featured: false,
    commission: 2200,
    description: "Inspect retaining walls, catch basins, and subbase grading on structural CTDOT projects around Norwich.",
    requirements: [
      "3+ years CTDOT roadway construction field inspection",
      "Knowledge of ACI Concrete testing procedures",
      "High school diploma with formal state inspection credentials"
    ]
  },
  {
    id: "22",
    title: "Senior Structural PM",
    location: "Stamford, Connecticut",
    type: "Direct Hire",
    remoteType: "Hybrid",
    country: "United States",
    datePosted: "3 weeks ago",
    daysAgo: 22,
    featured: false,
    commission: 5800,
    description: "Direct planning, scheduling, and commercial progress on structural designs for highway flyovers and railway spans.",
    requirements: [
      "PE Licensure required",
      "8+ years structural engineering PM history",
      "Proficient in Microsoft Project and Primavera P6 scheduling"
    ]
  },
  {
    id: "23",
    title: "Bridge Inspection Team Leader",
    location: "North Haven, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "3 weeks ago",
    daysAgo: 23,
    featured: false,
    commission: 3500,
    description: "Lead field team performing high-angle rope access and structural inspections on state department highway bridges.",
    requirements: [
      "NHI Safety Inspection of In-Service Bridges certificate",
      "Connecticut PE registration or NICET Level IV",
      "Experience conducting structural crack and corrosion field documentation"
    ]
  },
  {
    id: "24",
    title: "Automation & Controls Engineer",
    location: "Danbury, Connecticut",
    type: "Full-time",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "4 weeks ago",
    daysAgo: 28,
    featured: false,
    commission: 4500,
    description: "Program Allen-Bradley PLC processors, design custom HMI control screens, and configure manufacturing robotics integrations.",
    requirements: [
      "Degree in Electrical, Mechanical, or Systems Automation Engineering",
      "4+ years coding PLC loops using RSLogix 5000 / Studio 5000",
      "Experience wiring industrial control enclosures and networking nodes"
    ]
  },
  {
    id: "25",
    title: "Senior Site Civil Engineer",
    location: "Hamden, Connecticut",
    type: "Direct Hire",
    remoteType: "Onsite",
    country: "United States",
    datePosted: "4 weeks ago",
    daysAgo: 29,
    featured: false,
    commission: 5400,
    description: "Direct site grading plans, drainage designs, utility routes, and planning applications for commercial developments in Hamden.",
    requirements: [
      "Active PE License (Connecticut)",
      "7+ years Civil 3D design expertise",
      "Experience guiding junior designers and presenting at public zoning boards"
    ]
  },
  {
    id: "26",
    title: "BIM / CAD Designer",
    location: "London, United Kingdom",
    type: "Contract",
    remoteType: "Hybrid",
    country: "United Kingdom",
    datePosted: "4 weeks ago",
    daysAgo: 30,
    featured: false,
    commission: 3800,
    description: "Model structural elements, coordinate MEP piping runs, and manage building information model files in Revit for major infrastructure developments.",
    requirements: [
      "Degree or technical diploma in Drafting / Engineering Technology",
      "4+ years BIM coordination utilizing Autodesk Revit and Navisworks Manage",
      "Knowledge of UK BS EN ISO 19650 BIM execution standards"
    ]
  },
];

export function FeaturedJobs() {
  const [keyword, setKeyword] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const [jobType, setJobType] = useState("All");
  const [remoteType, setRemoteType] = useState("All");
  const [country, setCountry] = useState("All");
  const [sortBy, setSortBy] = useState("Most Recent");

  const [alertsEmail, setAlertsEmail] = useState("");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  
  // Selected Job for Details Modal
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  // Modal state tabs
  const [detailsTab, setDetailsTab] = useState<"details" | "apply" | "refer">("details");

  // Form inputs for direct apply
  const [applyName, setApplyName] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyResume, setApplyResume] = useState("");
  const [applyNote, setApplyNote] = useState("");

  // Form inputs for referral
  const [refName, setRefName] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [candName, setCandName] = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candResume, setCandResume] = useState("");
  const [candNote, setCandNote] = useState("");

  // Form submission sets search states
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchKeyword(keyword);
    setSearchLocation(locationInput);
  };

  // Filtered jobs list
  const filteredJobs = useMemo(() => {
    return INITIAL_JOBS.filter((job) => {
      // Keyword match (title)
      if (
        searchKeyword &&
        !job.title.toLowerCase().includes(searchKeyword.toLowerCase())
      ) {
        return false;
      }
      // Location match
      if (
        searchLocation &&
        !job.location.toLowerCase().includes(searchLocation.toLowerCase())
      ) {
        return false;
      }
      // Job Type match
      if (jobType !== "All" && job.type !== jobType) {
        return false;
      }
      // Remote Type match
      if (remoteType !== "All" && job.remoteType !== remoteType) {
        return false;
      }
      // Country match
      if (country !== "All" && job.country !== country) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "Most Recent") {
        return a.daysAgo - b.daysAgo;
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  }, [searchKeyword, searchLocation, jobType, remoteType, country, sortBy]);

  const openJobDetails = (job: JobListing) => {
    setSelectedJob(job);
    setDetailsTab("details");
  };

  const handleDirectApply = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Application submitted successfully for ${applyName}. Best of luck!`);
    setSelectedJob(null);
    setApplyName("");
    setApplyEmail("");
    setApplyResume("");
    setApplyNote("");
  };

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you ${refName}! Referral for ${candName} registered successfully. If selected, your $${selectedJob?.commission.toLocaleString()} commission is locked.`);
    setSelectedJob(null);
    setRefName("");
    setRefEmail("");
    setCandName("");
    setCandEmail("");
    setCandResume("");
    setCandNote("");
  };

  return (
    <section id="jobs" className="py-20 bg-gray-50/30 border-b border-gray-100">
      <Container>
        {/* Header section with Steel-Navy accent */}
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            JobFolder
          </h2>
          <p className="mt-4 text-base text-muted leading-relaxed">
            JobFolder is a specialized staffing and executive search firm
            serving engineering, infrastructure, manufacturing, healthcare,
            technology, and other technical markets nationwide and
            internationally.
          </p>
        </div>

        {/* Search Engine Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm mb-10"
        >
          <div className="grid gap-6 md:grid-cols-[1fr_1fr_auto] items-end">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Job Title or Keyword(s)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Civil Engineer, Inspector"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-4 text-sm text-ink outline-none transition-all placeholder:text-gray-400 focus:border-blue-brand focus:bg-white focus:ring-2 focus:ring-blue-brand/10"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Hamden, Connecticut"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 pl-11 pr-4 text-sm text-ink outline-none transition-all placeholder:text-gray-400 focus:border-blue-brand focus:bg-white focus:ring-2 focus:ring-blue-brand/10"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-blue-brand text-white font-semibold text-sm hover:bg-blue-brand-dark transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          {/* Secondary Filters */}
          <div className="grid gap-4 sm:grid-cols-3 mt-6 pt-6 border-t border-gray-100">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Job Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-ink outline-none transition-all focus:border-blue-brand"
              >
                <option value="All">All Types</option>
                <option value="Direct Hire">Direct Hire</option>
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Remote Type
              </label>
              <select
                value={remoteType}
                onChange={(e) => setRemoteType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-ink outline-none transition-all focus:border-blue-brand"
              >
                <option value="All">All Workstyles</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-ink outline-none transition-all focus:border-blue-brand"
              >
                <option value="All">All Countries</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>
          </div>
        </form>

        {/* Results Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          
          {/* Main Listings */}
          <div>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <span className="text-sm font-bold text-ink">
                {filteredJobs.length} open position{filteredJobs.length === 1 ? "" : "s"}
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-ink outline-none focus:border-blue-brand"
                >
                  <option value="Most Recent">Most Recent</option>
                  <option value="Alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* List Table Headers on Desktop */}
            <div className="hidden sm:grid grid-cols-[1fr_100px_90px_140px_90px] gap-4 px-6 py-3 bg-gray-50 rounded-xl mb-4 text-[11px] font-bold uppercase tracking-wider text-muted">
              <div>Job Title & Location</div>
              <div>Job Type</div>
              <div>Remote Type</div>
              <div>Referral Commission</div>
              <div className="text-right">Date Posted</div>
            </div>

            {/* Job Listings List */}
            {filteredJobs.length > 0 ? (
              <div className="space-y-3">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => openJobDetails(job)}
                    className={`relative grid sm:grid-cols-[1fr_100px_90px_140px_90px] gap-4 items-center px-6 py-5 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200 cursor-pointer ${
                      job.featured ? "border-l-4 border-l-blue-brand" : ""
                    }`}
                  >
                    {/* Title & Location */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink hover:text-blue-brand transition-colors text-sm sm:text-base">
                          {job.title}
                        </span>
                        {job.featured && (
                          <span className="inline-flex items-center rounded bg-blue-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-blue-brand">
                            Featured
                          </span>
                        )}
                      </div>
                      <span className="block mt-1 text-xs text-muted font-medium">
                        {job.location}
                      </span>
                    </div>

                    {/* Job Type */}
                    <div className="text-xs font-semibold text-gray-600 sm:text-left">
                      <span className="sm:hidden font-bold uppercase text-[10px] text-muted block mb-0.5">Job Type</span>
                      {job.type}
                    </div>

                    {/* Remote Type */}
                    <div className="text-xs text-gray-500 font-medium sm:text-left">
                      <span className="sm:hidden font-bold uppercase text-[10px] text-muted block mb-0.5">Remote Type</span>
                      {job.remoteType}
                    </div>

                    {/* Referral Commission */}
                    <div className="sm:text-left">
                      <span className="sm:hidden font-bold uppercase text-[10px] text-muted block mb-0.5">Referral Commission</span>
                      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                        ${job.commission.toLocaleString()} Bounty
                      </span>
                    </div>

                    {/* Date Posted */}
                    <div className="text-xs text-gray-500 font-medium sm:text-right">
                      <span className="sm:hidden font-bold uppercase text-[10px] text-muted block mb-0.5">Date Posted</span>
                      {job.datePosted}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl">
                <p className="text-base font-semibold text-ink">No positions found</p>
                <p className="text-xs text-muted mt-1">Try broadening your search term or clearing some filters.</p>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            
            {/* Recruiter Profile Card */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col items-center text-center">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-gray-100 border border-gray-100 mb-4 shadow-sm transition-transform duration-300 hover:scale-105">
                <Image
                  src="/patrick-novick.png"
                  alt="Patrick Novick"
                  fill
                  sizes="112px"
                  className="object-cover object-top text-gray-400 animate-fade-in"
                />
              </div>
              <h3 className="font-extrabold text-ink text-base">
                Patrick Novick
              </h3>
              <p className="text-xs font-semibold text-blue-brand uppercase tracking-wider mt-0.5">
                Principal Recruiter
              </p>
              <p className="mt-3 text-xs text-muted leading-relaxed">
                Connect directly with Patrick to coordinate your next engineering, DOT, or manufacturing career move.
              </p>
              <a
                href="https://www.linkedin.com/in/patricknovick"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0077b5] py-2.5 text-xs font-semibold text-white hover:bg-[#006294] transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <svg className="fill-current" width="14" height="14" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                Connect on LinkedIn
              </a>
            </div>

            {/* Get Alerts CTA Card */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-brand-soft text-blue-brand mb-4">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </div>
              <h3 className="font-extrabold text-ink text-base">
                Get alerts for new listings
              </h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Stay updated with the latest civil, structural, and general technical engineering opportunities.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAlertModal(true);
                }}
                className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-blue-brand py-2.5 text-xs font-semibold text-white hover:bg-blue-brand-dark transition-all cursor-pointer"
              >
                Set Alert
              </button>
            </div>

            {/* Submit Application CTA Card */}
            <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-blue-brand to-blue-brand-dark p-6 shadow-sm text-white relative overflow-hidden">
              <span className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-white/10 blur-lg pointer-events-none" />
              <div className="relative z-10">
                <h3 className="font-extrabold text-base">
                  Submit a general application
                </h3>
                <p className="mt-2 text-xs text-blue-100 leading-relaxed">
                  Don&apos;t see the right role? Send us your resume and PE certifications so we can match you to upcoming positions.
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowApplyModal(true);
                  }}
                  className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-white py-2.5 text-xs font-semibold text-blue-brand hover:bg-blue-50 transition-all cursor-pointer"
                >
                  Apply Generically
                </button>
              </div>
            </div>

          </div>
        </div>
      </Container>

      {/* 2-in-1 Job Details, Direct Apply & Referral Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-gray-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-ink">{selectedJob.title}</h3>
                  <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                    ${selectedJob.commission.toLocaleString()} Commission
                  </span>
                </div>
                <p className="text-xs text-muted font-medium mt-1">{selectedJob.location} • {selectedJob.type} • {selectedJob.remoteType}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-ink cursor-pointer bg-white p-1 rounded-full border border-gray-100 shadow-xs"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-gray-100 text-sm font-semibold">
              <button
                onClick={() => setDetailsTab("details")}
                className={`flex-1 py-3 text-center transition-all cursor-pointer border-b-2 ${
                  detailsTab === "details" ? "border-blue-brand text-blue-brand bg-blue-50/10" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                Role Overview
              </button>
              <button
                onClick={() => setDetailsTab("apply")}
                className={`flex-1 py-3 text-center transition-all cursor-pointer border-b-2 ${
                  detailsTab === "apply" ? "border-blue-brand text-blue-brand bg-blue-50/10" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                Apply Directly
              </button>
              <button
                onClick={() => setDetailsTab("refer")}
                className={`flex-1 py-3 text-center transition-all cursor-pointer border-b-2 ${
                  detailsTab === "refer" ? "border-blue-brand text-blue-brand bg-blue-50/10" : "border-transparent text-muted hover:text-blue-brand"
                }`}
              >
                Refer &amp; Earn
              </button>
            </div>

            {/* Modal Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              
              {/* Tab 1: Role Overview */}
              {detailsTab === "details" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Job Description</h4>
                    <p className="text-sm leading-relaxed text-ink">{selectedJob.description}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Role Requirements</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-ink pl-1">
                      {selectedJob.requirements.map((req, idx) => (
                        <li key={idx} className="leading-relaxed">{req}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-blue-brand-soft/30 border border-blue-brand/10 p-5 mt-4">
                    <h4 className="text-sm font-bold text-blue-brand flex items-center gap-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" x2="12" y1="2" y2="22" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                      Earn ${selectedJob.commission.toLocaleString()} Commission
                    </h4>
                    <p className="text-xs text-muted leading-relaxed mt-1.5">
                      Do you know a structural engineer or inspector who fits this profile? Refer them to us. If they are selected and hired by our client, we pay you the referral commission as soon as they start.
                    </p>
                    <button
                      onClick={() => setDetailsTab("refer")}
                      className="mt-3.5 inline-flex items-center justify-center rounded-xl bg-blue-brand px-5 py-2 text-xs font-semibold text-white hover:bg-blue-brand-dark transition-all cursor-pointer"
                    >
                      Refer Candidate Now
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Direct Application */}
              {detailsTab === "apply" && (
                <form onSubmit={handleDirectApply} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        value={applyName}
                        onChange={(e) => setApplyName(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink outline-none focus:border-blue-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1.5">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="wade@email.com"
                        value={applyEmail}
                        onChange={(e) => setApplyEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink outline-none focus:border-blue-brand"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">Resume / CV Link</label>
                    <input
                      type="url"
                      required
                      placeholder="e.g. Dropbox or Google Drive document link"
                      value={applyResume}
                      onChange={(e) => setApplyResume(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink outline-none focus:border-blue-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">Key Certifications / PE Details (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="List states of licensure, certifications, or details..."
                      value={applyNote}
                      onChange={(e) => setApplyNote(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink outline-none focus:border-blue-brand resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-brand py-3 text-sm font-semibold text-white hover:bg-blue-brand-dark transition-all cursor-pointer"
                  >
                    Submit Application
                  </button>
                </form>
              )}

              {/* Tab 3: Refer Candidate */}
              {detailsTab === "refer" && (
                <form onSubmit={handleReferralSubmit} className="space-y-4">
                  {/* Referrer Details */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Your Contact Details (To receive commission)</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Patrick Novick"
                          value={refName}
                          onChange={(e) => setRefName(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-blue-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">Your Email</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. patrick@agency.com"
                          value={refEmail}
                          onChange={(e) => setRefEmail(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-blue-brand"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Candidate Details */}
                  <div className="p-4 rounded-2xl bg-blue-brand-soft border border-blue-brand-light/50">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-blue-brand-dark mb-3">Referred Candidate Details</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">Candidate Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Candidate Full Name"
                          value={candName}
                          onChange={(e) => setCandName(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-blue-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-ink mb-1">Candidate Email</label>
                        <input
                          type="email"
                          required
                          placeholder="candidate@email.com"
                          value={candEmail}
                          onChange={(e) => setCandEmail(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-blue-brand"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-[11px] font-semibold text-ink mb-1">Candidate Resume Link (Google Drive / DropBox)</label>
                      <input
                        type="url"
                        required
                        placeholder="Shared file link containing candidate resume"
                        value={candResume}
                        onChange={(e) => setCandResume(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-blue-brand"
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-[11px] font-semibold text-ink mb-1">Why is this candidate a great match? (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Briefly review candidate accomplishments, active PE license states, etc..."
                        value={candNote}
                        onChange={(e) => setCandNote(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-blue-brand resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-brand py-3 text-sm font-semibold text-white hover:bg-blue-brand-dark transition-all cursor-pointer flex justify-center items-center gap-1.5"
                  >
                    <svg className="fill-current" width="16" height="16" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
                    </svg>
                    Register Referral &amp; Secure Commission
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Alert Signup Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white border border-gray-100 p-6 md:p-8 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowAlertModal(false);
                setAlertsEmail("");
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-ink cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-extrabold text-ink">Subscribe to alerts</h3>
            <p className="text-xs text-muted mt-2">
              We&apos;ll email you when new engineering, infrastructure, and technical placements open.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Alert configured successfully for: ${alertsEmail}`);
                setShowAlertModal(false);
                setAlertsEmail("");
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={alertsEmail}
                  onChange={(e) => setAlertsEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-ink outline-none focus:border-blue-brand"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-brand py-3 text-sm font-semibold text-white hover:bg-blue-brand-dark transition-all cursor-pointer"
              >
                Activate Job Alerts
              </button>
            </form>
          </div>
        </div>
      )}

      {/* General Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-gray-100 p-6 md:p-8 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-ink cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-extrabold text-ink">General Application</h3>
            <p className="text-xs text-muted mt-2">
              Tell us about your background, specializations, and licensure.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("General application received. Our staffing executives will contact you.");
                setShowApplyModal(false);
              }}
              className="mt-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Wade"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink outline-none focus:border-blue-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Warren"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink outline-none focus:border-blue-brand"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink outline-none focus:border-blue-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Are you a Licensed PE?</label>
                <select className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs text-ink outline-none focus:border-blue-brand">
                  <option value="Yes">Yes, Active Licensure</option>
                  <option value="No">No / EIT Status</option>
                  <option value="NA">N/A (Non-civil/other discipline)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Brief Overview of Expertise</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your design, PM, or inspection experience..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink outline-none focus:border-blue-brand resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-brand py-3 text-sm font-semibold text-white hover:bg-blue-brand-dark transition-all cursor-pointer"
              >
                Submit Application
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
