import { describe, expect, test } from "bun:test";
import { advance, FIXED_DT_MS, DT } from "../sim.js";
import { levels } from "../levels.js";

describe("Simulation frame rate independence and fixed timestep", () => {
  test("ball reaches same position at 60 FPS (16.7ms frames) and 144 FPS (6.9ms frames) after 1s", () => {
    const initialBall = { x: 90, y: 200, vx: 5, vy: 1 };
    const level = levels[0];

    let state60 = {
      ball: { ...initialBall },
      trail: [],
      state: "flying",
      level,
      accumulator: 0,
    };

    let state144 = {
      ball: { ...initialBall },
      trail: [],
      state: "flying",
      level,
      accumulator: 0,
    };

    // Simulate 1 second (1000 ms) with 16.7ms frames (~60 FPS)
    let elapsed60 = 0;
    const frame60 = 16.7;
    while (elapsed60 < 1000) {
      const dt = Math.min(frame60, 1000 - elapsed60);
      state60 = advance(state60, dt);
      elapsed60 += dt;
    }

    // Simulate 1 second (1000 ms) with 6.9ms frames (~144 FPS)
    let elapsed144 = 0;
    const frame144 = 6.9;
    while (elapsed144 < 1000) {
      const dt = Math.min(frame144, 1000 - elapsed144);
      state144 = advance(state144, dt);
      elapsed144 += dt;
    }

    // Distance between final ball positions
    const dx = state60.ball.x - state144.ball.x;
    const dy = state60.ball.y - state144.ball.y;
    const posDifference = Math.hypot(dx, dy);

    // Distance moved in 1 step at final velocity (1 step distance)
    const stepDistance60 = Math.hypot(state60.ball.vx, state60.ball.vy) * DT;
    const stepDistance144 = Math.hypot(state144.ball.vx, state144.ball.vy) * DT;
    const maxStepDistance = Math.max(stepDistance60, stepDistance144);

    expect(posDifference).toBeLessThan(maxStepDistance);
  });

  test("background tab for 10s consumes at most 100ms of simulation time in one frame", () => {
    const level = levels[0];
    const initialState = {
      ball: { x: 90, y: 200, vx: 5, vy: 1 },
      trail: [],
      state: "flying",
      level,
      accumulator: 0,
    };

    // Simulate a 10-second gap (10,000 ms)
    const updatedState = advance(initialState, 10000);

    // At 100ms max allowed simulation time:
    // Number of steps in 100ms = Math.floor(100 / FIXED_DT_MS)
    const maxExpectedSteps = Math.floor(100 / FIXED_DT_MS);

    // Verify steps executed (reflected in trail length)
    expect(updatedState.trail.length).toBeLessThanOrEqual(maxExpectedSteps);
    expect(updatedState.accumulator).toBeLessThan(FIXED_DT_MS);
  });
});
