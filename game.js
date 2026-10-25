import { advance, W, H, BALL_R } from "./sim.js";
import { levels } from "./levels.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const msg = document.getElementById("msg");

let levelIdx = 0;
let aiming = false;
let aimFrom = null;
let aimTo = null;
let attempts = 0;
let lastTime = null;

let simState = {
  ball: null,
  trail: [],
  state: "aim",
  level: levels[0],
  accumulator: 0,
};

function level() {
  return levels[levelIdx];
}

function reset(full) {
  simState = {
    ball: null,
    trail: [],
    state: "aim",
    level: level(),
    accumulator: 0,
  };
  aiming = false;
  aimTo = null;
  lastTime = null;
  if (full) attempts = 0;
  render();
}

function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

canvas.addEventListener("pointerdown", (e) => {
  if (simState.state !== "aim") return;
  aiming = true;
  aimFrom = level().start;
  aimTo = toLogical(e);
  render();
});

canvas.addEventListener("pointermove", (e) => {
  if (!aiming) return;
  aimTo = toLogical(e);
  render();
});

window.addEventListener("pointerup", () => {
  if (!aiming) return;
  aiming = false;
  // Launch opposite the drag (slingshot), power ∝ drag length.
  const dx = aimFrom.x - aimTo.x;
  const dy = aimFrom.y - aimTo.y;
  const power = Math.min(Math.hypot(dx, dy), 160) / 160;
  const speed = 5.5 * power;
  const ang = Math.atan2(dy, dx);
  simState = {
    ball: { x: aimFrom.x, y: aimFrom.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed },
    trail: [],
    state: "flying",
    level: level(),
    accumulator: 0,
  };
  lastTime = null;
  attempts++;
});

document.getElementById("retry").addEventListener("click", () => reset(false));

function nextLevel() {
  levelIdx = (levelIdx + 1) % levels.length;
  reset(true);
}
document.getElementById("next").addEventListener("click", nextLevel);

function tick(now) {
  if (lastTime !== null) {
    const elapsedMs = now - lastTime;
    simState.level = level();
    simState = advance(simState, elapsedMs);
  }
  lastTime = now;
  render();
  requestAnimationFrame(tick);
}

function circle(x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function render() {
  const lv = level();
  const { ball, trail, state } = simState;

  ctx.clearRect(0, 0, W, H);
  // starfield backdrop
  ctx.fillStyle = "#0b0f17";
  ctx.fillRect(0, 0, W, H);

  // goal ring
  ctx.beginPath();
  ctx.arc(lv.goal.x, lv.goal.y, lv.goal.r, 0, Math.PI * 2);
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  ctx.stroke();
  circle(lv.goal.x, lv.goal.y, 4, "#22c55e");

  // gravity wells
  for (const w of lv.wells) {
    const g = ctx.createRadialGradient(w.x, w.y, 2, w.x, w.y, w.r);
    g.addColorStop(0, "#60a5fa");
    g.addColorStop(1, "#1e3a8a");
    circle(w.x, w.y, w.r, g);
  }

  // trail
  ctx.beginPath();
  for (let i = 0; i < trail.length; i++) {
    const p = trail[i];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = "rgba(245,158,11,.5)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // start marker + aim line
  circle(lv.start.x, lv.start.y, 5, "#e5e7eb");
  if (aiming && aimTo) {
    ctx.beginPath();
    ctx.moveTo(lv.start.x, lv.start.y);
    ctx.lineTo(lv.start.x + (lv.start.x - aimTo.x), lv.start.y + (lv.start.y - aimTo.y));
    ctx.strokeStyle = "#f59e0b";
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ball
  if (ball) circle(ball.x, ball.y, BALL_R, "#fbbf24");

  hud.textContent = `Fase ${levelIdx + 1}/${levels.length} · ${lv.name} · tentativas: ${attempts}`;
  msg.textContent = state === "win" ? "🎉 Chegou! Próxima fase →" : state === "lose" ? "💥 Perdeu. Tente de novo." : "Arraste a partir do ponto branco e solte (estilingue).";
  msg.className = state === "win" ? "ok" : state === "lose" ? "err" : "";
}

reset(true);
requestAnimationFrame(tick);
