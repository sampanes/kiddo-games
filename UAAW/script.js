// --- asset paths ---
const STAGE_SRC = "assets/stage.png";
const TRUCK_SRC = "assets/truck.png";
const MONSTER_SRC = "assets/monster.png";

// --- canvas ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- tune here ---
const TRUCK_SCALE = 0.10;  // smaller = smaller truck
const TRUCK_SPEED = 5;     // px/frame
const ROTATE_LERP = 0.30;  // rotation smoothing (0..1)
const HILL_OFFSET_X = 42;    // shift curve left/right (+ right, - left)
const HILL_OFFSET_Y = 59;    // shift curve up/down (+ down, - up)
const HILL_BASE = canvas.height * 0.6;
const HILL_HEIGHT = canvas.height * 0.5;
const HILL_EXPONENT = 1.25;

// descent target (rough cave center) and auto-drive speed
const CAVE_X = canvas.width * 0.50;             // tweak to match cave art
const CAVE_Y = HILL_BASE + 110 + HILL_OFFSET_Y;  // tweak to match cave mouth
const DESCENT_PARAM_SPEED = 0.007;               // bezier t increment base

// Ramp down into the cave (world x is axle center)
const RAMP_START_AXLE = canvas.width - 10;     // where ramp begins (rightmost)
const RAMP_END_AXLE = canvas.width - 220;    // ramp length to the left
const CAVE_FLOOR_Y = CAVE_Y;                // target ground inside cave

// monster in cave
const MONSTER_SCALE = 0.13; // ~15%
const MONSTER_OFFSET_X = 0;    // small positional nudge
const MONSTER_OFFSET_Y = 10;

// --- images ---
const stageImg = new Image();
const truckImg = new Image();
const monsterImg = new Image();
stageImg.src = STAGE_SRC;
truckImg.src = TRUCK_SRC;
monsterImg.src = MONSTER_SRC;

// --- state ---
let truck = {
  x: 110, y: 0, w: 0, h: 0,
  angle: 0,
  dir: 1,                 // +1 face right, -1 face left
  speed: TRUCK_SPEED
};

let monster = { w: 0, h: 0, x: 0, y: 0 };

const keys = { left: false, right: false };
addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Touch controls -> toggle same keys flags
function bindHoldButton(id, downFn, upFn) {
  const el = document.getElementById(id);
  if (!el) return;
  const down = e => { e.preventDefault(); downFn(); };
  const up   = e => { e.preventDefault(); upFn();   };

  // pointer events handle mouse + touch nicely
  el.addEventListener('pointerdown', down, { passive: false });
  el.addEventListener('pointerup',   up,   { passive: false });
  el.addEventListener('pointerleave',up,   { passive: false });
  el.addEventListener('pointercancel',up,  { passive: false });
}

bindHoldButton('btnLeft',
  () => { keys.left  = true; },
  () => { keys.left  = false; }
);
bindHoldButton('btnRight',
  () => { keys.right = true; },
  () => { keys.right = false; }
);

// prevent the page from scrolling while touching the canvas/controls
['touchstart','touchmove','wheel'].forEach(ev =>
  document.addEventListener(ev, e => {
    const t = e.target;
    if (t.id === 'gameCanvas' || t.closest?.('#touchControls')) {
      e.preventDefault();
    }
  }, { passive: false })
);

// Returns { y, angle } for the ground under a given axleX
function groundAt(axleX) {
  // Outside ramp zone -> use the hill
  if (axleX < RAMP_END_AXLE || axleX > RAMP_START_AXLE) {
    const y = hillY(axleX);
    const ang = slopeAngleAt(axleX);
    return { y, angle: ang };
  }

  // In ramp zone: blend from hill at start -> cave floor at end (moving left)
  const tRaw = (RAMP_START_AXLE - axleX) / (RAMP_START_AXLE - RAMP_END_AXLE); // 0..1
  const t = smoothstep(tRaw);

  const yStart = hillY(RAMP_START_AXLE);
  const yEnd = CAVE_FLOOR_Y;
  const y = yStart * (1 - t) + yEnd * t;

  // Slope along the ramp (down-left): angle goes from hill angle to ~horizontal
  // Make ramp angle mildly downward; tweak -0.35 for steeper look
  const angStart = slopeAngleAt(RAMP_START_AXLE);
  const angEnd = -0.35;
  const angle = angStart + (angEnd - angStart) * t;

  return { y, angle };
}

