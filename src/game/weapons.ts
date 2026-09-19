import * as THREE from "three";
import { Weapon, Attachment, AttachmentCategory, Perk } from "../types";

export const WEAPON_PRESETS: Record<string, Weapon> = {
  M4A1: {
    id: "M4A1",
    name: "M4A1 Carbine",
    category: "AR",
    damage: 32,
    fireRate: 650, // RPM
    magSize: 30,
    currentAmmo: 30,
    reserveAmmo: 120,
    reloadTime: 2.1,
    range: 120,
    adsFov: 42,
    recoilVertical: 0.022,
    recoilHorizontal: 0.008,
    spread: 0.035,
    isAutomatic: true,
  },
  MP5: {
    id: "MP5",
    name: "MP5 Submachine",
    category: "SMG",
    damage: 26,
    fireRate: 820,
    magSize: 30,
    currentAmmo: 30,
    reserveAmmo: 150,
    reloadTime: 1.7,
    range: 65,
    adsFov: 48,
    recoilVertical: 0.018,
    recoilHorizontal: 0.012,
    spread: 0.045,
    isAutomatic: true,
  },
  BARRETT: {
    id: "BARRETT",
    name: "Barrett .50 CAL",
    category: "SNIPER",
    damage: 135,
    fireRate: 50,
    magSize: 5,
    currentAmmo: 5,
    reserveAmmo: 25,
    reloadTime: 3.2,
    range: 250,
    adsFov: 18,
    recoilVertical: 0.09,
    recoilHorizontal: 0.02,
    spread: 0.005,
    isAutomatic: false,
  },
  ORIGIN12: {
    id: "ORIGIN12",
    name: "Origin-12 Shotgun",
    category: "SHOTGUN",
    damage: 18,
    fireRate: 240,
    magSize: 8,
    currentAmmo: 8,
    reserveAmmo: 32,
    reloadTime: 2.5,
    range: 35,
    adsFov: 50,
    recoilVertical: 0.065,
    recoilHorizontal: 0.025,
    spread: 0.085,
    isAutomatic: false,
    pellets: 8,
  },
  KAG6: {
    id: "KAG6",
    name: "KAG-6 Battle Rifle",
    category: "AR",
    damage: 38,
    fireRate: 540,
    magSize: 25,
    currentAmmo: 25,
    reserveAmmo: 100,
    reloadTime: 2.3,
    range: 140,
    adsFov: 40,
    recoilVertical: 0.028,
    recoilHorizontal: 0.006,
    spread: 0.03,
    isAutomatic: true,
  },
  VECTOR: {
    id: "VECTOR",
    name: "Vector .45 ACP",
    category: "SMG",
    damage: 22,
    fireRate: 1050,
    magSize: 33,
    currentAmmo: 33,
    reserveAmmo: 165,
    reloadTime: 1.8,
    range: 55,
    adsFov: 49,
    recoilVertical: 0.024,
    recoilHorizontal: 0.015,
    spread: 0.05,
    isAutomatic: true,
  },
  // SECONDARY WEAPONS
  DEAGLE: {
    id: "DEAGLE",
    name: "Desert Eagle .50 AE",
    category: "PISTOL",
    damage: 68,
    fireRate: 280,
    magSize: 7,
    currentAmmo: 7,
    reserveAmmo: 35,
    reloadTime: 1.6,
    range: 60,
    adsFov: 52,
    recoilVertical: 0.045,
    recoilHorizontal: 0.01,
    spread: 0.038,
    isAutomatic: false,
    isSecondary: true,
  },
  RENETTI: {
    id: "RENETTI",
    name: "Renetti 3-Burst",
    category: "PISTOL",
    damage: 28,
    fireRate: 600,
    magSize: 15,
    currentAmmo: 15,
    reserveAmmo: 60,
    reloadTime: 1.5,
    range: 48,
    adsFov: 52,
    recoilVertical: 0.025,
    recoilHorizontal: 0.008,
    spread: 0.042,
    isAutomatic: false,
    isSecondary: true,
  },
  KNIFE: {
    id: "KNIFE",
    name: "Combat Karambit",
    category: "MELEE",
    damage: 120,
    fireRate: 150,
    magSize: 1,
    currentAmmo: 1,
    reserveAmmo: 1,
    reloadTime: 0.5,
    range: 3.5,
    adsFov: 65,
    recoilVertical: 0.01,
    recoilHorizontal: 0.01,
    spread: 0.01,
    isAutomatic: false,
    isSecondary: true,
  },
};

