import React, { useState, useEffect } from "react";
import { RankedProfile, RankDivision } from "../types";
import { getRankDivisionInfo } from "../game/loadoutStore";
import { sounds } from "../game/audio";
import {
  Trophy,
  Flame,
  Shield,
  Target,
  Swords,
  ChevronRight,
  Clock,
  Zap,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface RankedMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: RankedProfile;
  onStartRankedMatch: (division: RankDivision) => void;
}

export const RankedMatchModal: React.FC<RankedMatchModalProps> = ({
  isOpen,
  onClose,
  profile,
  onStartRankedMatch,
}) => {
  const [activeTab, setActiveTab] = useState<"lobby" | "career" | "history" | "divisions">("lobby");
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [matchFound, setMatchFound] = useState(false);

  const divisionInfo = getRankDivisionInfo(profile.sr);
  const range = divisionInfo.maxSr - divisionInfo.minSr;
  const progressPercent = Math.min(100, Math.max(0, ((profile.sr - divisionInfo.minSr) / range) * 100));

  // Matchmaking timer & simulated lobby assembly
  useEffect(() => {
    let interval: any;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime((prev) => {
          if (prev >= 4 && !matchFound) {
            setMatchFound(true);
            sounds.playRadioBeep();
            setTimeout(() => {
              setIsSearching(false);
              setMatchFound(false);
              onStartRankedMatch(divisionInfo.division);
              onClose();
            }, 1600);
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setSearchTime(0);
      setMatchFound(false);
    }
    return () => clearInterval(interval);
  }, [isSearching, matchFound]);

  if (!isOpen) return null;

  const kdRatio = profile.deaths > 0 ? (profile.kills / profile.deaths).toFixed(2) : profile.kills.toFixed(2);
  const winRate =
    profile.wins + profile.losses > 0
      ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
      : 50;

  const DIVISIONS_LIST: { name: RankDivision; minSr: number; color: string }[] = [
    { name: "Top 250", minSr: 6500, color: "#ef4444" },
    { name: "Grandmaster", minSr: 5400, color: "#ec4899" },
    { name: "Master", minSr: 4500, color: "#a855f7" },
    { name: "Diamond", minSr: 3600, color: "#38bdf8" },
    { name: "Platinum", minSr: 2700, color: "#2dd4bf" },
    { name: "Gold", minSr: 1800, color: "#eab308" },
    { name: "Silver", minSr: 900, color: "#94a3b8" },
    { name: "Bronze", minSr: 0, color: "#cd7f32" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 select-none animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-5xl h-[88vh] flex flex-col bg-[#0b0e14] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="h-16 px-6 bg-gradient-to-r from-[#141820] via-[#10141b] to-[#141820] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  TACTICAL LEAGUE
                </span>
                <span className="text-white/30">•</span>
                <span className="text-xs text-white/70">SEASON 1 RANKED PLAY</span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-wide">COMPETITIVE MATCHMAKING & PROGRESSION</h1>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="h-12 bg-[#080a0f] border-b border-white/5 flex items-stretch px-6 shrink-0 gap-2">
          <button
            onClick={() => {
              setActiveTab("lobby");
              sounds.playRadioBeep();
            }}
            className={`px-5 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === "lobby"
                ? "border-amber-500 text-amber-400 bg-white/5"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Swords className="w-4 h-4" />
            <span>RANKED LOBBY</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("career");
              sounds.playRadioBeep();
            }}
            className={`px-5 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === "career"
                ? "border-amber-500 text-amber-400 bg-white/5"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Target className="w-4 h-4" />
            <span>CAREER STATS</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              sounds.playRadioBeep();
            }}
            className={`px-5 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === "history"
                ? "border-amber-500 text-amber-400 bg-white/5"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>COMBAT RECORD</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("divisions");
              sounds.playRadioBeep();
            }}
            className={`px-5 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === "divisions"
                ? "border-amber-500 text-amber-400 bg-white/5"
                : "border-transparent text-white/60 hover:text-white"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>DIVISIONS LADDER</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: RANKED LOBBY & MATCHMAKING */}
          {activeTab === "lobby" && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Rank Badge Crest Card */}
              <div className="relative p-6 rounded-2xl bg-gradient-to-r from-[#121622] via-[#0f121a] to-[#121622] border border-amber-500/30 overflow-hidden shadow-xl">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Glowing Rank Insignia */}
                  <div
                    className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center border-2 shadow-lg relative shrink-0"
                    style={{
                      borderColor: divisionInfo.badgeColor,
                      backgroundColor: `${divisionInfo.badgeColor}15`,
                      boxShadow: `0 0 35px ${divisionInfo.badgeColor}30`,
                    }}
                  >
                    <Trophy className="w-10 h-10" style={{ color: divisionInfo.badgeColor }} />
                    <span className="text-xs font-black uppercase tracking-wider mt-1 text-white">
                      {divisionInfo.division}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5"
                      style={{ backgroundColor: divisionInfo.badgeColor, color: "#000" }}
                    >
                      TIER {divisionInfo.tier}
                    </span>
                  </div>

                  {/* Rank Details & SR Progress Bar */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h2 className="text-2xl font-extrabold text-white">
                        {divisionInfo.division} {divisionInfo.tier === 1 ? "I" : divisionInfo.tier === 2 ? "II" : "III"}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold">
                        {profile.sr} SR
                      </span>
                      {profile.winStreak > 1 && (
                        <span className="px-2.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-400 font-mono text-xs font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          <span>{profile.winStreak} WIN STREAK (+SR BONUS)</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-white/60 mt-1">
                      Win matches against skill-matched operators to earn Skill Rating (SR) and promote to {divisionInfo.nextDivision}.
                    </p>

                    {/* Progress Bar to next division */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-mono mb-1 text-white/70">
                        <span>CURRENT: {profile.sr} SR</span>
                        <span className="text-amber-400 font-bold">NEXT RANK: {divisionInfo.maxSr + 1} SR</span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] font-mono text-white/40 block">RECORD (W - L)</span>
                  <span className="text-xl font-bold text-white mt-1 block">
                    {profile.wins}W - {profile.losses}L
                  </span>
                  <span className="text-xs text-emerald-400 font-mono">{winRate}% WIN RATE</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] font-mono text-white/40 block">K/D RATIO</span>
                  <span className="text-xl font-bold text-white mt-1 block">{kdRatio}</span>
                  <span className="text-xs text-white/50 font-mono">{profile.kills} KILLS</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] font-mono text-white/40 block">HEADSHOT RATIO</span>
                  <span className="text-xl font-bold text-white mt-1 block">
                    {profile.kills > 0 ? Math.round((profile.headshots / profile.kills) * 100) : 25}%
                  </span>
                  <span className="text-xs text-amber-400 font-mono">{profile.headshots} HEADSHOTS</span>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[11px] font-mono text-white/40 block">PEAK SKILL RATING</span>
                  <span className="text-xl font-bold text-white mt-1 block">{profile.topSr} SR</span>
                  <span className="text-xs text-purple-400 font-mono">SEASON HIGH</span>
                </div>
              </div>

              {/* Matchmaking Queue Action Center */}
              <div className="p-6 rounded-2xl bg-black/60 border border-white/10 text-center space-y-4">
                {isSearching ? (
                  <div className="space-y-4 py-4 animate-in fade-in">
                    <div className="w-16 h-16 mx-auto rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                    <div>
                      {matchFound ? (
                        <div className="text-emerald-400 font-extrabold text-lg flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>MATCH FOUND! DEPLOYING OPERATORS...</span>
                        </div>
                      ) : (
                        <div className="text-white font-bold text-lg">
                          SEARCHING MATCH IN {divisionInfo.division.toUpperCase()} BRACKET...
                        </div>
                      )}
                      <div className="text-xs font-mono text-white/50 mt-1 flex items-center justify-center gap-4">
                        <span>ELAPSED: 0:0{searchTime}</span>
                        <span>•</span>
                        <span>SERVER: EU-WEST (18ms)</span>
                        <span>•</span>
                        <span>SKILL MMR: BALANCED</span>
                      </div>
                    </div>

                    {!matchFound && (
                      <button
                        onClick={() => setIsSearching(false)}
                        className="px-6 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-xs font-bold tracking-wider transition"
                      >
                        CANCEL MATCHMAKING
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-4 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">READY FOR COMPETITIVE WARZONE</h3>
                      <p className="text-xs text-white/60 max-w-md mx-auto mt-1">
                        5v5 Tactical Team Deathmatch with official CDL rules, calibrated weapon balancing, and skill rating progression.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsSearching(true);
                        sounds.playRadioBeep();
                      }}
                      className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-base tracking-widest uppercase transition shadow-lg shadow-amber-500/30 active:scale-95 inline-flex items-center gap-3"
                    >
                      <Zap className="w-5 h-5 fill-black" />
                      <span>FIND RANKED MATCH</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CAREER DETAILED STATS */}
          {activeTab === "career" && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs font-mono text-white/40 block">TOTAL ELIMINATIONS</span>
                  <span className="text-3xl font-extrabold text-white mt-1 block">{profile.kills}</span>
                  <span className="text-xs text-white/50 mt-1 block">Confirmed takedowns</span>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs font-mono text-white/40 block">DEATHS</span>
                  <span className="text-3xl font-extrabold text-white mt-1 block">{profile.deaths}</span>
                  <span className="text-xs text-white/50 mt-1 block">Casualties suffered</span>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs font-mono text-white/40 block">K/D RATIO</span>
                  <span className="text-3xl font-extrabold text-amber-400 mt-1 block">{kdRatio}</span>
                  <span className="text-xs text-emerald-400 mt-1 block">Top 12% among players</span>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs font-mono text-white/40 block">ACCURACY RATING</span>
                  <span className="text-3xl font-extrabold text-white mt-1 block">
                    {profile.shotsFired > 0
                      ? Math.round((profile.shotsHit / profile.shotsFired) * 100)
                      : 28}%
                  </span>
                  <span className="text-xs text-white/50 mt-1 block">Raycast shot connection</span>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs font-mono text-white/40 block">CRITICAL HEADSHOTS</span>
                  <span className="text-3xl font-extrabold text-white mt-1 block">{profile.headshots}</span>
                  <span className="text-xs text-amber-400 mt-1 block">1.8x lethal damage multiplier</span>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-xs font-mono text-white/40 block">MATCHES PLAYED</span>
                  <span className="text-3xl font-extrabold text-white mt-1 block">
                    {profile.wins + profile.losses}
                  </span>
                  <span className="text-xs text-white/50 mt-1 block">{profile.wins} Wins • {profile.losses} Losses</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MATCH COMBAT HISTORY */}
          {activeTab === "history" && (
            <div className="max-w-4xl mx-auto space-y-3">
              <span className="text-xs font-mono text-white/50 uppercase tracking-wider block mb-2">
                LAST 10 RANKED MATCHES
              </span>

              {profile.matchesHistory.length === 0 ? (
                <div className="p-12 text-center text-white/40 bg-white/5 rounded-2xl border border-white/10">
                  No recorded matches yet. Play your first ranked match to build your combat ledger!
                </div>
              ) : (
                profile.matchesHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border flex items-center justify-between transition ${
                      item.result === "VICTORY"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                        : "bg-red-500/10 border-red-500/30 text-white"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          item.result === "VICTORY" ? "bg-emerald-500 text-black" : "bg-red-500 text-white"
                        }`}
                      >
                        {item.result === "VICTORY" ? "W" : "L"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm">{item.result}</span>
                          <span className="text-xs text-white/40">•</span>
                          <span className="text-xs text-white/70">{item.mapName}</span>
                          <span className="text-xs text-white/40">•</span>
                          <span className="text-xs font-mono text-white/50">
                            {item.score.friendly} - {item.score.enemy}
                          </span>
                        </div>
                        <div className="text-xs text-white/60 mt-1 font-mono">
                          {item.kills} Kills • {item.deaths} Deaths • {item.damageDealt} DMG
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono font-bold text-sm">
                      {item.srChange > 0 ? (
                        <span className="text-emerald-400">+{item.srChange} SR</span>
                      ) : (
                        <span className="text-red-400">{item.srChange} SR</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: DIVISIONS LADDER */}
          {activeTab === "divisions" && (
            <div className="max-w-4xl mx-auto space-y-3">
              <span className="text-xs font-mono text-white/50 uppercase tracking-wider block mb-2">
                COMPETITIVE SKILL RATING DIVISIONS
              </span>

              <div className="space-y-2">
                {DIVISIONS_LIST.map((div) => {
                  const isCurrent = div.name === divisionInfo.division;
                  return (
                    <div
                      key={div.name}
                      className={`p-4 rounded-xl border flex items-center justify-between transition ${
                        isCurrent
                          ? "bg-amber-500/20 border-amber-500 shadow-md"
                          : "bg-white/5 border-white/5 text-white/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs"
                          style={{
                            backgroundColor: `${div.color}25`,
                            color: div.color,
                            border: `1px solid ${div.color}`,
                          }}
                        >
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm">{div.name}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold">
                                CURRENT DIVISION
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/50">Tier I, II, III progression</span>
                        </div>
                      </div>

                      <div className="font-mono text-xs text-white/70 font-bold">
                        {div.minSr}+ SR
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
