import { Hero } from "@/components/sections/Hero";
import { Introduction } from "@/components/sections/Introduction";
import { Network } from "@/components/sections/Network";
import { Commodities } from "@/components/sections/Commodities";
import { Expertise } from "@/components/sections/Expertise";
import { Approach } from "@/components/sections/Approach";
import { WhyUs } from "@/components/sections/WhyUs";
import { Philosophy } from "@/components/sections/Philosophy";
import { Contact } from "@/components/sections/Contact";

export default function HomePage() {
  return (
    <main id="main">
      <Hero />
      <Introduction />
      <Network />
      <Commodities />
      <Expertise />
      <Approach />
      <WhyUs />
      <Philosophy />
      <Contact />
    </main>
  );
}
