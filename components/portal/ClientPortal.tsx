"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Fingerprint, KeyRound, Loader2, Lock, RotateCcw, ShieldCheck, Timer, X } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import {
  fingerprintClientId,
  normalizeClientId,
  CLIENT_ID_MAX,
  CLIENT_ID_MIN,
  type ClientRecord,
  type PortalResponse,
} from "@/lib/client-portal";
import { getCallAction, getMailtoHref, siteConfig } from "@/lib/site";
import { startScroll, stopScroll } from "@/lib/scroll";

/*
 * The client portal: "Track your progress".
 *
 * Every security marker shown here is real: the HTTPS check, the SHA-256
 * fingerprint computed on the visitor's device (the ID itself is never sent),
 * the idle lock, and the server-side verification against Ventrion's private
 * registry (see lib/client-portal.ts and app/api/portal/route.ts). Nothing is
 * shown as verified unless the server has a record for that fingerprint.
 */

const SESSION_SECONDS = 5 * 60;
const MINT = "#8cc5a8";

type PortalContextValue = { open: () => void; close: () => void; isOpen: boolean };
const PortalContext = createContext<PortalContextValue | null>(null);

export function useClientPortal() {
  const value = useContext(PortalContext);
  if (!value) throw new Error("useClientPortal must be used inside <ClientPortalProvider>");
  return value;
}

