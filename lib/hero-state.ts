/**
 * Mutable state shared between DOM-side scroll/pointer handlers and the
 * hero WebGL scene. Mutated directly to avoid React re-renders per frame.
 */
export const heroState = {
  /** Scroll progress through the hero, 0 → 1. */
  progress: 0,
  /** Pointer position in normalised device coordinates (-1 → 1). */
  pointerX: 0,
  pointerY: 0,
};