// ATTACHMENTS REGISTRY
export const ATTACHMENTS: Record<string, Attachment> = {
  // OPTICS
  optic_iron: {
    id: "optic_iron",
    name: "Factory Iron Sights",
    category: "optic",
    description: "Standard factory-installed metallic sights with maximum peripheral vision.",
    pros: ["Fastest ADS speed", "Uncluttered periphery"],
    cons: ["Zero optical magnification"],
    statModifiers: { adsFov: 0, adsSpeedMultiplier: 1.05 },
  },
  optic_reddot: {
    id: "optic_reddot",
    name: "Viper Reflex Red Dot",
    category: "optic",
    description: "Anti-reflective glass optic with an illuminated 2-MOA crisp red center point.",
    pros: ["Precision target acquisition", "Clean sight picture"],
    cons: ["Slightly reduced ADS transition"],
    statModifiers: { adsFov: -4, adsSpeedMultiplier: 0.98 },
  },
  optic_holo: {
    id: "optic_holo",
    name: "Corp Combat Holo-Sight",
    category: "optic",
    description: "Rugged military holographic optic providing a circular reticle for CQB and mid-range tracking.",
    pros: ["Excellent reticle tracking", "+Accuracy at medium range"],
    cons: ["Moderate frame occlusion"],
    statModifiers: { adsFov: -8, adsSpeedMultiplier: 0.95, spread: -0.005 },
  },
  optic_acog: {
    id: "optic_acog",
    name: "VLK 3.5x Tactical Optic",
    category: "optic",
    description: "Prismatic medium-range combat scope providing 3.5x zoom magnification.",
    pros: ["+3.5x Zoom magnification", "Superior long-range precision"],
    cons: ["-ADS speed", "Tunnel vision peripheral view"],
    statModifiers: { adsFov: -16, adsSpeedMultiplier: 0.88, spread: -0.01 },
  },
  optic_thermal: {
    id: "optic_thermal",
    name: "Merc Thermal Infrared",
    category: "optic",
    description: "High-contrast thermal sensor imaging highlighting human signatures through smoke.",
    pros: ["Thermal signature detection", "Penetrates smoke screens"],
    cons: ["Slower ADS speed", "Vulnerable to Cold-Blooded"],
    statModifiers: { adsFov: -14, adsSpeedMultiplier: 0.85 },
  },
  // MUZZLE
  muzzle_suppressor: {
    id: "muzzle_suppressor",
    name: "Monolithic Suppressor",
    category: "muzzle",
    description: "Heavy aerospace-grade silencer that hides muzzle flash, muffles gunshots, and boosts muzzle velocity.",
    pros: ["Sound suppression & stealth", "Conceals red dot on mini-map", "+Effective damage range"],
    cons: ["-ADS speed", "-Aim walking steadiness"],
    statModifiers: { range: 25, spread: -0.004, adsSpeedMultiplier: 0.94 },
  },
  muzzle_compensator: {
    id: "muzzle_compensator",
    name: "Tactical Ported Compensator",
    category: "muzzle",
    description: "Multi-port directional muzzle brake that vents propellant gases upward to negate muzzle rise.",
    pros: ["-35% Vertical recoil rise", "+Full-auto sustained control"],
    cons: ["-ADS speed", "Visible muzzle flash"],
    statModifiers: { recoilVertical: -0.008, adsSpeedMultiplier: 0.96 },
  },
  muzzle_flashguard: {
    id: "muzzle_flashguard",
    name: "Prismatic Flash Guard",
    category: "muzzle",
    description: "Conical pronged flash suppressor eliminating firing glow without adding heavy weight.",
    pros: ["Zero muzzle flash blindness", "No ADS penalty"],
    cons: ["Does not silence audio"],
    statModifiers: { spread: -0.002 },
  },
  // BARREL
  barrel_long: {
    id: "barrel_long",
    name: "Corvus Custom Long Barrel",
    category: "barrel",
    description: "Heavy match-grade rifled barrel increasing muzzle velocity, bullet drop stability, and lethal range.",
    pros: ["+25% Damage range", "+Bullet velocity", "-Recoil kick"],
    cons: ["-Movement speed", "-ADS speed"],
    statModifiers: { range: 35, recoilVertical: -0.004, moveSpeedMultiplier: 0.95, adsSpeedMultiplier: 0.92 },
  },
  barrel_cqb: {
    id: "barrel_cqb",
    name: "FSS 11.5'' Commando Short",
    category: "barrel",
    description: "Lightweight shortened aluminum barrel optimized for intense close-quarters speed and room-clearing.",
    pros: ["+Fast ADS speed", "+Sprint to fire recovery", "+Mobility"],
    cons: ["-Damage range", "+Recoil kick"],
    statModifiers: { range: -20, recoilVertical: 0.004, moveSpeedMultiplier: 1.05, adsSpeedMultiplier: 1.1 },
  },
  // UNDERBARREL
  underbarrel_commando: {
    id: "underbarrel_commando",
    name: "Commando Foregrip",
    category: "underbarrel",
    description: "Ergonomic angled forward grip providing superior stabilization during continuous automatic fire.",
    pros: ["-Recoil stabilization", "+Aiming idle stability"],
    cons: ["-Movement speed"],
    statModifiers: { recoilHorizontal: -0.005, recoilVertical: -0.003, moveSpeedMultiplier: 0.97 },
  },
  underbarrel_merc: {
    id: "underbarrel_merc",
    name: "Merc Tactical Foregrip",
    category: "underbarrel",
    description: "Vertical ribbed foregrip designed for aggressive hip-firing run-and-gun combat.",
    pros: ["-Tightened hipfire spread", "-Vertical recoil control"],
    cons: ["-Aim walking speed"],
    statModifiers: { spread: -0.012, recoilVertical: -0.004, moveSpeedMultiplier: 0.98 },
  },
  underbarrel_laser: {
    id: "underbarrel_laser",
    name: "Tac 5mW Green Laser",
    category: "underbarrel",
    description: "High-output green diode laser sight projecting a visible beam for instantaneous hipfire targeting.",
    pros: ["+Ultra fast sprint-to-fire speed", "+Superior hipfire accuracy"],
    cons: ["Laser beam visible to enemies"],
    statModifiers: { spread: -0.015, adsSpeedMultiplier: 1.08 },
  },
  // MAGAZINE
  mag_extended45: {
    id: "mag_extended45",
    name: "45-Round Extended Mag",
    category: "magazine",
    description: "High-capacity composite polymer box magazine offering 50% more ammunition before reloading.",
    pros: ["+15 Round magazine capacity", "+Sustained squad fire"],
    cons: ["-Reload speed", "-Movement speed"],
    statModifiers: { magSize: 15, reloadTime: 0.35, moveSpeedMultiplier: 0.96 },
  },
  mag_drum60: {
    id: "mag_drum60",
    name: "60-Round Tactical Drum",
    category: "magazine",
    description: "Double-stack cylindrical drum magazine for overwhelming suppressing fire against multiple targets.",
    pros: ["+30 Round magazine capacity", "Never get caught empty"],
    cons: ["-Slower reload time", "-Mobility & ADS speed"],
    statModifiers: { magSize: 30, reloadTime: 0.7, moveSpeedMultiplier: 0.92, adsSpeedMultiplier: 0.9 },
  },
  mag_fast: {
    id: "mag_fast",
    name: "Sleight-of-Hand Quick Mag",
    category: "magazine",
    description: "Taped twin magazines with flared magwell assist for lightning-fast tactical reloads under fire.",
    pros: ["-35% Reload duration", "Fast combat turnaround"],
    cons: ["Standard round capacity"],
    statModifiers: { reloadTime: -0.65 },
  },
  // STOCK
  stock_nostock: {
    id: "stock_nostock",
    name: "No Stock Buffer Tube",
    category: "stock",
    description: "Removes the rear buttstock entirely for maximum sprint velocity, slide speed, and maneuverability.",
    pros: ["+Maximum sprint mobility", "+Lightning-fast ADS time"],
    cons: ["+Increased weapon recoil kick"],
    statModifiers: { moveSpeedMultiplier: 1.08, adsSpeedMultiplier: 1.15, recoilVertical: 0.006, recoilHorizontal: 0.004 },
  },
  stock_heavy: {
    id: "stock_heavy",
    name: "Singuard Precision Marksman",
    category: "stock",
    description: "Heavy weighted cheek-riser stock delivering laser-beam recoil stability and target tracking.",
    pros: ["-Heavy recoil dampening", "+Flinch resistance"],
    cons: ["-ADS speed", "-Sprint speed"],
    statModifiers: { recoilVertical: -0.007, recoilHorizontal: -0.004, moveSpeedMultiplier: 0.95, adsSpeedMultiplier: 0.92 },
  },
};

