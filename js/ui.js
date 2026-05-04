import * as THREE from "three";

export const ui = {
  stats: document.getElementById("stats"),
  topStats: document.getElementById("topStats"),
  message: document.getElementById("message"),
  startButton: document.getElementById("startButton"),
  damageFlash: document.getElementById("damageFlash"),
  weaponView: document.getElementById("weaponView"),
  muzzleFlash: document.getElementById("muzzleFlash"),
  radar: document.getElementById("radar"),
};

export function updateHud(game, extra = "") {
  const weapon = game.weapons[game.currentWeapon];
  const ammoText = weapon.ammo >= 0 ? `${weapon.ammo} / ${weapon.reserve}` : "∞";

  ui.stats.innerHTML =
    `HP: ${Math.max(0, Math.floor(game.player.hp))}<br>` +
    `Weapon: ${weapon.name}<br>` +
    `Ammo: ${ammoText}<br>` +
    `Score: ${game.score}` +
    `${extra ? `<br>${extra}` : ""}`;

  ui.topStats.textContent = `Round ${game.round} | Enemies Left: ${game.enemies.length}`;
}

export function showDamageFlash() {
  ui.damageFlash.style.opacity = "1";
  setTimeout(() => {
    ui.damageFlash.style.opacity = "0";
  }, 90);
}

export function showGameOver(game, resetCallback) {
  document.exitPointerLock?.();

  ui.message.style.display = "block";
  ui.message.innerHTML =
    `<h1>Game Over</h1>` +
    `<div>Final Score: ${game.score}<br>Reached Round: ${game.round}</div>` +
    `<button id="restartButton">Restart</button>`;

  document.getElementById("restartButton").addEventListener("click", () => {
    resetCallback();
    ui.message.style.display = "none";
    game.canvas.requestPointerLock();
  });
}

export function drawRadar(game) {
  const radar = ui.radar;
  const ctx = radar.getContext("2d");

  const size = radar.width;
  const center = size / 2;
  const radarRadius = center - 5;
  const scale = 2.2;

  ctx.clearRect(0, 0, size, size);

  // background circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radarRadius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "rgba(20, 24, 28, 0.9)";
  ctx.fillRect(0, 0, size, size);

  // rotate map based on player view
  ctx.translate(center, center);
  ctx.rotate(game.player.yaw);
  ctx.translate(-center, -center);

  // draw map blocks
  ctx.fillStyle = "rgba(180, 180, 180, 0.45)";

  game.obstacles.forEach(box => {
    const dx = box.position.x - game.camera.position.x;
    const dz = box.position.z - game.camera.position.z;

    const w = box.userData.size.w * scale;
    const d = box.userData.size.d * scale;

    const x = center + dx * scale - w / 2;
    const y = center + dz * scale - d / 2;

    ctx.fillRect(x, y, w, d);
  });

  // draw enemies
  ctx.fillStyle = "#ff3b30";

  game.enemies.forEach(enemy => {
    const dx = enemy.mesh.position.x - game.camera.position.x;
    const dz = enemy.mesh.position.z - game.camera.position.z;

    const x = center + dx * scale;
    const y = center + dz * scale;

    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();

  // border
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center, center, radarRadius, 0, Math.PI * 2);
  ctx.stroke();

  // player triangle fixed in center
  ctx.fillStyle = "#42ff75";
  ctx.beginPath();
  ctx.moveTo(center, center - 9);
  ctx.lineTo(center - 6, center + 7);
  ctx.lineTo(center + 6, center + 7);
  ctx.closePath();
  ctx.fill();

  // north / front line
  ctx.strokeStyle = "rgba(66,255,117,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(center, center);
  ctx.lineTo(center, center - 22);
  ctx.stroke();
}
