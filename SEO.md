# JobFolder — Keyword map & content plan

Target market: **US engineering, DOT & infrastructure recruiting.** Chosen because
`JOB_CATEGORIES` in `lib/jobs.ts` is dominated by Civil, Transportation/DOT,
Structural, MEP, Water/Hydrology, CEI and AEC disciplines.

Two audiences share the site, so keywords split into two clusters. Never mix them
on one page — a page that tries to rank for both ranks for neither.

---

## Cluster A — Client side (companies hiring)

The revenue cluster. Owns the home page, `/recruiters`-adjacent company pages,
`/case-studies`, `/hiring-guides`, `/contact`.

| Priority | Term | Intent |
|---|---|---|
| Head | engineering recruiting agency | commercial |
| Head | civil engineering recruiters | commercial |
| Head | DOT staffing agency | commercial |
| Head | transportation engineering recruiters | commercial |
| Head | AEC recruiting firm / AEC staffing agency | commercial |
| Body | structural engineering recruiters | commercial |
| Body | MEP engineering recruitment | commercial |
| Body | CEI inspection staffing | commercial |
| Body | water resources engineer recruiter | commercial |
| Body | construction project manager recruiters | commercial |
| Long tail | how to hire civil engineers | informational |
| Long tail | how to hire PE licensed engineers | informational |
| Long tail | contingency vs retained engineering search | informational |
| Long tail | why are civil engineering roles hard to fill | informational |
| Long tail | engineering recruitment fees explained | informational |
| Long tail | hiring engineers for DOT projects | informational |

## Cluster B — Supply side (recruiters & candidates)

Owns `/recruiters`, `/recruiter-faq`, `/jobs`, `/how-it-works/*`.

| Priority | Term | Intent |
|---|---|---|
| Head | split fee recruiting network | commercial |
| Head | refer a candidate earn commission | commercial |
| Head | freelance recruiter jobs | commercial |
| Body | recruiter referral commission | commercial |
| Body | independent recruiter network US | commercial |
| Body | civil engineering jobs | job seeker |
| Body | transportation / DOT jobs | job seeker |
| Body | CEI inspector jobs | job seeker |
| Long tail | how do split placement fees work | informational |
| Long tail | how much do recruiters earn per placement | informational |

---

## Page assignments

One primary keyword per page. The primary belongs in `<title>`, the `<h1>`, and
the first 100 words. Secondaries go in `<h2>`s and body copy.

| Route | Primary | Secondaries |
|---|---|---|
| `/` | engineering recruiting agency | civil engineering recruiters, DOT staffing, AEC |
| `/jobs` | engineering & DOT jobs | civil engineering jobs, CEI inspector jobs |
| `/jobs/[id]` | *(the role title itself)* | + JobPosting structured data |
| `/how-it-works` | how JobFolder recruiting works | crowdsourced recruiting, vetted shortlist |
| `/how-it-works/browse-placements` | browse open engineering placements | referral commission |
| `/how-it-works/refer-candidates` | refer a candidate | candidate referral process |
| `/how-it-works/earn-commission` | recruiter referral commission | split fee, payout |
| `/recruiters` | split fee recruiting network | freelance recruiter, refer & earn |
| `/recruiter-faq` | recruiter referral commission FAQ | how split fees work, payout timing |
| `/case-studies` | engineering recruitment case studies | DOT hiring, hard-to-fill roles |
| `/hiring-guides` | how to hire civil engineers | PE licensure, CEI staffing, DOT hiring |
| `/careers` | careers at JobFolder | recruiting jobs, talent partner roles |
| `/press` | JobFolder press kit | media enquiries, brand assets |
| `/contact` | contact engineering recruiters | request talent, hiring enquiry |

Excluded from indexing (`robots: noindex`): `/login`, `/signup`, `/dashboard/*`,
`/console-4h9k2xqf/*`.

---

## Structured data

| Type | Where | Why |
|---|---|---|
| `EmploymentAgency` | root layout | entity/knowledge-panel eligibility |
| `WebSite` + `SearchAction` | root layout | sitelinks search box |
| `FAQPage` | `/recruiter-faq` | FAQ rich results |
| `BreadcrumbList` | `/how-it-works/[slug]` | breadcrumb rich results |
| `JobPosting` | `/jobs/[id]` | **Google Jobs eligibility** — highest-value item on the site |

### JobPosting caveat

`/jobs/[id]` fetches from Firestore in a `useEffect`, so the JSON-LD is injected
client-side. Google renders JS and will usually pick it up, but Google Jobs is
stricter than normal search. For guaranteed indexing the route needs a server
component that reads Firestore during SSR/ISR. See "Known gaps" below.

---

## Known gaps (not addressed in this pass)

1. **`NEXT_PUBLIC_SITE_URL` is unset.** `metadataBase` falls back to
   `https://jobfolder.com`. Set the real production domain in `.env.local` or
   canonical URLs and OG images will point at the wrong host.
2. **No OG image.** `/opengraph-image.png` is referenced but not present in
   `public/`. Social shares will fall back to a bare link. 1200×630px.
3. **JobPosting needs SSR** to be reliably eligible for Google Jobs (above).
4. **Unverified statistics.** `components/SocialProof.tsx` claims 20K hires,
   1.3M candidates sourced, and $8.5B in salaries placed; `components/Hero.tsx`
   claims 27,500+ candidates placed; `components/Testimonial.tsx` carries an
   unattributed client quote. These predate this pass and were left as-is —
   they need to be either substantiated or removed before launch.
5. **`/contact` shows "Phone: TBD"** — a placeholder visible to visitors.
6. **No blog/article route.** `/hiring-guides` currently lists guides as static
   cards. Ranking for the informational long-tail terms above needs real article
   pages behind those cards.
