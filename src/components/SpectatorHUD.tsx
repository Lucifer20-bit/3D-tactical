import React from "react";
import { PlayerNetState, SpectatorCameraMode, KillfeedEntry } from "../types";
import {
  Video,
  Camera,
  Eye,
  ChevronLeft,
  ChevronRight,
  Shield,
  Crosshair,
  User,
  Radio,
  Minimize2,
  ArrowUp,
  ArrowDown,
  Play,
  RotateCcw,
} from "lucide-react";

interface SpectatorHUDProps {
  cameraMode: SpectatorCameraMode;
  onSetCameraMode: (mode: SpectatorCameraMode) => void;
  players: PlayerNetState[];
  spectatedPlayerId: string | null;
  onSelectPlayer: (id: string) => void;
  onNextPlayer: () => void;
  onPrevPlayer: () => void;
  alphaScore: number;
  bravoScore: number;
  scoreLimit: number;
  killfeed: KillfeedEntry[];
  onExitSpectator: () => void;
  flyAltitude: number;
  onChangeAltitude: (delta: number) => void;
  isCinematic: boolean;
  onToggleCinematic: () => void;
}

export const SpectatorHUD: React.FC<SpectatorHUDProps> = ({
  cameraMode,
  onSetCameraMode,
  players,
  spectatedPlayerId,
  onSelectPlayer,
  onNextPlayer,
  onPrevPlayer,
  alphaScore,
  bravoScore,
  scoreLimit,
  killfeed,
  onExitSpectator,
  flyAltitude,
  onChangeAltitude,
  isCinematic,
  onToggleCinematic,
}) => {
  const spectatedPlayer = players.find((p) => p.id === spectatedPlayerId) || players[0];

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between font-sans select-none">
      {/* Top Broadcast Bar */}
      <div className="p-4 flex items-start justify-between">
        {/* Live Broadcast Indicator */}
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-red-600/90 text-white font-black text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-red-600/30">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>LIVE SPECTATOR</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-white/70 text-xs font-mono flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>BANDWIDTH: LOW (PASSIVE 12Kbps)</span>
          </div>
        </div>

        {/* Match Scores Banner */}
        <div className="pointer-events-auto flex items-center bg-black/70 backdrop-blur border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-5 py-2 bg-blue-600/30 border-r border-white/10 text-center min-w-[70px]">
            <span className="text-[10px] font-mono font-bold text-blue-400 block">ALPHA</span>
            <span className="text-xl font-black text-white">{alphaScore}</span>
          </div>
          <div className="px-4 text-center">
            <span className="text-[10px] font-mono text-white/50 block">TARGET</span>
            <span className="text-xs font-bold text-white/80">{scoreLimit}</span>
          </div>
          <div className="px-5 py-2 bg-red-600/30 border-l border-white/10 text-center min-w-[70px]">
            <span className="text-[10px] font-mono font-bold text-red-400 block">BRAVO</span>
            <span className="text-xl font-black text-white">{bravoScore}</span>
          </div>
        </div>

        {/* Exit to Play Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleCinematic}
            className={`p-2.5 rounded-xl border backdrop-blur transition ${
              isCinematic
                ? "bg-amber-500/20 border-amber-500 text-amber-400"
                : "bg-black/60 border-white/10 text-white/70 hover:text-white"
            }`}
            title="Toggle Cinematic Letterboxing"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={onExitSpectator}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>JOIN AS PLAYER</span>
          </button>
        </div>
      </div>

      {/* Middle Floating Killfeed */}
      {!isCinematic && (
        <div className="absolute top-20 right-4 pointer-events-none space-y-1.5 w-64">
          {killfeed.slice(-4).map((k) => (
            <div
              key={k.id}
              className="p-2 rounded-lg bg-black/75 backdrop-blur border border-white/10 text-[11px] flex items-center justify-between text-white animate-in slide-in-from-right-4 duration-200"
            >
              <span className={k.attackerTeam === "alpha" ? "text-blue-400 font-bold" : "text-red-400 font-bold"}>
                {k.attackerName}
              </span>
              <span className="text-white/50 text-[10px] font-mono">[{k.weapon}]</span>
              <span className={k.targetTeam === "alpha" ? "text-blue-400" : "text-red-400"}>
                {k.targetName}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Spectator Control Deck */}
      <div className="p-4 flex flex-col md:flex-row items-end justify-between gap-4">
        {/* Spectated Player Card (POV Mode) */}
        {cameraMode !== "free_cam" && spectatedPlayer && (
          <div className="pointer-events-auto p-4 rounded-2xl bg-black/80 backdrop-blur border border-white/15 w-full md:w-80 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    spectatedPlayer.team === "alpha" ? "bg-blue-400 shadow-sm shadow-blue-400" : "bg-red-400 shadow-sm shadow-red-400"
                  }`}
                />
                <span className="font-extrabold text-white text-base truncate max-w-[160px]">
                  {spectatedPlayer.name}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {spectatedPlayer.kills}K - {spectatedPlayer.deaths}D
              </span>
            </div>

            {/* Health & Armor Bars */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-white/60">
                <span>HEALTH</span>
                <span>{spectatedPlayer.health}/100</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                  style={{ width: `${spectatedPlayer.health}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-white/60">
                <span>ARMOR PLATES</span>
                <span>{spectatedPlayer.armor}/150</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-200"
                  style={{ width: `${(spectatedPlayer.armor / 150) * 100}%` }}
                />
              </div>
            </div>

            {/* Weapon & Player Switch Controls */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
              <div className="text-xs font-mono text-white/80">
                <span className="text-white/40 block text-[10px]">ACTIVE WEAPON</span>
                <span className="font-bold text-amber-400">{spectatedPlayer.selectedWeapon}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={onPrevPlayer}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                  title="Previous Player"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={onNextPlayer}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                  title="Next Player"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Free Drone Camera Altitude Controls */}
        {cameraMode === "free_cam" && (
          <div className="pointer-events-auto p-4 rounded-2xl bg-black/80 backdrop-blur border border-white/15 shadow-2xl flex items-center gap-3 animate-in fade-in">
            <span className="text-xs font-mono text-white/60">DRONE ALTITUDE: {Math.round(flyAltitude)}m</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onChangeAltitude(2)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                title="Ascend Drone"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangeAltitude(-2)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                title="Descend Drone"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Camera Perspective Mode Switcher */}
        <div className="pointer-events-auto p-2 rounded-2xl bg-black/80 backdrop-blur border border-white/15 flex items-center gap-1 shadow-2xl">
          <button
            onClick={() => onSetCameraMode("first_person")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              cameraMode === "first_person"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>FIRST-PERSON</span>
          </button>

          <button
            onClick={() => onSetCameraMode("third_person")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              cameraMode === "third_person"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>ORBIT CHASE</span>
          </button>

          <button
            onClick={() => onSetCameraMode("free_cam")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              cameraMode === "free_cam"
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>FREE DRONE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
