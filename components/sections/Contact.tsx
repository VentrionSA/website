import { ArrowUpRight, KeyRound, Mail, Phone } from "lucide-react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SplitHeading } from "@/components/ui/SplitHeading";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/ui/icons";
import { PortalTrigger } from "@/components/portal/InvestorPortal";
import { getCallAction, getMailtoHref, getWhatsAppHref, siteConfig } from "@/lib/site";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { BACKDROPS } from "@/lib/backdrops";

/** The call to action that closes the page: speak with Ventrion. */
function CallPanel() {
  const call = getCallAction();
  return (
    <a
      href={call.href}
      className="group relative block overflow-hidden bg-burgundy p-7 text-paper shadow-[0_30px_60px_-30px_rgba(150,25,42,0.55)] transition-colors duration-500 hover:bg-burgundy-deep sm:p-10 lg:p-12"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-paper/10" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full border border-paper/10" />
      <span className="relative flex items-center gap-5 sm:gap-6">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-paper/45 sm:h-16 sm:w-16">
          <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full border border-paper/30 [animation-duration:2.4s]" />
          <Phone className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block font-text text-[12px] uppercase tracking-[0.24em] text-paper/75">{call.label}</span>
          <span className="mt-2 block font-serif text-[clamp(2.1rem,4.4vw,4rem)] font-medium leading-[0.95]">
            {call.isPhone ? call.detail : "Speak with us"}
          </span>
        </span>
      </span>
      <span className="relative mt-8 flex items-center justify-between gap-4 border-t border-paper/20 pt-5 font-text text-[15px] text-paper/85">
        {call.isPhone ? "Private and confidential" : "Leave your number and we will call you back"}
        <ArrowUpRight
          className="h-5 w-5 shrink-0 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </span>
    </a>
  );
}

const rowClass =
  "group flex items-center gap-5 border-t border-line py-5 text-left transition-colors duration-500 first:border-t-0 hover:text-ivory";

export function Contact() {
  const whatsapp = getWhatsAppHref();
  const mail = getMailtoHref();

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative isolate overflow-clip bg-ink py-[clamp(6rem,12vw,11rem)]">
      <SectionBackdrop src={BACKDROPS.contact} wash={0.72} side="left" saturate={0.5} />
      <div className="shell relative grid gap-14 lg:grid-cols-12 lg:items-end lg:gap-8">
        <div className="lg:col-span-6">
          <Eyebrow index="04">Contact</Eyebrow>
          <SplitHeading id="contact-title" className="display-xl mt-8 max-w-[16ch] text-ivory">
            Every engagement begins with a <em className="text-burgundy">call.</em>
          </SplitHeading>
          <Reveal className="mt-8 max-w-md">
            <p className="text-[17px] leading-relaxed text-mist">
              Speak with Ventrion directly. Every conversation is private and confidential.
            </p>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-6 lg:col-start-7" y={40}>
          <CallPanel />

          <div className="mt-6 border-y border-line">
            {mail ? (
              <a href={mail} className={rowClass}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-line-strong transition-colors duration-500 group-hover:border-mark">
                  <Mail className="h-4 w-4 text-mark" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="eyebrow text-[10px] text-mist">Email</span>
                  <span className="mt-1 truncate text-[15px] text-ivory decoration-mark/40 underline-offset-4 group-hover:underline">
                    {siteConfig.email}
                  </span>
                </span>
              </a>
            ) : null}
            {whatsapp ? (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={rowClass}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-line-strong transition-colors duration-500 group-hover:border-mark">
                  <WhatsAppIcon className="h-4 w-4 text-mark" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="eyebrow text-[10px] text-mist">WhatsApp</span>
                  <span className="mt-1 text-[15px] text-ivory decoration-mark/40 underline-offset-4 group-hover:underline">
                    {siteConfig.whatsappNumber}
                  </span>
                </span>
              </a>
            ) : null}
            <PortalTrigger className={`${rowClass} w-full`}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-line-strong transition-colors duration-500 group-hover:border-mark">
                <KeyRound className="h-4 w-4 text-mark" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="eyebrow text-[10px] text-mist">Investors</span>
                <span className="mt-1 text-[15px] text-ivory decoration-mark/40 underline-offset-4 group-hover:underline">
                  Track your investment
                </span>
              </span>
            </PortalTrigger>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
