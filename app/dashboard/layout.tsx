import type { Metadata } from "next";
import DashboardGate from "./DashboardGate";

/* Server layout exists purely to own the metadata — the auth gate below it is a
   client component and cannot export any. Everything here is behind a login, so
   it must never be indexed. */
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardGate>{children}</DashboardGate>;
}
