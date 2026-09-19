import { PlayerNetState, KillfeedEntry } from "../types";

export interface NetworkCallbacks {
  onInit: (data: { playerId: string; team: "alpha" | "bravo"; room: any; players: PlayerNetState[] }) => void;
  onStateDelta: (delta: { players: any[]; alphaScore: number; bravoScore: number }) => void;
  onPlayerJoined: (player: PlayerNetState) => void;
  onPlayerLeft: (playerId: string) => void;
  onPlayerShot: (data: { playerId: string; weapon: string; origin: any; direction: any }) => void;
  onHitEvent: (data: { attackerId: string; targetId: string; damage: number; isHeadshot: boolean; targetHealth: number; targetArmor: number }) => void;
  onKillfeed: (entry: KillfeedEntry) => void;
  onRespawn: (data: { playerId: string; x: number; y: number; z: number; health: number; armor: number }) => void;
  onArmorUpdated: (data: { armor: number; plates: number }) => void;
  onUAVActivated: (data: { callerId: string; callerTeam: "alpha" | "bravo"; duration: number }) => void;
  onPingUpdate: (ping: number) => void;
  onVoiceSignal?: (data: { senderId: string; signal: any }) => void;
  onVoiceState?: (data: { playerId: string; isTalking: boolean; isMuted: boolean }) => void;
}

export class GameNetwork {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private pingInterval: any = null;
  private currentPing: number = 20;
  private callbacks: NetworkCallbacks | null = null;
  private lastMovementSent: number = 0;
  public playerId: string = "";
  public playerTeam: "alpha" | "bravo" = "alpha";

  public connect(roomId: string, playerName: string, callbacks: NetworkCallbacks) {
    this.callbacks = callbacks;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const url = `${protocol}//${host}/?room=${encodeURIComponent(roomId)}&name=${encodeURIComponent(playerName)}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.startPingLoop();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error("Net parse error", e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        clearInterval(this.pingInterval);
        // Try auto reconnect after 3s
        setTimeout(() => {
          if (!this.isConnected && this.callbacks) {
            this.connect(roomId, playerName, this.callbacks);
          }
        }, 3000);
      };

      this.ws.onerror = (e) => {
        console.warn("WebSocket connection warning", e);
      };
    } catch (e) {
      console.error("WebSocket init failed", e);
    }
  }

  private startPingLoop() {
    clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "ping",
            clientTimestamp: performance.now(),
            ping: this.currentPing,
          })
        );
      }
    }, 2000);
  }

  private handleMessage(data: any) {
    if (!this.callbacks) return;

    switch (data.type) {
      case "pong": {
        const roundTrip = Math.round(performance.now() - data.clientTimestamp);
        this.currentPing = Math.max(12, roundTrip);
        this.callbacks.onPingUpdate(this.currentPing);
        break;
      }
      case "init":
        this.playerId = data.playerId;
        this.playerTeam = data.team;
        this.callbacks.onInit(data);
        break;
      case "state_delta":
        this.callbacks.onStateDelta(data);
        break;
      case "player_joined":
        this.callbacks.onPlayerJoined(data.player);
        break;
      case "player_left":
        this.callbacks.onPlayerLeft(data.playerId);
        break;
      case "player_shot":
        this.callbacks.onPlayerShot(data);
        break;
      case "hit_event":
        this.callbacks.onHitEvent(data);
        break;
      case "killfeed":
        this.callbacks.onKillfeed({
          id: `kf_${Date.now()}_${Math.random()}`,
          attackerName: data.attackerName,
          attackerTeam: data.attackerTeam,
          targetName: data.targetName,
          targetTeam: data.targetTeam,
          weapon: data.weapon,
          isHeadshot: !!data.isHeadshot,
          timestamp: Date.now(),
        });
        break;
      case "player_respawn":
        this.callbacks.onRespawn(data);
        break;
      case "armor_updated":
        this.callbacks.onArmorUpdated(data);
        break;
      case "uav_activated":
        this.callbacks.onUAVActivated(data);
        break;
      case "voice_signal":
        if (this.callbacks.onVoiceSignal) {
          this.callbacks.onVoiceSignal(data);
        }
        break;
      case "voice_state":
        if (this.callbacks.onVoiceState) {
          this.callbacks.onVoiceState(data);
        }
        break;
    }
  }

  public sendMovement(state: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    isSprinting: boolean;
    isSliding: boolean;
    isADS: boolean;
    isFiring: boolean;
    weapon: string;
  }) {
    const now = performance.now();
    // 25Hz throttle for mobile network conservation
    if (now - this.lastMovementSent < 38) return;
    this.lastMovementSent = now;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "movement",
          ...state,
        })
      );
    }
  }

  public sendShoot(weapon: string, origin: { x: number; y: number; z: number }, direction: { x: number; y: number; z: number }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "shoot",
          weapon,
          origin,
          direction,
        })
      );
    }
  }

  public sendBulletHit(targetId: string, damage: number, isHeadshot: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "bullet_hit",
          targetId,
          damage,
          isHeadshot,
        })
      );
    }
  }

  public sendArmorPlate() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "armor_plate" }));
    }
  }

  public sendCallUAV() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "call_uav" }));
    }
  }

  public sendVoiceSignal(targetId: string, signal: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "voice_signal",
          targetId,
          signal,
        })
      );
    }
  }

  public sendVoiceState(isTalking: boolean, isMuted: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "voice_state",
          isTalking,
          isMuted,
        })
      );
    }
  }

  public disconnect() {
    clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const network = new GameNetwork();