// PERKS REGISTRY
export const PERKS: Record<string, Perk> = {
  double_time: {
    id: "double_time",
    name: "Double Time",
    slot: 1,
    description: "Doubles the duration of tactical sprint. Increases knee-slide speed and jump momentum by 30%.",
    iconName: "Zap",
    color: "#3b82f6",
  },
  scavenger: {
    id: "scavenger",
    name: "Scavenger",
    slot: 1,
    description: "Resupply full weapon ammunition and tactical armor plates from eliminated enemy satchels.",
    iconName: "Package",
    color: "#3b82f6",
  },
  overkill: {
    id: "overkill",
    name: "Overkill",
    slot: 1,
    description: "Carry two primary weapons simultaneously (e.g. M4A1 Assault Rifle + Barrett .50 CAL Sniper).",
    iconName: "Crosshair",
    color: "#3b82f6",
  },
  ghost: {
    id: "ghost",
    name: "Ghost",
    slot: 2,
    description: "Undetectable by enemy UAV radar sweeps, heartbeat sensors, and aerial surveillance sweeps.",
    iconName: "EyeOff",
    color: "#ef4444",
  },
  hardline: {
    id: "hardline",
    name: "Hardline",
    slot: 2,
    description: "Killstreaks and tactical UAV drone calls require 1 less score/elimination to activate.",
    iconName: "Award",
    color: "#ef4444",
  },
  high_alert: {
    id: "high_alert",
    name: "High Alert",
    slot: 2,
    description: "Your peripheral tactical vision pulses with an amber radar glow when enemies look at you from off-screen.",
    iconName: "AlertTriangle",
    color: "#ef4444",
  },
  amped: {
    id: "amped",
    name: "Amped",
    slot: 3,
    description: "Faster weapon swapping speed and lightning-fast tactical grenade throwing animation.",
    iconName: "Repeat",
    color: "#eab308",
  },
  tracker: {
    id: "tracker",
    name: "Tracker",
    slot: 3,
    description: "Enemies leave a visible glowing tactical footprint trail on the ground for 6 seconds.",
    iconName: "Footprints",
    color: "#eab308",
  },
  battle_hardened: {
    id: "battle_hardened",
    name: "Battle Hardened",
    slot: 3,
    description: "Reduces flashbang, concussion, and explosion screen disruption by 75%.",
    iconName: "Shield",
    color: "#eab308",
  },
};

