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

// MAPS Object with all the neat data
const TRUCK_SRC = "assets/truck.png"; // Same Truck
const MAPS = {
  defaultHill: {
    stageSrc: "assets/stage.png",
    monsterSrc: "assets/monster.png",
    path: [
      { x: 12.0, y: 321.9 },
      { x: 14.4, y: 321.7 },
      { x: 17.3, y: 321.6 },
      { x: 20.6, y: 321.5 },
      { x: 24.4, y: 321.4 },
      { x: 28.6, y: 321.1 },
      { x: 33.2, y: 320.8 },
      { x: 38.3, y: 320.3 },
      { x: 43.7, y: 319.5 },
      { x: 49.6, y: 318.5 },
      { x: 55.9, y: 317.2 },
      { x: 62.9, y: 315.5 },
      { x: 70.8, y: 313.7 },
      { x: 79.4, y: 311.6 },
      { x: 88.5, y: 309.3 },
      { x: 97.8, y: 306.8 },
      { x: 107.2, y: 304.2 },
      { x: 116.5, y: 301.3 },
      { x: 125.4, y: 298.2 },
      { x: 133.8, y: 295.0 },
      { x: 141.3, y: 291.6 },
      { x: 147.7, y: 288.3 },
      { x: 152.8, y: 285.1 },
      { x: 157.0, y: 281.9 },
      { x: 160.9, y: 278.5 },
      { x: 164.7, y: 274.9 },
      { x: 168.9, y: 270.9 },
      { x: 174.0, y: 266.3 },
      { x: 180.2, y: 261.0 },
      { x: 188.1, y: 254.9 },
      { x: 198.0, y: 247.7 },
      { x: 210.6, y: 239.1 },
      { x: 226.0, y: 228.8 },
      { x: 243.4, y: 217.3 },
      { x: 262.0, y: 205.0 },
      { x: 281.3, y: 192.3 },
      { x: 300.5, y: 179.7 },
      { x: 319.0, y: 167.6 },
      { x: 335.9, y: 156.4 },
      { x: 350.6, y: 146.5 },
      { x: 362.5, y: 138.4 },
      { x: 371.5, y: 132.0 },
      { x: 378.4, y: 126.8 },
      { x: 383.6, y: 122.6 },
      { x: 387.5, y: 119.2 },
      { x: 390.3, y: 116.5 },
      { x: 392.4, y: 114.2 },
      { x: 394.3, y: 112.3 },
      { x: 396.2, y: 110.5 },
      { x: 398.5, y: 108.6 },
      { x: 401.6, y: 106.5 },
      { x: 405.1, y: 104.3 },
      { x: 408.5, y: 102.3 },
      { x: 411.8, y: 100.5 },
      { x: 415.1, y: 98.8 },
      { x: 418.3, y: 97.4 },
      { x: 421.4, y: 96.1 },
      { x: 424.6, y: 95.0 },
      { x: 427.8, y: 94.1 },
      { x: 431.0, y: 93.5 },
      { x: 434.3, y: 93.0 },
      { x: 437.6, y: 92.6 },
      { x: 440.8, y: 92.3 },
      { x: 443.8, y: 92.1 },
      { x: 446.9, y: 92.1 },
      { x: 450.0, y: 92.4 },
      { x: 453.3, y: 92.9 },
      { x: 456.7, y: 93.7 },
      { x: 460.4, y: 94.9 },
      { x: 464.3, y: 96.5 },
      { x: 468.7, y: 98.5 },
      { x: 473.4, y: 101.3 },
      { x: 478.6, y: 104.8 },
      { x: 484.2, y: 108.8 },
      { x: 490.0, y: 113.3 },
      { x: 496.0, y: 118.0 },
      { x: 502.0, y: 122.8 },
      { x: 507.9, y: 127.4 },
      { x: 513.7, y: 131.9 },
      { x: 519.3, y: 135.8 },
      { x: 524.6, y: 139.2 },
      { x: 529.6, y: 142.1 },
      { x: 534.5, y: 144.5 },
      { x: 539.4, y: 146.7 },
      { x: 544.2, y: 148.7 },
      { x: 548.8, y: 150.4 },
      { x: 553.3, y: 152.1 },
      { x: 557.6, y: 153.8 },
      { x: 561.7, y: 155.5 },
      { x: 565.6, y: 157.2 },
      { x: 569.3, y: 159.2 },
      { x: 572.4, y: 161.0 },
      { x: 575.0, y: 162.4 },
      { x: 577.1, y: 163.6 },
      { x: 578.9, y: 164.8 },
      { x: 580.7, y: 166.1 },
      { x: 582.6, y: 167.7 },
      { x: 584.8, y: 169.7 },
      { x: 587.5, y: 172.3 },
      { x: 590.7, y: 175.6 },
      { x: 594.8, y: 179.9 },
      { x: 599.9, y: 185.4 },
      { x: 605.8, y: 192.2 },
      { x: 612.5, y: 199.9 },
      { x: 619.6, y: 208.3 },
      { x: 627.0, y: 217.0 },
      { x: 634.4, y: 225.7 },
      { x: 641.7, y: 234.2 },
      { x: 648.5, y: 242.1 },
      { x: 654.8, y: 249.1 },
      { x: 660.3, y: 254.9 },
      { x: 664.9, y: 259.6 },
      { x: 668.9, y: 263.6 },
      { x: 672.4, y: 267.0 },
      { x: 675.6, y: 269.8 },
      { x: 678.5, y: 272.2 },
      { x: 681.4, y: 274.4 },
      { x: 684.3, y: 276.4 },
      { x: 687.4, y: 278.4 },
      { x: 690.8, y: 280.5 },
      { x: 694.6, y: 282.8 },
      { x: 698.8, y: 285.3 },
      { x: 703.2, y: 287.7 },
      { x: 707.8, y: 290.0 },
      { x: 712.5, y: 292.2 },
      { x: 717.3, y: 294.4 },
      { x: 722.2, y: 296.5 },
      { x: 727.2, y: 298.6 },
      { x: 732.3, y: 300.6 },
      { x: 737.4, y: 302.5 },
      { x: 742.5, y: 304.4 },
      { x: 748.1, y: 306.2 },
      { x: 754.3, y: 307.9 },
      { x: 760.9, y: 309.6 },
      { x: 767.6, y: 311.2 },
      { x: 774.3, y: 312.7 },
      { x: 780.6, y: 314.2 },
      { x: 786.4, y: 315.6 },
      { x: 791.3, y: 317.0 },
      { x: 795.1, y: 318.3 },
      { x: 797.6, y: 319.5 },
      { x: 799.4, y: 320.1 },
      { x: 801.1, y: 319.7 },
      { x: 802.5, y: 318.7 },
      { x: 803.2, y: 317.5 },
      { x: 802.9, y: 316.6 },
      { x: 801.5, y: 316.2 },
      { x: 798.5, y: 316.9 },
      { x: 793.7, y: 319.0 },
      { x: 786.9, y: 322.9 },
      { x: 777.6, y: 329.1 },
      { x: 764.9, y: 338.4 },
      { x: 748.4, y: 350.7 },
      { x: 728.9, y: 365.3 },
      { x: 707.4, y: 381.4 },
      { x: 684.9, y: 398.4 },
      { x: 662.1, y: 415.4 },
      { x: 640.1, y: 431.7 },
      { x: 619.8, y: 446.5 },
      { x: 602.0, y: 459.1 },
      { x: 587.6, y: 468.7 },
      { x: 576.6, y: 475.5 },
      { x: 568.0, y: 480.3 },
      { x: 561.2, y: 483.3 },
      { x: 556.0, y: 485.1 },
      { x: 551.7, y: 485.8 },
      { x: 548.2, y: 485.9 },
      { x: 544.8, y: 485.8 },
      { x: 541.2, y: 485.7 },
      { x: 537.0, y: 486.0 },
      { x: 531.7, y: 487.1 },
      { x: 525.8, y: 488.6 },
      { x: 519.8, y: 489.9 },
      { x: 513.9, y: 491.1 },
      { x: 507.8, y: 492.2 },
      { x: 501.7, y: 493.3 },
      { x: 495.4, y: 494.4 },
      { x: 489.0, y: 495.7 },
      { x: 482.5, y: 497.1 },
      { x: 475.7, y: 498.7 },
      { x: 468.7, y: 500.7 },
      { x: 461.0, y: 503.0 },
      { x: 452.5, y: 505.8 },
      { x: 443.4, y: 508.9 },
      { x: 434.1, y: 512.1 },
      { x: 424.8, y: 515.5 },
      { x: 415.8, y: 518.7 },
      { x: 407.4, y: 521.8 },
      { x: 399.9, y: 524.6 },
      { x: 393.6, y: 526.9 },
      { x: 388.8, y: 528.6 }
    ],
    truckScale: 0.10,
    monsterScale: 0.13,
    monsterPos: { x: CAVE_X, y: CAVE_Y, ox: 0, oy: 10 }
  },
  desertDune: {
    stageSrc: "assets/desert_stage.png",
    monsterSrc: null,
    path: [],       // get a path array by opening this image in tools/recorder.html
    truckScale: 0.12
  }
};

