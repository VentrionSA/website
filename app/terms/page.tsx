import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms governing the use of the Ventrion website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Use" updated="21 November 2026">
      <p>
        These terms govern your use of this website, operated by <strong>Ventrion Company</strong> (“Ventrion”). By
        using the website you agree to these terms.
      </p>
      <h2>Information only</h2>
      <p>
        Content on this website is provided for general information about our services. It does not constitute an
        offer, a solicitation, or financial, legal or investment advice, and no contract is formed by submitting an
        enquiry. Any commercial engagement is subject to separate written agreement.
      </p>
      <h2>Market references</h2>
      <p>
        References to markets, regions and sectors describe the scope of our commercial network and interests. They do
        not represent office locations, guarantees of availability, or endorsements by any third party.
      </p>
      <h2>Intellectual property</h2>
      <p>
        The Ventrion name, logo, design and content of this website are owned by or licensed to Ventrion and may not be
        reproduced without permission.
      </p>
      <h2>Liability</h2>
      <p>
        We aim to keep the website accurate and available, but we do not warrant that it is error-free or uninterrupted.
        To the extent permitted by law, we are not liable for losses arising from use of the website.
      </p>
      <h2>Governing law</h2>
      <p>These terms are governed by the laws of [JURISDICTION].</p>
      <h2>Contact</h2>
      <p>Questions about these terms can be sent to info@ventrion.sa.</p>
    </LegalPage>
  );
}
