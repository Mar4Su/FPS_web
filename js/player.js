import { canMoveTo } from "./world.js";
import * as THREE from "three";

export function createPlayer() {
  return {
    speed: 7,
    sprintSpeed: 11,
    crouchSpeed: 3.5,
    hp: 100,
    radius: 0.55,
    height: 1.7,
    crouchHeight: 1.0,
    yaw: 0,
    pitch: 0,
    alive: true,
    crouching: false,
    verticalVelocity: 0,
    grounded: true,
    jumpForce: 6.5,
    gravity: -18
  };
}

export function resetPlayer(player, camera) {
  player.hp = 100;
  player.alive = true;
  player.yaw = 0;
  player.pitch = 0;
  player.verticalVelocity = 0;
  player.grounded = true;
  player.crouching = false;

  camera.position.set(0, player.height, 8);
}

export function updatePlayer(game, dt) {
  const { player, camera, keys, obstacles } = game;

  camera.rotation.order = "YXZ";
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;

  player.crouching = keys.ControlLeft || keys.ControlRight;
  const targetHeight = player.crouching ? player.crouchHeight : player.height;

  player.verticalVelocity += player.gravity * dt;
  camera.position.y += player.verticalVelocity * dt;

  if (camera.position.y <= targetHeight) {
    camera.position.y = targetHeight;
    player.verticalVelocity = 0;
    player.grounded = true;
  }

  if (player.grounded) {
    camera.position.y += (targetHeight - camera.position.y) * 10 * dt;
  }

  const forward = new THREE.Vector3(0, 0, -1)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw)
    .normalize();

  const right = new THREE.Vector3(1, 0, 0)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw)
    .normalize();

  const move = new THREE.Vector3();

  if (keys.KeyW || keys.ArrowUp) move.add(forward);
  if (keys.KeyS || keys.ArrowDown) move.sub(forward);
  if (keys.KeyD || keys.ArrowRight) move.add(right);
  if (keys.KeyA || keys.ArrowLeft) move.sub(right);

  if (move.lengthSq() > 0) move.normalize();

  const speed = player.crouching
    ? player.crouchSpeed
    : (keys.ShiftLeft || keys.ShiftRight)
      ? player.sprintSpeed
      : player.speed;

  const nextPos = camera.position.clone().add(move.multiplyScalar(speed * dt));

  const testX = camera.position.clone();
  testX.x = nextPos.x;
  if (canMoveTo(testX, obstacles, player.radius)) {
    camera.position.x = nextPos.x;
  }

  const testZ = camera.position.clone();
  testZ.z = nextPos.z;
  if (canMoveTo(testZ, obstacles, player.radius)) {
    camera.position.z = nextPos.z;
  }
}

export function jump(player) {
  if (player.grounded && player.alive) {
    player.verticalVelocity = player.jumpForce;
    player.grounded = false;
  }
}
