import { collidesWithBox } from "./world.js";
import { showDamageFlash, showGameOver, updateHud } from "./ui.js";
import * as THREE from "three";

export function clearEnemies(game) {
  game.enemies.forEach((enemy) => game.scene.remove(enemy.mesh));
  game.enemies = [];
}

export function spawnRound(game) {
  const count = 4 + game.round * 2;

  for (let i = 0; i < count; i++) {
    spawnEnemy(game);
  }
}

export function spawnEnemy(game) {
  const enemyRadius = 0.7;
  let x = 0;
  let z = 0;
  let foundGoodSpot = false;

  // Try multiple times to find valid position
  for (let tries = 0; tries < 120; tries++) {
    x = THREE.MathUtils.randFloat(-34, 34);
    z = THREE.MathUtils.randFloat(-24, 24);

    const spawnPos = new THREE.Vector3(x, 1.05, z);

    const tooClose = spawnPos.distanceTo(game.camera.position) < 12;
    const insideBlock = game.obstacles.some(box =>
      collidesWithBox(spawnPos, box, enemyRadius)
    );

    if (!tooClose && !insideBlock) {
      foundGoodSpot = true;
      break;
    }
  }

  // fallback (safe corners)
  if (!foundGoodSpot) {
    const fallback = new THREE.Vector3(0, 1.05, -22);
    x = fallback.x;
    z = fallback.z;
  }

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 1.1, 5, 10),
    new THREE.MeshStandardMaterial({ color: 0xc0392b })
  );

  body.position.set(x, 1.05, z);
  game.scene.add(body);

  game.enemies.push({
    mesh: body,
    hp: 100,
    speed: THREE.MathUtils.randFloat(1.3, 2.2) + game.round * 0.08,
    attackCooldown: 0,
    radius: enemyRadius,
    strafeDirection: Math.random() < 0.5 ? -1 : 1
  });
}

export function damageEnemy(game, mesh, amount) {
  const enemy = game.enemies.find((e) => e.mesh === mesh);
  if (!enemy) return;

  enemy.hp -= amount;
  enemy.mesh.material.color.set(0xffffff);

  setTimeout(() => {
    if (enemy.mesh && enemy.hp > 0) {
      enemy.mesh.material.color.set(0xc0392b);
    }
  }, 60);

  if (enemy.hp <= 0) {
    game.scene.remove(enemy.mesh);
    game.enemies = game.enemies.filter((e) => e !== enemy);
    game.score += 100;

    if (game.enemies.length === 0) {
      nextRound(game);
    }
  }
}

export function nextRound(game) {
  game.round++;
  game.player.hp = Math.min(100, game.player.hp + 25);
  game.weapons[1].reserve += 30;
  game.weapons[2].reserve += 12;

  spawnRound(game);
  updateHud(game, "Round " + game.round);
}

export function damagePlayer(game, amount) {
  if (!game.player.alive) return;

  game.player.hp -= amount;
  showDamageFlash();

  if (game.player.hp <= 0) {
    game.player.alive = false;
    showGameOver(game, game.resetGame);
  }

  updateHud(game);
}

export function updateEnemies(game, dt) {
  game.enemies.forEach((enemy) => {
    const pos = enemy.mesh.position;
    const target = game.camera.position.clone();

    target.y = pos.y;

    const direction = target.sub(pos);
    const distance = direction.length();

    if (distance > 1.5) {
      direction.normalize();

      const next = pos.clone().add(direction.multiplyScalar(enemy.speed * dt));

      const blocked = game.obstacles.some((box) =>
        collidesWithBox(next, box, enemy.radius)
      );

      if (!blocked) {
        pos.copy(next);
      } else {
        // try sideways movement if blocked
        const sideways = new THREE.Vector3(-direction.z, 0, direction.x)
          .multiplyScalar(enemy.strafeDirection);

        const sideStep = pos.clone().add(
          sideways.multiplyScalar(enemy.speed * dt * 0.8)
        );

        const sideBlocked = game.obstacles.some(box =>
          collidesWithBox(sideStep, box, enemy.radius)
        );

        if (!sideBlocked) {
          pos.copy(sideStep);
        } else {
          // flip direction if still blocked
          enemy.strafeDirection *= -1;
        }
      }
    } else {
      enemy.attackCooldown -= dt;

      if (enemy.attackCooldown <= 0) {
        damagePlayer(game, 10 + game.round * 1.5);
        enemy.attackCooldown = 0.8;
      }
    }

    enemy.mesh.lookAt(game.camera.position.x, enemy.mesh.position.y, game.camera.position.z);
  });
}
