// Pure gravity physics for orbit-drop. No DOM — unit-testable in isolation.

/** Summed gravitational acceleration at (x,y) from all wells. Softened to avoid singularities. */
export function gravityAccel(x, y, wells, G = 2200, soft = 22) {
  let ax = 0;
  let ay = 0;
  for (const w of wells) {
    const dx = w.x - x;
    const dy = w.y - y;
    const r2 = dx * dx + dy * dy + soft * soft;
    const r = Math.sqrt(r2);
    const a = (G * w.m) / r2;
    ax += (a * dx) / r;
    ay += (a * dy) / r;
  }
  return { ax, ay };
}

/** Semi-implicit Euler step; returns the next body state. */
export function step(body, wells, dt, G, soft) {
  const { ax, ay } = gravityAccel(body.x, body.y, wells, G, soft);
  const vx = body.vx + ax * dt;
  const vy = body.vy + ay * dt;
  return { x: body.x + vx * dt, y: body.y + vy * dt, vx, vy };
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/** True if (x,y) is within any body's radius (+pad). */
export function hitsAny(x, y, bodies, pad = 0) {
  return bodies.some((b) => dist(x, y, b.x, b.y) <= b.r + pad);
}

/** True if the ball reached the goal ring center within `tolerance`. */
export function reached(x, y, goal, tolerance) {
  return dist(x, y, goal.x, goal.y) <= tolerance;
}

export const MAX_DRAG = 160;

/** Clamps drag vector (dx, dy) to max length while preserving direction. */
export function clampDrag(dx, dy, max = MAX_DRAG) {
  const drag = Math.hypot(dx, dy);
  if (drag === 0) {
    return { dx: 0, dy: 0, len: 0, drag: 0 };
  }
  const len = Math.min(drag, max);
  const ratio = len / drag;
  return { dx: dx * ratio, dy: dy * ratio, len, drag };
}
