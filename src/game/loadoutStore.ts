import { CustomLoadout, RankedProfile, RankDivision, MatchHistoryItem } from "../types";

export const DEFAULT_LOADOUTS: CustomLoadout[] = [
  {
    id: "loadout_1",
    name: "Assault Stealth",
    primaryWeaponId: "M4A1",
    primaryAttachments: {
      optic: "optic_reddot",
      muzzle: "muzzle_suppressor",
      barrel: "barrel_long",
      underbarrel: "underbarrel_commando",
      magazine: "mag_extended45",
    },
    secondaryWeaponId: "DEAGLE",
    secondaryAttachments: {
      optic: "optic_reddot",
    },
    perks: ["double_time", "ghost", "amped"],
    lethal: "frag",
    tactical: "stim",
  },
  {
    id: "loadout_2",
    name: "CQB Rusher",
    primaryWeaponId: "MP5",
    primaryAttachments: {
      optic: "optic_holo",
      barrel: "barrel_cqb",
      underbarrel: "underbarrel_laser",
      magazine: "mag_fast",
      stock: "stock_nostock",
    },
    secondaryWeaponId: "KNIFE",
    secondaryAttachments: {},
    perks: ["double_time", "hardline", "tracker"],
    lethal: "semtex",
    tactical: "stim",
  },
  {
    id: "loadout_3",
    name: "Precision Sniper",
    primaryWeaponId: "BARRETT",
    primaryAttachments: {
      optic: "optic_thermal",
      muzzle: "muzzle_suppressor",
      barrel: "barrel_long",
      stock: "stock_heavy",
    },
    secondaryWeaponId: "RENETTI",
    secondaryAttachments: {
      optic: "optic_reddot",
    },
    perks: ["overkill", "ghost", "battle_hardened"],
    lethal: "frag",
    tactical: "smoke",
  },
  {
    id: "loadout_4",
    name: "Heavy Gunner",
    primaryWeaponId: "KAG6",
    primaryAttachments: {
      optic: "optic_acog",
      muzzle: "muzzle_compensator",
      underbarrel: "underbarrel_merc",
      magazine: "mag_drum60",
      stock: "stock_heavy",
    },
    secondaryWeaponId: "DEAGLE",
    secondaryAttachments: {},
    perks: ["scavenger", "high_alert", "battle_hardened"],
    lethal: "frag",
    tactical: "flash",
  },
  {
    id: "loadout_5",
    name: "Extreme Vector",
    primaryWeaponId: "VECTOR",
    primaryAttachments: {
      optic: "optic_reddot",
      muzzle: "muzzle_compensator",
      underbarrel: "underbarrel_laser",
      magazine: "mag_extended45",
      stock: "stock_nostock",
    },
    secondaryWeaponId: "RENETTI",
    secondaryAttachments: {},
    perks: ["double_time", "ghost", "amped"],
    lethal: "semtex",
    tactical: "stim",
  },
];

const LOADOUTS_STORAGE_KEY = "tactical_fps_custom_loadouts_v1";
const ACTIVE_LOADOUT_KEY = "tactical_fps_active_loadout_id_v1";
const RANKED_PROFILE_KEY = "tactical_fps_ranked_profile_v1";

