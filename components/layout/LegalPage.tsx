import type { ReactNode } from "react";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function LegalPage({
  eyebrow,
  title,
  updated,
  draft = false,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  /** Shows a notice while the page still contains [PLACEHOLDERS]. */
  draft?: boolean;
  children: ReactNode;
}) {
  return (
    <main id="main" className="bg-ink pb-28 pt-40 lg:pt-48">
      <div className="shell grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="display-lg mt-8 text-ivory">{title}</h1>
            <p className="mt-6 text-sm text-mist">Last updated: {updated}</p>
            <Link href="/" className="link-draw mt-10 inline-flex text-[11px] font-semibold uppercase tracking-[0.24em] text-ivory hover:text-gold">
              ← Back to home
            </Link>
          </div>
        </div>
        <article className="legal-copy max-w-2xl space-y-6 text-[16px] leading-[1.8] text-mist lg:col-span-7 lg:col-start-6 [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:text-ivory [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ivory">
          {draft ? (
            <p className="border border-gold/30 bg-gold/[0.05] p-5 text-sm text-ivory/85">
              This page is awaiting final details. Bracketed items are placeholders.
            </p>
          ) : null}
          {children}
        </article>
      </div>
    </main>
  );
}
