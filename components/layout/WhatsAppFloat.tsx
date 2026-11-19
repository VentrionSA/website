"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getWhatsAppHref } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

/** Persistent WhatsApp contact button (bottom-right, safe-area aware). */
export function WhatsAppFloat() {
  const href = getWhatsAppHref();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 1400);
    if (!href && process.env.NODE_ENV !== "production") {
      console.info("[Ventrion] WhatsApp number not configured — set NEXT_PUBLIC_WHATSAPP_NUMBER or edit lib/site.ts.");
    }
    return () => window.clearTimeout(timer);
  }, [href]);

  return (
    <motion.a
      href={href ?? "/#contact"}
      {...(href ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label="Let’s talk on WhatsApp"
      className="wa-float group fixed bottom-[calc(1.1rem+env(safe-area-inset-bottom))] right-[calc(1.1rem+env(safe-area-inset-right))] z-[60] block rounded-full transition-opacity duration-500 sm:bottom-[calc(1.75rem+env(safe-area-inset-bottom))] sm:right-[calc(1.75rem+env(safe-area-inset-right))]"
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      animate={visible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.6, y: 12 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <span aria-hidden="true" className="wa-pulse absolute inset-0 rounded-full" />
      <span className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-whatsapp text-white shadow-[0_14px_40px_-12px_rgba(37,211,102,0.65)] sm:h-14 sm:w-14">
        <WhatsAppIcon className="h-[26px] w-[26px] sm:h-7 sm:w-7" />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[calc(100%+14px)] top-1/2 hidden -translate-y-1/2 translate-x-2 whitespace-nowrap bg-ivory px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink opacity-0 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:block"
      >
        Let’s talk on WhatsApp
      </span>
    </motion.a>
  );
}