/**
 * Procedural 3D Weapon Model Generator with Real Dynamic Attachments
 */
export function createWeaponMesh(
  weaponId: string,
  attachments: Partial<Record<AttachmentCategory, string>> = {}
): {
  root: THREE.Group;
  muzzleFlash: THREE.PointLight;
  flashMesh: THREE.Mesh;
  sightPoint: THREE.Vector3;
  laserBeam?: THREE.Line;
} {
  const root = new THREE.Group();

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d1b,
    metalness: 0.85,
    roughness: 0.35,
  });

  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x0f1110,
    metalness: 0.2,
    roughness: 0.8,
  });

  const metalAccent = new THREE.MeshStandardMaterial({
    color: 0x3d3831,
    metalness: 0.7,
    roughness: 0.45,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xdde2e6,
    metalness: 0.95,
    roughness: 0.15,
  });

  let sightPoint = new THREE.Vector3(0, 0.078, -0.15);
  let muzzlePos = new THREE.Vector3(0, 0.02, -0.9);

  // BASE WEAPON GEOMETRY
  if (weaponId === "BARRETT") {
    // Heavy Sniper Rifle
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.65), darkMat);
    receiver.position.set(0, 0, -0.15);
    root.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.85, 12), darkMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.8);
    root.add(barrel);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.2, 0.14), darkMat);
    mag.position.set(0, -0.12, -0.05);
    mag.rotation.x = 0.15;
    root.add(mag);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.07), gripMat);
    grip.position.set(0, -0.1, 0.12);
    grip.rotation.x = -0.3;
    root.add(grip);

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.12, 0.32), darkMat);
    stock.position.set(0, 0, 0.3);
    root.add(stock);

    muzzlePos.set(0, 0.02, -1.25);
    sightPoint.set(0, 0.115, -0.15);
  } else if (weaponId === "MP5" || weaponId === "VECTOR") {
    // SMG Compact Profile
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.42), darkMat);
    receiver.position.set(0, 0, -0.1);
    root.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.28, 12), darkMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, -0.42);
    root.add(barrel);

    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.07, 0.22), gripMat);
    handguard.position.set(0, 0.01, -0.32);
    root.add(handguard);

    const magGeo = attachments.magazine === "mag_drum60"
      ? new THREE.CylinderGeometry(0.08, 0.08, 0.09, 16)
      : new THREE.BoxGeometry(0.038, 0.24, 0.05);
    const mag = new THREE.Mesh(magGeo, darkMat);
    if (attachments.magazine === "mag_drum60") {
      mag.rotation.x = Math.PI / 2;
      mag.position.set(0, -0.12, -0.06);
    } else {
      mag.position.set(0, -0.12, -0.06);
      mag.rotation.x = 0.25;
    }
    root.add(mag);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.13, 0.06), gripMat);
    grip.position.set(0, -0.08, 0.06);
    grip.rotation.x = -0.35;
    root.add(grip);

    if (attachments.stock !== "stock_nostock") {
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.2), darkMat);
      stock.position.set(0, -0.01, 0.18);
      root.add(stock);
    }

    muzzlePos.set(0, 0.015, -0.58);
    sightPoint.set(0, 0.072, -0.1);
  } else if (weaponId === "ORIGIN12") {
    // Tactical Shotgun
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.48), darkMat);
    receiver.position.set(0, 0, -0.1);
    root.add(receiver);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.45, 12), darkMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.025, -0.52);
    root.add(barrel);

    const drumMag = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 16), darkMat);
    drumMag.rotation.x = Math.PI / 2;
    drumMag.position.set(0, -0.12, -0.08);
    root.add(drumMag);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.065), gripMat);
    grip.position.set(0, -0.09, 0.1);
    grip.rotation.x = -0.3;
    root.add(grip);

    muzzlePos.set(0, 0.025, -0.76);
    sightPoint.set(0, 0.08, -0.1);
  } else if (weaponId === "DEAGLE" || weaponId === "RENETTI") {
    // Handgun / Tactical Pistol
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.24), chromeMat);
    slide.position.set(0, 0.03, -0.06);
    root.add(slide);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.05, 0.2), darkMat);
    frame.position.set(0, -0.01, -0.05);
    root.add(frame);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.13, 0.06), gripMat);
    grip.position.set(0, -0.09, 0.02);
    grip.rotation.x = -0.3;
    root.add(grip);

    muzzlePos.set(0, 0.03, -0.2);
    sightPoint.set(0, 0.065, -0.06);
  } else if (weaponId === "KNIFE") {
    // Combat Knife
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.26), chromeMat);
    blade.position.set(0, 0.02, -0.14);
    root.add(blade);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.14), gripMat);
    handle.position.set(0, 0, 0.02);
    root.add(handle);

    sightPoint.set(0, 0.05, -0.1);
    muzzlePos.set(0, 0, -0.3);
  } else {
    // Standard M4A1 / KAG6 Assault Rifle
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.52), darkMat);
    receiver.position.set(0, 0, -0.1);
    root.add(receiver);

    // Barrel length modified by barrel attachment
    const isLongBarrel = attachments.barrel === "barrel_long";
    const isCQBBarrel = attachments.barrel === "barrel_cqb";
    const barrelLength = isLongBarrel ? 0.65 : isCQBBarrel ? 0.32 : 0.48;
    const barrelZ = -0.36 - barrelLength / 2;

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, barrelLength, 12), darkMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, barrelZ);
    root.add(barrel);

    // Handguard
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.075, barrelLength * 0.7), metalAccent);
    handguard.position.set(0, 0.015, -0.36 - (barrelLength * 0.7) / 2);
    root.add(handguard);

    // Magazine
    const isExtended = attachments.magazine === "mag_extended45";
    const isDrum = attachments.magazine === "mag_drum60";
    if (isDrum) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16), darkMat);
      drum.rotation.x = Math.PI / 2;
      drum.position.set(0, -0.12, -0.06);
      root.add(drum);
    } else {
      const magHeight = isExtended ? 0.28 : 0.2;
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, magHeight, 0.08), metalAccent);
      mag.position.set(0, -0.06 - magHeight / 2, -0.06);
      mag.rotation.x = 0.2;
      root.add(mag);
    }

    // Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.15, 0.065), gripMat);
    grip.position.set(0, -0.1, 0.08);
    grip.rotation.x = -0.35;
    root.add(grip);

    // Stock
    if (attachments.stock !== "stock_nostock") {
      const isHeavy = attachments.stock === "stock_heavy";
      const stock = new THREE.Mesh(
        new THREE.BoxGeometry(isHeavy ? 0.075 : 0.06, isHeavy ? 0.14 : 0.11, 0.26),
        isHeavy ? darkMat : metalAccent
      );
      stock.position.set(0, -0.01, 0.24);
      root.add(stock);
    }

    muzzlePos.set(0, 0.015, barrelZ - barrelLength / 2);
  }

  // ATTACHMENT: MUZZLE (Suppressor or Compensator)
  if (attachments.muzzle === "muzzle_suppressor") {
    const suppressor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: 0x111311, metalness: 0.9, roughness: 0.2 })
    );
    suppressor.rotation.x = Math.PI / 2;
    suppressor.position.copy(muzzlePos).add(new THREE.Vector3(0, 0, -0.11));
    root.add(suppressor);
    muzzlePos.z -= 0.22;
  } else if (attachments.muzzle === "muzzle_compensator") {
    const comp = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.038, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.3 })
    );
    comp.position.copy(muzzlePos).add(new THREE.Vector3(0, 0, -0.04));
    root.add(comp);
    muzzlePos.z -= 0.08;
  }

  // ATTACHMENT: UNDERBARREL (Foregrip or Laser)
  let laserBeam: THREE.Line | undefined;
  if (attachments.underbarrel === "underbarrel_commando" || attachments.underbarrel === "underbarrel_merc") {
    const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.05), gripMat);
    foregrip.position.set(0, -0.08, -0.38);
    if (attachments.underbarrel === "underbarrel_commando") {
      foregrip.rotation.x = -0.3; // angled
    }
    root.add(foregrip);
  } else if (attachments.underbarrel === "underbarrel_laser") {
    // 5mW Green Laser Module
    const laserModule = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.025, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x1e2420, metalness: 0.8, roughness: 0.3 })
    );
    laserModule.position.set(0.045, 0.015, -0.36);
    root.add(laserModule);

    // Green Laser line geometry
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.045, 0.015, -0.39),
      new THREE.Vector3(0.045, 0.015, -35),
    ]);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.75,
      linewidth: 2,
    });
    laserBeam = new THREE.Line(laserGeo, laserMat);
    root.add(laserBeam);
  }

  // ATTACHMENT: OPTIC
  if (attachments.optic === "optic_reddot") {
    // Reflex Red Dot Sight
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.02, 0.07), darkMat);
    sightBase.position.set(0, 0.06, -0.15);
    root.add(sightBase);

    const sightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.045, 0.01), darkMat);
    sightFrame.position.set(0, 0.085, -0.15);
    root.add(sightFrame);

    const glassMat = new THREE.MeshBasicMaterial({ color: 0x114422, transparent: true, opacity: 0.35 });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.034, 0.005), glassMat);
    glass.position.set(0, 0.085, -0.15);
    root.add(glass);

    const dotMat = new THREE.MeshBasicMaterial({ color: 0xff0022 });
    const redDot = new THREE.Mesh(new THREE.SphereGeometry(0.002, 8, 8), dotMat);
    redDot.position.set(0, 0.085, -0.152);
    root.add(redDot);

    sightPoint.set(0, 0.085, -0.15);
  } else if (attachments.optic === "optic_holo") {
    // Holographic Holo-Sight
    const holoHood = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.058, 0.09), darkMat);
    holoHood.position.set(0, 0.082, -0.14);
    root.add(holoHood);

    const glassMat = new THREE.MeshBasicMaterial({ color: 0x0a2a1a, transparent: true, opacity: 0.4 });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.04, 0.005), glassMat);
    glass.position.set(0, 0.085, -0.14);
    root.add(glass);

    const reticleMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
    const reticleRing = new THREE.Mesh(new THREE.RingGeometry(0.004, 0.0055, 16), reticleMat);
    reticleRing.position.set(0, 0.085, -0.142);
    root.add(reticleRing);

    const reticleDot = new THREE.Mesh(new THREE.SphereGeometry(0.0015, 8, 8), reticleMat);
    reticleDot.position.set(0, 0.085, -0.142);
    root.add(reticleDot);

    sightPoint.set(0, 0.085, -0.14);
  } else if (attachments.optic === "optic_acog" || attachments.optic === "optic_thermal") {
    // 3.5x ACOG / Thermal Scope Tube
    const scopeTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.026, 0.16, 16),
      attachments.optic === "optic_thermal"
        ? new THREE.MeshStandardMaterial({ color: 0x223344, metalness: 0.8, roughness: 0.3 })
        : darkMat
    );
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.088, -0.14);
    root.add(scopeTube);

    const lensMat = new THREE.MeshBasicMaterial({
      color: attachments.optic === "optic_thermal" ? 0x00ffff : 0x112233,
      transparent: true,
      opacity: 0.65,
    });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), lensMat);
    lens.position.set(0, 0.088, -0.06);
    root.add(lens);

    sightPoint.set(0, 0.088, -0.14);
  } else if (weaponId !== "BARRETT") {
    // Standard Iron Sights
    const frontPost = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.025, 0.015), darkMat);
    frontPost.position.set(0, 0.065, -0.45);
    root.add(frontPost);

    const rearNotch = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.015), darkMat);
    rearNotch.position.set(0, 0.065, -0.05);
    root.add(rearNotch);

    sightPoint.set(0, 0.065, -0.15);
  }

  // Muzzle flash light & sprite
  const muzzleFlash = new THREE.PointLight(0xffaa33, 0, 8);
  muzzleFlash.position.copy(muzzlePos);
  root.add(muzzleFlash);

  const flashGeo = new THREE.OctahedronGeometry(0.12, 1);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffdd44,
    transparent: true,
    opacity: 0,
  });
  const flashMesh = new THREE.Mesh(flashGeo, flashMat);
  flashMesh.position.copy(muzzlePos).add(new THREE.Vector3(0, 0, -0.02));
  root.add(flashMesh);

  return { root, muzzleFlash, flashMesh, sightPoint, laserBeam };
}

