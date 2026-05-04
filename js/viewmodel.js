import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export const viewModel = {
  group: null,
  model: null,
  mixer: null,
  actions: {},
  recoilTime: 0,
  inspectTime: 0
};

export function setupViewModel(camera) {
  const loader = new GLTFLoader();

  viewModel.group = new THREE.Group();
  camera.add(viewModel.group);

  viewModel.group.position.set(0.7, -0.35, -0.5);
  viewModel.group.rotation.set(0.02, -0.08, 0.02);
  viewModel.group.scale.set(1, 1, 1);

  const weaponLight = new THREE.PointLight(0xffffff, 2.3, 6);
  weaponLight.position.set(0.3, 0.4, 0.8);
  camera.add(weaponLight);

  loader.load("models/ak_hands.glb", (gltf) => {
    viewModel.model = gltf.scene;

    viewModel.model.position.set(0.7, -0.35, -0.5);
    viewModel.model.rotation.set(0, Math.PI, 0);
    viewModel.model.scale.set(3, 3, 5);

    viewModel.model.traverse((child) => {
      if (child.isMesh) {
        child.frustumCulled = false;
      }
    });

    viewModel.group.add(viewModel.model);

    if (gltf.animations.length > 0) {
      viewModel.mixer = new THREE.AnimationMixer(viewModel.model);

      gltf.animations.forEach((clip) => {
        const name = clip.name.toLowerCase();
        viewModel.actions[name] = viewModel.mixer.clipAction(clip);
      });

      console.log("Animations:", gltf.animations.map(a => a.name));
    }

    console.log("AK + hands loaded:", viewModel.model);
  });
}

export function playShootAnimation() {
  viewModel.recoilTime = 0.08;

  playAnimationByKeyword(["shoot", "fire"]);
}

export function playInspectAnimation() {
  viewModel.inspectTime = 1.2;

  const played = playAnimationByKeyword(["inspect", "look", "idle"]);
  if (!played) {
    viewModel.inspectTime = 1.2;
  }
}

function playAnimationByKeyword(keywords) {
  if (!viewModel.mixer) return false;

  const key = Object.keys(viewModel.actions).find(name =>
    keywords.some(word => name.includes(word))
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
    viewModel.group.position.z = -0.72;
    viewModel.group.rotation.x = -0.08;
  } else if (viewModel.inspectTime > 0) {
    viewModel.inspectTime -= dt;

    const p = Math.sin((1.2 - viewModel.inspectTime) * Math.PI / 1.2);

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