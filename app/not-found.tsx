import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <main id="main" className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink">
      <LogoMark className="pointer-events-none absolute -right-[10vw] top-1/2 h-[80vh] w-auto -translate-y-1/2 text-ivory/[0.035]" />
      <div className="shell relative">
        <p className="eyebrow text-gold">Error 404</p>
        <h1 className="display-xl mt-8 max-w-[12ch] text-ivory">This route does not <em className="text-burgundy">exist.</em></h1>
        <p className="mt-6 max-w-md text-mist">The page you are looking for may have moved. Let us take you back.</p>
        <Link
          href="/"
          className="mt-12 inline-flex items-center gap-4 bg-burgundy px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-paper transition-colors duration-500 hover:bg-onyx"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
