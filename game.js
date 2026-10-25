import { step, hitsAny, reached, launchVelocity } from "./physics.js";
import { levels } from "./levels.js";

const W = 800;
const H = 520;
const G = 2200;
const SOFT = 22;
const DT = 0.18;
const BALL_R = 6;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const msg = document.getElementById("msg");

let levelIdx = 0;
let ball = null; // {x,y,vx,vy} while flying, else null
let trail = [];
let aiming = false;
let aimFrom = null;
let aimTo = null;
let attempts = 0;
let state = "aim"; // aim | flying | win | lose

function level() {
  return levels[levelIdx];
}

function reset(full) {
  ball = null;
  trail = [];
  aiming = false;
  aimTo = null;
  state = "aim";
  if (full) attempts = 0;
  render();
}

function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

canvas.addEventListener("pointerdown", (e) => {
  if (state !== "aim") return;
  canvas.setPointerCapture(e.pointerId);
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
  const vel = launchVelocity(aimFrom, aimTo, 160, 5.5);
  aiming = false;
  if (!vel) {
    aimTo = null;
    render();
    return;
  }
  ball = { x: aimFrom.x, y: aimFrom.y, vx: vel.vx, vy: vel.vy };
  trail = [];
  attempts++;
  state = "flying";
});
window.addEventListener("pointercancel", () => {
  if (!aiming) return;
  aiming = false;
  aimTo = null;
  render();
});

document.getElementById("retry").addEventListener("click", () => reset(false));

function advance() {
  levelIdx = (levelIdx + 1) % levels.length;
  reset(true);
}
document.getElementById("next").addEventListener("click", advance);

function tick() {
  if (state === "flying" && ball) {
    for (let i = 0; i < 3; i++) {
      ball = step(ball, level().wells, DT, G, SOFT);
      trail.push({ x: ball.x, y: ball.y });
      if (trail.length > 400) trail.shift();

      if (reached(ball.x, ball.y, level().goal, level().goal.r)) {
        state = "win";
        break;
      }
      if (hitsAny(ball.x, ball.y, level().wells, BALL_R) || ball.x < -40 || ball.x > W + 40 || ball.y < -40 || ball.y > H + 40) {
        state = "lose";
        break;
      }
    }
  }
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
