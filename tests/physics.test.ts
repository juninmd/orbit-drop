import { test, expect } from "bun:test";
import { gravityAccel, step, dist, hitsAny, reached, launchVelocity, evaluate, MAX_STEPS } from "../physics.js";

test("gravity pulls toward a well", () => {
  // Well to the right of the point → positive ax, ~zero ay.
  const { ax, ay } = gravityAccel(0, 0, [{ x: 100, y: 0, m: 1 }]);
  expect(ax).toBeGreaterThan(0);
  expect(Math.abs(ay)).toBeLessThan(1e-9);
});

test("symmetric wells cancel horizontally", () => {
  const wells = [
    { x: -100, y: 0, m: 1 },
    { x: 100, y: 0, m: 1 },
  ];
  const { ax } = gravityAccel(0, 0, wells);
  expect(Math.abs(ax)).toBeLessThan(1e-9);
});

test("step moves a resting body toward the well", () => {
  const body = { x: 0, y: 0, vx: 0, vy: 0 };
  const next = step(body, [{ x: 100, y: 0, m: 1 }], 0.2, 2200, 22);
  expect(next.x).toBeGreaterThan(0); // drifted right
  expect(next.vx).toBeGreaterThan(0);
});

test("hitsAny detects collision within radius+pad", () => {
  const bodies = [{ x: 50, y: 50, r: 10 }];
  expect(hitsAny(55, 50, bodies, 0)).toBe(true);
  expect(hitsAny(70, 50, bodies, 0)).toBe(false);
  expect(hitsAny(66, 50, bodies, 6)).toBe(true); // pad extends reach
});

test("reached checks goal tolerance", () => {
  expect(reached(10, 10, { x: 12, y: 10 }, 5)).toBe(true);
  expect(reached(10, 10, { x: 40, y: 10 }, 5)).toBe(false);
});

test("dist is euclidean", () => {
  expect(dist(0, 0, 3, 4)).toBe(5);
});

test("launchVelocity returns null for drag of 0 and 11 px", () => {
  const from = { x: 100, y: 100 };
  expect(launchVelocity(from, { x: 100, y: 100 })).toBeNull();
  expect(launchVelocity(from, { x: 111, y: 100 })).toBeNull();
});

test("launchVelocity returns correct vector opposite to drag for 100 and 500 px", () => {
  const from = { x: 100, y: 100 };

  // 100 px drag to the right -> launch vector to the left
  const vel100 = launchVelocity(from, { x: 200, y: 100 });
  expect(vel100).not.toBeNull();
  if (vel100) {
    const mag = Math.hypot(vel100.vx, vel100.vy);
    expect(mag).toBeLessThanOrEqual(5.5);
    expect(mag).toBeCloseTo(5.5 * (100 / 160), 5);
    expect(vel100.vx).toBeLessThan(0); // opposite to drag (+100 in X)
    expect(Math.abs(vel100.vy)).toBeLessThan(1e-9);
  }

  // 500 px drag to the right -> capped at maxSpeed = 5.5
  const vel500 = launchVelocity(from, { x: 600, y: 100 });
  expect(vel500).not.toBeNull();
  if (vel500) {
    const mag = Math.hypot(vel500.vx, vel500.vy);
    expect(mag).toBeCloseTo(5.5, 5);
    expect(vel500.vx).toBeLessThan(0);
    expect(Math.abs(vel500.vy)).toBeLessThan(1e-9);
  }
});

test("orbit circular velocity evaluates to timeout after MAX_STEPS", () => {
  // Single well at (400, 260) with mass m = 1.0, radius 10
  const well = { x: 400, y: 260, r: 10, m: 1.0 };
  const wells = [well];
  const G = 2200;
  const SOFT = 22;
  const DT = 0.18;

  // Position ball at distance R = 200 from well along x-axis
  const R = 200;
  const startX = well.x - R; // 200
  const startY = well.y;     // 260

  // Calculate gravitational acceleration at start position to determine circular speed v = sqrt(a * R)
  const { ax, ay } = gravityAccel(startX, startY, wells, G, SOFT);
  const aMag = Math.hypot(ax, ay);
  const vCirc = Math.sqrt(aMag * R);

  // Tangential velocity perpendicular to radius vector (pointing up, +y direction)
  let ball = {
    x: startX,
    y: startY,
    vx: 0,
    vy: vCirc,
    steps: 0,
  };

  const level = {
    wells,
    goal: { x: 9999, y: 9999, r: 10 }, // goal far away
  };

  const config = { ballR: 6, minX: -1000, maxX: 2000, minY: -1000, maxY: 2000, maxSteps: MAX_STEPS };

  let result = evaluate(ball, level, config);
  expect(result.state).toBe("flying");

  // Step simulation up to MAX_STEPS
  for (let i = 0; i < MAX_STEPS; i++) {
    ball = step(ball, wells, DT, G, SOFT);
    ball.steps = i + 1;
    result = evaluate(ball, level, config);
    if (result.state !== "flying") {
      break;
    }
  }

  expect(ball.steps).toBe(MAX_STEPS);
  expect(result.state).toBe("lose");
  expect(result.loseReason).toBe("timeout");
});
