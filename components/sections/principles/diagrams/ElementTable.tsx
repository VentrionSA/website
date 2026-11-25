"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInViewport, usePrefersReducedMotion } from "@/lib/device";

/**
 * The table of elements, drawn like the network map: every element a plain sage
 * cell, a select few in green, the one in focus in burgundy. The focused element
 * is shown large in the table's own gap and changes every few seconds.
 */

const P = 22; // cell pitch
const CELL = 20;
const W = 18 * P - 2;
const H = Math.round(8.5 * P + CELL);

type Element = { symbol: string; name: string; number: number; mass: string; period: number; group: number };

// A select few: metals, minerals and the elements of fertilisers and energy.
const SELECT: Element[] = [
  { symbol: "Cu", name: "Copper", number: 29, mass: "63.546", period: 4, group: 11 },
  { symbol: "Fe", name: "Iron", number: 26, mass: "55.845", period: 4, group: 8 },
  { symbol: "Al", name: "Aluminium", number: 13, mass: "26.982", period: 3, group: 13 },
  { symbol: "Zn", name: "Zinc", number: 30, mass: "65.38", period: 4, group: 12 },
  { symbol: "Ni", name: "Nickel", number: 28, mass: "58.693", period: 4, group: 10 },
  { symbol: "S", name: "Sulfur", number: 16, mass: "32.06", period: 3, group: 16 },
  { symbol: "Au", name: "Gold", number: 79, mass: "196.97", period: 6, group: 11 },
  { symbol: "N", name: "Nitrogen", number: 7, mass: "14.007", period: 2, group: 15 },
  { symbol: "Sn", name: "Tin", number: 50, mass: "118.71", period: 5, group: 14 },
  { symbol: "P", name: "Phosphorus", number: 15, mass: "30.974", period: 3, group: 15 },
  { symbol: "K", name: "Potassium", number: 19, mass: "39.098", period: 4, group: 1 },
  { symbol: "Cr", name: "Chromium", number: 24, mass: "51.996", period: 4, group: 6 },
  { symbol: "Mn", name: "Manganese", number: 25, mass: "54.938", period: 4, group: 7 },
  { symbol: "Ag", name: "Silver", number: 47, mass: "107.87", period: 5, group: 11 },
  { symbol: "C", name: "Carbon", number: 6, mass: "12.011", period: 2, group: 14 },
  { symbol: "Pb", name: "Lead", number: 82, mass: "207.2", period: 6, group: 14 },
];

/** Every cell of the table, as [x, y] in the drawing (main block, then the two f-block rows). */
function cells() {
  const out: { x: number; y: number; key: string; select: number }[] = [];
  const add = (period: number, group: number, y = (period - 1) * P) => {
    const select = SELECT.findIndex((e) => e.period === period && e.group === group && period <= 7);
    out.push({ x: (group - 1) * P, y, key: `${period}-${group}`, select });
  };
  add(1, 1);
  add(1, 18);
  for (const p of [2, 3]) for (const g of [1, 2, 13, 14, 15, 16, 17, 18]) add(p, g);
  for (const p of [4, 5, 6, 7]) for (let g = 1; g <= 18; g++) add(p, g);
  for (const row of [0, 1]) for (let g = 3; g <= 17; g++) add(9 + row, g, (7.5 + row) * P);
  return out;
}

export function ElementTable() {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInViewport(root);
  const reduce = usePrefersReducedMotion();
  const [focus, setFocus] = useState(0);
  const [seen, setSeen] = useState(false);
  const hovering = useRef(false);
  const all = useMemo(cells, []);
  const el = SELECT[focus];

  useEffect(() => {
    if (inView) setSeen(true);
  }, [inView]);

  useEffect(() => {
    if (!inView || reduce) return;
    const id = window.setInterval(() => {
      if (!hovering.current) setFocus((f) => (f + 1) % SELECT.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [inView, reduce]);

  // the element tile sits in the table's gap: groups 3 to 12, periods 1 to 3
  const cardX = 2 * P;
  const tile = 3 * P - 2;

  return (
    <div ref={root} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="The table of elements, with a select few highlighted.">
        {all.map((c, i) => {
          const selected = c.select >= 0;
          const focused = c.select === focus;
          return (
            <g
              key={c.key}
              className="transition-opacity duration-700"
              style={{ opacity: seen || reduce ? 1 : 0, transitionDelay: `${Math.round(i * 5)}ms` }}
              onMouseEnter={
                selected
                  ? () => {
                      hovering.current = true;
                      setFocus(c.select);
                    }
                  : undefined
              }
              onMouseLeave={selected ? () => (hovering.current = false) : undefined}
            >
              <rect
                x={c.x}
                y={c.y}
                width={CELL}
                height={CELL}
                rx={2.5}
                className="transition-[fill] duration-500"
                fill={focused ? "#b52336" : selected ? "#5b796c" : "#d9ddd2"}
                style={selected ? { cursor: "pointer" } : undefined}
              />
              {selected ? (
                <text
                  x={c.x + CELL / 2}
                  y={c.y + CELL / 2 + 3.2}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={600}
                  fill="#f4f0e6"
                  className="pointer-events-none font-text"
                >
                  {SELECT[c.select].symbol}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* the element in focus, shown large */}
        <g key={el.symbol} className="element-card">
          <rect x={cardX} y={0} width={tile} height={tile} rx={3} fill="#b52336" />
          <text x={cardX + 6} y={11} fontSize={8} fill="#f4f0e6" className="font-text" fontWeight={500}>
            {el.number}
          </text>
          <text x={cardX + tile / 2} y={41} textAnchor="middle" fontSize={27} fill="#f4f0e6" className="font-serif" fontWeight={500}>
            {el.symbol}
          </text>
          <text x={cardX + tile / 2} y={57} textAnchor="middle" fontSize={6.5} fill="#f4f0e6" fillOpacity={0.8} className="font-text">
            {el.mass}
          </text>
          <text x={cardX + tile + 12} y={31} fontSize={17} fill="#123b30" className="font-serif" fontStyle="italic">
            {el.name}
          </text>
          <rect x={cardX + tile + 12} y={40} width={24} height={1} fill="#b52336" />
        </g>
      </svg>
    </div>
  );
}
