import { test, expect } from "bun:test";
import { gravityAccel, step, dist, hitsAny, reached, clampDrag, MAX_DRAG, evaluate, MAX_STEPS } from "../physics.js";

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

test("clampDrag handles drag zero", () => {
  const res = clampDrag(0, 0, 160);
  expect(res).toEqual({ dx: 0, dy: 0, len: 0, drag: 0 });
});

test("clampDrag preserves vector when within max", () => {
  const res = clampDrag(60, 80, 160); // hypot = 100
  expect(res.drag).toBe(100);
  expect(res.len).toBe(100);
  expect(res.dx).toBeCloseTo(60);
  expect(res.dy).toBeCloseTo(80);
});

test("clampDrag limits vector length to max and preserves direction", () => {
  const res = clampDrag(180, 240, 160); // hypot = 300
  expect(res.drag).toBe(300);
  expect(res.len).toBe(160);
  expect(res.dx).toBeCloseTo(96); // 180 * (160/300) = 96
  expect(res.dy).toBeCloseTo(128); // 240 * (160/300) = 128
  expect(Math.atan2(res.dy, res.dx)).toBeCloseTo(Math.atan2(240, 180));
});

test("clampDrag uses MAX_DRAG by default", () => {
  expect(MAX_DRAG).toBe(160);
  const res = clampDrag(300, 0);
  expect(res.len).toBe(160);
  expect(res.dx).toBeCloseTo(160);
  expect(res.dy).toBeCloseTo(0);
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
  // ax is directed towards well (positive x). magnitude is ax.
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
