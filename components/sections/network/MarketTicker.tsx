import { Fragment } from "react";
import { MARKETS } from "@/lib/content";

/**
 * A small four-pointed star in the shape of the Ventrion star, for sizes too small to show
 * the mark's detail (and light enough to repeat: the full mark is 14 KB of drawing).
 */
function StarGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="-6 -6 12 12" className={className} fill="currentColor" aria-hidden="true">
      <path d="M0-6 1.4-1.4 6 0 1.4 1.4 0 6-1.4 1.4-6 0-1.4-1.4Z" />
    </svg>
  );
}

/**
 * The network's markets passing slowly by, between hairlines, as on a trading floor's
 * board: the band that opens the Network section. Decorative (the markets are listed in
 * the section itself); still with reduced motion.
 */
export function MarketTicker() {
  // two runs of the markets, so the band can slide by one run and start again unseen
  const run = (copy: number) =>
    MARKETS.map((market) => (
      <Fragment key={`${copy}-${market.id}`}>
        <span className="whitespace-nowrap px-6 font-serif text-[1.35rem] italic leading-none text-ivory/85 sm:px-9 sm:text-[1.6rem]">
          {market.name}
        </span>
        <StarGlyph className="h-3 w-3 shrink-0 text-burgundy/70 sm:h-3.5 sm:w-3.5" />
      </Fragment>
    ));

  return (
    <div aria-hidden="true" className="ticker-band relative overflow-hidden border-y border-line py-4 sm:py-5">
      <div className="ticker flex w-max items-center">
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}
