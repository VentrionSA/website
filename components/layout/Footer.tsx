import Link from "next/link";
import { LogoMark, LogoWordmark } from "@/components/brand/Logo";
import { NAV_LINKS } from "@/lib/content";
import { getMailtoHref, getWhatsAppHref, siteConfig } from "@/lib/site";

function Placeholder({ children }: { children: string }) {
  return (
    <span className="font-mono text-[11px] tracking-normal text-mist/60" title="Placeholder — replace in lib/site.ts or via environment variables">
      {children}
    </span>
  );
}

const linkClass = "link-draw text-sm text-ivory/80 transition-colors duration-500 hover:text-ivory";

export function Footer() {
  const mail = getMailtoHref();
  const whatsapp = getWhatsAppHref();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div aria-hidden="true" className="pointer-events-none absolute -right-[8vw] bottom-[8%] text-mark/[0.07]">
        <LogoMark className="float-mark h-[52vw] w-auto max-h-[720px] lg:h-[34vw]" />
      </div>
      <div className="shell relative pb-10 pt-24 lg:pt-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6">
            <a href="/#top" className="inline-flex items-center gap-4 text-ivory" aria-label="Ventrion — back to top">
              <LogoMark className="h-12 w-auto text-mark" />
              <LogoWordmark className="h-[15px] w-auto" />
            </a>
            <p className="display-sm mt-10 max-w-[22ch] text-ivory">
              Connecting markets. Moving <em className="text-burgundy">opportunity.</em>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist">A private trade facilitation group.</p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-2 lg:col-start-8">
            <p className="eyebrow mb-6 text-ivory">Navigate</p>
            <ul className="space-y-3.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={linkClass}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className="eyebrow mb-6 text-ivory">Contact</p>
            <ul className="space-y-4 text-sm">
              <li className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.24em] text-mist">Email</span>
                {mail ? (
                  <a href={mail} className={linkClass}>
                    {siteConfig.email}
                  </a>
                ) : (
                  <Placeholder>[CONTACT_EMAIL]</Placeholder>
                )}
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.24em] text-mist">WhatsApp</span>
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {siteConfig.whatsappNumber}
                  </a>
                ) : (
                  <Placeholder>[WHATSAPP_NUMBER]</Placeholder>
                )}
              </li>
            </ul>
          </div>
        </div>

        <div aria-hidden="true" className="mt-24 text-ivory/[0.045] lg:mt-32">
          <LogoWordmark className="h-auto w-full" />
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-line pt-8 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.legalName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <li>
              <Link href="/privacy" className="link-draw transition-colors duration-500 hover:text-ivory">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="link-draw transition-colors duration-500 hover:text-ivory">
                Terms of Use
              </Link>
            </li>
            <li>
              <a href="/#top" className="link-draw transition-colors duration-500 hover:text-ivory">
                Back to top ↑
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
