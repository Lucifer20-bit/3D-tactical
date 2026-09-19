export interface Weapon {
  id: string;
  name: string;
  category: "AR" | "SMG" | "SNIPER" | "SHOTGUN" | "PISTOL" | "MELEE" | "LAUNCHER";
  damage: number;
  fireRate: number; // RPM
  magSize: number;
  currentAmmo: number;
  reserveAmmo: number;
  reloadTime: number; // in seconds
  range: number;
  adsFov: number; // degrees
  recoilVertical: number;
  recoilHorizontal: number;
  spread: number;
  isAutomatic: boolean;
  pellets?: number;
  isSecondary?: boolean;
}

export type AttachmentCategory = "optic" | "muzzle" | "barrel" | "underbarrel" | "magazine" | "stock";

export interface Attachment {
  id: string;
  name: string;
  category: AttachmentCategory;
  description: string;
  pros: string[];
  cons: string[];
  statModifiers: {
    damage?: number;
    fireRate?: number;
    range?: number;
    recoilVertical?: number;
    recoilHorizontal?: number;
    spread?: number;
    adsFov?: number;
    magSize?: number;
    reloadTime?: number;
    moveSpeedMultiplier?: number;
    adsSpeedMultiplier?: number;
  };
}

export interface Perk {
  id: string;
  name: string;
  slot: 1 | 2 | 3;
  description: string;
  iconName: string;
  color: string;
}

export interface CustomLoadout {
  id: string;
  name: string;
  primaryWeaponId: string;
  primaryAttachments: Partial<Record<AttachmentCategory, string>>;
  secondaryWeaponId: string;
  secondaryAttachments: Partial<Record<AttachmentCategory, string>>;
  perks: [string, string, string]; // perk IDs for slot 1, 2, 3
  lethal: "frag" | "semtex";
  tactical: "stim" | "flash" | "smoke";
}

export type RankDivision =
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Grandmaster"
  | "Top 250";

export interface MatchHistoryItem {
  id: string;
  timestamp: number;
  gameMode: "Casual" | "Ranked";
  mapName: string;
  result: "VICTORY" | "DEFEAT" | "DRAW";
  score: { friendly: number; enemy: number };
  kills: number;
  deaths: number;
  damageDealt: number;
  srChange: number;
}

export interface RankedProfile {
  division: RankDivision;
  tier: 1 | 2 | 3;
  sr: number; // Skill Rating points
  topSr: number;
  wins: number;
  losses: number;
  winStreak: number;
  kills: number;
  deaths: number;
  headshots: number;
  shotsFired: number;
  shotsHit: number;
  matchesHistory: MatchHistoryItem[];
}

export interface PlayerNetState {
  id: string;
  name: string;
  team: "alpha" | "bravo";
  isBot: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  health: number;
  armor: number; // 0 to 150
  plates: number; // 0 to 5
  isAlive: boolean;
  isSliding: boolean;
  isSprinting: boolean;
  isADS: boolean;
  isFiring: boolean;
  selectedWeapon: string;
  kills: number;
  deaths: number;
  score: number;
  ping: number;
  rankDivision?: RankDivision;
}

export interface KillfeedEntry {
  id: string;
  attackerName: string;
  attackerTeam: "alpha" | "bravo";
  targetName: string;
  targetTeam: "alpha" | "bravo";
  weapon: string;
  isHeadshot: boolean;
  timestamp: number;
}

export interface Hitmarker {
  id: string;
  isKill: boolean;
  isHeadshot: boolean;
  timestamp: number;
}

export interface DamageIndicator {
  id: string;
  angle: number; // in radians relative to player yaw
  timestamp: number;
}

export interface GameSettings {
  lookSensitivity: number;
  adsSensitivity: number;
  invertY: boolean;
  gyroEnabled: boolean;
  graphicsQuality: "low" | "medium" | "high";
  fov: number;
  sfxVolume: number;
  touchControlsOpacity: number;
  haptics: boolean;
  bloodEffects: boolean;
}

export type SpectatorCameraMode = "first_person" | "third_person" | "free_cam";
