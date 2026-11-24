import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ventrion handles personal information when you visit this website, contact us or use the investor portal.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy *Policy*" updated="24 November 2026">
      <p>
        This policy explains how <strong>Ventrion Company</strong> (“Ventrion”, “we”, “us”) handles personal
        information when you visit this website, contact us or use the investor portal.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>
          When you contact us by telephone, email or WhatsApp, we receive the details you choose to share, such as your
          name, company, contact details and the subject of your enquiry.
        </li>
        <li>
          When you use the investor portal, your Investor ID is converted on your device into a one-way fingerprint
          (SHA-256) before anything is sent. We use the fingerprint only to look up your record and do not store it; the
          Investor ID itself never leaves your device.
        </li>
      </ul>
      <p>
        Our hosting provider may also process standard technical information (such as IP address and browser type) to
        operate, secure and protect the website, including limiting repeated attempts in the investor portal.
      </p>
      <h2>How we use it</h2>
      <p>
        We use the information you share only to respond to you, to assess and discuss the introductions and trade
        opportunities you have asked about, to show investors the status of their engagement, and to keep appropriate
        business records. We do not sell personal information.
      </p>
      <h2>Sharing</h2>
      <p>
        We may share information with prospective counterparties only where this is necessary to progress an
        opportunity you have asked us to explore, and where appropriate with your agreement.
      </p>
      <h2>Retention</h2>
      <p>We keep correspondence and investor records for up to 24 months from our last contact with you, unless a longer period is required to meet legal, regulatory or contractual obligations, after which they are securely deleted.</p>
      <h2>Your rights</h2>
      <p>
        Depending on where you are located, you may have rights to access, correct or delete your personal information.
        To make a request, contact us at info@ventrion.sa.
      </p>
      <h2>Contact</h2>
      <p>Questions about this policy can be sent to info@ventrion.sa.</p>
    </LegalPage>
  );
}