// --- runtime-selectable map state ---
let currentMap = null;
let currentPath = null;
let TRUCK_SCALE_CURRENT = TRUCK_SCALE;
let MONSTER_SCALE_CURRENT = MONSTER_SCALE;

// --- images ---
const stageImg = new Image();
const truckImg = new Image();
const monsterImg = new Image();
let loaded = 0;
let expectedLoads = 0;
let started = false;

stageImg.onload = onLoaded;
truckImg.onload = onLoaded;
monsterImg.onload = onLoaded;

// set truck src once (shared across maps), then load the map
truckImg.src = TRUCK_SRC;

// --- state ---
let truck = {
  x: 110, y: 0, w: 0, h: 0,
  angle: 0,
  dir: 1,                 // +1 face right, -1 face left
  speed: TRUCK_SPEED
};

let monster = { w: 0, h: 0, x: 0, y: 0 };

// progress along PATH (0..1). Persist between frames.
let s = 0;
const S_STEP = 0.0025;   // how fast s moves per frame (tweak)
let facing = 1; // +1 right, -1 left, persists when stopped

loadMap(MAPS.defaultHill);

const keys = { left: false, right: false };
addEventListener("keydown", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
addEventListener("keyup", e => {
  if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

// Arc-length-ish sampler over a polyline
function samplePath(PATH, s) {
  s = Math.max(0, Math.min(1, s));
  // precompute segment lengths once
  if (!PATH._len) {
    let L = [0], acc = 0;
    for (let i = 1; i < PATH.length; i++) {
      acc += Math.hypot(PATH[i].x - PATH[i - 1].x, PATH[i].y - PATH[i - 1].y);
      L.push(acc);
    }
    PATH._len = L; PATH._total = acc || 1;
  }
  const target = s * PATH._total;
  // find segment
  let i = PATH._len.findIndex(d => d >= target);
  if (i <= 0) i = 1;
  const L0 = PATH._len[i - 1], L1 = PATH._len[i];
  const p0 = PATH[i - 1], p1 = PATH[i];
  const t = (target - L0) / Math.max(1e-6, L1 - L0);
  const x = p0.x + t * (p1.x - p0.x);
  const y = p0.y + t * (p1.y - p0.y);
  const dx = (p1.x - p0.x), dy = (p1.y - p0.y);
  const angle = Math.atan2(dy, dx);
  return { x, y, dx, dy, angle };
}

// Touch controls -> toggle same keys flags
function bindHoldButton(id, downFn, upFn) {
  const el = document.getElementById(id);
  if (!el) return;
  const down = e => { e.preventDefault(); downFn(); };
  const up = e => { e.preventDefault(); upFn(); };

  // pointer events handle mouse + touch nicely
  el.addEventListener('pointerdown', down, { passive: false });
  el.addEventListener('pointerup', up, { passive: false });
  el.addEventListener('pointerleave', up, { passive: false });
  el.addEventListener('pointercancel', up, { passive: false });
}

bindHoldButton('btnLeft',
  () => { keys.left = true; },
  () => { keys.left = false; }
);
bindHoldButton('btnRight',
  () => { keys.right = true; },
  () => { keys.right = false; }
);

// prevent the page from scrolling while touching the canvas/controls
['touchstart', 'touchmove', 'wheel'].forEach(ev =>
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

function loadMap(def) {
  currentMap = def;

  // per-map config
  TRUCK_SCALE_CURRENT = def.truckScale ?? TRUCK_SCALE;
  MONSTER_SCALE_CURRENT = def.monsterScale ?? MONSTER_SCALE;
  currentPath = def.path;
  if (currentPath) { delete currentPath._len; delete currentPath._total; }

  // reset loader gate for this map:
  loaded = 0;
  expectedLoads = 1 /* truck */ + 1 /* stage */ + (def.monsterSrc ? 1 : 0);

  // set sources ONCE (onload handlers are already attached globally)
  stageImg.src = def.stageSrc;
  monsterImg.src = def.monsterSrc || "";

  // reset motion/orientation
  s = 0;
  facing = 1;
  truck.angle = 0;
}

function onLoaded() {
  if (++loaded < expectedLoads) return;

  // Sizing now that images are guaranteed loaded
  truck.w = truckImg.width * TRUCK_SCALE_CURRENT;
  truck.h = truckImg.height * TRUCK_SCALE_CURRENT;

  monster.w = monsterImg.naturalWidth ? monsterImg.width * MONSTER_SCALE_CURRENT : 0;
  monster.h = monsterImg.naturalWidth ? monsterImg.height * MONSTER_SCALE_CURRENT : 0;

  if (currentMap?.monsterPos && monster.w) {
    const mp = currentMap.monsterPos;
    monster.x = mp.x - monster.w / 2 + (mp.ox ?? 0);
    monster.y = mp.y - monster.h * 0.85 + (mp.oy ?? 0);
  }

  // first frame starts the loop exactly once
  if (!started) {
    started = true;
    requestAnimationFrame(loop);
  }
}

function loop() {
  // --- movement along PATH ---
  if (keys.right) s += S_STEP;
  if (keys.left) s -= S_STEP;

  // remember last intended facing from input
  if (keys.right && !keys.left) facing = 1;
  else if (keys.left && !keys.right) facing = -1;

  // clamp or loop progress
  s = Math.max(0, Math.min(1, s));
  // s = (s % 1 + 1) % 1; // use this instead to wrap around

  // get pose from PATH
  const pose = samplePath(currentPath, s);

  // place truck so axle sits on the path
  truck.x = pose.x - truck.w * 0.5;
  truck.y = pose.y - truck.h + 6;

  // rotate toward tangent; mirror when facing left
  const tangent = pose.angle;
  const targetDrawAngle = (facing === 1) ? tangent : -tangent;
  truck.angle = stepAngle(truck.angle, targetDrawAngle, ROTATE_LERP);

  // --- draw ---
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background first
  if (stageImg.complete && stageImg.naturalWidth) {
    ctx.drawImage(stageImg, 0, 0, canvas.width, canvas.height);
  }

  // monster behind truck
  if (monsterImg.complete && monsterImg.naturalWidth && monster.w) {
    ctx.drawImage(monsterImg, monster.x, monster.y, monster.w, monster.h);
  }

  // truck (flip, then rotate, then draw)
  ctx.save();
  const pivotX = truck.x + truck.w * 0.45;
  const pivotY = truck.y + truck.h * 0.78;
  ctx.translate(pivotX, pivotY);
  ctx.scale(facing, 1);       // horizontal flip only
  ctx.rotate(truck.angle);
  ctx.drawImage(
    truckImg,
    -truck.w * 0.45,          // NOTE: not multiplied by 'facing'
    -truck.h * 0.78,
    truck.w, truck.h
  );
  ctx.restore();

  requestAnimationFrame(loop);
}
