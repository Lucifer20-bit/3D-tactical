import * as THREE from "three";

export interface BoxCollider {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface MapData {
  sceneGroup: THREE.Group;
  colliders: BoxCollider[];
  spawnPoints: { x: number; y: number; z: number; team: "alpha" | "bravo" }[];
}

export function buildWarzoneMap(): MapData {
  const group = new THREE.Group();
  const colliders: BoxCollider[] = [];

  const spawnPoints = [
    { x: -35, y: 1.5, z: -35, team: "alpha" as const },
    { x: -30, y: 1.5, z: -40, team: "alpha" as const },
    { x: -40, y: 1.5, z: -30, team: "alpha" as const },
    { x: -25, y: 1.5, z: -35, team: "alpha" as const },
    { x: 35, y: 1.5, z: 35, team: "bravo" as const },
    { x: 30, y: 1.5, z: 40, team: "bravo" as const },
    { x: 40, y: 1.5, z: 30, team: "bravo" as const },
    { x: 25, y: 1.5, z: 35, team: "bravo" as const },
  ];

  function addBox(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    castShadow = true,
    receiveShadow = true
  ) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    group.add(mesh);

    colliders.push({
      min: new THREE.Vector3(x - w / 2, y, z - d / 2),
      max: new THREE.Vector3(x + w / 2, y + h, z + d / 2),
    });

    return mesh;
  }

