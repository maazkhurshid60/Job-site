import type { Metadata } from "next";
import ConsoleGate from "./ConsoleGate";

/* Server layout exists purely to own the metadata — the admin gate below it is
   a client component and cannot export any.

   noindex is how the console stays out of search results. It is deliberately
   NOT listed in robots.txt: that file is public, so naming the path there would
   hand out the unguessable slug the console relies on (see lib/routes.ts). */
export const metadata: Metadata = {
  title: "Console",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConsoleGate>{children}</ConsoleGate>;
}
