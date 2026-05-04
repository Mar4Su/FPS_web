import { createWorld } from "./world.js";
import { createPlayer, resetPlayer, updatePlayer, jump } from "./player.js";
import { clearEnemies, spawnRound, updateEnemies } from "./enemies.js";
import {
  createWeapons,
  resetWeapons,
  switchWeapon,
  shoot,
  reload,
  updateBullets,
  clearBullets
} from "./weapons.js";
import { ui, updateHud, drawRadar } from "./ui.js";
import * as THREE from "three";
import { setupViewModel, updateViewModel, playInspectAnimation } from "./viewmodel.js";

const canvas = document.getElementById("gameCanvas");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
scene.add(camera);
setupViewModel(camera);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const game = {
  canvas,
  scene,
  camera,
  renderer,

  obstacles: createWorld(scene),
  player: createPlayer(),
  weapons: createWeapons(),

  currentWeapon: 1,
  weaponState: {
    lastShot: 0,
    reloading: false,
    mouseDown: false
  },

  score: 0,
  round: 1,
  started: false,

  enemies: [],
  bullets: [],
  keys: {},

  raycaster: new THREE.Raycaster(),
  clock: new THREE.Clock(),

  resetGame
};

function resetGame() {
  resetPlayer(game.player, game.camera);
  resetWeapons(game);

  game.score = 0;
  game.round = 1;

  clearEnemies(game);
  clearBullets(game);
  spawnRound(game);

  updateHud(game);
}

function startGame() {
  resetGame();
  game.started = true;
  ui.message.style.display = "none";
  canvas.requestPointerLock();
}

function setupInput() {
  document.addEventListener("keydown", (e) => {
    game.keys[e.code] = true;

    if (e.code === "Digit1") switchWeapon(game, 1);
    if (e.code === "Digit2") switchWeapon(game, 2);
    if (e.code === "Digit3") switchWeapon(game, 3);
    
    if (e.code === "KeyF") playInspectAnimation();

    if (e.code === "Space") jump(game.player);
    if (e.code === "KeyR") reload(game);
  });

  document.addEventListener("keydown", (e) => {
    if (!game.started) return;

    // block ALL ctrl/alt/shift combos
    if (e.ctrlKey || e.altKey) {
      e.preventDefault();
    }

    // block specific annoying keys
    const blockedKeys = [
      "Tab",
      "Escape",
      "F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12"
    ];

    if (blockedKeys.includes(e.code)) {
      e.preventDefault();
    }
  });

  document.addEventListener("contextmenu", (e) => {
    if (game.started) e.preventDefault();
  });

  document.addEventListener("keyup", (e) => {
    game.keys[e.code] = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (document.pointerLockElement !== canvas || !game.started || !game.player.alive) {
      return;
    }

    const sensitivity = 0.0023;

    game.player.yaw -= e.movementX * sensitivity;
    game.player.pitch -= e.movementY * sensitivity;
    game.player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, game.player.pitch));
  });

  document.addEventListener("mousedown", (e) => {
    if (!game.started) return;

    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
      return;
    }

    if (e.button === 0) {
      game.weaponState.mouseDown = true;
      shoot(game);
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (e.button === 0) {
      game.weaponState.mouseDown = false;
    }
  });

  ui.startButton.addEventListener("click", startGame);
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(game.clock.getDelta(), 0.05);

  if (game.started && game.player.alive) {
    updatePlayer(game, dt);
    updateEnemies(game, dt);
    updateBullets(game, dt);
    drawRadar(game);
    updateViewModel(dt, game);

    const weapon = game.weapons[game.currentWeapon];

    if (game.weaponState.mouseDown && weapon.auto) {
      shoot(game);
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

setupInput();
updateHud(game);
animate();
