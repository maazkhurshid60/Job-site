import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Terms of Service — JobFolder",
  description: "The terms that govern your use of the JobFolder marketplace.",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="By using JobFolder, you agree to these terms. Please read them carefully."
      updated="July 27, 2026"
    >
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of the JobFolder website and services. By creating an account or using
        the site, you agree to be bound by these Terms.
      </p>

      <InfoSection heading="Using the marketplace">
        <p>
          JobFolder lets you browse open roles, apply directly, and refer
          candidates from your network. You agree to provide accurate
          information and to only submit candidates you are authorized to refer.
        </p>
      </InfoSection>

      <InfoSection heading="Referrals and commissions">
        <p>
          Referral commissions are shown on each role. A commission is earned
          only when a referred candidate is selected and placed by the hiring
          client, subject to the client&apos;s confirmation and any guarantee
          period. We coordinate screening and placement with the client.
        </p>
      </InfoSection>

      <InfoSection heading="Your responsibilities">
        <p>
          You are responsible for the accuracy of the information you submit and
          for keeping your account credentials secure. You may not misuse the
          service, submit false candidate details, or infringe the rights of
          others.
        </p>
      </InfoSection>

      <InfoSection heading="Disclaimer and liability">
        <p>
          The service is provided &quot;as is&quot;. To the fullest extent
          permitted by law, JobFolder is not liable for any indirect or
          consequential loss arising from your use of the service.
        </p>
      </InfoSection>

      <InfoSection heading="Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a href="mailto:hello@jobfolder.com" className="text-blue-brand hover:underline">
            hello@jobfolder.com
          </a>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
