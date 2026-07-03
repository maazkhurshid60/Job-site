/* Centralised remote imagery (Unsplash CDN, whitelisted in next.config.ts).
   Swap these for owned/licensed assets before launch. */

const u = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const img = {
  // testimonial portraits
  clientPortraitA: u("photo-1580489944761-15a19d654956", 600),
  clientPortraitB: u("photo-1507003211169-0a1dd7228f2d", 600),
  // named client headshot
  wadeWarren: u("photo-1519085360753-af0119f7cbe7", 200),
  // hero social-proof avatar cluster
  avatars: [
    u("photo-1560250097-0b93528c311a", 120),
    u("photo-1573496359142-b8d87734a5a2", 120),
    u("photo-1494790108377-be9c29b29330", 120),
    u("photo-1522071820081-009f0129c71c", 120),
  ],
};
