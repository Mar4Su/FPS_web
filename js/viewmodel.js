import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

const WEAPON_MODELS = {
  1: {
    name: "AK",
    path: "models/ak_hands.glb",
    position: new THREE.Vector3(0.7, -0.35, -0.5),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: new THREE.Vector3(3, 3, 5)
  },
  2: {
    name: "Pistol",
    path: "models/pistol.glb",
    position: new THREE.Vector3(3, -1, -0.45),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: new THREE.Vector3(2, 1, 1)
  },
  3: {
    name: "Knife",
    path: "models/knife.glb",
    position: new THREE.Vector3(0.45, -0.45, -0.65),
    rotation: new THREE.Euler(0, Math.PI, 0),
    scale: new THREE.Vector3(2.5, 2.5, 2.5)
  }
};

export const viewModel = {
  group: null,
  model: null,
  mixer: null,
  actions: {},
  currentWeaponId: null,
  loadedModels: {},
  recoilTime: 0,
  inspectTime: 0
};

export function setupViewModel(camera) {
  viewModel.group = new THREE.Group();
  camera.add(viewModel.group);

  viewModel.group.position.set(0.38, -0.45, -0.85);
  viewModel.group.rotation.set(0.02, -0.08, 0.02);
  viewModel.group.scale.set(1, 1, 1);

  const weaponLight = new THREE.PointLight(0xffffff, 2.3, 6);
  weaponLight.position.set(0.3, 0.4, 0.8);
  camera.add(weaponLight);

  switchViewModel(1);
}



export function switchViewModel(id) {
  if (!viewModel.group) return;
  if (viewModel.currentWeaponId === id) return;

  viewModel.currentWeaponId = id;
  viewModel.actions = {};
  viewModel.mixer = null;
  viewModel.recoilTime = 0;
  viewModel.inspectTime = 0;

  if (viewModel.model) {
    viewModel.group.remove(viewModel.model);
    viewModel.model.visible = false;
  }

  if (viewModel.loadedModels[id]) {
    applyLoadedModel(id);
    return;
  }

  const config = WEAPON_MODELS[id];

  loader.load(
    config.path,
    (gltf) => {
      viewModel.loadedModels[id] = gltf;

      if (viewModel.currentWeaponId === id) {
        applyLoadedModel(id);
      }

      console.log(`${config.name} loaded:`, gltf.scene);
      console.log(
        `${config.name} animations:`,
        gltf.animations.map((a) => a.name)
      );
    },
    undefined,
    (error) => {
      console.error(`Failed to load ${config.path}`, error);
    }
  );
}

function centerModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());

  model.position.x -= center.x;
  model.position.y -= center.y;
  model.position.z -= center.z;
}

function applyLoadedModel(id) {
  const config = WEAPON_MODELS[id];
  const gltf = viewModel.loadedModels[id];

  viewModel.model = gltf.scene;
  viewModel.model.visible = true;

  viewModel.model.position.set(0, 0, 0);
  viewModel.model.rotation.set(0, 0, 0);
  viewModel.model.scale.set(1, 1, 1);

  if (id === 2) {
    normalizeWeaponModel(viewModel.model, 0.75);
    viewModel.model.position.set(0.2, 0.1, 0.5);
    viewModel.model.rotation.set(0, 0 , 0);
  } else {
    viewModel.model.position.copy(config.position);
    viewModel.model.rotation.copy(config.rotation);
    viewModel.model.scale.copy(config.scale);
  }

  viewModel.model.traverse((child) => {
    if (child.isMesh) {
      child.frustumCulled = false;
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });

  viewModel.group.add(viewModel.model);

  viewModel.actions = {};
  viewModel.mixer = null;

  if (gltf.animations && gltf.animations.length > 0) {
    viewModel.mixer = new THREE.AnimationMixer(viewModel.model);

    gltf.animations.forEach((clip) => {
      const name = clip.name.toLowerCase();
      viewModel.actions[name] = viewModel.mixer.clipAction(clip);
    });

    playAnimationByKeyword(["idle"]);
  }
}

export function playShootAnimation() {
  if (viewModel.currentWeaponId === 3) {
    viewModel.recoilTime = 0.18;
    playAnimationByKeyword(["slash", "attack", "knife", "swing"]);
    return;
  }

  viewModel.recoilTime = 0.08;
  playAnimationByKeyword(["shot", "shoot", "fire"]);
}

export function playInspectAnimation() {
  viewModel.inspectTime = 1.2;

  const played = playAnimationByKeyword(["inspect", "look"]);
  if (!played) {
    viewModel.inspectTime = 1.2;
  }
}

function playAnimationByKeyword(keywords) {
  if (!viewModel.mixer) return false;

  const key = Object.keys(viewModel.actions).find((name) =>
    keywords.some((word) => name.includes(word))
  );

  if (!key) return false;

  const action = viewModel.actions[key];
  action.reset();
  action.setLoop(THREE.LoopOnce);
  action.clampWhenFinished = true;
  action.play();

  return true;
}

export function updateViewModel(dt, game) {
  if (!viewModel.group || !game || !game.keys) return;

  if (viewModel.mixer) {
    viewModel.mixer.update(dt);
  }

  const moving =
    game.keys.KeyW ||
    game.keys.KeyA ||
    game.keys.KeyS ||
    game.keys.KeyD;

  const t = performance.now() * 0.006;

  const swayX = Math.sin(t) * (moving ? 0.02 : 0.005);
  const swayY = Math.abs(Math.cos(t)) * (moving ? 0.02 : 0.004);

  viewModel.group.position.x = 0.38 + swayX;
  viewModel.group.position.y = -0.45 + swayY;

  if (viewModel.recoilTime > 0) {
    viewModel.recoilTime -= dt;

    if (viewModel.currentWeaponId === 3) {
      viewModel.group.position.z = -0.72;
      viewModel.group.rotation.y = -0.45;
      viewModel.group.rotation.z = -0.45;
    } else {
      viewModel.group.position.z = -0.72;
      viewModel.group.rotation.x = -0.08;
    }
  } else if (viewModel.inspectTime > 0) {
    viewModel.inspectTime -= dt;

    const p = Math.sin(((1.2 - viewModel.inspectTime) * Math.PI) / 1.2);

    viewModel.group.position.z = -0.78 + p * 0.12;
    viewModel.group.rotation.y = -0.08 + p * 0.45;
    viewModel.group.rotation.z = 0.02 + p * 0.18;
  } else {
    viewModel.group.position.z += (-0.85 - viewModel.group.position.z) * 12 * dt;
    viewModel.group.rotation.x += (0.02 - viewModel.group.rotation.x) * 12 * dt;
    viewModel.group.rotation.y += (-0.08 - viewModel.group.rotation.y) * 12 * dt;
    viewModel.group.rotation.z += (0.02 - viewModel.group.rotation.z) * 12 * dt;
  }
}

function normalizeWeaponModel(model, targetSize = 1) {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxSize;

  model.position.sub(center);
  model.scale.multiplyScalar(scale);
}