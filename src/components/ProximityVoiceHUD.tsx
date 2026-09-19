import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Radio, RadioTower, Wifi, ShieldAlert } from "lucide-react";
import { TeammateVoiceStatus, VoiceChatSettings } from "../types";
import { webrtcVoice, VoiceConnectionStatus } from "../game/webrtcVoice";
import { sounds } from "../game/audio";

interface ProximityVoiceHUDProps {
  onOpenVoiceSettings?: () => void;
  team: "alpha" | "bravo";
}

export const ProximityVoiceHUD: React.FC<ProximityVoiceHUDProps> = ({ onOpenVoiceSettings, team }) => {
  const [status, setStatus] = useState<VoiceConnectionStatus>(webrtcVoice.status);
  const [teammates, setTeammates] = useState<TeammateVoiceStatus[]>([]);
  const [isTalking, setIsTalking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [settings, setSettings] = useState<VoiceChatSettings>(webrtcVoice.getSettings());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubStatus = webrtcVoice.onStatusChange((s) => setStatus(s));
    const unsubTeammates = webrtcVoice.onTeammatesChange((list) => setTeammates(list));
    const unsubSpeaking = webrtcVoice.onLocalSpeaking((talking, level) => {
      setIsTalking(talking);
      setMicLevel(level);
    });

    return () => {
      unsubStatus();
      unsubTeammates();
      unsubSpeaking();
    };
  }, []);

  const handleToggleMute = () => {
    sounds.playRadioBeep();
    const newMuted = webrtcVoice.toggleMute();
    setSettings((prev) => ({ ...prev, isMuted: newMuted }));
  };

  const handleToggleDeafen = () => {
    sounds.playRadioBeep();
    const newDeaf = webrtcVoice.toggleDeafen();
    setSettings((prev) => ({ ...prev, isDeafened: newDeaf }));
  };

  const handleStartMic = async () => {
    sounds.playRadioBeep();
    await webrtcVoice.startVoice();
  };

  // Check if anyone on squad is talking
  const activeSpeakers = teammates.filter((t) => t.isTalking);

  return (
    <div className="absolute top-20 left-4 z-30 pointer-events-auto flex flex-col gap-1.5 font-['Rajdhani'] max-w-[280px]">
      {/* Comms Bar / Quick Bar */}
      <div className="flex items-center gap-1.5 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/80 px-2.5 py-1.5 rounded text-xs shadow-lg">
        <button
          onClick={status === "connected" ? handleToggleMute : handleStartMic}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors font-semibold ${
            status !== "connected"
              ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
              : settings.isMuted
              ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40"
              : isTalking
              ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 animate-pulse"
              : "bg-neutral-800/60 text-neutral-300 hover:bg-neutral-700/60"
          }`}
          title={status !== "connected" ? "Click to enable microphone" : "Toggle Mic Mute"}
        >
          {status !== "connected" ? (
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
          ) : settings.isMuted ? (
            <MicOff className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Mic className={`w-3.5 h-3.5 ${isTalking ? "text-emerald-400" : "text-neutral-300"}`} />
          )}

          <span className="tracking-wider uppercase">
            {status === "requesting"
              ? "CONNECTING..."
              : status !== "connected"
              ? "ENABLE COMMS"
              : settings.isMuted
              ? "MUTED"
              : isTalking
              ? "TRANSMITTING"
              : settings.mode === "push_to_talk"
              ? "PTT [V]"
              : "OPEN MIC"}
          </span>
        </button>

        {/* Deafen Toggle */}
        <button
          onClick={handleToggleDeafen}
          className={`p-1 rounded transition-colors ${
            settings.isDeafened
              ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40"
              : "text-neutral-400 hover:text-white hover:bg-neutral-800"
          }`}
          title={settings.isDeafened ? "Squad Comms Deafened" : "Deafen Incoming Comms"}
        >
          {settings.isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Proximity / Radio indicator */}
        <button
          onClick={() => setIsExpanded((e) => !e)}
          className="ml-auto text-[10px] text-neutral-400 hover:text-amber-400 tracking-wider flex items-center gap-1 font-mono uppercase bg-neutral-900/60 px-1.5 py-0.5 rounded border border-neutral-800"
        >
          <RadioTower className="w-3 h-3 text-cyan-400" />
          <span>PROX {settings.proximityMaxDistance}M</span>
        </button>
      </div>

      {/* Live Mic Wave / Speaking Meter */}
      {status === "connected" && !settings.isMuted && (
        <div className="bg-neutral-950/70 border border-neutral-800/80 px-2 py-1 rounded flex items-center gap-2 text-[10px]">
          <span className="text-neutral-400 uppercase font-mono tracking-widest text-[9px]">MIC IN</span>
          <div className="flex-1 h-1.5 bg-neutral-900 rounded overflow-hidden flex items-center">
            <div
              className={`h-full transition-all duration-75 ${
                isTalking ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-neutral-600"
              }`}
              style={{ width: `${Math.min(100, Math.max(4, micLevel * 100))}%` }}
            />
          </div>
          <span className="font-mono text-neutral-500 text-[9px]">{Math.round(micLevel * 100)}%</span>
        </div>
      )}

      {/* Squad Member Comms Feed */}
      {(isExpanded || activeSpeakers.length > 0) && teammates.length > 0 && (
        <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800/90 rounded p-2 flex flex-col gap-1 text-xs shadow-xl">
          <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase font-mono tracking-wider pb-1 border-b border-neutral-800/80">
            <span>SQUAD RADIO ({team.toUpperCase()})</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HRTF 3D
            </span>
          </div>

          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
            {teammates.map((tm) => (
              <div
                key={tm.playerId}
                className={`flex items-center justify-between px-2 py-1 rounded transition-colors ${
                  tm.isTalking
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                    : "bg-neutral-900/50 text-neutral-300 hover:bg-neutral-800/50"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Equalizer animation when talking */}
                  {tm.isTalking ? (
                    <div className="flex items-end gap-0.5 h-3 w-3">
                      <span className="w-0.5 bg-emerald-400 animate-[bounce_0.6s_infinite] h-2" />
                      <span className="w-0.5 bg-emerald-400 animate-[bounce_0.4s_infinite] h-3" />
                      <span className="w-0.5 bg-emerald-400 animate-[bounce_0.5s_infinite] h-1.5" />
                    </div>
                  ) : tm.isMuted ? (
                    <MicOff className="w-3 h-3 text-neutral-500" />
                  ) : (
                    <Mic className="w-3 h-3 text-neutral-600" />
                  )}
                  <span className="truncate font-semibold tracking-wide text-xs">{tm.playerName}</span>
                </div>

                {/* Distance & Link status */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                  <span
                    className={`px-1 rounded ${
                      tm.distance <= 8
                        ? "text-emerald-400 bg-emerald-950/60"
                        : tm.distance <= 20
                        ? "text-amber-300 bg-amber-950/60"
                        : "text-cyan-300 bg-cyan-950/60"
                    }`}
                  >
                    {tm.distance}m
                  </span>
                  {tm.isRadioTransmission && (
                    <span className="text-[9px] text-cyan-400 uppercase font-mono tracking-tighter">[RAD]</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Microphone status alert if denied */}
      {status === "denied" && (
        <div className="bg-rose-950/90 border border-rose-700/80 rounded p-2 text-rose-200 text-xs flex items-start gap-2 shadow-xl">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold uppercase tracking-wider text-[11px]">MIC PERMISSION BLOCKED</div>
            <p className="text-[10px] text-rose-300/90 leading-tight">
              Enable microphone permissions in your browser bar to transmit tactical voice comms.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
