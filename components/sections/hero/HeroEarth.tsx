"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import poster from "@/assets/images/earth-poster.webp";

/**
 * The hero Earth: a still frame paints instantly, then cross-fades to the
 * looping video (WebM for Chrome/Firefox, MP4 for Safari) once it is playing.
 * The video's square frame is trimmed to a soft-edged circle in CSS (.earth-video).
 * Reduced-motion and data-saver visitors keep the still.
 */
export function HeroEarth({ className = "" }: { className?: string }) {
  const [animate, setAnimate] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!reduce && !saveData) setAnimate(true);
  }, []);

  return (
    <div className={`relative aspect-square ${className}`}>
      {/* grounding shadow and a faint atmosphere */}
      <div aria-hidden="true" className="earth-shadow" />
      <div aria-hidden="true" className="earth-atmosphere" />
      {/* a fine gold orbit with a travelling point */}
      <div aria-hidden="true" className="earth-orbit">
        <span className="earth-orbit-dot" />
      </div>

      <Image
        src={poster}
        alt=""
        aria-hidden="true"
        priority
        sizes="(min-width: 1024px) 620px, 72vw"
        className="absolute inset-0 h-full w-full select-none"
        draggable={false}
      />
      {animate ? (
        <video
          className={`earth-video absolute inset-0 h-full w-full transition-opacity duration-700 ease-out ${playing ? "opacity-100" : "opacity-0"}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => setPlaying(true)}
        >
          <source src="/media/earth.webm" type="video/webm" />
          <source src="/media/earth.mp4" type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
