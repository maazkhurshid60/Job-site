import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { CONTACT_EMAIL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Cookie Policy — JobFolder",
  description: "How JobFolder uses cookies and similar technologies.",
};

export default function CookiePolicyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Cookie Policy"
      intro="This page explains how JobFolder uses cookies and similar technologies."
      updated="July 27, 2026"
    >
      <p>
        Cookies are small text files stored on your device that help websites
        work and understand how they are used. This policy describes the cookies
        we use and why.
      </p>

      <InfoSection heading="Essential cookies">
        <p>
          These are required for the site to function — for example, to keep you
          signed in and to remember your session. The site will not work
          properly without them.
        </p>
      </InfoSection>

      <InfoSection heading="Analytics cookies">
        <p>
          We may use analytics cookies to understand how visitors use the site
          so we can improve it. These help us measure things like which pages
          are most useful.
        </p>
      </InfoSection>

      <InfoSection heading="Managing cookies">
        <p>
          You can control and delete cookies through your browser settings.
          Blocking essential cookies may affect how the site works for you.
        </p>
      </InfoSection>

      <InfoSection heading="Contact">
        <p>
          Questions about our use of cookies? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-brand hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
