import { Hero } from "@/components/sections/Hero";
import { Introduction } from "@/components/sections/Introduction";
import { MissionVision } from "@/components/sections/MissionVision";
import { Network } from "@/components/sections/Network";
import { Values } from "@/components/sections/Values";
import { Closing } from "@/components/sections/Closing";
import { Contact } from "@/components/sections/Contact";
import { Preloader } from "@/components/layout/Preloader";

export default function HomePage() {
  return (
    <main id="main">
      <Preloader />
      <noscript>
        <style>{"#preloader{display:none}"}</style>
      </noscript>
      <Hero />
      <Introduction />
      <Network />
      <MissionVision />
      <Values />
      <Closing />
      <Contact />
    </main>
  );
}
