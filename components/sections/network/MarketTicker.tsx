import { Fragment } from "react";
import { MARKETS } from "@/lib/content";
import { LogoMark } from "@/components/brand/Logo";

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
        <LogoMark className="h-3 w-auto shrink-0 text-burgundy/70 sm:h-3.5" />
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