export function loadSavedLoadouts(): CustomLoadout[] {
  try {
    const saved = localStorage.getItem(LOADOUTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Error loading custom loadouts", e);
  }
  return DEFAULT_LOADOUTS;
}

export function saveLoadouts(loadouts: CustomLoadout[]) {
  try {
    localStorage.setItem(LOADOUTS_STORAGE_KEY, JSON.stringify(loadouts));
  } catch (e) {
    console.warn("Error saving custom loadouts", e);
  }
}

export function getActiveLoadoutId(): string {
  try {
    return localStorage.getItem(ACTIVE_LOADOUT_KEY) || "loadout_1";
  } catch {
    return "loadout_1";
  }
}

export function setActiveLoadoutId(id: string) {
  try {
    localStorage.setItem(ACTIVE_LOADOUT_KEY, id);
  } catch (e) {
    console.warn("Error saving active loadout ID", e);
  }
}

export function getRankDivisionInfo(sr: number): {
  division: RankDivision;
  tier: 1 | 2 | 3;
  minSr: number;
  maxSr: number;
  badgeColor: string;
  nextDivision: string;
} {
  if (sr >= 6500) {
    return { division: "Top 250", tier: 1, minSr: 6500, maxSr: 10000, badgeColor: "#ef4444", nextDivision: "Maximum Rank" };
  }
  if (sr >= 5400) {
    return { division: "Grandmaster", tier: 1, minSr: 5400, maxSr: 6499, badgeColor: "#ec4899", nextDivision: "Top 250" };
  }
  if (sr >= 4500) {
    return { division: "Master", tier: 1, minSr: 4500, maxSr: 5399, badgeColor: "#a855f7", nextDivision: "Grandmaster" };
  }
  if (sr >= 3600) {
    const offset = sr - 3600;
    const tier = (3 - Math.min(2, Math.floor(offset / 300))) as 1 | 2 | 3;
    return { division: "Diamond", tier, minSr: 3600, maxSr: 4499, badgeColor: "#38bdf8", nextDivision: "Master" };
  }
  if (sr >= 2700) {
    const offset = sr - 2700;
    const tier = (3 - Math.min(2, Math.floor(offset / 300))) as 1 | 2 | 3;
    return { division: "Platinum", tier, minSr: 2700, maxSr: 3599, badgeColor: "#2dd4bf", nextDivision: "Diamond" };
  }
  if (sr >= 1800) {
    const offset = sr - 1800;
    const tier = (3 - Math.min(2, Math.floor(offset / 300))) as 1 | 2 | 3;
    return { division: "Gold", tier, minSr: 1800, maxSr: 2699, badgeColor: "#eab308", nextDivision: "Platinum" };
  }
  if (sr >= 900) {
    const offset = sr - 900;
    const tier = (3 - Math.min(2, Math.floor(offset / 300))) as 1 | 2 | 3;
    return { division: "Silver", tier, minSr: 900, maxSr: 1799, badgeColor: "#94a3b8", nextDivision: "Gold" };
  }
  const tier = (3 - Math.min(2, Math.floor(sr / 300))) as 1 | 2 | 3;
  return { division: "Bronze", tier, minSr: 0, maxSr: 899, badgeColor: "#cd7f32", nextDivision: "Silver" };
}

const DEFAULT_RANKED_PROFILE: RankedProfile = {
  division: "Gold",
  tier: 2,
  sr: 2150,
  topSr: 2280,
  wins: 14,
  losses: 8,
  winStreak: 2,
  kills: 248,
  deaths: 162,
  headshots: 68,
  shotsFired: 2100,
  shotsHit: 590,
  matchesHistory: [
    {
      id: "hist_1",
      timestamp: Date.now() - 1000 * 60 * 45,
      gameMode: "Ranked",
      mapName: "Warzone Yard",
      result: "VICTORY",
      score: { friendly: 50, enemy: 38 },
      kills: 18,
      deaths: 9,
      damageDealt: 1840,
      srChange: 35,
    },
    {
      id: "hist_2",
      timestamp: Date.now() - 1000 * 60 * 120,
      gameMode: "Ranked",
      mapName: "Warzone Yard",
      result: "VICTORY",
      score: { friendly: 50, enemy: 44 },
      kills: 15,
      deaths: 11,
      damageDealt: 1610,
      srChange: 28,
    },
    {
      id: "hist_3",
      timestamp: Date.now() - 1000 * 60 * 240,
      gameMode: "Ranked",
      mapName: "Warzone Yard",
      result: "DEFEAT",
      score: { friendly: 41, enemy: 50 },
      kills: 12,
      deaths: 14,
      damageDealt: 1320,
      srChange: -18,
    },
  ],
};

export function loadRankedProfile(): RankedProfile {
  try {
    const saved = localStorage.getItem(RANKED_PROFILE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.sr === "number") return parsed;
    }
  } catch (e) {
    console.warn("Error loading ranked profile", e);
  }
  return DEFAULT_RANKED_PROFILE;
}

export function saveRankedProfile(profile: RankedProfile) {
  try {
    localStorage.setItem(RANKED_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn("Error saving ranked profile", e);
  }
}

export function recordMatchResult(
  isVictory: boolean,
  kills: number,
  deaths: number,
  damageDealt: number,
  friendlyScore: number,
  enemyScore: number,
  isRanked: boolean
): { profile: RankedProfile; srChange: number } {
  const profile = loadRankedProfile();

  let srChange = 0;
  if (isRanked) {
    if (isVictory) {
      // Base victory SR + performance bonus
      const kdRatio = deaths > 0 ? kills / deaths : kills;
      const perfBonus = Math.min(15, Math.floor(kdRatio * 4));
      srChange = 25 + perfBonus;
      profile.wins++;
      profile.winStreak++;
    } else {
      // Defeat SR deduction cushioned slightly by high personal kills
      const cushion = Math.min(6, Math.floor(kills / 4));
      srChange = -(22 - cushion);
      profile.losses++;
      profile.winStreak = 0;
    }

    profile.sr = Math.max(0, profile.sr + srChange);
    profile.topSr = Math.max(profile.topSr, profile.sr);

    const divInfo = getRankDivisionInfo(profile.sr);
    profile.division = divInfo.division;
    profile.tier = divInfo.tier;
  }

  profile.kills += kills;
  profile.deaths += deaths;

  const historyItem: MatchHistoryItem = {
    id: `match_${Date.now()}`,
    timestamp: Date.now(),
    gameMode: isRanked ? "Ranked" : "Casual",
    mapName: "Warzone Yard",
    result: isVictory ? "VICTORY" : "DEFEAT",
    score: { friendly: friendlyScore, enemy: enemyScore },
    kills,
    deaths,
    damageDealt,
    srChange: isRanked ? srChange : 0,
  };

  profile.matchesHistory = [historyItem, ...profile.matchesHistory.slice(0, 9)];
  saveRankedProfile(profile);

  return { profile, srChange };
}
