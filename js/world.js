import * as THREE from "three";

export function createWorld(scene) {
  scene.background = new THREE.Color(0x151515);
  scene.fog = new THREE.Fog(0x151515, 18, 70);

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainLight.position.set(10, 20, 10);
  scene.add(mainLight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const obstacles = [];

  function createBox(x, y, z, w, h, d, color, obstacle = true) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color })
    );

    box.position.set(x, y, z);
    box.userData.size = { w, h, d };
    scene.add(box);

    if (obstacle) obstacles.push(box);
    return box;
  }

  createBox(0, 2, -30, 80, 4, 2, 0x444444);
  createBox(0, 2, 30, 80, 4, 2, 0x444444);
  createBox(-40, 2, 0, 2, 4, 80, 0x444444);
  createBox(40, 2, 0, 2, 4, 80, 0x444444);

  createBox(-12, 1.5, -8, 4, 3, 12, 0x5c5c5c);
  createBox(13, 1.5, 2, 4, 3, 14, 0x5c5c5c);
  createBox(0, 1, 14, 16, 2, 4, 0x555555);
  createBox(-23, 1, 15, 8, 2, 8, 0x4b4b4b);
  createBox(23, 1, -15, 8, 2, 8, 0x4b4b4b);

  return obstacles;
}

export function collidesWithBox(pos, box, radius) {
  const s = box.userData.size;

  return (
    pos.x > box.position.x - s.w / 2 - radius &&
    pos.x < box.position.x + s.w / 2 + radius &&
    pos.z > box.position.z - s.d / 2 - radius &&
    pos.z < box.position.z + s.d / 2 + radius
  );
}

export function canMoveTo(pos, obstacles, radius) {
  if (pos.x < -38 || pos.x > 38 || pos.z < -28 || pos.z > 28) {
    return false;
  }

  return !obstacles.some((box) => collidesWithBox(pos, box, radius));
}