  // 1. Tactical Ground / Asphalt Floor
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x222528,
    roughness: 0.85,
    metalness: 0.15,
  });
  const groundGeo = new THREE.PlaneGeometry(120, 120);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  // Tactical lane markings on ground
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xcc9922 });
  for (let i = -40; i <= 40; i += 20) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 90), lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(i, 0.01, 0);
    group.add(line);
  }

  // Center helipad / tactical capture zone circle
  const ringGeo = new THREE.RingGeometry(8, 8.4, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.02, 0);
  group.add(ring);

  // 2. Perimeter Boundary Blast Walls
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c1e,
    roughness: 0.9,
    metalness: 0.2,
  });
  const mapSize = 100;
  const wallH = 12;
  const wallT = 4;
  // North / South / East / West
  addBox(0, 0, -mapSize / 2, mapSize, wallH, wallT, wallMat);
  addBox(0, 0, mapSize / 2, mapSize, wallH, wallT, wallMat);
  addBox(-mapSize / 2, 0, 0, wallT, wallH, mapSize, wallMat);
  addBox(mapSize / 2, 0, 0, wallT, wallH, mapSize, wallMat);

  // 3. Shipping Containers Materials (CoD Shipment / Bloodstrike palette)
  const containerMats = [
    new THREE.MeshStandardMaterial({ color: 0xa82824, roughness: 0.6, metalness: 0.3 }), // Red
    new THREE.MeshStandardMaterial({ color: 0x245582, roughness: 0.6, metalness: 0.3 }), // Blue
    new THREE.MeshStandardMaterial({ color: 0x3d6639, roughness: 0.6, metalness: 0.3 }), // Military Olive
    new THREE.MeshStandardMaterial({ color: 0xd4881c, roughness: 0.6, metalness: 0.3 }), // Hazard Orange
    new THREE.MeshStandardMaterial({ color: 0x36393e, roughness: 0.5, metalness: 0.4 }), // Gunmetal
  ];

  const contW = 3.6;
  const contH = 3.8;
  const contL = 10;

  // Function to place a realistic corrugated container with end doors
  function addContainer(x: number, y: number, z: number, rotY: number, matIndex: number) {
    const cMat = containerMats[matIndex % containerMats.length];
    const geo = new THREE.BoxGeometry(contW, contH, contL);
    const mesh = new THREE.Mesh(geo, cMat);
    mesh.position.set(x, y + contH / 2, z);
    mesh.rotation.y = rotY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Hazard stripes on corner edges
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.8 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(contW * 1.02, contH * 1.02, 0.2), frameMat);
    frame.position.set(0, 0, contL / 2);
    mesh.add(frame);
    const frameBack = frame.clone();
    frameBack.position.set(0, 0, -contL / 2);
    mesh.add(frameBack);

    // Approximate AABB collider based on rotation
    const isRot = Math.abs(Math.sin(rotY)) > 0.5;
    const effW = isRot ? contL : contW;
    const effD = isRot ? contW : contL;

    colliders.push({
      min: new THREE.Vector3(x - effW / 2, y, z - effD / 2),
      max: new THREE.Vector3(x + effW / 2, y + contH, z + effD / 2),
    });
  }

  // --- Map Layout: 3 Lanes & Center Warzone Arena ---

  // Center Chokepoint & Angled Containers
  addContainer(0, 0, 7, 0, 0); // Red container
  addContainer(0, 0, -7, 0, 1); // Blue container
  addContainer(-8, 0, 0, Math.PI / 2, 2); // Olive sideways
  addContainer(8, 0, 0, Math.PI / 2, 3); // Orange sideways

  // Stacked 2nd story containers for verticality & sniping
  addContainer(0, contH, 7, 0, 4);
  addContainer(8, contH, 0, Math.PI / 2, 0);

  // Left Lane (Alpha Flank)
  addContainer(-22, 0, -15, 0, 1);
  addContainer(-22, 0, 0, 0, 3);
  addContainer(-22, 0, 15, 0, 2);
  addContainer(-22, contH, 0, 0, 4); // upper catwalk

  addContainer(-14, 0, -25, Math.PI / 4, 0);
  addContainer(-14, 0, 25, -Math.PI / 4, 1);

  // Right Lane (Bravo Flank)
  addContainer(22, 0, -15, 0, 2);
  addContainer(22, 0, 0, 0, 0);
  addContainer(22, 0, 15, 0, 1);
  addContainer(22, contH, 0, 0, 3); // upper catwalk

  addContainer(14, 0, -25, -Math.PI / 4, 3);
  addContainer(14, 0, 25, Math.PI / 4, 2);

  // Team Alpha Base Area
  addContainer(-32, 0, -25, Math.PI / 2, 0);
  addContainer(-20, 0, -38, 0, 2);
  addContainer(-35, 0, -10, 0, 1);

  // Team Bravo Base Area
  addContainer(32, 0, 25, Math.PI / 2, 1);
  addContainer(20, 0, 38, 0, 3);
  addContainer(35, 0, 10, 0, 0);

  // 4. Wooden Supply Crates (Slide Cover / Mantle Steps)
  const crateMat = new THREE.MeshStandardMaterial({
    color: 0x7a5b35,
    roughness: 0.9,
    metalness: 0.05,
  });
  const cratePositions = [
    { x: -5, y: 0, z: -14 },
    { x: 5, y: 0, z: 14 },
    { x: -16, y: 0, z: 8 },
    { x: 16, y: 0, z: -8 },
    { x: -28, y: 0, z: -4 },
    { x: 28, y: 0, z: 4 },
    { x: -10, y: 0, z: -35 },
    { x: 10, y: 0, z: 35 },
  ];
  cratePositions.forEach((pos) => {
    addBox(pos.x, pos.y, pos.z, 2.2, 2.2, 2.2, crateMat);
    // Stacked small crate for step-up
    addBox(pos.x + 1.2, pos.y, pos.z, 1.2, 1.1, 1.2, crateMat);
  });

  // 5. Concrete Barricades / Waist-high Slide Covers (Jersey Barriers)
  const barrierMat = new THREE.MeshStandardMaterial({
    color: 0x5a5d62,
    roughness: 0.95,
  });
  const barriers = [
    { x: -4, z: 0, rot: 0 },
    { x: 4, z: 0, rot: 0 },
    { x: 0, z: -18, rot: Math.PI / 2 },
    { x: 0, z: 18, rot: Math.PI / 2 },
    { x: -12, z: -10, rot: 0 },
    { x: 12, z: 10, rot: 0 },
    { x: -30, z: -18, rot: Math.PI / 4 },
    { x: 30, z: 18, rot: Math.PI / 4 },
  ];
  barriers.forEach((b) => {
    const w = b.rot === 0 ? 1.0 : 4.5;
    const d = b.rot === 0 ? 4.5 : 1.0;
    addBox(b.x, 0, b.z, w, 1.3, d, barrierMat);
  });

  // 6. Explosive & Tactical Barrels
  const redBarrelMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.6, roughness: 0.4 });
  const oilBarrelMat = new THREE.MeshStandardMaterial({ color: 0x1f2124, metalness: 0.7, roughness: 0.3 });
  const barrelPositions = [
    { x: -8, z: -6, red: true },
    { x: -9, z: -6.8, red: false },
    { x: 8, z: 6, red: true },
    { x: 9, z: 6.8, red: false },
    { x: -24, z: -8, red: false },
    { x: 24, z: 8, red: false },
    { x: -18, z: 18, red: true },
    { x: 18, z: -18, red: true },
  ];
  barrelPositions.forEach((bp) => {
    const geo = new THREE.CylinderGeometry(0.55, 0.55, 1.5, 12);
    const mesh = new THREE.Mesh(geo, bp.red ? redBarrelMat : oilBarrelMat);
    mesh.position.set(bp.x, 0.75, bp.z);
    mesh.castShadow = true;
    group.add(mesh);

    colliders.push({
      min: new THREE.Vector3(bp.x - 0.55, 0, bp.z - 0.55),
      max: new THREE.Vector3(bp.x + 0.55, 1.5, bp.z + 0.55),
    });
  });

  // 7. Tactical Ramps for Container Access (Enables climbing to high ground)
  const rampMat = new THREE.MeshStandardMaterial({ color: 0x3d4147, metalness: 0.5, roughness: 0.6 });
  function addRamp(x: number, z: number, targetY: number, rotY: number) {
    const rampLength = 8.5;
    const rampW = 2.4;
    const geo = new THREE.BoxGeometry(rampW, 0.3, rampLength);
    const mesh = new THREE.Mesh(geo, rampMat);
    mesh.position.set(x, targetY / 2, z);
    mesh.rotation.x = -Math.atan2(targetY, rampLength);
    mesh.rotation.y = rotY;
    group.add(mesh);
  }
  addRamp(-22, -8, contH, 0);
  addRamp(22, 8, contH, 0);

  // 8. Industrial Lighting & Floodlights
  const floodlightMat = new THREE.MeshBasicMaterial({ color: 0xfff4d6 });
  const towerPositions = [
    { x: -44, z: -44 },
    { x: 44, z: -44 },
    { x: -44, z: 44 },
    { x: 44, z: 44 },
  ];
  towerPositions.forEach((tp) => {
    // Light pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 14, 8),
      new THREE.MeshStandardMaterial({ color: 0x2b2e33, metalness: 0.8 })
    );
    pole.position.set(tp.x, 7, tp.z);
    group.add(pole);

    // Lamp head
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), floodlightMat);
    lamp.position.set(tp.x, 14, tp.z);
    group.add(lamp);

    const light = new THREE.PointLight(0xffecd0, 0.8, 45);
    light.position.set(tp.x, 13.5, tp.z);
    group.add(light);
  });

  return { sceneGroup: group, colliders, spawnPoints };
}
