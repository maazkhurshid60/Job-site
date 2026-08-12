/* Self-hosted imagery — every file lives in /public so nothing loads from a
   remote CDN. Swap these for owned/licensed brand assets when available.

   The photos in /public/photos are under the free Unsplash License (commercial
   use permitted, no permission needed). Photographer credits and source links
   are recorded in public/photos/CREDITS.md — nothing here is Unsplash+ or
   Getty-licensed, which would have required a paid subscription.

   Alt text is stored alongside each path rather than written at the call site,
   so the same photo is always described the same way and no usage silently
   ships without a description. */

export type Photo = { src: string; alt: string };

export const img = {
  // testimonial portraits
  clientPortraitA: "/people/portrait-a.jpg",
  clientPortraitB: "/people/portrait-b.jpg",
  // hero social-proof avatar cluster
  avatars: [
    "/people/avatar-1.jpg",
    "/people/avatar-2.jpg",
    "/people/avatar-3.jpg",
    "/people/avatar-4.jpg",
  ],
};

export const photo = {
  engineersSiteReview: {
    src: "/photos/engineers-site-review.jpg",
    alt: "Two structural engineers in high-visibility vests reviewing a site map together",
  },
  civilEngineerWeir: {
    src: "/photos/civil-engineer-weir.jpg",
    alt: "A civil engineer discussing a weir project on site with a colleague",
  },
  highwayInterchange: {
    src: "/photos/highway-interchange.jpg",
    alt: "Aerial view of a multi-lane highway interchange with overpasses and surrounding fields",
  },
  interviewHandshake: {
    src: "/photos/interview-handshake.jpg",
    alt: "A candidate shaking hands with a hiring manager at the end of a job interview",
  },
  landSurveyor: {
    src: "/photos/land-surveyor.jpg",
    alt: "A land surveyor setting up equipment on a construction site",
  },
  steelBeams: {
    src: "/photos/steel-beams.jpg",
    alt: "Ironworkers installing structural steel beams on a building frame",
  },
  siteCrew: {
    src: "/photos/site-crew.jpg",
    alt: "A construction crew in hard hats and safety vests talking on site",
  },
  engineerOnSite: {
    src: "/photos/engineer-on-site.jpg",
    alt: "A civil engineer in a hard hat and high-visibility vest working on site",
  },
  heroInterview: {
    src: "/photos/hero-recruiter-interview.jpg",
    alt: "A hiring manager in a suit shaking hands with a job candidate across a table after a successful interview",
  },
} satisfies Record<string, Photo>;
