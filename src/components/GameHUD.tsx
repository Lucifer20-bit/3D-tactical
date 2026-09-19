import React from "react";
import { Shield, Heart, Wifi, Volume2, VolumeX, Settings, Trophy, Radio, Target, Crosshair, Eye, Flame, Zap } from "lucide-react";
import { Weapon, KillfeedEntry, Hitmarker, DamageIndicator, PlayerNetState, CustomLoadout } from "../types";

interface GameHUDProps {
  health: number;
  armor: number; // 0 to 150
  plates: number; // 0 to 5
  weapon: Weapon;
  isReloading: boolean;
  reloadProgress: number;
  isSliding: boolean;
  isSprinting: boolean;
  isADS: boolean;
  ping: number;
  alphaScore: number;
  bravoScore: number;
  scoreLimit: number;
  team: "alpha" | "bravo";
  killfeed: KillfeedEntry[];
  hitmarkers: Hitmarker[];
  damageIndicators: DamageIndicator[];
  uavActive: boolean;
  uavProgress: number;
  players: PlayerNetState[];
  playerYaw: number;
  playerPos: { x: number; z: number };
  onOpenSettings: () => void;
  onOpenScoreboard: () => void;
  onOpenGunsmith?: () => void;
  onOpenRanked?: () => void;
  onOpenSpectator?: () => void;
  isRanked?: boolean;
  rankedDivision?: string;
  activeLoadout?: CustomLoadout;
  isMuted: boolean;
  onToggleMute: () => void;
  matchWinner: "alpha" | "bravo" | null;
  onRestartMatch: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  health,
  armor,
  plates,
  weapon,
  isReloading,
  reloadProgress,
  isSliding,
  isSprinting,
  isADS,
  ping,
  alphaScore,
  bravoScore,
  scoreLimit,
  team,
  killfeed,
  hitmarkers,
  damageIndicators,
  uavActive,
  uavProgress,
  players,
  playerYaw,
  playerPos,
  onOpenSettings,
  onOpenScoreboard,
  onOpenGunsmith,
  onOpenRanked,
  onOpenSpectator,
  isRanked = false,
  rankedDivision = "Gold II",
  activeLoadout,
  isMuted,
  onToggleMute,
  matchWinner,
  onRestartMatch,
}) => {
  const isCriticalHealth = health < 35 && health > 0;
  const isDead = health <= 0;

  // Calculate ping status color
  const pingColor = ping < 40 ? "text-emerald-400" : ping < 90 ? "text-amber-400" : "text-red-400";

  return (
    <div id="game-hud-overlay" className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden font-sans">
      {/* 1. Critical Health Blood Vignette & Screen Shake */}
      {isCriticalHealth && (
        <div className="absolute inset-0 pointer-events-none border-[12px] border-red-700/60 shadow-[inset_0_0_90px_rgba(200,0,0,0.7)] animate-pulse" />
      )}

      {/* Dead Screen Overlay */}
      {isDead && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-auto z-40">
          <div className="text-red-600 font-extrabold text-4xl tracking-widest uppercase animate-bounce font-mono">
            K.I.A. - ELIMINATED
          </div>
          <div className="text-zinc-300 text-sm mt-2 font-mono">Tactical insertion in progress...</div>
          <div className="w-48 h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-500 animate-[pulse_1s_infinite]" />
          </div>
        </div>
      )}

      {/* Match Victory / Defeat Screen */}
      {matchWinner && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto z-50 animate-in fade-in duration-300">
          <Trophy className={`w-16 h-16 mb-2 ${matchWinner === team ? "text-yellow-400" : "text-zinc-500"}`} />
          <div
            className={`text-5xl font-black tracking-widest uppercase font-mono ${
              matchWinner === team ? "text-yellow-400" : "text-red-500"
            }`}
          >
            {matchWinner === team ? "VICTORY" : "DEFEAT"}
          </div>
          <div className="text-zinc-300 text-base mt-2 font-mono">
            Final Score: Alpha {alphaScore} — Bravo {bravoScore}
          </div>
          <button
            id="btn-hud-restart-match"
            type="button"
            onClick={onRestartMatch}
            className="mt-6 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase tracking-wider transition-transform active:scale-95 shadow-lg shadow-amber-500/40"
          >
            Play Next Round
          </button>
        </div>
      )}

      {/* 2. Top Bar: Match Scoreboard Header & Ping */}
      <div className="absolute top-2 left-0 right-0 flex justify-between items-start px-3 pointer-events-auto">
        {/* Left: Mini Radar & Ping Meter */}
        <div className="flex items-start gap-2">
          {/* Tactical Mini-Map Radar */}
          <div className="relative w-22 h-22 sm:w-26 sm:h-26 rounded-full border border-zinc-600/80 bg-zinc-950/80 backdrop-blur-xs overflow-hidden shadow-lg shadow-black/60">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-zinc-700/50" />
              <div className="h-full w-px bg-zinc-700/50 absolute" />
              <div className="w-14 h-14 rounded-full border border-zinc-700/40" />
            </div>

            {/* UAV Sweep Scan Wave */}
            {uavActive && (
              <div
                className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-full origin-center animate-spin"
                style={{ animationDuration: "2s" }}
              />
            )}

            {/* Center Player Icon with View Cone */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ transform: `translate(-50%, -50%) rotate(${playerYaw}rad)` }}
            >
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400" />
            </div>

            {/* Blips of Other Players */}
            {players.map((p) => {
              if (!p.isAlive) return null;
              const isFriendly = p.team === team;
              const relX = (p.x - playerPos.x) * 1.6;
              const relZ = (p.z - playerPos.z) * 1.6;

              // Only show enemies if UAV is active or firing, friendly always visible
              const showBlip = isFriendly || uavActive || p.isFiring;
              if (!showBlip) return null;

              return (
                <div
                  key={p.id}
                  className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                    isFriendly ? "bg-cyan-400 ring-1 ring-cyan-200" : "bg-red-500 ring-1 ring-red-300 animate-ping"
                  }`}
                  style={{
                    left: `${50 + relX}%`,
                    top: `${50 + relZ}%`,
                  }}
                />
              );
            })}
          </div>

          {/* Network Latency Meter */}
          <div className="bg-black/60 backdrop-blur-xs border border-zinc-800 rounded px-2 py-1 flex items-center gap-1.5 text-[11px] font-mono">
            <Wifi className={`w-3.5 h-3.5 ${pingColor}`} />
            <span className={pingColor}>{ping}ms</span>
            <span className="text-zinc-500 text-[9px] uppercase hidden sm:inline">LOW-LAT</span>
          </div>
        </div>

        {/* Center: Team Score Progress Bar */}
        <button
          id="btn-hud-scoreboard"
          type="button"
          onClick={onOpenScoreboard}
          className="flex flex-col items-center bg-black/75 backdrop-blur-xs border border-zinc-800 px-4 py-1.5 rounded-lg shadow-md hover:border-zinc-600 transition-colors"
        >
          <div className="flex items-center gap-3 text-xs font-mono font-bold tracking-wider">
            {/* Friendly Score */}
            <div className="flex items-center gap-1 text-cyan-400">
              <span className="text-[10px] text-zinc-400 uppercase">ALPHA</span>
              <span className="text-base font-extrabold">{alphaScore}</span>
            </div>
            <span className="text-zinc-600 font-bold">/</span>
            <span className="text-[11px] text-amber-400 font-bold">{scoreLimit}</span>
            <span className="text-zinc-600 font-bold">/</span>
            {/* Enemy Score */}
            <div className="flex items-center gap-1 text-red-500">
              <span className="text-base font-extrabold">{bravoScore}</span>
              <span className="text-[10px] text-zinc-400 uppercase">BRAVO</span>
            </div>
          </div>

          {/* Comparative Progress Bar */}
          <div className="w-36 h-1.5 bg-zinc-800 rounded-full mt-1 flex overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-300"
              style={{ width: `${(alphaScore / scoreLimit) * 100}%` }}
            />
            <div className="flex-1 bg-zinc-800" />
            <div
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${(bravoScore / scoreLimit) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isRanked && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 uppercase font-mono font-bold">
                RANKED • {rankedDivision}
              </span>
            )}
            <span className="text-[9px] text-zinc-400 uppercase font-mono">TDM • Tap for Roster</span>
          </div>
        </button>

        {/* Right: Quick Controls & Killfeed */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 pointer-events-auto">
            {onOpenGunsmith && (
              <button
                id="btn-hud-gunsmith"
                type="button"
                onClick={onOpenGunsmith}
                title="Gunsmith Custom Loadouts"
                className="px-2 py-1 rounded bg-black/60 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 text-xs font-mono font-bold flex items-center gap-1 transition"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">GUNSMITH</span>
              </button>
            )}

            {onOpenRanked && (
              <button
                id="btn-hud-ranked"
                type="button"
                onClick={onOpenRanked}
                title="Ranked Matches & Progression"
                className="px-2 py-1 rounded bg-black/60 border border-amber-500/40 text-yellow-400 hover:bg-yellow-500/20 text-xs font-mono font-bold flex items-center gap-1 transition"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px]">RANKED</span>
              </button>
            )}

            {onOpenSpectator && (
              <button
                id="btn-hud-spectator"
                type="button"
                onClick={onOpenSpectator}
                title="Spectator Broadcast Mode"
                className="p-1.5 rounded bg-black/60 border border-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <Eye className="w-4 h-4 text-sky-400" />
              </button>
            )}

            <button
              id="btn-hud-audio-toggle"
              type="button"
              onClick={onToggleMute}
              className="p-1.5 rounded bg-black/60 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              id="btn-hud-settings"
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded bg-black/60 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Killfeed */}
          <div className="flex flex-col gap-1 items-end max-w-[200px] pointer-events-none">
            {killfeed.slice(-4).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-1.5 bg-black/65 border border-zinc-800/80 px-2 py-0.5 rounded text-[11px] font-mono leading-none animate-in slide-in-from-right duration-200"
              >
                <span className={entry.attackerTeam === team ? "text-cyan-400 font-bold" : "text-red-400 font-bold"}>
                  {entry.attackerName}
                </span>
                <span className="text-[9px] px-1 py-0.2 bg-zinc-800 text-zinc-300 rounded uppercase font-sans">
                  {entry.weapon}
                </span>
                {entry.isHeadshot && <span className="text-[10px] text-yellow-400">🎯</span>}
                <span className={entry.targetTeam === team ? "text-cyan-400" : "text-red-400"}>
                  {entry.targetName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Center Screen: Dynamic Call of Duty Crosshair / Hitmarkers / Damage Indicators */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Dynamic Crosshair (spreads during sprint, shrinks when ADS or crouch) */}
        {!isADS && (
          <div
            className={`relative flex items-center justify-center transition-all duration-100 ${
              isSprinting ? "w-10 h-10 opacity-70" : isSliding ? "w-7 h-7 opacity-90" : "w-6 h-6 opacity-85"
            }`}
          >
            {/* Center dot */}
            <div className="w-1 h-1 rounded-full bg-white/90 drop-shadow" />
            {/* 4 Ticks */}
            <div className="absolute top-0 w-0.5 h-2 bg-white/90 shadow-sm" />
            <div className="absolute bottom-0 w-0.5 h-2 bg-white/90 shadow-sm" />
            <div className="absolute left-0 h-0.5 w-2 bg-white/90 shadow-sm" />
            <div className="absolute right-0 h-0.5 w-2 bg-white/90 shadow-sm" />
          </div>
        )}

        {/* Sniper Scope / Red Dot Optic Overlay when ADS */}
        {isADS && weapon.category === "SNIPER" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            {/* Darkened vignette around scope */}
            <div className="w-[85vmin] h-[85vmin] rounded-full border-[180px] border-black relative flex items-center justify-center overflow-hidden">
              {/* Precision Crosshair Lines */}
              <div className="w-full h-[1.5px] bg-red-600/90 absolute" />
              <div className="h-full w-[1.5px] bg-red-600/90 absolute" />
              {/* Mil-dot Range Ticks */}
              {[-60, -30, 30, 60].map((offset) => (
                <div key={offset} className="absolute w-3 h-[1px] bg-red-400" style={{ transform: `translateY(${offset}px)` }} />
              ))}
              <div className="w-3 h-3 rounded-full border border-red-500" />
            </div>
          </div>
        )}

        {/* Call of Duty Iconic Hitmarkers */}
        {hitmarkers.slice(-3).map((hm) => (
          <div
            key={hm.id}
            className={`absolute pointer-events-none animate-out fade-out zoom-out duration-150 ${
              hm.isKill
                ? "text-red-600 scale-150 font-black text-2xl drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]"
                : hm.isHeadshot
                ? "text-yellow-400 scale-125 font-black text-xl drop-shadow-[0_0_8px_rgba(255,200,0,0.8)]"
                : "text-white scale-100 font-bold text-lg drop-shadow"
            }`}
          >
            ✕
          </div>
        ))}

        {/* Directional Damage Indicators */}
        {damageIndicators.slice(-2).map((di) => (
          <div
            key={di.id}
            className="absolute w-44 h-44 rounded-full pointer-events-none animate-out fade-out duration-500"
            style={{ transform: `rotate(${di.angle}rad)` }}
          >
            <div className="w-12 h-3 bg-red-600/90 rounded-full mx-auto shadow-[0_0_12px_rgba(255,0,0,0.9)]" />
          </div>
        ))}
      </div>

      {/* 4. Bottom Left: Health, Armor Plates (Warzone / Bloodstrike 3-Pip Vest) */}
      <div className="absolute left-4 bottom-4 flex flex-col gap-1.5 pointer-events-none">
        {/* Kinetic Movement Notification (Bloodstrike signature) */}
        {isSliding && (
          <div className="px-2.5 py-0.5 rounded bg-amber-500/90 text-black font-extrabold text-[10px] tracking-widest uppercase self-start animate-bounce shadow-md">
            ⚡ TACTICAL SLIDE
          </div>
        )}
        {isSprinting && !isSliding && (
          <div className="px-2 py-0.5 rounded bg-sky-500/80 text-black font-bold text-[9px] tracking-widest uppercase self-start">
            TAC SPRINT
          </div>
        )}

        {/* 3 Armor Pips (0-150: 3 bars of 50 each) */}
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="flex gap-1">
            {[0, 1, 2].map((pipIndex) => {
              const pipFill = Math.max(0, Math.min(50, armor - pipIndex * 50));
              const pct = (pipFill / 50) * 100;
              return (
                <div
                  key={pipIndex}
                  className="w-10 h-2 bg-zinc-900/80 border border-blue-900/60 rounded-xs overflow-hidden"
                >
                  <div
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>
          <span className="text-[10px] font-mono text-blue-300 font-bold ml-0.5">{armor}</span>
        </div>

        {/* Health Bar (0-100) */}
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-red-500 shrink-0" />
          <div className="w-32 h-2.5 bg-zinc-900/80 border border-red-950/80 rounded-xs overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                health > 50 ? "bg-emerald-500" : health > 25 ? "bg-amber-500" : "bg-red-600"
              }`}
              style={{ width: `${Math.max(0, health)}%` }}
            />
          </div>
          <span className="text-[11px] font-mono font-extrabold text-zinc-100 ml-0.5">{health}</span>
        </div>
      </div>

      {/* 5. Bottom Right: Active Weapon & Ammo Counter */}
      <div className="absolute right-4 bottom-4 flex flex-col items-end pointer-events-none">
        {/* Reloading Bar */}
        {isReloading && (
          <div className="mb-1 flex flex-col items-end">
            <span className="text-[10px] text-amber-400 uppercase font-mono font-bold tracking-wider">
              RELOADING...
            </span>
            <div className="w-28 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all"
                style={{ width: `${reloadProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow">
            {weapon.currentAmmo}
          </span>
          <span className="text-zinc-400 font-mono text-base font-bold">/ {weapon.reserveAmmo}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-mono font-bold uppercase tracking-wider">
          <span>{weapon.name}</span>
          <span className="text-[9px] px-1 py-0.2 bg-zinc-800 text-zinc-400 rounded">
            {weapon.category}
          </span>
        </div>
        {activeLoadout && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-amber-400/90">
            <span className="font-bold">{activeLoadout.name}</span>
            <span className="text-white/30">•</span>
            <span className="text-white/60 uppercase">{activeLoadout.tactical} / {activeLoadout.lethal}</span>
          </div>
        )}
      </div>
    </div>
  );
};
