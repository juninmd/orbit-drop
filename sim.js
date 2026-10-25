import { step, hitsAny, reached } from "./physics.js";

export const FIXED_DT_MS = 1000 / 180;
export const DT = 0.18;
export const G = 2200;
export const SOFT = 22;
export const BALL_R = 6;
export const W = 800;
export const H = 520;

const EPS = 1e-6;

/**
 * Pure simulation advancement function.
 * @param {Object} state - { ball, trail, state/status, level, accumulator }
 * @param {number} elapsedMs - Elapsed time since last frame in milliseconds.
 * @returns {Object} Updated state object.
 */
export function advance(state, elapsedMs) {
  if (!state) return state;
  const currentStatus = state.state || state.status || "aim";
  if (currentStatus !== "flying" || !state.ball) {
    return state;
  }

  // Cap elapsed time to 100ms max to prevent spiral of death / teleportation after tab backgrounding
  const cappedElapsed = Math.min(Math.max(0, elapsedMs), 100);

  let acc = (state.accumulator || 0) + cappedElapsed;
  let ball = state.ball;
  let status = currentStatus;
  const trail = state.trail ? [...state.trail] : [];
  const level = state.level;

  while (acc >= FIXED_DT_MS - EPS && status === "flying" && ball) {
    ball = step(ball, level.wells, DT, G, SOFT);
    trail.push({ x: ball.x, y: ball.y });
    if (trail.length > 400) {
      trail.shift();
    }

    if (reached(ball.x, ball.y, level.goal, level.goal.r)) {
      status = "win";
      acc -= FIXED_DT_MS;
      break;
    }

    if (
      hitsAny(ball.x, ball.y, level.wells, BALL_R) ||
      ball.x < -40 ||
      ball.x > W + 40 ||
      ball.y < -40 ||
      ball.y > H + 40
    ) {
      status = "lose";
      acc -= FIXED_DT_MS;
      break;
    }

    acc -= FIXED_DT_MS;
  }

  // Prevent accumulator from going negative due to EPS
  if (acc < 0) acc = 0;

  return {
    ...state,
    ball,
    trail,
    state: status,
    status,
    accumulator: acc,
  };
}
