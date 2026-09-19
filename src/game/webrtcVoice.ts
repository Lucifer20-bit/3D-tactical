import { network } from "./network";
import { TeammateVoiceStatus, VoiceChatSettings, VoiceTransmissionMode } from "../types";

export type VoiceConnectionStatus = "idle" | "requesting" | "connected" | "denied" | "error" | "unsupported";

interface PeerConnectionBundle {
  peerId: string;
  peerConnection: RTCPeerConnection;
  remoteStream?: MediaStream;
  sourceNode?: MediaStreamAudioSourceNode;
  pannerNode?: PannerNode;
  filterNode?: BiquadFilterNode;
  gainNode?: GainNode;
  analyserNode?: AnalyserNode;
  isTalking: boolean;
  distance: number;
  volume: number;
}

export class WebRTCVoiceManager {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private localGain: GainNode | null = null;
  private peers: Map<string, PeerConnectionBundle> = new Map();
  
  public status: VoiceConnectionStatus = "idle";
  public errorMessage: string = "";
  public isLocallyTalking: boolean = false;
  public localMicLevel: number = 0; // 0 to 1 for visual meter
  public isPTTHeld: boolean = false;
  
  private settings: VoiceChatSettings = {
    enabled: true,
    mode: "push_to_talk",
    micSensitivity: 0.04,
    proximityMaxDistance: 35,
    spatialAudio: true,
    radioFilterEnabled: true,
    voiceVolume: 0.85,
    micVolume: 1.0,
    isDeafened: false,
    isMuted: false,
  };

  private myPlayerId: string = "";
  private myTeam: "alpha" | "bravo" = "alpha";
  private onStatusChangeCallbacks: Array<(status: VoiceConnectionStatus) => void> = [];
  private onTeammatesChangeCallbacks: Array<(teammates: TeammateVoiceStatus[]) => void> = [];
  private onLocalSpeakingCallbacks: Array<(isTalking: boolean, level: number) => void> = [];
  
  private vadInterval: any = null;
  private lastVoiceStateSent: boolean = false;

