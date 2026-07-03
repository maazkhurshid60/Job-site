import Link from "next/link";
import { Container } from "./ui";
import { Logo } from "./Logo";

const columns = [
  {
    heading: "Product",
    links: ["Browse jobs", "How it works", "For companies", "For recruiters"],
  },
  {
    heading: "Company",
    links: ["About us", "Careers", "Contact", "Press"],
  },
  {
    heading: "Resources",
    links: ["Hiring guides", "Recruiter FAQ", "Case studies", "Blog"],
  },
  {
    heading: "Legal",
    links: ["Privacy", "Terms", "Cookie policy"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-cream">
      <Container className="py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
              A crowdsourced recruiting agency. The reach of a network, the
              judgement of an agency — end to end.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-bold text-ink">{col.heading}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-sm text-muted transition-colors hover:text-primary"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Metro Opportunities. All rights reserved.
          </p>
          <div className="flex gap-3">
            {["in", "X", "f"].map((s) => (
              <span
                key={s}
                className="grid h-8 w-8 place-items-center rounded-full border border-line text-xs font-semibold text-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