// hill height at given x, factoring in offsets
function hillY(x) {
  const w = canvas.width;
  const t = Math.min(1, Math.max(0, (x - HILL_OFFSET_X) / w));
  const s = Math.sin(Math.PI * t);
  const shaped = Math.pow(s, HILL_EXPONENT);
  return HILL_BASE - HILL_HEIGHT * shaped + HILL_OFFSET_Y;
}

// slope angle for rotation
function slopeAngleAt(x) {
  const dx = 2;
  const y1 = hillY(x - dx);
  const y2 = hillY(x + dx);
  return Math.atan2(y2 - y1, 2 * dx);
}

// Smoothstep (nicer than linear)
function smoothstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

// Smallest-angle step toward target (prevents whip flips)
function stepAngle(curr, target, lerp) {
  let d = target - curr;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return curr + d * lerp;
}

// ---- quadratic Bézier helpers for the descent-to-cave ----
function qbez(p0, p1, p2, t) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
  };
}
function qbezAngle(p0, p1, p2, t) {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return Math.atan2(dy, dx);
}

// ---- path segments ----
// seg0: hill; seg1: quadratic Bézier into cave
const path = { seg0: { xMax: 0 }, seg1: { p0: null, p1: null, p2: null } };
let segIndex = 0;   // 0 = hill, 1 = descent
let t1 = 0;         // Bézier parameter

function initPath() {
  path.seg0.xMax = canvas.width - truck.w; // max truck.x (image-left)

  // start of descent at the far right axle position on the hill
  const startX = path.seg0.xMax + truck.w * 0.5; // axle center
  const startY = hillY(startX);

  // control point to curve down-left
  const ctrl = { x: startX - 120, y: startY + 120 };

  // end point near cave center
  const end = { x: CAVE_X, y: CAVE_Y };

  path.seg1.p0 = { x: startX, y: startY };
  path.seg1.p1 = ctrl;
  path.seg1.p2 = end;
}

let loaded = 0;
function onLoaded() {
  if (++loaded < 3) return; // stage, truck, monster

  // truck sizing
  truck.w = truckImg.width * TRUCK_SCALE;
  truck.h = truckImg.height * TRUCK_SCALE;
  truck.y = hillY(truck.x + truck.w * 0.5) - truck.h + 6;

  // monster sizing & placement in cave
  monster.w = monsterImg.width * MONSTER_SCALE;
  monster.h = monsterImg.height * MONSTER_SCALE;
  monster.x = CAVE_X - monster.w / 2 + MONSTER_OFFSET_X;
  monster.y = CAVE_Y - monster.h * 0.85 + MONSTER_OFFSET_Y;

  initPath();
  requestAnimationFrame(loop);
}
stageImg.onload = onLoaded;
truckImg.onload = onLoaded;
monsterImg.onload = onLoaded;

function loop() {
  // --- movement (manual control always on) ---
  let vx = 0;
  if (keys.left) vx -= truck.speed;
  if (keys.right) vx += truck.speed;

  // update position & clamp image-left x
  truck.x += vx;
  truck.x = Math.max(0, Math.min(canvas.width - truck.w, truck.x));

  // facing follows *current* movement (keep last when stopped)
  if (vx > 0.01) truck.facing = 1;
  else if (vx < -0.01) truck.facing = -1;

  // compute axle world x then get ground
  const axleX = truck.x + truck.w * 0.5;
  const g = groundAt(axleX);

  // place truck on ground (tiny gap)
  truck.y = g.y - truck.h + 6;

  // rotate toward ground tangent using shortest-angle step
  truck.angle = stepAngle(truck.angle, g.angle, ROTATE_LERP);

  // --- draw ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(stageImg, 0, 0, canvas.width, canvas.height);

  // monster first, so it sits inside cave behind truck
  if (monster.w) ctx.drawImage(monsterImg, monster.x, monster.y, monster.w, monster.h);

  // draw truck with facing via horizontal flip
  ctx.save();
  const pivotX = truck.x + truck.w * 0.45;
  const pivotY = truck.y + truck.h * 0.78;
  ctx.translate(pivotX, pivotY);
  ctx.rotate(truck.angle);
  ctx.scale(truck.facing, 1); // face left/right
  ctx.drawImage(
    truckImg,
    -truck.w * 0.45 * truck.facing,
    -truck.h * 0.78,
    truck.w, truck.h
  );
  ctx.restore();

  requestAnimationFrame(loop);
}