  constructor() {
    // Setup keyboard listeners for Push-To-Talk (V key default)
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", (e) => {
        if ((e.code === "KeyV" || e.key.toLowerCase() === "v") && !e.repeat) {
          // Check if active element is an input
          const tag = (document.activeElement?.tagName || "").toLowerCase();
          if (tag === "input" || tag === "textarea") return;
          this.setPTTHeld(true);
        }
      });

      window.addEventListener("keyup", (e) => {
        if (e.code === "KeyV" || e.key.toLowerCase() === "v") {
          this.setPTTHeld(false);
        }
      });
    }
  }

  public init(playerId: string, team: "alpha" | "bravo", settings?: Partial<VoiceChatSettings>) {
    this.myPlayerId = playerId;
    this.myTeam = team;
    if (settings) {
      this.settings = { ...this.settings, ...settings };
    }
  }

  public updateSettings(settings: Partial<VoiceChatSettings>) {
    this.settings = { ...this.settings, ...settings };
    this.applyAudioSettings();
  }

  public getSettings(): VoiceChatSettings {
    return { ...this.settings };
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  public async startVoice(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      this.status = "unsupported";
      this.notifyStatus();
      return false;
    }

    try {
      this.status = "requesting";
      this.notifyStatus();
      const ctx = this.initAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
        video: false,
      });

      this.localStream = stream;
      this.status = "connected";
      this.notifyStatus();

      // Audio analysis for Voice Activity Detection (VAD) & Live Meter
      const source = ctx.createMediaStreamSource(stream);
      this.localAnalyser = ctx.createAnalyser();
      this.localAnalyser.fftSize = 256;
      this.localAnalyser.smoothingTimeConstant = 0.3;

      this.localGain = ctx.createGain();
      this.localGain.gain.value = this.settings.micVolume;

      source.connect(this.localAnalyser);

      // Start VAD Loop
      this.startVADLoop();

      // Add tracks to existing peer connections if any
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = this.shouldTransmit();
        this.peers.forEach((peer) => {
          const senders = peer.peerConnection.getSenders();
          const hasTrack = senders.some((s) => s.track && s.track.kind === "audio");
          if (!hasTrack) {
            peer.peerConnection.addTrack(audioTrack, stream);
          }
        });
      }

      return true;
    } catch (err: any) {
      console.warn("Microphone access denied or failed", err);
      this.status = err.name === "NotAllowedError" || err.name === "PermissionDeniedError" ? "denied" : "error";
      this.errorMessage = err.message || "Failed to access microphone";
      this.notifyStatus();
      return false;
    }
  }

  public stopVoice() {
    clearInterval(this.vadInterval);
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.closeAllPeers();
    this.status = "idle";
    this.isLocallyTalking = false;
    this.localMicLevel = 0;
    this.notifyStatus();
    this.notifyLocalSpeaking(false, 0);
  }

  public setPTTHeld(held: boolean) {
    if (this.isPTTHeld === held) return;
    this.isPTTHeld = held;
    this.updateTrackState();
  }

  public toggleMute(): boolean {
    this.settings.isMuted = !this.settings.isMuted;
    this.updateTrackState();
    network.sendVoiceState(false, this.settings.isMuted);
    return this.settings.isMuted;
  }

  public toggleDeafen(): boolean {
    this.settings.isDeafened = !this.settings.isDeafened;
    this.applyAudioSettings();
    return this.settings.isDeafened;
  }

  private shouldTransmit(): boolean {
    if (this.settings.isMuted || !this.settings.enabled || this.status !== "connected") {
      return false;
    }
    if (this.settings.mode === "push_to_talk") {
      return this.isPTTHeld;
    }
    // Open mic: active if RMS exceeded sensitivity threshold
    return this.isLocallyTalking;
  }

  private updateTrackState() {
    const transmit = this.shouldTransmit();
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = transmit;
      });
    }

    if (transmit !== this.lastVoiceStateSent) {
      this.lastVoiceStateSent = transmit;
      network.sendVoiceState(transmit, this.settings.isMuted);
    }
    this.notifyLocalSpeaking(transmit, this.localMicLevel);
  }

  private startVADLoop() {
    clearInterval(this.vadInterval);
    const dataArray = new Uint8Array(128);

    this.vadInterval = setInterval(() => {
      if (!this.localAnalyser) return;

      this.localAnalyser.getByteTimeDomainData(dataArray);
      let sumSq = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sumSq += val * val;
      }
      const rms = Math.sqrt(sumSq / dataArray.length);
      this.localMicLevel = Math.min(1, rms * 3.5);

      const isOverThreshold = rms > this.settings.micSensitivity;
      if (this.settings.mode === "open_mic") {
        if (this.isLocallyTalking !== isOverThreshold) {
          this.isLocallyTalking = isOverThreshold;
          this.updateTrackState();
        }
      } else {
        this.isLocallyTalking = this.isPTTHeld && isOverThreshold;
        this.notifyLocalSpeaking(this.isPTTHeld, this.localMicLevel);
      }
    }, 45);
  }

  // Handle peer connection for squad members
  public syncTeammates(teammates: Array<{ id: string; name: string; team: "alpha" | "bravo"; isBot?: boolean; isAlive: boolean }>) {
    if (!this.settings.enabled) return;

    // Filter to human teammates only (exclude self and bots)
    const humanTeammates = teammates.filter(
      (t) => t.id !== this.myPlayerId && t.team === this.myTeam && !t.isBot
    );

    const activeIds = new Set(humanTeammates.map((t) => t.id));

    // Remove peers that left
    this.peers.forEach((_, peerId) => {
      if (!activeIds.has(peerId)) {
        this.closePeer(peerId);
      }
    });

    // Create or establish peer connections
    humanTeammates.forEach((tm) => {
      if (!this.peers.has(tm.id)) {
        this.createPeerConnection(tm.id);
      }
    });
  }

  private createPeerConnection(peerId: string): PeerConnectionBundle {
    const ctx = this.initAudioContext();
    const rtcConfig: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(rtcConfig);
    const bundle: PeerConnectionBundle = {
      peerId,
      peerConnection: pc,
      isTalking: false,
      distance: 10,
      volume: 1,
    };

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        network.sendVoiceSignal(peerId, {
          type: "candidate",
          candidate: event.candidate,
        });
      }
    };

    // Remote Audio Stream received
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      bundle.remoteStream = remoteStream;
      this.setupSpatialAudioNodes(bundle, remoteStream, ctx);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        console.warn(`WebRTC peer ${peerId} disconnected`);
      }
    };

    this.peers.set(peerId, bundle);

    // Polite peer pattern: peer with lexicographically lower ID initiates offer
    const isInitiator = this.myPlayerId < peerId;
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          network.sendVoiceSignal(peerId, {
            type: "offer",
            offer,
          });
        } catch (e) {
          console.error("WebRTC offer error", e);
        }
      };
    }

    return bundle;
  }

  private setupSpatialAudioNodes(bundle: PeerConnectionBundle, stream: MediaStream, ctx: AudioContext) {
    try {
      const source = ctx.createMediaStreamSource(stream);
      bundle.sourceNode = source;

      // 3D Panner Node for realistic spatial proximity positioning
      const panner = ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 3;
      panner.maxDistance = this.settings.proximityMaxDistance;
      panner.rolloffFactor = 1.2;
      panner.coneInnerAngle = 360;
      bundle.pannerNode = panner;

      // Military Radio Tactical Filter (Bandpass)
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1800; // speech mid-tones
      filter.Q.value = 1.0;
      bundle.filterNode = filter;

      // Master Gain for distance attenuation and volume
      const gain = ctx.createGain();
      gain.gain.value = this.settings.isDeafened ? 0 : this.settings.voiceVolume;
      bundle.gainNode = gain;

      // Audio Meter Analyser for remote teammate speaking detection
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      bundle.analyserNode = analyser;

      // Routing: Source -> Panner -> Gain -> Destination & Analyser
      source.connect(panner);
      panner.connect(gain);
      gain.connect(analyser);
      gain.connect(ctx.destination);

      // Start Remote Speaker Activity detection loop
      this.monitorRemoteSpeaker(bundle);
    } catch (e) {
      console.error("Spatial audio setup error", e);
    }
  }

  private monitorRemoteSpeaker(bundle: PeerConnectionBundle) {
    const data = new Uint8Array(64);
    const checkInterval = setInterval(() => {
      if (!bundle.analyserNode || !this.peers.has(bundle.peerId)) {
        clearInterval(checkInterval);
        return;
      }
      bundle.analyserNode.getByteTimeDomainData(data);
      let sumSq = 0;
      for (let i = 0; i < data.length; i++) {
        const val = (data[i] - 128) / 128;
        sumSq += val * val;
      }
      const rms = Math.sqrt(sumSq / data.length);
      bundle.isTalking = rms > 0.035;
    }, 80);
  }

  // Handle incoming signaling packets from WebSocket
  public async handleVoiceSignal(senderId: string, signal: any) {
    let bundle = this.peers.get(senderId);
    if (!bundle) {
      bundle = this.createPeerConnection(senderId);
    }
    const pc = bundle.peerConnection;

    try {
      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        network.sendVoiceSignal(senderId, {
          type: "answer",
          answer,
        });
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
      } else if (signal.type === "candidate" && signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (e) {
      console.error("Handle voice signal error", e);
    }
  }

  // Update 3D Positions for Proximity & HRTF Spatial Audio
  public updateSpatialPositions(
    listenerPos: { x: number; y: number; z: number; yaw: number; pitch: number },
    playersMap: Map<string, { x: number; y: number; z: number; name?: string; team?: string; isAlive?: boolean; isTalking?: boolean; isMuted?: boolean }>
  ) {
    if (!this.audioContext) return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Update Listener Position & Orientation
    const listener = ctx.listener;
    if (listener.positionX) {
      listener.positionX.setValueAtTime(listenerPos.x, now);
      listener.positionY.setValueAtTime(listenerPos.y + 1.5, now);
      listener.positionZ.setValueAtTime(listenerPos.z, now);

      // Camera forward vector
      const forwardX = Math.sin(listenerPos.yaw) * Math.cos(listenerPos.pitch);
      const forwardY = Math.sin(listenerPos.pitch);
      const forwardZ = Math.cos(listenerPos.yaw) * Math.cos(listenerPos.pitch);

      listener.forwardX.setValueAtTime(forwardX, now);
      listener.forwardY.setValueAtTime(forwardY, now);
      listener.forwardZ.setValueAtTime(forwardZ, now);
      listener.upX.setValueAtTime(0, now);
      listener.upY.setValueAtTime(1, now);
      listener.upZ.setValueAtTime(0, now);
    } else if ((listener as any).setPosition) {
      // Fallback for older browsers
      (listener as any).setPosition(listenerPos.x, listenerPos.y + 1.5, listenerPos.z);
      const forwardX = Math.sin(listenerPos.yaw) * Math.cos(listenerPos.pitch);
      const forwardY = Math.sin(listenerPos.pitch);
      const forwardZ = Math.cos(listenerPos.yaw) * Math.cos(listenerPos.pitch);
      (listener as any).setOrientation(forwardX, forwardY, forwardZ, 0, 1, 0);
    }

    // Update each remote peer's Panner Node and Volume
    const teammateStatuses: TeammateVoiceStatus[] = [];

    playersMap.forEach((player, id) => {
      if (id === this.myPlayerId) return;
      if (player.team !== this.myTeam) return;

      const dx = player.x - listenerPos.x;
      const dy = player.y - listenerPos.y;
      const dz = player.z - listenerPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const peerBundle = this.peers.get(id);
      let vol = 1.0;

      if (peerBundle && peerBundle.pannerNode && peerBundle.gainNode) {
        // Set Panner 3D coordinates
        if (peerBundle.pannerNode.positionX) {
          peerBundle.pannerNode.positionX.setValueAtTime(player.x, now);
          peerBundle.pannerNode.positionY.setValueAtTime(player.y + 1.5, now);
          peerBundle.pannerNode.positionZ.setValueAtTime(player.z, now);
        } else if ((peerBundle.pannerNode as any).setPosition) {
          (peerBundle.pannerNode as any).setPosition(player.x, player.y + 1.5, player.z);
        }

        // Proximity volume roll-off calculation
        const maxDist = this.settings.proximityMaxDistance;
        if (this.settings.isDeafened) {
          vol = 0;
        } else if (this.settings.spatialAudio) {
          if (distance <= 4) {
            vol = 1.0;
          } else if (distance < maxDist) {
            // Smooth natural inverse curve
            vol = 1.0 - (distance - 4) / (maxDist - 4);
            vol = Math.max(0.15, vol * vol); // Keep soft radio floor
          } else {
            // Beyond proximity: tactical radio cutoff or subtle background radio
            vol = this.settings.radioFilterEnabled ? 0.25 : 0;
          }
        }
        vol *= this.settings.voiceVolume;

        peerBundle.gainNode.gain.setValueAtTime(vol, now);
        peerBundle.distance = Math.round(distance * 10) / 10;
        peerBundle.volume = vol;
      }

      teammateStatuses.push({
        playerId: id,
        playerName: player.name || `Operator_${id.slice(-3)}`,
        team: this.myTeam,
        isTalking: (peerBundle && peerBundle.isTalking) || !!player.isTalking,
        isMuted: !!player.isMuted,
        distance: Math.round(distance),
        volume: vol,
        hasActiveStream: !!(peerBundle && peerBundle.remoteStream),
        isRadioTransmission: distance > 18 && this.settings.radioFilterEnabled,
      });
    });

    this.notifyTeammates(teammateStatuses);
  }

  private applyAudioSettings() {
    if (this.localGain) {
      this.localGain.gain.value = this.settings.micVolume;
    }
    this.peers.forEach((peer) => {
      if (peer.gainNode) {
        peer.gainNode.gain.value = this.settings.isDeafened ? 0 : this.settings.voiceVolume;
      }
      if (peer.pannerNode) {
        peer.pannerNode.maxDistance = this.settings.proximityMaxDistance;
      }
    });
    this.updateTrackState();
  }

  private closePeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      try {
        peer.peerConnection.close();
        if (peer.sourceNode) peer.sourceNode.disconnect();
        if (peer.pannerNode) peer.pannerNode.disconnect();
        if (peer.gainNode) peer.gainNode.disconnect();
      } catch (e) {}
      this.peers.delete(peerId);
    }
  }

  private closeAllPeers() {
    this.peers.forEach((_, id) => this.closePeer(id));
    this.peers.clear();
  }

  // Subscribers
  public onStatusChange(cb: (status: VoiceConnectionStatus) => void) {
    this.onStatusChangeCallbacks.push(cb);
    cb(this.status);
    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter((c) => c !== cb);
    };
  }

  public onTeammatesChange(cb: (teammates: TeammateVoiceStatus[]) => void) {
    this.onTeammatesChangeCallbacks.push(cb);
    return () => {
      this.onTeammatesChangeCallbacks = this.onTeammatesChangeCallbacks.filter((c) => c !== cb);
    };
  }

  public onLocalSpeaking(cb: (isTalking: boolean, level: number) => void) {
    this.onLocalSpeakingCallbacks.push(cb);
    return () => {
      this.onLocalSpeakingCallbacks = this.onLocalSpeakingCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyStatus() {
    this.onStatusChangeCallbacks.forEach((cb) => cb(this.status));
  }

  private notifyTeammates(list: TeammateVoiceStatus[]) {
    this.onTeammatesChangeCallbacks.forEach((cb) => cb(list));
  }

  private notifyLocalSpeaking(isTalking: boolean, level: number) {
    this.onLocalSpeakingCallbacks.forEach((cb) => cb(isTalking, level));
  }
}

export const webrtcVoice = new WebRTCVoiceManager();
