import * as THREE from "three";

export interface RemotePlayerMesh {
  root: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponHolder: THREE.Group;
  muzzleLight: THREE.PointLight;
  team: "alpha" | "bravo";
  animTime: number;
}

export function createPlayerModel(team: "alpha" | "bravo", name: string): RemotePlayerMesh {
  const root = new THREE.Group();

  // Color schemes
  const camoColor = team === "alpha" ? 0x826d4e : 0x272c33; // Desert tan vs Urban midnight
  const vestColor = team === "alpha" ? 0x3d3528 : 0x181a1d;
  const visorColor = team === "alpha" ? 0xd49b35 : 0x48a8e8;

  const camoMat = new THREE.MeshStandardMaterial({ color: camoColor, roughness: 0.7, metalness: 0.2 });
  const vestMat = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.8, metalness: 0.3 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc49174, roughness: 0.8 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: camoColor, roughness: 0.5, metalness: 0.4 });
  const visorMat = new THREE.MeshBasicMaterial({ color: visorColor });

  // 1. Torso & Tactical Vest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.35), camoMat);
  torso.position.y = 1.05;
  torso.castShadow = true;
  root.add(torso);

  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.65, 0.42), vestMat);
  vest.position.set(0, 0, 0);
  torso.add(vest);

  // Tactical Pouches on Vest
  for (let i = -1; i <= 1; i++) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.08), vestMat);
    pouch.position.set(i * 0.2, -0.12, 0.24);
    vest.add(pouch);
  }

  // 2. Head & Combat Helmet with Tactical Visor
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.38, 0.35), skinMat);
  head.position.set(0, 0.6, 0);
  torso.add(head);

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.26, 0.44), helmetMat);
  helmet.position.set(0, 0.1, 0);
  head.add(helmet);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), visorMat);
  visor.position.set(0, 0.02, 0.21);
  head.add(visor);

  // 3. Arms & Weapon Holding Rig
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.45, 0.3, 0);
  torso.add(leftArm);

  const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), camoMat);
  lArmMesh.position.set(0, -0.25, 0);
  leftArm.add(lArmMesh);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.45, 0.3, 0);
  torso.add(rightArm);

  const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), camoMat);
  rArmMesh.position.set(0, -0.25, 0);
  rightArm.add(rArmMesh);

  // Weapon in Right Arm
  const weaponHolder = new THREE.Group();
  weaponHolder.position.set(0, -0.45, 0.25);
  weaponHolder.rotation.x = -Math.PI / 2 + 0.15;
  rightArm.add(weaponHolder);

  const gunMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.15, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x151618, metalness: 0.8, roughness: 0.3 })
  );
  gunMesh.position.set(-0.15, 0, -0.15);
  weaponHolder.add(gunMesh);

  const muzzleLight = new THREE.PointLight(0xffbb33, 0, 8);
  muzzleLight.position.set(-0.15, 0, -0.65);
  weaponHolder.add(muzzleLight);

  // Left arm reaches to support gun
  leftArm.rotation.x = -Math.PI / 3;
  leftArm.rotation.y = 0.5;
  rightArm.rotation.x = -Math.PI / 3;
  rightArm.rotation.y = -0.2;

  // 4. Legs
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.2, 0.65, 0);
  root.add(leftLeg);

  const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.7, 0.24), camoMat);
  lLegMesh.position.set(0, -0.32, 0);
  leftLeg.add(lLegMesh);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.2, 0.65, 0);
  root.add(rightLeg);

  const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.7, 0.24), camoMat);
  rLegMesh.position.set(0, -0.32, 0);
  rightLeg.add(rLegMesh);

  return {
    root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    weaponHolder,
    muzzleLight,
    team,
    animTime: 0,
  };
}

export function animateRemotePlayer(
  mesh: RemotePlayerMesh,
  delta: number,
  isMoving: boolean,
  isSprinting: boolean,
  isSliding: boolean,
  isFiring: boolean,
  isAlive: boolean
) {
  if (!isAlive) {
    // Dead / collapsed posture
    mesh.root.position.y = 0.2;
    mesh.root.rotation.x = -Math.PI / 2;
    mesh.muzzleLight.intensity = 0;
    return;
  }

  mesh.root.rotation.x = 0;

  if (isSliding) {
    // Bloodstrike slide posture: lean back, slide low
    mesh.root.position.y = 0.6;
    mesh.torso.rotation.x = -0.4;
    mesh.leftLeg.rotation.x = 1.3;
    mesh.rightLeg.rotation.x = 1.0;
  } else if (isMoving) {
    mesh.root.position.y = 0;
    mesh.animTime += delta * (isSprinting ? 14 : 9);
    mesh.torso.rotation.x = isSprinting ? 0.2 : 0.05;

    // Running leg swing
    const swing = Math.sin(mesh.animTime) * (isSprinting ? 0.75 : 0.45);
    mesh.leftLeg.rotation.x = swing;
    mesh.rightLeg.rotation.x = -swing;
  } else {
    // Idle stance
    mesh.root.position.y = 0;
    mesh.animTime += delta * 2;
    mesh.torso.rotation.x = 0;
    mesh.leftLeg.rotation.x = 0;
    mesh.rightLeg.rotation.x = 0;
  }

  // Muzzle flash on firing
  if (isFiring) {
    mesh.muzzleLight.intensity = Math.random() < 0.6 ? 2.5 : 0;
  } else {
    mesh.muzzleLight.intensity = 0;
  }
}
