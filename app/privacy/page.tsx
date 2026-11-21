import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Ventrion handles personal information submitted through this website.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" updated="21 November 2026">
      <p>
        This policy explains how <strong>Ventrion Company</strong> (“Ventrion”, “we”, “us”) collects and uses
        personal information when you visit this website or submit an enquiry.
      </p>
      <h2>Information we collect</h2>
      <p>When you submit the enquiry form we collect the details you provide:</p>
      <ul>
        <li>Full name, company name, business email and WhatsApp or phone number</li>
        <li>Country, your role (buyer, seller, supplier, distributor or other) and commodity interest</li>
        <li>Any requirement, volume or message details you choose to share</li>
      </ul>
      <p>
        Our hosting provider may also process standard technical information (such as IP address and browser type) to
        operate, secure and protect the website.
      </p>
      <h2>How we use it</h2>
      <p>
        We use enquiry information only to respond to your enquiry, to assess and discuss potential commercial
        opportunities you have asked about, and to keep appropriate business records. We do not sell personal
        information.
      </p>
      <h2>Sharing</h2>
      <p>
        Enquiry details are delivered to us by email at info@ventrion.sa. We may share information with prospective
        counterparties only where this is necessary to progress an opportunity you have asked us to explore, and where
        appropriate with your agreement.
      </p>
      <h2>Retention</h2>
      <p>We keep enquiry information for up to 24 months from our last contact with you, unless a longer period is required to meet legal, regulatory or contractual obligations, after which it is securely deleted.</p>
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
