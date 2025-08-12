// --- asset paths ---
const STAGE_SRC = "assets/stage.png";
const TRUCK_SRC = "assets/truck.png";

// --- canvas ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- tune here ---
const TRUCK_SCALE = 0.10;     // smaller = smaller truck
const TRUCK_SPEED = 5;      // px/frame
const ROTATE_LERP = 0.5;     // rotation smoothing (0..1)
const HILL_OFFSET_X = 42;    // shift curve left/right (+ right, - left)
const HILL_OFFSET_Y = 59;      // shift curve up/down (+ down, - up)
const HILL_BASE = canvas.height * 0.6;
const HILL_HEIGHT = canvas.height * 0.5;
const HILL_EXPONENT = 1.25;

// --- images ---
const stageImg = new Image();
const truckImg = new Image();
stageImg.src = STAGE_SRC;
truckImg.src  = TRUCK_SRC;

// --- state ---
let truck = {
  x: 110, y: 0, w: 0, h: 0,
  angle: 0,
  speed: TRUCK_SPEED
};

const keys = { left: false, right: false };
addEventListener("keydown", e => {
  if (e.key === "ArrowLeft"  || e.key === "a") keys.left  = true;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
});
addEventListener("keyup", e => {
  if (e.key === "ArrowLeft"  || e.key === "a") keys.left  = false;
  if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
});

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

let loaded = 0;
function onLoaded() {
  if (++loaded < 2) return;
  truck.w = truckImg.width  * TRUCK_SCALE;
  truck.h = truckImg.height * TRUCK_SCALE;
  truck.y = hillY(truck.x + truck.w * 0.5) - truck.h + 6;
  requestAnimationFrame(loop);
}
stageImg.onload = onLoaded;
truckImg.onload = onLoaded;

function loop() {
  if (keys.left)  truck.x -= truck.speed;
  if (keys.right) truck.x += truck.speed;
  truck.x = Math.max(0, Math.min(canvas.width - truck.w, truck.x));

  const axleX = truck.x + truck.w * 0.5;
  truck.y = hillY(axleX) - truck.h + 6;
  const targetAngle = slopeAngleAt(axleX);
  truck.angle += (targetAngle - truck.angle) * ROTATE_LERP;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(stageImg, 0, 0, canvas.width, canvas.height);

  ctx.save();
  const pivotX = truck.x + truck.w * 0.45;
  const pivotY = truck.y + truck.h * 0.78;
  ctx.translate(pivotX, pivotY);
  ctx.rotate(truck.angle);
  ctx.drawImage(
    truckImg,
    -truck.w * 0.45,
    -truck.h * 0.78,
    truck.w, truck.h
  );
  ctx.restore();

  requestAnimationFrame(loop);
}
