import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { EnquiryForm } from "@/components/contact/EnquiryForm";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getMailtoHref, getWhatsAppHref, siteConfig } from "@/lib/site";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

function ContactRow({
  href,
  icon,
  label,
  value,
  placeholder,
  external,
}: {
  href: string | null;
  icon: ReactNode;
  label: string;
  value: string;
  placeholder: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-line-strong transition-colors duration-500 group-hover:border-gold">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="eyebrow text-[10px] text-mist">{label}</span>
        {href ? (
          <span className="mt-1 text-[15px] text-ivory transition-colors duration-500 group-hover:text-gold">{value}</span>
        ) : (
          <span className="mt-1 font-mono text-[12px] text-mist/60" title="Placeholder — configure in lib/site.ts">
            {placeholder}
          </span>
        )}
      </span>
    </>
  );
  return href ? (
    <a href={href} className="group flex items-center gap-5" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {inner}
    </a>
  ) : (
    <div className="flex items-center gap-5">{inner}</div>
  );
}

export function Contact() {
  const whatsapp = getWhatsAppHref();
  const mail = getMailtoHref();

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative isolate overflow-clip bg-ink py-[clamp(6rem,12vw,11rem)]">
      <SectionBackdrop src={BACKDROPS.contact} wash={0.66} side="left" saturate={0.55} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_50%_at_15%_20%,rgba(196,167,121,0.08),transparent_70%)]"
      />
      <div className="shell relative grid gap-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Eyebrow index="04">Contact</Eyebrow>
            <SplitHeading id="contact-title" className="display-lg mt-8 max-w-[11ch] text-ivory">
              Request an <em className="text-gold">introduction.</em>
            </SplitHeading>
            <Reveal className="mt-8 max-w-md">
              <p className="text-[17px] leading-relaxed text-mist">
                Whether you are buying or selling, the conversation begins here.
              </p>
            </Reveal>

            <Reveal stagger={0.08} className="mt-12 space-y-6 border-t border-line pt-10">
              <div data-reveal>
                {/* Secondary contact: WhatsApp with pre-filled message */}
                <a
                  href={whatsapp ?? "#contact-form"}
                  {...(whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group inline-flex items-center gap-4 border border-whatsapp/40 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ivory transition-colors duration-500 hover:border-whatsapp hover:bg-whatsapp hover:text-ink"
                >
                  <WhatsAppIcon className="h-5 w-5 text-whatsapp transition-colors duration-500 group-hover:text-ink" />
                  Chat on WhatsApp
                </a>
                {!whatsapp ? (
                  <p className="mt-3 font-mono text-[11px] text-mist/60">[WHATSAPP_NUMBER_WITH_COUNTRY_CODE] — not yet configured</p>
                ) : null}
              </div>
              <div data-reveal>
                <ContactRow
                  href={mail}
                  icon={<Mail className="h-4 w-4 text-gold" strokeWidth={1.5} aria-hidden="true" />}
                  label="Email"
                  value={siteConfig.email}
                  placeholder="[CONTACT_EMAIL]"
                />
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal id="contact-form" className="lg:col-span-7" y={48}>
          <EnquiryForm />
        </Reveal>
      </div>
    </section>
  );
}
