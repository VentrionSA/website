import { ArrowUpRight, KeyRound, Mail, Phone } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/ui/icons";
import { PortalTrigger } from "@/components/portal/ClientPortal";
import { getCallAction, getMailtoHref, getWhatsAppHref, siteConfig } from "@/lib/site";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

/** The call to action that closes the page: one wide burgundy bar, the number set large. */
function CallBar() {
  const call = getCallAction();
  return (
    <a
      href={call.href}
      className="group relative flex w-full items-center gap-5 overflow-hidden bg-burgundy px-6 py-6 text-left text-paper shadow-[0_30px_60px_-34px_rgba(150,25,42,0.6)] transition-colors duration-500 hover:bg-burgundy-deep sm:gap-7 sm:px-10 sm:py-8"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-paper/10" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-paper/10" />
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-paper/45 sm:h-16 sm:w-16">
        <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full border border-paper/30 [animation-duration:2.4s]" />
        <Phone className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-text text-[11px] uppercase tracking-[0.26em] text-paper/75 sm:text-[12px]">{call.label}</span>
        <span className="mt-2 block whitespace-nowrap font-serif text-[clamp(1.75rem,5.2vw,3.5rem)] font-medium leading-[0.95] [font-variant-numeric:lining-nums_tabular-nums]">
          {call.isPhone ? call.detail : "Speak with us"}
        </span>
      </span>
      <span className="relative hidden shrink-0 flex-col items-end gap-3 font-text text-[13px] text-paper/80 sm:flex">
        <ArrowUpRight
          className="h-6 w-6 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        {call.isPhone ? "Private and confidential" : "We will call you back"}
      </span>
    </a>
  );
}

const linkClass =
  "group inline-flex items-center gap-3 text-[15px] text-ivory transition-opacity duration-500 hover:opacity-80";
const iconClass =
  "flex h-10 w-10 shrink-0 items-center justify-center border border-line-strong transition-colors duration-500 group-hover:border-mark";

export function Contact() {
  const whatsapp = getWhatsAppHref();
  const mail = getMailtoHref();

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative isolate overflow-clip bg-ink py-[clamp(6rem,12vw,11rem)]">
      <SectionBackdrop src={BACKDROPS.contact} wash={0.8} side="both" saturate={0.45} />
      <div className="shell relative flex flex-col items-center text-center">
        <Eyebrow index="04" className="justify-center">
          Contact
        </Eyebrow>
        <SplitHeading id="contact-title" className="display-xl mt-8 max-w-[17ch] text-balance text-ivory">
          Every engagement begins with a <em className="text-burgundy">call.</em>
        </SplitHeading>
        <Reveal className="mt-7 max-w-[30rem]">
          <p className="text-[17px] leading-relaxed text-mist">
            Speak with Ventrion directly. Every conversation is private and confidential.
          </p>
        </Reveal>

        <Reveal className="mt-12 w-full max-w-[46rem] sm:mt-14" y={30}>
          <CallBar />
        </Reveal>

        <Reveal className="mt-9 flex w-full max-w-[46rem] justify-center border-t border-line pt-8" delay={0.1}>
          {/* stacked on phones with the icons in one column; a single centred row from sm up */}
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-0">
            {mail ? (
              <a href={mail} className={linkClass}>
                <span className={iconClass}>
                  <Mail className="h-4 w-4 text-mark" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="flex flex-col text-left">
                  <span className="eyebrow text-[9.5px] text-mist">Email</span>
                  <span className="mt-0.5">{siteConfig.email}</span>
                </span>
              </a>
            ) : null}
            {whatsapp ? (
              <>
                <span aria-hidden="true" className="mx-10 hidden h-9 w-px bg-line-strong sm:block" />
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  <span className={iconClass}>
                    <WhatsAppIcon className="h-4 w-4 text-mark" />
                  </span>
                  <span className="flex flex-col text-left">
                    <span className="eyebrow text-[9.5px] text-mist">WhatsApp</span>
                    <span className="mt-0.5">{siteConfig.whatsappNumber}</span>
                  </span>
                </a>
              </>
            ) : null}
            <span aria-hidden="true" className="mx-10 hidden h-9 w-px bg-line-strong sm:block" />
            <PortalTrigger className={linkClass}>
              <span className={iconClass}>
                <KeyRound className="h-4 w-4 text-mark" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="flex flex-col text-left">
                <span className="eyebrow text-[9.5px] text-mist">Client portal</span>
                <span className="mt-0.5">Track your progress</span>
              </span>
            </PortalTrigger>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
