import { Hero } from "@/components/sections/Hero";
import { Introduction } from "@/components/sections/Introduction";
import { Network } from "@/components/sections/Network";
import { Principles } from "@/components/sections/Principles";
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
      <Principles />
      <Closing />
      <Contact />
    </main>
  );
}
