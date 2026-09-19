import React, { useState, useEffect } from "react";
import { X, Sliders, Trophy, Share2, Volume2, ShieldCheck, Zap, Mic, Radio, RadioTower, VolumeX, CheckCircle2 } from "lucide-react";
import { GameSettings, PlayerNetState, VoiceTransmissionMode } from "../types";
import { webrtcVoice, VoiceConnectionStatus } from "../game/webrtcVoice";
import { sounds } from "../game/audio";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  roomId: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  roomId,
}) => {
  const [activeTab, setActiveTab] = useState<"controls" | "voice">("controls");
  const [voiceStatus, setVoiceStatus] = useState<VoiceConnectionStatus>(webrtcVoice.status);
  const [micLevel, setMicLevel] = useState(0);
  const [isTestLoopActive, setIsTestLoopActive] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsubStatus = webrtcVoice.onStatusChange((s) => setVoiceStatus(s));
    const unsubSpeaking = webrtcVoice.onLocalSpeaking((_, level) => setMicLevel(level));
    return () => {
      unsubStatus();
      unsubSpeaking();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShareRoom = () => {
    const url = `${window.location.origin}?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard.writeText(url);
    alert(`Match Room link copied!\nShare with friends to fight together:\n${url}`);
  };

  const handleTestRadioCheck = async () => {
    sounds.playRadioBeep();
    if (voiceStatus !== "connected") {
      await webrtcVoice.startVoice();
    }
    setIsTestLoopActive(true);
    setTimeout(() => {
      setIsTestLoopActive(false);
      sounds.playRadioBeep();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl text-zinc-100 flex flex-col gap-4 font-sans max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span className="font-mono font-bold text-lg uppercase tracking-wider">Tactical Settings</span>
          </div>
          <button
            id="btn-settings-close"
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("controls")}
            className={`py-1.5 rounded font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "controls"
                ? "bg-amber-500 text-black shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Display & Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("voice")}
            className={`py-1.5 rounded font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "voice"
                ? "bg-amber-500 text-black shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Tactical Voice Comms
          </button>
        </div>

        {/* Room Share Banner */}
        <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase text-zinc-400">Match Lobby Code</div>
            <div className="font-mono font-bold text-amber-400 text-xs">{roomId}</div>
          </div>
          <button
            id="btn-settings-share-room"
            type="button"
            onClick={handleShareRoom}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold flex items-center gap-1.5 border border-zinc-700 active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            Copy Match Link
          </button>
        </div>

        {/* Tab 1: Controls & Display */}
        {activeTab === "controls" && (
          <div className="flex flex-col gap-3 text-xs">
            {/* Look Sensitivity */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-zinc-300">Look Sensitivity</span>
                <span className="text-amber-400">{Math.round(settings.lookSensitivity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.1"
                value={settings.lookSensitivity}
                onChange={(e) => onUpdateSettings({ lookSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* ADS Sensitivity */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-zinc-300">ADS Optic Sensitivity</span>
                <span className="text-amber-400">{Math.round(settings.adsSensitivity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={settings.adsSensitivity}
                onChange={(e) => onUpdateSettings({ adsSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Touch HUD Opacity */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-zinc-300">Touch Controls Opacity</span>
                <span className="text-amber-400">{Math.round(settings.touchControlsOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={settings.touchControlsOpacity}
                onChange={(e) => onUpdateSettings({ touchControlsOpacity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Gyroscope Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <div>
                <div className="font-mono font-bold text-zinc-200">Gyroscope Aim Assist</div>
                <div className="text-[10px] text-zinc-400">Tilt mobile phone to aim precisely</div>
              </div>
              <button
                id="btn-settings-gyro-toggle"
                type="button"
                onClick={() => onUpdateSettings({ gyroEnabled: !settings.gyroEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.gyroEnabled ? "bg-amber-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    settings.gyroEnabled ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Graphics Quality */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <div>
                <div className="font-mono font-bold text-zinc-200">Graphics Mode</div>
                <div className="text-[10px] text-zinc-400">Optimize 60-120FPS on mobile GPUs</div>
              </div>
              <div className="flex gap-1">
                {(["low", "medium", "high"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onUpdateSettings({ graphicsQuality: q })}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                      settings.graphicsQuality === q
                        ? "bg-amber-500 text-black shadow"
                        : "bg-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tactical Voice Comms (WebRTC & Proximity Audio) */}
        {activeTab === "voice" && (
          <div className="flex flex-col gap-3 text-xs">
            {/* Master Voice Chat Toggle */}
            <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
              <div>
                <div className="font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                  <RadioTower className="w-4 h-4 text-amber-400" />
                  WebRTC Squad Voice Chat
                </div>
                <div className="text-[10px] text-zinc-400">Low-latency P2P proximity communication</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextVal = !settings.voiceChatEnabled;
                  onUpdateSettings({ voiceChatEnabled: nextVal });
                  webrtcVoice.updateSettings({ enabled: nextVal });
                  if (!nextVal) webrtcVoice.stopVoice();
                  else webrtcVoice.startVoice();
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.voiceChatEnabled ? "bg-amber-500" : "bg-zinc-800"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    settings.voiceChatEnabled ? "right-1" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* Transmission Mode: PTT vs Open Mic */}
            <div>
              <div className="font-mono text-zinc-300 mb-1.5 font-semibold">Transmission Mode</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(["push_to_talk", "open_mic"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ voiceMode: mode });
                      webrtcVoice.updateSettings({ mode });
                    }}
                    className={`py-2 px-2.5 rounded-lg border font-mono font-bold text-xs flex flex-col items-center gap-0.5 transition-all ${
                      settings.voiceMode === mode
                        ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>{mode === "push_to_talk" ? "PUSH TO TALK" : "OPEN MIC"}</span>
                    <span className="text-[9px] font-normal opacity-75">
                      {mode === "push_to_talk" ? "Hold Key [V] or Touch" : "Voice Activation (VAD)"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Microphone Diagnostic & Level Meter */}
            <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-300">Live Mic Level & Status</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    voiceStatus === "connected"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : voiceStatus === "requesting"
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : voiceStatus === "denied"
                      ? "bg-rose-950 text-rose-400 border border-rose-800"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {voiceStatus === "connected"
                    ? "MIC READY"
                    : voiceStatus === "requesting"
                    ? "REQUESTING..."
                    : voiceStatus === "denied"
                    ? "PERMISSION BLOCKED"
                    : "STANDBY"}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-zinc-900 rounded overflow-hidden flex items-center">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.max(2, micLevel * 100))}%` }}
                />
              </div>

              {/* Mic Test Trigger */}
              <button
                type="button"
                onClick={handleTestRadioCheck}
                className="w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 border border-zinc-700 active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                {isTestLoopActive ? "TRANSMITTING RADIO CHECK..." : "TEST MIC / RADIO CHECK"}
              </button>
            </div>

            {/* Proximity Distance & 3D Spatial Settings */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-zinc-300">Proximity Acoustic Range</span>
                <span className="text-amber-400">{settings.proximityMaxDistance} meters</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={settings.proximityMaxDistance}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdateSettings({ proximityMaxDistance: val });
                  webrtcVoice.updateSettings({ proximityMaxDistance: val });
                }}
                className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Squad Voice Volume */}
            <div>
              <div className="flex justify-between mb-1 font-mono">
                <span className="text-zinc-300">Squad Master Comms Volume</span>
                <span className="text-amber-400">{Math.round(settings.voiceVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={settings.voiceVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateSettings({ voiceVolume: val });
                  webrtcVoice.updateSettings({ voiceVolume: val });
                }}
                className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Spatial HRTF Audio & Radio Filter Toggles */}
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-zinc-200">3D HRTF Spatial Audio</div>
                  <div className="text-[10px] text-zinc-400">Directional panning based on teammate position</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.spatialAudio;
                    onUpdateSettings({ spatialAudio: next });
                    webrtcVoice.updateSettings({ spatialAudio: next });
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings.spatialAudio ? "bg-amber-500" : "bg-zinc-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.spatialAudio ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-zinc-200">Tactical Radio Effect</div>
                  <div className="text-[10px] text-zinc-400">Bandpass radio filter for distant teammates</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !settings.radioFilterEnabled;
                    onUpdateSettings({ radioFilterEnabled: next });
                    webrtcVoice.updateSettings({ radioFilterEnabled: next });
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings.radioFilterEnabled ? "bg-amber-500" : "bg-zinc-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      settings.radioFilterEnabled ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          id="btn-settings-confirm"
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold uppercase tracking-wider text-xs transition-colors mt-2"
        >
          Save & Resume Match
        </button>
      </div>
    </div>
  );
};

interface ScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerNetState[];
  alphaScore: number;
  bravoScore: number;
  myId: string;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  isOpen,
  onClose,
  players,
  alphaScore,
  bravoScore,
  myId,
}) => {
  if (!isOpen) return null;

  const alphaPlayers = players.filter((p) => p.team === "alpha");
  const bravoPlayers = players.filter((p) => p.team === "bravo");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl text-zinc-100 flex flex-col gap-4 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-mono font-bold text-lg uppercase tracking-wider">
              Match Roster — Team Deathmatch
            </span>
          </div>
          <button
            id="btn-scoreboard-close"
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Comparison */}
        <div className="flex items-center justify-around bg-zinc-900/60 p-3 rounded-lg font-mono">
          <div className="text-center">
            <div className="text-xs text-cyan-400 font-bold uppercase">TEAM ALPHA</div>
            <div className="text-3xl font-black text-cyan-400">{alphaScore}</div>
          </div>
          <div className="text-zinc-600 font-bold text-xl">VS</div>
          <div className="text-center">
            <div className="text-xs text-red-500 font-bold uppercase">TEAM BRAVO</div>
            <div className="text-3xl font-black text-red-500">{bravoScore}</div>
          </div>
        </div>

        {/* Players Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Team Alpha */}
          <div className="border border-cyan-900/40 rounded-lg overflow-hidden">
            <div className="bg-cyan-950/60 px-3 py-1.5 font-bold text-cyan-400 uppercase flex justify-between">
              <span>ALPHA SQUAD</span>
              <span>K / D / PTS</span>
            </div>
            <div className="divide-y divide-zinc-900">
              {alphaPlayers.map((p) => (
                <div
                  key={p.id}
                  className={`px-3 py-1.5 flex justify-between items-center ${
                    p.id === myId ? "bg-cyan-950/40 font-bold text-cyan-300" : "text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                    <span>{p.name}</span>
                    {p.isBot && <span className="text-[9px] px-1 bg-zinc-800 text-zinc-500 rounded">BOT</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{p.kills}</span>
                    <span className="text-zinc-600">/</span>
                    <span>{p.deaths}</span>
                    <span className="text-zinc-600">/</span>
                    <span className="text-amber-400">{p.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Bravo */}
          <div className="border border-red-900/40 rounded-lg overflow-hidden">
            <div className="bg-red-950/60 px-3 py-1.5 font-bold text-red-400 uppercase flex justify-between">
              <span>BRAVO SQUAD</span>
              <span>K / D / PTS</span>
            </div>
            <div className="divide-y divide-zinc-900">
              {bravoPlayers.map((p) => (
                <div
                  key={p.id}
                  className={`px-3 py-1.5 flex justify-between items-center ${
                    p.id === myId ? "bg-red-950/40 font-bold text-red-300" : "text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                    <span>{p.name}</span>
                    {p.isBot && <span className="text-[9px] px-1 bg-zinc-800 text-zinc-500 rounded">BOT</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{p.kills}</span>
                    <span className="text-zinc-600">/</span>
                    <span>{p.deaths}</span>
                    <span className="text-zinc-600">/</span>
                    <span className="text-amber-400">{p.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          id="btn-scoreboard-close-action"
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold uppercase text-xs transition-colors"
        >
          Close Scoreboard (Tap Anywhere)
        </button>
      </div>
    </div>
  );
};
