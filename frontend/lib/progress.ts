/** Shared scroll state: p = raw 0..1 page progress, s = damped value read by the 3D scene. */
export const scroll = { p: 0, s: 0 };

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const ss = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
