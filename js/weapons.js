import { ui, updateHud } from "./ui.js";
import { damageEnemy } from "./enemies.js";
import { playShootAnimation } from "./viewmodel.js";
import * as THREE from "three";

export function createWeapons() {
  return {
    1: {
      name: "Rifle",
      ammo: 30,
      reserve: 90,
      magSize: 30,
      damage: 30,
      fireRate: 0.09,
      auto: true,
      range: 55
    },
    2: {
      name: "Pistol",
      ammo: 12,
      reserve: 48,
      magSize: 12,
      damage: 45,
      fireRate: 0.35,
      auto: false,
      range: 45
    },
    3: {
      name: "Knife",
      ammo: -1,
      reserve: -1,
      magSize: -1,
      damage: 70,
      fireRate: 0.55,
      auto: false,
      range: 2.2
    }
  };
}

export function resetWeapons(game) {
  game.currentWeapon = 1;

  game.weapons[1].ammo = 30;
  game.weapons[1].reserve = 90;

  game.weapons[2].ammo = 12;
  game.weapons[2].reserve = 48;

  game.weapons[3].ammo = -1;
  game.weapons[3].reserve = -1;

  game.weaponState.lastShot = 0;
  game.weaponState.reloading = false;
  game.weaponState.mouseDown = false;

  switchWeapon(game, 1);
}

export function switchWeapon(game, id) {
  game.currentWeapon = id;
  game.weaponState.reloading = false;

  ui.weaponView.classList.toggle("akBlueGem", id === 1);
  ui.weaponView.classList.toggle("knifeMode", id === 3);
  updateHud(game);
}

export function shoot(game) {
  const weapon = game.weapons[game.currentWeapon];
  const now = performance.now() / 1000;

  if (!game.player.alive || game.weaponState.reloading) return;
  if (now - game.weaponState.lastShot < weapon.fireRate) return;

  if (weapon.ammo === 0) {
    reload(game);
    return;
  }

  playShootAnimation();

  game.weaponState.lastShot = now;

  ui.weaponView.classList.remove("recoil", "knifeSwing");
  ui.muzzleFlash.classList.remove("show");
  void ui.weaponView.offsetWidth;

  if (game.currentWeapon === 3) {
    knifeAttack(game, weapon);
    return;
  }

  weapon.ammo--;

  playShootAnimation();

  ui.weaponView.classList.add("recoil");
  ui.muzzleFlash.classList.add("show");

  setTimeout(() => ui.weaponView.classList.remove("recoil"), 90);
  setTimeout(() => ui.muzzleFlash.classList.remove("show"), 90);

  game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
  game.raycaster.far = weapon.range;

  createBulletTracer(game, weapon);

  const hits = game.raycaster.intersectObjects(game.enemies.map((e) => e.mesh), false);

  if (hits.length > 0) {
    damageEnemy(game, hits[0].object, weapon.damage);
  }

  updateHud(game);
}

function knifeAttack(game, weapon) {
  ui.weaponView.classList.add("knifeSwing");

  setTimeout(() => {
    ui.weaponView.classList.remove("knifeSwing");
  }, 180);

  game.raycaster.setFromCamera(new THREE.Vector2(0, 0), game.camera);
  game.raycaster.far = weapon.range;

  const hits = game.raycaster.intersectObjects(game.enemies.map((e) => e.mesh), false);

  if (hits.length > 0) {
    damageEnemy(game, hits[0].object, weapon.damage);
  }

  updateHud(game);
}

function createBulletTracer(game, weapon) {
  const direction = new THREE.Vector3();
  game.camera.getWorldDirection(direction);

  const start = game.camera.position.clone().add(direction.clone().multiplyScalar(1.2));
  start.y -= 0.18;

  const end = start.clone().add(direction.clone().multiplyScalar(weapon.range));

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([start, end]),
    new THREE.LineBasicMaterial({
      color: 0xffdd66,
      transparent: true,
      opacity: 1
    })
  );

  game.scene.add(line);
  game.bullets.push({ mesh: line, life: 0.07 });
}

export function reload(game) {
  const weapon = game.weapons[game.currentWeapon];

  if (
    game.currentWeapon === 3 ||
    game.weaponState.reloading ||
    weapon.ammo === weapon.magSize ||
    weapon.reserve <= 0
  ) {
    return;
  }

  game.weaponState.reloading = true;
  updateHud(game, "Reloading...");

  setTimeout(() => {
    const needed = weapon.magSize - weapon.ammo;
    const taken = Math.min(needed, weapon.reserve);

    weapon.ammo += taken;
    weapon.reserve -= taken;
    game.weaponState.reloading = false;

    updateHud(game);
  }, 1000);
}

export function updateBullets(game, dt) {
  game.bullets.forEach((bullet) => {
    bullet.life -= dt;
    bullet.mesh.material.opacity = Math.max(0, bullet.life / 0.07);

    if (bullet.life <= 0) {
      game.scene.remove(bullet.mesh);
    }
  });

  game.bullets = game.bullets.filter((bullet) => bullet.life > 0);
}

export function clearBullets(game) {
  game.bullets.forEach((bullet) => game.scene.remove(bullet.mesh));
  game.bullets = [];
}