/**
 * Calculates modified weapon stats based on active attachments
 */
export function computeModifiedWeaponStats(
  baseWeapon: Weapon,
  attachments: Partial<Record<AttachmentCategory, string>> = {}
): Weapon {
  const modified = { ...baseWeapon };

  Object.values(attachments).forEach((attId) => {
    if (!attId) return;
    const att = ATTACHMENTS[attId];
    if (!att || !att.statModifiers) return;

    const mods = att.statModifiers;
    if (mods.damage) modified.damage += mods.damage;
    if (mods.fireRate) modified.fireRate += mods.fireRate;
    if (mods.range) modified.range += mods.range;
    if (mods.recoilVertical) modified.recoilVertical = Math.max(0.004, modified.recoilVertical + mods.recoilVertical);
    if (mods.recoilHorizontal) modified.recoilHorizontal = Math.max(0.002, modified.recoilHorizontal + mods.recoilHorizontal);
    if (mods.spread) modified.spread = Math.max(0.004, modified.spread + mods.spread);
    if (mods.adsFov) modified.adsFov += mods.adsFov;
    if (mods.magSize) {
      modified.magSize += mods.magSize;
      modified.currentAmmo = modified.magSize;
      modified.reserveAmmo = modified.magSize * 4;
    }
    if (mods.reloadTime) modified.reloadTime = Math.max(0.8, modified.reloadTime + mods.reloadTime);
  });

  return modified;
}