export function ClientPortalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  const open = useCallback(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  // Deep link: /#track opens the portal (handy for links sent to clients).
  useEffect(() => {
    const check = () => {
      if (window.location.hash !== "#track") return;
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setIsOpen(true);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  useEffect(() => {
    if (isOpen) wasOpen.current = true;
    else if (wasOpen.current) {
      wasOpen.current = false;
      returnFocus.current?.focus({ preventScroll: true });
    }
  }, [isOpen]);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <PortalContext.Provider value={value}>
      {children}
      <AnimatePresence>{isOpen ? <PortalDialog key="client-portal" onClose={close} /> : null}</AnimatePresence>
    </PortalContext.Provider>
  );
}

/** Any button that opens the portal. */
export function PortalTrigger({ className = "", children, label }: { className?: string; children: ReactNode; label?: string }) {
  const { open } = useClientPortal();
  return (
    <button type="button" onClick={open} aria-haspopup="dialog" aria-label={label} className={className}>
      {children}
    </button>
  );
}

/* ── The dialog ────────────────────────────────────────────────────────── */

type Phase = "idle" | "verifying" | "verified" | "unverified" | "limited" | "error" | "locked";

function randomReference() {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

function formatFingerprint(hex: string) {
  const up = hex.toUpperCase();
  return `${up.slice(0, 4)} ${up.slice(4, 8)} ${up.slice(8, 12)} ${up.slice(12, 16)} ··· ${up.slice(-4)}`;
}

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function StepIcon({ state }: { state: "pending" | "active" | "done" | "failed" }) {
  if (state === "done") return <Check className="h-3.5 w-3.5" style={{ color: MINT }} strokeWidth={2} aria-hidden="true" />;
  if (state === "failed") return <X className="h-3.5 w-3.5 text-[#e3a3ab]" strokeWidth={2} aria-hidden="true" />;
  if (state === "active") return <Loader2 className="h-3.5 w-3.5 animate-spin text-paper/70" strokeWidth={2} aria-hidden="true" />;
  return <span className="block h-1 w-1 rounded-full bg-paper/30" aria-hidden="true" />;
}

function PortalDialog({ onClose }: { onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [reference, setReference] = useState(randomReference);
  const [https, setHttps] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [handshake, setHandshake] = useState(0);
  const [value, setValue] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [record, setRecord] = useState<ClientRecord | null>(null);
  const [retryAfter, setRetryAfter] = useState(0);
  const [remaining, setRemaining] = useState(SESSION_SECONDS);

  const normalized = normalizeClientId(value);
  const busy = phase === "verifying";
  const ready = normalized.length >= CLIENT_ID_MIN && !busy && hashing;
  const call = getCallAction();
  const mail = getMailtoHref();

  // Lock page scroll, Escape to close, keep Tab inside the dialog.
  useEffect(() => {
    stopScroll();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const focusables = Array.from(
        panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled])"),
      ).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      startScroll();
    };
  }, [onClose]);

  // Secure-session handshake: real checks, revealed in sequence.
  useEffect(() => {
    setHttps(window.location.protocol === "https:");
    setHashing(typeof crypto !== "undefined" && !!crypto.subtle);
    setHandshake(0);
    const timers = [1, 2, 3].map((n) => window.setTimeout(() => setHandshake(n), 180 + n * 300));
    const focus = window.setTimeout(() => input.current?.focus({ preventScroll: true }), 420);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(focus);
    };
  }, [reference]);

  // Live fingerprint of what is typed, computed on this device.
  useEffect(() => {
    if (!normalized) {
      setFingerprint("");
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const fp = await fingerprintClientId(normalized);
        if (!cancelled) setFingerprint(fp);
      } catch {
        /* Web Crypto unavailable: the handshake already shows it */
      }
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [normalized]);

  const lock = useCallback(() => {
    setPhase("locked");
    setValue("");
    setFingerprint("");
    setRecord(null);
  }, []);

  // Idle lock: the session closes itself after five minutes without activity.
  useEffect(() => {
    if (phase === "locked") return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.setTimeout(lock, 0);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, lock]);

  const touch = () => setRemaining(SESSION_SECONDS);

  const newSession = () => {
    setReference(randomReference());
    setPhase("idle");
    setRecord(null);
    setValue("");
    setFingerprint("");
    setStep(0);
    setRemaining(SESSION_SECONDS);
  };

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    touch();
    setPhase("verifying");
    setRecord(null);
    setStep(1);
    try {
      const fp = await fingerprintClientId(normalized);
      setStep(2);
      const response = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint: fp }),
        cache: "no-store",
      });
      setStep(3);
      const data = (await response.json()) as PortalResponse;
      if (data.status === "verified") {
        setRecord(data.record);
        setPhase("verified");
      } else if (data.status === "limited") {
        setRetryAfter(data.retryAfter);
        setPhase("limited");
      } else if (data.status === "unverified") {
        setPhase("unverified");
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  }

  const checks = [
    {
      icon: ShieldCheck,
      label: "Channel",
      value: https ? "Encrypted · HTTPS" : "Not encrypted (local preview)",
      ok: https,
    },
    {
      icon: Fingerprint,
      label: "Client ID",
      value: hashing ? "Hashed on device · SHA-256" : "Hashing unavailable",
      ok: hashing,
    },
    { icon: Timer, label: "Session", value: "Locks after 5 min idle", ok: true },
  ];

  const verifySteps = ["Fingerprint sealed on this device", "Encrypted channel to Ventrion", "Registry lookup"];
  const scanning = handshake < 3 || busy;

  return (
    <motion.div
      className="fixed inset-0 z-[96] flex items-end justify-center bg-[#04110c]/72 backdrop-blur-md sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.35 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-lenis-prevent
    >
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-title"
        aria-describedby="portal-desc"
        className="relative max-h-[100svh] w-full overflow-y-auto overscroll-contain bg-[#0b231c] text-paper shadow-[0_40px_120px_-24px_rgba(0,0,0,0.65)] ring-1 ring-paper/10 sm:max-h-[calc(100svh-3rem)] sm:max-w-[35rem]"
        initial={{ opacity: 0, y: 28, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, transition: { duration: 0.25 } }}
        transition={{ duration: 0.6, ease: EASE }}
        onKeyDown={touch}
        onPointerDown={touch}
      >
        {/* Instrument texture: fine grid, a cool glow and corner brackets */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(244,240,230,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(244,240,230,0.035)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(180deg,black,transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(140,197,168,0.14),transparent_70%)]"
        />
        {["left-3 top-3 border-l border-t", "right-3 top-3 border-r border-t", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"].map((c) => (
          <span key={c} aria-hidden="true" className={`pointer-events-none absolute h-3 w-3 border-paper/25 ${c}`} />
        ))}

        {/* Header */}
        <div className="relative flex items-center justify-between gap-4 px-6 pb-4 pt-5 sm:px-8">
          <div className="flex items-center gap-3">
            <LogoMark className="h-7 w-auto text-paper" />
            <div className="leading-none">
              <p className="font-text text-[12px] uppercase tracking-[0.3em] text-paper">Ventrion</p>
              <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.22em] text-paper/50">Client portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: MINT }} aria-live="off">
              <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ backgroundColor: MINT }} />
                <span className="relative h-1.5 w-1.5 rounded-full" style={{ backgroundColor: MINT }} />
              </span>
              <span className="hidden sm:inline">Secure ·</span>
              <span className="tabular-nums">{formatClock(remaining)}</span>
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close the client portal"
              className="-mr-2 flex h-9 w-9 items-center justify-center text-paper/70 transition-colors hover:text-paper"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Scan line: runs while the session is opening and while verifying */}
        <div aria-hidden="true" className="relative h-px overflow-hidden bg-paper/10">
          {scanning ? (
            <span
              className="portal-scan absolute inset-y-0 left-0 w-1/3"
              style={{ backgroundImage: `linear-gradient(90deg, transparent, ${MINT}, transparent)` }}
            />
          ) : null}
        </div>

        <div className="relative px-6 pb-7 pt-7 sm:px-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/45">
            Session <span className="text-paper/70">{reference}</span>
          </p>
          <h2 id="portal-title" className="mt-3 font-serif text-[2.35rem] font-medium leading-[1.02] sm:text-[2.6rem]">
            Track your <em>progress.</em>
          </h2>
          <p id="portal-desc" className="mt-3 max-w-[30rem] text-[14.5px] leading-relaxed text-paper/70">
            Ventrion values transparency and time more than anything. To give you peace of mind, you can track your
            trade whenever you want, wherever you are.
          </p>

          {/* Session checks */}
          <ul className="mt-6 space-y-2.5 border-y border-paper/10 py-4 font-mono text-[11px] tracking-[0.04em]" aria-label="Session security">
            {checks.map((check, i) => {
              const shown = handshake > i;
              const Icon = check.icon;
              return (
                <li key={check.label} className="flex items-center justify-between gap-4">
                  <span className="flex shrink-0 items-center gap-2.5 whitespace-nowrap uppercase tracking-[0.16em] text-paper/55">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                    {check.label}
                  </span>
                  <span className="flex items-center gap-2 text-right text-paper/80">
                    {shown ? check.value : <span className="text-paper/35">establishing…</span>}
                    <StepIcon state={shown ? (check.ok ? "done" : "failed") : "active"} />
                  </span>
                </li>
              );
            })}
          </ul>

          {phase === "locked" ? (
            <div className="mt-7 border border-paper/15 bg-black/15 p-6 text-center" role="status">
              <Lock className="mx-auto h-6 w-6 text-paper/70" strokeWidth={1.5} aria-hidden="true" />
              <p className="mt-4 font-serif text-[1.5rem] leading-tight">Session locked</p>
              <p className="mx-auto mt-2 max-w-[22rem] text-[13.5px] leading-relaxed text-paper/60">
                For your security the session closed after five minutes without activity. Nothing you entered was kept.
              </p>
              <button
                type="button"
                onClick={newSession}
                className="mt-6 inline-flex items-center gap-2.5 border border-paper/25 px-5 py-3 font-text text-[15px] transition-colors hover:border-paper/60"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                Start a new session
              </button>
            </div>
          ) : phase === "verified" && record ? (
            <div className="mt-7" role="status">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: MINT }}>
                <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Verified
              </p>
              {record.name ? <p className="mt-2 font-serif text-[1.9rem] leading-tight">{record.name}</p> : null}
              <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden border border-paper/10 bg-paper/10 text-[13.5px]">
                {[
                  ["Status", record.status],
                  ["Last update", record.updated],
                  ["Stage", record.stage],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v], i, all) => (
                    <div key={k} className={`bg-[#0b231c] p-4 ${i === all.length - 1 && all.length % 2 ? "col-span-2" : ""}`}>
                      <dt className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-paper/45">{k}</dt>
                      <dd className="mt-1.5 text-paper">{v}</dd>
                    </div>
                  ))}
              </dl>
              {record.note ? <p className="mt-5 text-[14px] leading-relaxed text-paper/75">{record.note}</p> : null}
              {record.timeline?.length ? (
                <ol className="mt-6 space-y-0 border-l border-paper/15 pl-5">
                  {record.timeline.map((item, i) => (
                    <li key={`${item.label}-${i}`} className="relative pb-4 last:pb-0">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full ring-4 ring-[#0b231c]"
                        style={{ backgroundColor: item.done ? MINT : "rgba(244,240,230,0.3)" }}
                      />
                      {item.date ? <p className="font-mono text-[10px] tracking-[0.14em] text-paper/45">{item.date}</p> : null}
                      <p className={`text-[14px] ${item.done ? "text-paper" : "text-paper/60"}`}>{item.label}</p>
                    </li>
                  ))}
                </ol>
              ) : null}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={call.href}
                  className="inline-flex flex-1 items-center justify-between gap-3 bg-burgundy px-5 py-3.5 font-text text-[15.5px] text-paper transition-colors hover:bg-burgundy-deep"
                >
                  {call.label}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex flex-1 items-center justify-center gap-2 border border-paper/25 px-5 py-3.5 font-text text-[15.5px] transition-colors hover:border-paper/60"
                >
                  <Lock className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> End session
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={verify} className="mt-7" noValidate>
              <label htmlFor="client-id" className="font-mono text-[10px] uppercase tracking-[0.24em] text-paper/60">
                Client ID
              </label>
              <div className="mt-2 flex items-center gap-3 border border-paper/20 bg-black/20 px-4 transition-colors focus-within:border-[#8cc5a8]/80">
                <KeyRound className="h-4 w-4 shrink-0 text-paper/45" strokeWidth={1.5} aria-hidden="true" />
                <input
                  ref={input}
                  id="client-id"
                  name="client-id"
                  value={value}
                  onChange={(event) => {
                    touch();
                    setValue(event.target.value.toUpperCase().replace(/[^A-Z0-9 -]/g, "").slice(0, CLIENT_ID_MAX + 8));
                    if (phase !== "idle" && phase !== "verifying") setPhase("idle");
                  }}
                  disabled={busy}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="VTR-XXXX-XXXX-XXXX"
                  aria-describedby="client-id-fingerprint client-id-note"
                  className="h-14 w-full min-w-0 bg-transparent font-mono text-[16px] uppercase tracking-[0.16em] text-paper outline-none placeholder:text-paper/25 sm:text-[17px]"
                />
              </div>
              <p id="client-id-fingerprint" className="mt-2.5 flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-paper/45">
                <Fingerprint className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="uppercase tracking-[0.2em]">SHA-256</span>
                <span className="truncate text-paper/70">{fingerprint ? formatFingerprint(fingerprint) : "awaiting input"}</span>
              </p>

              {busy ? (
                <ul className="mt-5 space-y-2 font-mono text-[11px] tracking-[0.04em]" aria-live="polite">
                  {verifySteps.map((label, i) => (
                    <li key={label} className="flex items-center gap-2.5 text-paper/75">
                      <StepIcon state={step > i + 1 ? "done" : step === i + 1 ? "active" : "pending"} />
                      {label}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div aria-live="polite">
                {phase === "unverified" ? (
                  <div className="mt-5 border border-[#e3a3ab]/35 bg-burgundy/15 p-4 text-[13.5px] leading-relaxed">
                    <p className="text-paper">We could not verify this Client ID.</p>
                    <p className="mt-1 text-paper/65">
                      Check the ID and try again. If it is still not recognised, please speak with Ventrion.
                    </p>
                    <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-text text-[14px]">
                      <a href={call.href} className="underline decoration-paper/30 underline-offset-4 hover:decoration-paper">
                        {call.label}
                      </a>
                      {mail ? (
                        <a href={mail} className="underline decoration-paper/30 underline-offset-4 hover:decoration-paper">
                          {siteConfig.email}
                        </a>
                      ) : null}
                    </p>
                  </div>
                ) : phase === "limited" ? (
                  <p className="mt-5 border border-paper/15 bg-black/15 p-4 text-[13.5px] leading-relaxed text-paper/75">
                    Too many attempts from this network. For your protection, please try again in{" "}
                    {Math.max(1, Math.ceil(retryAfter / 60))} minute{Math.ceil(retryAfter / 60) > 1 ? "s" : ""}.
                  </p>
                ) : phase === "error" ? (
                  <p className="mt-5 border border-paper/15 bg-black/15 p-4 text-[13.5px] leading-relaxed text-paper/75">
                    The secure service could not be reached. Please check that you are online and try again.
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={!ready}
                className="mt-6 flex w-full items-center justify-between gap-4 bg-burgundy px-6 py-4 font-text text-[17px] text-paper transition-[background-color,opacity] duration-300 hover:bg-burgundy-deep disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-burgundy"
              >
                <span className="flex items-center gap-3">
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <Lock className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  )}
                  {busy ? "Verifying…" : "Verify securely"}
                </span>
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </form>
          )}

          <p id="client-id-note" className="mt-6 text-[11.5px] leading-relaxed text-paper/45">
            Your Client ID is turned into a one-way fingerprint on this device before anything is sent; the ID itself
            never leaves your device and is not stored. Client IDs are issued privately by Ventrion.
          </p>
        </div>

        <div className="relative flex items-center justify-between border-t border-paper/10 px-6 py-3 font-mono text-[9.5px] uppercase tracking-[0.2em] text-paper/40 sm:px-8">
          <span>Esc to close</span>
          <span className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" /> {https ? "TLS · SHA-256" : "SHA-256"}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
