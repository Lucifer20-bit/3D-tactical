/**
 * 3D Tactical FPS - High-octane multiplayer first-person shooter
 * Featuring Call of Duty and Bloodstrike mechanics:
 * Tactical sprint, slide cancelling, weapon ADS, armor plates,
 * responsive mobile touch controls, and low-latency network netcode.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { WEAPON_PRESETS, createWeaponMesh } from "./game/weapons";
import { buildWarzoneMap, BoxCollider } from "./game/map";
import { createPlayerModel, animateRemotePlayer, RemotePlayerMesh } from "./game/playerModel";
import { network } from "./game/network";
import { sounds } from "./game/audio";
import { TouchControls } from "./components/TouchControls";
import { GameHUD } from "./components/GameHUD";
import { SettingsModal, ScoreboardModal } from "./components/GameModals";
import { GunsmithModal } from "./components/GunsmithModal";
import { RankedMatchModal } from "./components/RankedMatchModal";
import { SpectatorHUD } from "./components/SpectatorHUD";
import { ProximityVoiceHUD } from "./components/ProximityVoiceHUD";
import { webrtcVoice } from "./game/webrtcVoice";
import {
  loadSavedLoadouts,
  saveLoadouts,
  getActiveLoadoutId,
  setActiveLoadoutId,
  loadRankedProfile,
  recordMatchResult,
} from "./game/loadoutStore";
import {
  Weapon,
  PlayerNetState,
  KillfeedEntry,
  Hitmarker,
  DamageIndicator,
  GameSettings,
  CustomLoadout,
  RankedProfile,
  SpectatorCameraMode,
  RankDivision,
} from "./types";
import { computeModifiedWeaponStats } from "./game/weapons";

const DEFAULT_SETTINGS: GameSettings = {
  lookSensitivity: 1.0,
  adsSensitivity: 0.8,
  invertY: false,
  gyroEnabled: false,
  graphicsQuality: "high",
  fov: 75,
  sfxVolume: 0.8,
  touchControlsOpacity: 0.85,
  haptics: true,
  bloodEffects: true,
  voiceChatEnabled: true,
  voiceMode: "push_to_talk",
  voiceVolume: 0.85,
  micSensitivity: 0.04,
  proximityMaxDistance: 35,
  spatialAudio: true,
  radioFilterEnabled: true,
};

interface GrenadeObj {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  timer: number;
}

export default function App() {
  // Canvas mount container
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Settings & UI state
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScoreboardOpen, setIsScoreboardOpen] = useState(false);
  const [isGunsmithOpen, setIsGunsmithOpen] = useState(false);
  const [isRankedOpen, setIsRankedOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Loadout & Gunsmith state
  const [loadouts, setLoadouts] = useState<CustomLoadout[]>(() => loadSavedLoadouts());
  const [activeLoadoutId, setActiveLoadoutIdState] = useState<string>(() => getActiveLoadoutId());
  const [activeWeaponSlot, setActiveWeaponSlot] = useState<"primary" | "secondary">("primary");

  // Ranked & Matchmaking state
  const [rankedProfile, setRankedProfile] = useState<RankedProfile>(() => loadRankedProfile());
  const [isRankedMatch, setIsRankedMatch] = useState(false);
  const [rankedDivision, setRankedDivision] = useState<string>("Gold II");

  // Spectator Mode state
  const [isSpectating, setIsSpectating] = useState(false);
  const [spectatorCameraMode, setSpectatorCameraMode] = useState<SpectatorCameraMode>("first_person");
  const [spectatedPlayerId, setSpectatedPlayerId] = useState<string | null>(null);
  const [droneAltitude, setDroneAltitude] = useState(14);
  const [isCinematicSpectator, setIsCinematicSpectator] = useState(false);

  // Match & Network state
  const [roomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("room") || "match_1";
  });
  const [myPlayerId, setMyPlayerId] = useState<string>("");
  const [myTeam, setMyTeam] = useState<"alpha" | "bravo">("alpha");
  const [ping, setPing] = useState(18);
  const [alphaScore, setAlphaScore] = useState(0);
  const [bravoScore, setBravoScore] = useState(0);
  const [scoreLimit] = useState(50);
  const [matchWinner, setMatchWinner] = useState<"alpha" | "bravo" | null>(null);
  const [playersList, setPlayersList] = useState<PlayerNetState[]>([]);

  // Combat & Equipment state
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(150);
  const [plates, setPlates] = useState(3);
  const [currentWeaponKey, setCurrentWeaponKey] = useState<string>("M4A1");
  const [currentWeapon, setCurrentWeapon] = useState<Weapon>(() => ({ ...WEAPON_PRESETS["M4A1"] }));
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);
  const [isADS, setIsADS] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);

  // Tactical Streaks & Feedback
  const [uavActive, setUavActive] = useState(false);
  const [uavReady, setUavReady] = useState(true);
  const [killfeed, setKillfeed] = useState<KillfeedEntry[]>([]);
  const [hitmarkers, setHitmarkers] = useState<Hitmarker[]>([]);
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([]);

  // Player Orientation for HUD Radar
  const [playerYaw, setPlayerYaw] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 0 });

  // Refs for real-time game loop access (avoiding closure staleness)
  const isDeadRef = useRef(false);
  const healthRef = useRef(100);
  const armorRef = useRef(150);
  const platesRef = useRef(3);
  const currentWeaponRef = useRef<Weapon>({ ...WEAPON_PRESETS["M4A1"] });
  const isReloadingRef = useRef(false);
  const isADSRef = useRef(false);
  const isSprintingRef = useRef(false);
  const isSlidingRef = useRef(false);
  const slideTimerRef = useRef(0);
  const slideDirRef = useRef(new THREE.Vector3());
  const isFiringRef = useRef(false);
  const lastFireTimeRef = useRef(0);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  settingsRef.current = settings;
  const isSpectatingRef = useRef(false);
  isSpectatingRef.current = isSpectating;
  const spectatedIdRef = useRef<string | null>(null);
  spectatedIdRef.current = spectatedPlayerId;
  const spectatorCamModeRef = useRef<SpectatorCameraMode>("first_person");
  spectatorCamModeRef.current = spectatorCameraMode;
  const droneAltitudeRef = useRef(14);
  droneAltitudeRef.current = droneAltitude;

  // Match stats tracker
  const matchStatsRef = useRef({ kills: 0, deaths: 0, damageDealt: 0 });

  // Movement inputs
  const inputMoveRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keyStateRef = useRef<Record<string, boolean>>({});

  // Three.js Game World References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const collidersRef = useRef<BoxCollider[]>([]);
  const remotePlayersRef = useRef<Map<string, RemotePlayerMesh>>(new Map());
  const remoteStatesRef = useRef<Map<string, PlayerNetState>>(new Map());
  const grenadesRef = useRef<GrenadeObj[]>([]);

  // First-person weapon viewmodel
  const weaponRigRef = useRef<THREE.Group | null>(null);
  const weaponMeshRef = useRef<{
    root: THREE.Group;
    muzzleFlash: THREE.PointLight;
    flashMesh: THREE.Mesh;
    sightPoint: THREE.Vector3;
  } | null>(null);

  // Player position & physics
  const playerPositionRef = useRef(new THREE.Vector3(-35, 1.5, -35));
  const playerVelocityRef = useRef(new THREE.Vector3());
  const playerRotationRef = useRef({ yaw: 0, pitch: 0 });
  const isGroundedRef = useRef(true);
  const cameraBobTimeRef = useRef(0);
  const weaponRecoilOffsetRef = useRef(new THREE.Vector3());

  // Setup Three.js World & Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181c22);
    scene.fog = new THREE.FogExp2(0x181c22, 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.rotation.order = "YXZ";
    cameraRef.current = camera;
    scene.add(camera);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: settings.graphicsQuality !== "low",
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.graphicsQuality === "high" ? 2 : 1));
    renderer.shadowMap.enabled = settings.graphicsQuality === "high";
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. Lighting (Atmospheric Tactical Warzone)
    const ambientLight = new THREE.HemisphereLight(0xcfd8dc, 0x263238, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff1cf, 1.25);
    dirLight.position.set(35, 45, 25);
    dirLight.castShadow = settings.graphicsQuality === "high";
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 5;
      dirLight.shadow.camera.far = 120;
      dirLight.shadow.camera.left = -45;
      dirLight.shadow.camera.right = 45;
      dirLight.shadow.camera.top = 45;
      dirLight.shadow.camera.bottom = -45;
    }
    scene.add(dirLight);

    // 5. Build Warzone Shipping Yard Map
    const mapData = buildWarzoneMap();
    scene.add(mapData.sceneGroup);
    collidersRef.current = mapData.colliders;

    // 6. First-Person Weapon Rig attached to Camera
    const weaponRig = new THREE.Group();
    weaponRig.position.set(0.18, -0.16, -0.32);
    camera.add(weaponRig);
    weaponRigRef.current = weaponRig;

    // Build initial weapon mesh from custom loadout
    const initialLoadouts = loadSavedLoadouts();
    const activeId = getActiveLoadoutId();
    const initialLoadout = initialLoadouts.find((l) => l.id === activeId) || initialLoadouts[0];
    const initialWepMesh = createWeaponMesh(initialLoadout.primaryWeaponId, initialLoadout.primaryAttachments);
    weaponRig.add(initialWepMesh.root);
    weaponMeshRef.current = initialWepMesh;

    // 7. WebSocket Network Setup
    network.connect(roomId, `Operator_${Math.floor(100 + Math.random() * 900)}`, {
      onInit: (data) => {
        setMyPlayerId(data.playerId);
        setMyTeam(data.team);
        // Find own spawn point
        const me = data.players.find((p) => p.id === data.playerId);
        if (me) {
          playerPositionRef.current.set(me.x, me.y, me.z);
        }
        setPlayersList(data.players);

        // Initialize WebRTC Voice Chat for tactical team comms
        webrtcVoice.init(data.playerId, data.team, {
          enabled: settingsRef.current.voiceChatEnabled,
          mode: settingsRef.current.voiceMode,
          voiceVolume: settingsRef.current.voiceVolume,
          micSensitivity: settingsRef.current.micSensitivity,
          proximityMaxDistance: settingsRef.current.proximityMaxDistance,
          spatialAudio: settingsRef.current.spatialAudio,
          radioFilterEnabled: settingsRef.current.radioFilterEnabled,
        });
        webrtcVoice.syncTeammates(data.players);
      },
      onStateDelta: (delta) => {
        setAlphaScore(delta.alphaScore);
        setBravoScore(delta.bravoScore);
        if (delta.alphaScore >= 50 && !matchWinner) {
          setMatchWinner("alpha");
          sounds.playRadioBeep();
          const isVictory = myTeam === "alpha";
          const res = recordMatchResult(
            isVictory,
            matchStatsRef.current.kills,
            matchStatsRef.current.deaths,
            matchStatsRef.current.damageDealt,
            delta.alphaScore,
            delta.bravoScore,
            isRankedMatch
          );
          setRankedProfile(res.profile);
        } else if (delta.bravoScore >= 50 && !matchWinner) {
          setMatchWinner("bravo");
          sounds.playRadioBeep();
          const isVictory = myTeam === "bravo";
          const res = recordMatchResult(
            isVictory,
            matchStatsRef.current.kills,
            matchStatsRef.current.deaths,
            matchStatsRef.current.damageDealt,
            delta.bravoScore,
            delta.alphaScore,
            isRankedMatch
          );
          setRankedProfile(res.profile);
        }

        // Sync remote players map
        delta.players.forEach((p: any) => {
          if (p.id === network.playerId) {
            // Update local stats from authoritative server
            setHealth(p.hp);
            setArmor(p.ar);
            healthRef.current = p.hp;
            armorRef.current = p.ar;
            isDeadRef.current = !p.alive;
            return;
          }

          let existingMesh = remotePlayersRef.current.get(p.id);
          if (!existingMesh) {
            // New remote player model
            const playerTeam = p.id.includes("alpha") || p.id.charCodeAt(0) % 2 === 0 ? "alpha" : "bravo";
            const newMesh = createPlayerModel(playerTeam, p.id);
            scene.add(newMesh.root);
            remotePlayersRef.current.set(p.id, newMesh);
            existingMesh = newMesh;
          }

          // Target position interpolation
          remoteStatesRef.current.set(p.id, {
            id: p.id,
            name: p.id,
            team: p.id.includes("alpha") ? "alpha" : "bravo",
            isBot: p.id.startsWith("bot_"),
            x: p.x,
            y: p.y,
            z: p.z,
            yaw: p.yaw,
            pitch: p.pitch,
            health: p.hp,
            armor: p.ar,
            plates: 3,
            isAlive: p.alive,
            isSliding: p.slide,
            isSprinting: p.sprint,
            isADS: p.ads,
            isFiring: p.fire,
            selectedWeapon: p.wep,
            kills: p.k,
            deaths: p.d,
            score: p.sc,
            ping: p.png,
            isTalking: !!p.tlk,
            isMuted: !!p.mut,
          });
        });

        setPlayersList(Array.from(remoteStatesRef.current.values()));
      },
      onPlayerJoined: (player) => {
        if (player.id === network.playerId) return;
        const mesh = createPlayerModel(player.team, player.name);
        mesh.root.position.set(player.x, player.y, player.z);
        scene.add(mesh.root);
        remotePlayersRef.current.set(player.id, mesh);
        webrtcVoice.syncTeammates(Array.from(remoteStatesRef.current.values()));
      },
      onPlayerLeft: (playerId) => {
        const mesh = remotePlayersRef.current.get(playerId);
        if (mesh) {
          scene.remove(mesh.root);
          remotePlayersRef.current.delete(playerId);
        }
        remoteStatesRef.current.delete(playerId);
        webrtcVoice.syncTeammates(Array.from(remoteStatesRef.current.values()));
      },
      onVoiceSignal: (data) => {
        webrtcVoice.handleVoiceSignal(data.senderId, data.signal);
      },
      onVoiceState: (data) => {
        const state = remoteStatesRef.current.get(data.playerId);
        if (state) {
          state.isTalking = data.isTalking;
          state.isMuted = data.isMuted;
        }
      },
      onPlayerShot: (data) => {
        // Play remote gunshot audio if nearby
        const dist = playerPositionRef.current.distanceTo(new THREE.Vector3(data.origin.x, data.origin.y, data.origin.z));
        if (dist < 45) {
          sounds.playGunshot("AR");
        }
      },
      onHitEvent: (data) => {
        if (data.attackerId === network.playerId) {
          // Local player dealt damage!
          const isKill = data.targetHealth <= 0;
          sounds.playHitmarker(isKill, data.isHeadshot);
          matchStatsRef.current.damageDealt += data.damage;
          if (isKill) {
            matchStatsRef.current.kills += 1;
          }

          const hm: Hitmarker = {
            id: `hm_${Date.now()}_${Math.random()}`,
            isKill,
            isHeadshot: data.isHeadshot,
            timestamp: Date.now(),
          };
          setHitmarkers((prev) => [...prev.slice(-4), hm]);
        } else if (data.targetId === network.playerId) {
          // Local player received damage!
          if (data.targetHealth <= 0) {
            matchStatsRef.current.deaths += 1;
          }
          const attacker = remoteStatesRef.current.get(data.attackerId);
          if (attacker) {
            const dx = attacker.x - playerPositionRef.current.x;
            const dz = attacker.z - playerPositionRef.current.z;
            const hitAngle = Math.atan2(dx, dz) - playerRotationRef.current.yaw;
            const di: DamageIndicator = {
              id: `di_${Date.now()}`,
              angle: hitAngle,
              timestamp: Date.now(),
            };
            setDamageIndicators((prev) => [...prev.slice(-3), di]);
          }
        }
      },
      onKillfeed: (entry) => {
        setKillfeed((prev) => [...prev.slice(-6), entry]);
      },
      onRespawn: (data) => {
        if (data.playerId === network.playerId) {
          playerPositionRef.current.set(data.x, data.y, data.z);
          playerVelocityRef.current.set(0, 0, 0);
          isDeadRef.current = false;
          setHealth(100);
          setArmor(100);
          healthRef.current = 100;
          armorRef.current = 100;
        }
      },
      onArmorUpdated: (data) => {
        setArmor(data.armor);
        setPlates(data.plates);
        armorRef.current = data.armor;
        platesRef.current = data.plates;
      },
      onUAVActivated: (data) => {
        sounds.playRadioBeep();
        if (data.callerTeam === myTeam) {
          setUavActive(true);
          setTimeout(() => setUavActive(false), data.duration);
        }
      },
      onPingUpdate: (newPing) => {
        setPing(newPing);
      },
    });

    // 8. Resize Handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // 9. Desktop Keyboard / Mouse Pointer Lock Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keyStateRef.current[e.code] = true;

      // Quick keybinds
      if (e.code === "KeyR") handleReload();
      if (e.code === "Digit1") switchWeaponByIndex(0);
      if (e.code === "Digit2") switchWeaponByIndex(1);
      if (e.code === "Digit3") switchWeaponByIndex(2);
      if (e.code === "Digit4") switchWeaponByIndex(3);
      if (e.code === "KeyC") handleSlideAction();
      if (e.code === "KeyG") handleThrowGrenade();
      if (e.code === "Tab") {
        e.preventDefault();
        setIsScoreboardOpen((prev) => !prev);
      }
      if (e.code === "KeyP") handleArmorPlateAction();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyStateRef.current[e.code] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Check if clicking inside canvas area and not on modal/buttons
      if ((e.target as HTMLElement).tagName !== "BUTTON") {
        if (!document.pointerLockElement && canvasRef.current) {
          canvasRef.current.requestPointerLock();
        }
        if (e.button === 0) {
          handleFireStart();
        } else if (e.button === 2) {
          e.preventDefault();
          handleToggleADS();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        handleFireEnd();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        const factor = (isADSRef.current ? 0.0014 : 0.0022) * settingsRef.current.lookSensitivity;
        handleLookDelta(-e.movementX * factor, -e.movementY * factor);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("contextmenu", handleContextMenu);

    // 10. Main High-Performance Game Animation Loop
    let lastTime = performance.now();
    let animFrameId: number;

    const gameLoop = (currentTime: number) => {
      animFrameId = requestAnimationFrame(gameLoop);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.05); // cap frame delta
      lastTime = currentTime;

      if (isSpectatingRef.current) {
        if (weaponRigRef.current) weaponRigRef.current.visible = false;
        updateSpectatorCamera(delta);
      } else {
        if (weaponRigRef.current) weaponRigRef.current.visible = true;
        updateGamePhysics(delta);
        updateWeaponAnimations(delta);
      }
      updateRemotePlayers(delta);
      updateGrenades(delta);

      // WebRTC 3D Proximity Audio & HRTF Spatial calculation
      if (cameraRef.current) {
        webrtcVoice.updateSpatialPositions(
          {
            x: playerPositionRef.current.x,
            y: playerPositionRef.current.y,
            z: playerPositionRef.current.z,
            yaw: playerRotationRef.current.yaw,
            pitch: playerRotationRef.current.pitch,
          },
          remoteStatesRef.current as any
        );
      }

      // Render Scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("contextmenu", handleContextMenu);
      network.disconnect();
      webrtcVoice.stopVoice();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [roomId]);

  const activeLoadout = loadouts.find((l) => l.id === activeLoadoutId) || loadouts[0];

  // Apply Weapon from Custom Loadout
  const applyLoadoutWeapon = useCallback((loadout: CustomLoadout, slot: "primary" | "secondary") => {
    const wepId = slot === "primary" ? loadout.primaryWeaponId : loadout.secondaryWeaponId;
    const atts = slot === "primary" ? loadout.primaryAttachments : loadout.secondaryAttachments;
    const baseWep = WEAPON_PRESETS[wepId] || WEAPON_PRESETS["M4A1"];
    const modified = computeModifiedWeaponStats(baseWep, atts);

    currentWeaponRef.current = modified;
    setCurrentWeapon(modified);
    setCurrentWeaponKey(wepId);
    setActiveWeaponSlot(slot);

    // Swap 3D model with visual attachments
    if (weaponRigRef.current && sceneRef.current) {
      while (weaponRigRef.current.children.length > 0) {
        weaponRigRef.current.remove(weaponRigRef.current.children[0]);
      }
      const newMesh = createWeaponMesh(wepId, atts);
      weaponRigRef.current.add(newMesh.root);
      weaponMeshRef.current = newMesh;
    }
  }, []);

  // Spectator Camera Controller (First-Person POV, Orbit Chase, Free Drone)
  const droneAngleRef = useRef(0);
  const updateSpectatorCamera = (delta: number) => {
    if (!cameraRef.current) return;
    const players = Array.from(remoteStatesRef.current.values());
    let target = spectatedIdRef.current
      ? remoteStatesRef.current.get(spectatedIdRef.current)
      : players[0];

    if (!target && players.length > 0) {
      target = players[0];
      spectatedIdRef.current = target.id;
      setSpectatedPlayerId(target.id);
    }

    if (spectatorCamModeRef.current === "first_person" && target) {
      // First-person POV: Position directly at target's eye level
      cameraRef.current.position.set(target.x, target.y + 0.1, target.z);
      cameraRef.current.rotation.order = "YXZ";
      cameraRef.current.rotation.y = target.yaw;
      cameraRef.current.rotation.x = target.pitch;
      cameraRef.current.rotation.z = 0;
    } else if (spectatorCamModeRef.current === "third_person" && target) {
      // Third-person Orbit Chase: 3.5m behind target
      const backDist = 3.6;
      const height = 1.3;
      const targetCamPos = new THREE.Vector3(
        target.x + Math.sin(target.yaw) * backDist,
        target.y + height,
        target.z + Math.cos(target.yaw) * backDist
      );
      cameraRef.current.position.lerp(targetCamPos, 0.25);
      cameraRef.current.lookAt(target.x, target.y + 0.8, target.z);
    } else {
      // Free Drone Camera: Smooth orbit hovering above the arena
      droneAngleRef.current += delta * 0.12;
      const radius = 30;
      const droneX = Math.sin(droneAngleRef.current) * radius;
      const droneZ = Math.cos(droneAngleRef.current) * radius;
      cameraRef.current.position.set(droneX, droneAltitudeRef.current, droneZ);
      cameraRef.current.lookAt(0, 1.2, 0);
    }
  };

  // Handle Look Delta (from Touch drag or Mouse movement or Gyro)
  const handleLookDelta = useCallback((deltaYaw: number, deltaPitch: number) => {
    playerRotationRef.current.yaw += deltaYaw;
    const inv = settingsRef.current.invertY ? -1 : 1;
    playerRotationRef.current.pitch = Math.max(
      -Math.PI / 2.3,
      Math.min(Math.PI / 2.3, playerRotationRef.current.pitch + deltaPitch * inv)
    );

    if (cameraRef.current) {
      cameraRef.current.rotation.y = playerRotationRef.current.yaw;
      cameraRef.current.rotation.x = playerRotationRef.current.pitch;
    }
  }, []);

  // Update Game Physics, Movement & Collisions
  const updateGamePhysics = (delta: number) => {
    if (isDeadRef.current) return;

    // Aggregate inputs (touch joystick + WASD keyboard)
    let moveForward = inputMoveRef.current.y;
    let moveSide = inputMoveRef.current.x;

    if (keyStateRef.current["KeyW"] || keyStateRef.current["ArrowUp"]) moveForward += 1;
    if (keyStateRef.current["KeyS"] || keyStateRef.current["ArrowDown"]) moveForward -= 1;
    if (keyStateRef.current["KeyD"] || keyStateRef.current["ArrowRight"]) moveSide += 1;
    if (keyStateRef.current["KeyA"] || keyStateRef.current["ArrowLeft"]) moveSide -= 1;

    // Check tactical sprint & Double Time Perk
    const hasDoubleTime = activeLoadout.perks.includes("double_time");
    const isSprintInput = keyStateRef.current["ShiftLeft"] || keyStateRef.current["ShiftRight"];
    const shouldSprint = (isSprintInput || isSprintingRef.current) && moveForward > 0.3 && !isADSRef.current;
    isSprintingRef.current = shouldSprint;
    setIsSprinting(shouldSprint);

    // Slide Mechanic (Bloodstrike / Warzone signature)
    let baseSpeed = shouldSprint ? (hasDoubleTime ? 13.8 : 12.5) : 7.8;
    if (isADSRef.current) baseSpeed *= 0.55;

    if (isSlidingRef.current) {
      slideTimerRef.current -= delta;
      if (slideTimerRef.current <= 0) {
        isSlidingRef.current = false;
        setIsSliding(false);
      }
    }

    // Compute Direction
    const yaw = playerRotationRef.current.yaw;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, moveForward);
    moveDir.addScaledVector(right, moveSide);

    if (moveDir.lengthSq() > 1) {
      moveDir.normalize();
    }

    // Velocity update
    if (isSlidingRef.current) {
      // Slide burst speed tapering down
      const slideSpeed = 16.0 * (slideTimerRef.current / 0.75 + 0.3);
      playerVelocityRef.current.x = slideDirRef.current.x * slideSpeed;
      playerVelocityRef.current.z = slideDirRef.current.z * slideSpeed;
    } else {
      playerVelocityRef.current.x = moveDir.x * baseSpeed;
      playerVelocityRef.current.z = moveDir.z * baseSpeed;
    }

    // Jump & Gravity
    if ((keyStateRef.current["Space"] || false) && isGroundedRef.current) {
      playerVelocityRef.current.y = 8.2;
      isGroundedRef.current = false;
      // Slide-jump maintains momentum
      if (isSlidingRef.current) {
        isSlidingRef.current = false;
        setIsSliding(false);
      }
    }

    // Gravity
    playerVelocityRef.current.y -= 22.0 * delta;

    // Move & Collision Resolution
    const nextPos = playerPositionRef.current.clone();
    nextPos.x += playerVelocityRef.current.x * delta;
    nextPos.z += playerVelocityRef.current.z * delta;
    nextPos.y += playerVelocityRef.current.y * delta;

    // Ground Floor collision
    const targetEyeHeight = isSlidingRef.current ? 0.8 : 1.65;
    if (nextPos.y <= targetEyeHeight) {
      nextPos.y = targetEyeHeight;
      playerVelocityRef.current.y = 0;
      isGroundedRef.current = true;
    }

    // AABB Bounding Box Colliders check
    const playerRadius = 0.55;
    for (const box of collidersRef.current) {
      if (
        nextPos.x + playerRadius > box.min.x &&
        nextPos.x - playerRadius < box.max.x &&
        nextPos.z + playerRadius > box.min.z &&
        nextPos.z - playerRadius < box.max.z &&
        nextPos.y - targetEyeHeight < box.max.y &&
        nextPos.y > box.min.y
      ) {
        // Can mantle/walk on top of low crates or ramps
        if (playerPositionRef.current.y >= box.max.y) {
          nextPos.y = box.max.y + targetEyeHeight;
          playerVelocityRef.current.y = 0;
          isGroundedRef.current = true;
        } else {
          // Horizontal push out
          nextPos.x = playerPositionRef.current.x;
          nextPos.z = playerPositionRef.current.z;
        }
      }
    }

    // Map limits (-48 to 48)
    nextPos.x = Math.max(-47, Math.min(47, nextPos.x));
    nextPos.z = Math.max(-47, Math.min(47, nextPos.z));

    playerPositionRef.current.copy(nextPos);

    // Update camera position with smooth head bobbing
    if (cameraRef.current) {
      const isMoving = (Math.abs(moveForward) > 0.1 || Math.abs(moveSide) > 0.1) && isGroundedRef.current;
      if (isMoving && !isSlidingRef.current) {
        cameraBobTimeRef.current += delta * (shouldSprint ? 18 : 12);
        const bobY = Math.sin(cameraBobTimeRef.current) * (shouldSprint ? 0.08 : 0.04);
        const bobX = Math.cos(cameraBobTimeRef.current * 0.5) * 0.03;
        cameraRef.current.position.set(nextPos.x + bobX, nextPos.y + bobY, nextPos.z);
      } else {
        cameraRef.current.position.set(nextPos.x, nextPos.y, nextPos.z);
      }

      // Slide camera roll tilt
      const targetRoll = isSlidingRef.current ? 0.08 : 0;
      cameraRef.current.rotation.z += (targetRoll - cameraRef.current.rotation.z) * 0.2;
    }

    // Update HUD Orientation
    setPlayerYaw(playerRotationRef.current.yaw);
    setPlayerPos({ x: nextPos.x, z: nextPos.z });

    // Send movement to server (throttled at 25Hz)
    network.sendMovement({
      x: nextPos.x,
      y: nextPos.y,
      z: nextPos.z,
      yaw: playerRotationRef.current.yaw,
      pitch: playerRotationRef.current.pitch,
      isSprinting: shouldSprint,
      isSliding: isSlidingRef.current,
      isADS: isADSRef.current,
      isFiring: isFiringRef.current,
      weapon: currentWeaponRef.current.name,
    });

    // Handle automatic firing
    if (isFiringRef.current && currentWeaponRef.current.isAutomatic) {
      executeWeaponShot();
    }
  };

  // Interpolate remote players at 60FPS
  const updateRemotePlayers = (delta: number) => {
    remoteStatesRef.current.forEach((state, id) => {
      const mesh = remotePlayersRef.current.get(id);
      if (!mesh) return;

      // Smooth lerp to authoritative server position
      const targetPos = new THREE.Vector3(state.x, state.y - 1.5, state.z);
      mesh.root.position.lerp(targetPos, 0.25);

      // Smooth yaw rotation
      mesh.root.rotation.y = state.yaw + Math.PI;

      const isMoving = Math.abs(mesh.root.position.x - targetPos.x) > 0.05 || Math.abs(mesh.root.position.z - targetPos.z) > 0.05;
      animateRemotePlayer(mesh, delta, isMoving, state.isSprinting, state.isSliding, state.isFiring, state.isAlive);
    });
  };

  // Procedural Weapon Viewmodel Animation
  const updateWeaponAnimations = (delta: number) => {
    if (!weaponRigRef.current || !weaponMeshRef.current || !cameraRef.current) return;

    const wep = weaponMeshRef.current;
    const targetFov = isADSRef.current ? currentWeaponRef.current.adsFov : settingsRef.current.fov;
    cameraRef.current.fov += (targetFov - cameraRef.current.fov) * 0.2;
    cameraRef.current.updateProjectionMatrix();

    // ADS Position vs Hipfire Position
    const hipPos = new THREE.Vector3(0.18, -0.16, -0.32);
    // When ADS, weapon sights align directly with center screen (x: 0, y: -sightPoint.y)
    const adsPos = new THREE.Vector3(0, -wep.sightPoint.y, -0.22);
    const targetPos = isADSRef.current ? adsPos : hipPos;

    // Tactical Sprint Weapon Angle
    const targetRot = new THREE.Euler(0, 0, 0);
    if (isSprintingRef.current && !isADSRef.current) {
      targetPos.set(0.12, -0.22, -0.28);
      targetRot.set(-0.6, 0.4, -0.3); // CoD tactical sprint rush angle
    }

    // Recoil recovery
    weaponRecoilOffsetRef.current.multiplyScalar(0.85);

    weaponRigRef.current.position.lerp(targetPos.clone().add(weaponRecoilOffsetRef.current), 0.28);
    weaponRigRef.current.rotation.x += (targetRot.x - weaponRigRef.current.rotation.x) * 0.2;
    weaponRigRef.current.rotation.y += (targetRot.y - weaponRigRef.current.rotation.y) * 0.2;
    weaponRigRef.current.rotation.z += (targetRot.z - weaponRigRef.current.rotation.z) * 0.2;

    // Fade out muzzle flash light
    if (wep.muzzleFlash.intensity > 0) {
      wep.muzzleFlash.intensity *= 0.6;
      (wep.flashMesh.material as THREE.MeshBasicMaterial).opacity *= 0.6;
    }
  };

  // Update thrown grenades
  const updateGrenades = (delta: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    for (let i = grenadesRef.current.length - 1; i >= 0; i--) {
      const g = grenadesRef.current[i];
      g.timer -= delta;
      g.velocity.y -= 16.0 * delta; // gravity
      g.mesh.position.addScaledVector(g.velocity, delta);

      // Bounce on floor
      if (g.mesh.position.y <= 0.2) {
        g.mesh.position.y = 0.2;
        g.velocity.y = -g.velocity.y * 0.45;
        g.velocity.x *= 0.7;
        g.velocity.z *= 0.7;
      }

      // Detonation
      if (g.timer <= 0) {
        sounds.playExplosion();
        // Check damage to nearby enemies
        remoteStatesRef.current.forEach((enemy, enemyId) => {
          const dist = g.mesh.position.distanceTo(new THREE.Vector3(enemy.x, enemy.y, enemy.z));
          if (dist < 9.0) {
            const dmg = Math.round(110 * (1 - dist / 9.0));
            network.sendBulletHit(enemyId, dmg, false);
          }
        });

        scene.remove(g.mesh);
        grenadesRef.current.splice(i, 1);
      }
    }
  };

  // Weapon Firing Mechanism
  const executeWeaponShot = () => {
    if (isDeadRef.current || isReloadingRef.current) return;

    const wep = currentWeaponRef.current;
    const now = performance.now();
    const fireInterval = (60 / wep.fireRate) * 1000;

    if (now - lastFireTimeRef.current < fireInterval) return;

    if (wep.currentAmmo <= 0) {
      handleReload();
      return;
    }

    lastFireTimeRef.current = now;
    wep.currentAmmo--;
    setCurrentWeapon({ ...wep });

    // Audio & Muzzle Flash
    sounds.playGunshot(wep.category);

    if (weaponMeshRef.current) {
      weaponMeshRef.current.muzzleFlash.intensity = 4.0;
      (weaponMeshRef.current.flashMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
    }

    // Recoil Impulse
    weaponRecoilOffsetRef.current.z += 0.05;
    weaponRecoilOffsetRef.current.y += wep.recoilVertical;
    handleLookDelta(
      (Math.random() - 0.5) * wep.recoilHorizontal,
      wep.recoilVertical * 0.4
    );

    // Bullet Raycasting
    if (cameraRef.current && sceneRef.current) {
      const raycaster = new THREE.Raycaster();
      const origin = cameraRef.current.position.clone();
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRef.current.quaternion);

      // Weapon spread
      const spreadFactor = isADSRef.current ? 0.005 : wep.spread;
      dir.x += (Math.random() - 0.5) * spreadFactor;
      dir.y += (Math.random() - 0.5) * spreadFactor;
      dir.normalize();

      raycaster.set(origin, dir);

      // Check hit against remote players
      let hitTarget: { id: string; dist: number; isHeadshot: boolean } | null = null;
      let minHitDist = Infinity;

      remotePlayersRef.current.forEach((mesh, id) => {
        const state = remoteStatesRef.current.get(id);
        if (!state || !state.isAlive || state.team === myTeam) return;

        // Check head hitbox
        const headIntersects = raycaster.intersectObject(mesh.head, true);
        if (headIntersects.length > 0 && headIntersects[0].distance < minHitDist) {
          minHitDist = headIntersects[0].distance;
          hitTarget = { id, dist: headIntersects[0].distance, isHeadshot: true };
        }

        // Check torso hitbox
        const torsoIntersects = raycaster.intersectObject(mesh.torso, true);
        if (torsoIntersects.length > 0 && torsoIntersects[0].distance < minHitDist) {
          minHitDist = torsoIntersects[0].distance;
          hitTarget = { id, dist: torsoIntersects[0].distance, isHeadshot: false };
        }
      });

      if (hitTarget) {
        network.sendBulletHit((hitTarget as any).id, wep.damage, (hitTarget as any).isHeadshot);
      }

      // Broadcast shot event
      network.sendShoot(wep.name, { x: origin.x, y: origin.y, z: origin.z }, { x: dir.x, y: dir.y, z: dir.z });
    }
  };

  // Fire Start & End Handlers
  const handleFireStart = () => {
    isFiringRef.current = true;
    executeWeaponShot();
  };

  const handleFireEnd = () => {
    isFiringRef.current = false;
  };

  // Aim Down Sights (ADS)
  const handleToggleADS = () => {
    isADSRef.current = !isADSRef.current;
    setIsADS(isADSRef.current);
  };

  // Tactical Slide (Bloodstrike / Call of Duty slide cancel)
  const handleSlideAction = () => {
    if (isSlidingRef.current || !isGroundedRef.current) return;

    isSlidingRef.current = true;
    setIsSliding(true);
    slideTimerRef.current = 0.75;
    sounds.playSlide();

    // Slide forward in current camera yaw direction
    const yaw = playerRotationRef.current.yaw;
    slideDirRef.current.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
  };

  // Jump
  const handleJumpAction = () => {
    if (isGroundedRef.current) {
      playerVelocityRef.current.y = 8.2;
      isGroundedRef.current = false;
      if (isSlidingRef.current) {
        isSlidingRef.current = false;
        setIsSliding(false);
      }
    }
  };

  // Reload (with Amped perk accelerator)
  const handleReload = () => {
    const wep = currentWeaponRef.current;
    if (isReloadingRef.current || wep.currentAmmo === wep.magSize || wep.reserveAmmo <= 0) return;

    isReloadingRef.current = true;
    setIsReloading(true);
    sounds.playReload();

    const isAmped = activeLoadout.perks.includes("amped");
    const startTime = performance.now();
    const duration = wep.reloadTime * 1000 * (isAmped ? 0.72 : 1.0);

    const reloadTimer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setReloadProgress(progress);

      if (progress >= 1) {
        clearInterval(reloadTimer);
        const needed = wep.magSize - wep.currentAmmo;
        const available = Math.min(needed, wep.reserveAmmo);
        wep.currentAmmo += available;
        wep.reserveAmmo -= available;
        setCurrentWeapon({ ...wep });
        isReloadingRef.current = false;
        setIsReloading(false);
        setReloadProgress(0);
      }
    }, 50);
  };

  // Switch Weapon between Primary and Secondary in Active Loadout
  const handleNextWeapon = () => {
    const nextSlot = activeWeaponSlot === "primary" ? "secondary" : "primary";
    applyLoadoutWeapon(activeLoadout, nextSlot);
    sounds.playReload();
  };

  const switchWeaponByIndex = (index: number) => {
    const keys = Object.keys(WEAPON_PRESETS);
    const key = keys[index % keys.length];
    setCurrentWeaponKey(key);
    const baseWep = WEAPON_PRESETS[key];
    const newWep = { ...baseWep };
    currentWeaponRef.current = newWep;
    setCurrentWeapon(newWep);

    if (weaponRigRef.current && sceneRef.current) {
      while (weaponRigRef.current.children.length > 0) {
        weaponRigRef.current.remove(weaponRigRef.current.children[0]);
      }
      const newMesh = createWeaponMesh(key, {});
      weaponRigRef.current.add(newMesh.root);
      weaponMeshRef.current = newMesh;
    }
  };

  // Spectator mode navigation
  const handleSpectatorNextPlayer = () => {
    const list = playersList.filter((p) => p.isAlive);
    if (list.length === 0) return;
    const currIdx = list.findIndex((p) => p.id === spectatedPlayerId);
    const nextIdx = (currIdx + 1) % list.length;
    setSpectatedPlayerId(list[nextIdx].id);
    spectatedIdRef.current = list[nextIdx].id;
    sounds.playRadioBeep();
  };

  const handleSpectatorPrevPlayer = () => {
    const list = playersList.filter((p) => p.isAlive);
    if (list.length === 0) return;
    const currIdx = list.findIndex((p) => p.id === spectatedPlayerId);
    const prevIdx = (currIdx - 1 + list.length) % list.length;
    setSpectatedPlayerId(list[prevIdx].id);
    spectatedIdRef.current = list[prevIdx].id;
    sounds.playRadioBeep();
  };

  // Armor Plate Action (Warzone / Bloodstrike 3-Pip Vest)
  const handleArmorPlateAction = () => {
    if (platesRef.current > 0 && armorRef.current < 150) {
      sounds.playArmorPlate();
      network.sendArmorPlate();
    }
  };

  // Tactical Frag Grenade
  const handleThrowGrenade = () => {
    if (!cameraRef.current || !sceneRef.current) return;

    sounds.playRadioBeep();
    const grenadeMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x3d4435, metalness: 0.8, roughness: 0.2 })
    );
    grenadeMesh.position.copy(cameraRef.current.position);

    const throwDir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRef.current.quaternion);
    const velocity = throwDir.multiplyScalar(22).add(new THREE.Vector3(0, 5, 0));

    sceneRef.current.add(grenadeMesh);
    grenadesRef.current.push({
      mesh: grenadeMesh,
      velocity,
      timer: 2.5,
    });
  };

  // UAV Scorestreak
  const handleActivateUAV = () => {
    if (!uavReady) return;
    setUavReady(false);
    network.sendCallUAV();
    setTimeout(() => setUavReady(true), 40000); // 40s cooldown
  };

  // Joystick Move callback from TouchControls
  const handleJoystickMove = useCallback((moveX: number, moveY: number, isSprinting: boolean) => {
    inputMoveRef.current = { x: moveX, y: moveY };
    isSprintingRef.current = isSprinting;
    setIsSprinting(isSprinting);
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-viewport-container"
      className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none"
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} id="fps-canvas" className="w-full h-full block cursor-crosshair" />

      {/* Tactical HUD Overlay & Touch Controls or Spectator Broadcast HUD */}
      {!isSpectating ? (
        <>
          <GameHUD
            health={health}
            armor={armor}
            plates={plates}
            weapon={currentWeapon}
            isReloading={isReloading}
            reloadProgress={reloadProgress}
            isSliding={isSliding}
            isSprinting={isSprinting}
            isADS={isADS}
            ping={ping}
            alphaScore={alphaScore}
            bravoScore={bravoScore}
            scoreLimit={scoreLimit}
            team={myTeam}
            killfeed={killfeed}
            hitmarkers={hitmarkers}
            damageIndicators={damageIndicators}
            uavActive={uavActive}
            uavProgress={0}
            players={playersList}
            playerYaw={playerYaw}
            playerPos={playerPos}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenScoreboard={() => setIsScoreboardOpen(true)}
            onOpenGunsmith={() => setIsGunsmithOpen(true)}
            onOpenRanked={() => setIsRankedOpen(true)}
            onOpenSpectator={() => {
              setIsSpectating(true);
              isSpectatingRef.current = true;
              if (weaponRigRef.current) weaponRigRef.current.visible = false;
              const alive = playersList.find((p) => p.isAlive && p.id !== myPlayerId) || playersList[0];
              if (alive) {
                setSpectatedPlayerId(alive.id);
                spectatedIdRef.current = alive.id;
              }
            }}
            isRanked={isRankedMatch}
            rankedDivision={rankedDivision}
            activeLoadout={activeLoadout}
            isMuted={isMuted}
            onToggleMute={() => {
              const muted = sounds.toggleMute();
              setIsMuted(muted);
            }}
            matchWinner={matchWinner}
            onRestartMatch={() => {
              setMatchWinner(null);
              setAlphaScore(0);
              setBravoScore(0);
              matchStatsRef.current = { kills: 0, deaths: 0, damageDealt: 0 };
            }}
          />

          {/* WebRTC Tactical Squad Proximity Voice Chat HUD */}
          {settings.voiceChatEnabled && (
            <ProximityVoiceHUD
              team={myTeam}
              onOpenVoiceSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {/* Mobile Touchscreen Virtual Joystick & Tactical Action Controls */}
          <TouchControls
            onMove={handleJoystickMove}
            onLook={handleLookDelta}
            onFireStart={handleFireStart}
            onFireEnd={handleFireEnd}
            onToggleADS={handleToggleADS}
            onSlide={handleSlideAction}
            onJump={handleJumpAction}
            onReload={handleReload}
            onSwitchWeapon={handleNextWeapon}
            onInsertPlate={handleArmorPlateAction}
            onThrowGrenade={handleThrowGrenade}
            onActivateUAV={handleActivateUAV}
            isADS={isADS}
            currentWeapon={currentWeapon}
            armorPlates={plates}
            armorValue={armor}
            uavReady={uavReady}
            opacity={settings.touchControlsOpacity}
            sensitivity={settings.lookSensitivity}
            gyroEnabled={settings.gyroEnabled}
          />
        </>
      ) : (
        <SpectatorHUD
          cameraMode={spectatorCameraMode}
          onSetCameraMode={(mode: SpectatorCameraMode) => {
            setSpectatorCameraMode(mode);
            spectatorCamModeRef.current = mode;
          }}
          players={playersList}
          spectatedPlayerId={spectatedPlayerId}
          onSelectPlayer={(id: string) => {
            setSpectatedPlayerId(id);
            spectatedIdRef.current = id;
          }}
          onNextPlayer={handleSpectatorNextPlayer}
          onPrevPlayer={handleSpectatorPrevPlayer}
          alphaScore={alphaScore}
          bravoScore={bravoScore}
          scoreLimit={scoreLimit}
          killfeed={killfeed}
          onExitSpectator={() => {
            setIsSpectating(false);
            isSpectatingRef.current = false;
            if (weaponRigRef.current) weaponRigRef.current.visible = true;
          }}
          flyAltitude={droneAltitude}
          onChangeAltitude={(delta: number) => {
            const newAlt = Math.max(6, Math.min(40, droneAltitude + delta));
            setDroneAltitude(newAlt);
            droneAltitudeRef.current = newAlt;
          }}
          isCinematic={isCinematicSpectator}
          onToggleCinematic={() => setIsCinematicSpectator((c) => !c)}
        />
      )}

      {/* Gunsmith Customization Modal */}
      <GunsmithModal
        isOpen={isGunsmithOpen}
        onClose={() => setIsGunsmithOpen(false)}
        loadouts={loadouts}
        activeLoadoutId={activeLoadoutId}
        onSelectActiveLoadout={(id: string) => {
          setActiveLoadoutIdState(id);
          setActiveLoadoutId(id);
          const target = loadouts.find((l: CustomLoadout) => l.id === id);
          if (target) {
            applyLoadoutWeapon(target, activeWeaponSlot);
          }
        }}
        onSaveLoadouts={(updated: CustomLoadout[]) => {
          setLoadouts(updated);
          saveLoadouts(updated);
          const target = updated.find((l: CustomLoadout) => l.id === activeLoadoutId);
          if (target) {
            applyLoadoutWeapon(target, activeWeaponSlot);
          }
        }}
      />

      {/* Ranked Mode & Matchmaking Modal */}
      <RankedMatchModal
        isOpen={isRankedOpen}
        onClose={() => setIsRankedOpen(false)}
        profile={rankedProfile}
        onStartRankedMatch={(division: RankDivision) => {
          setIsRankedMatch(true);
          setRankedDivision(division);
          setIsRankedOpen(false);
          sounds.playRadioBeep();
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => {
          setSettings((prev) => {
            const updated = { ...prev, ...newVals };
            webrtcVoice.updateSettings({
              enabled: updated.voiceChatEnabled,
              mode: updated.voiceMode,
              voiceVolume: updated.voiceVolume,
              micSensitivity: updated.micSensitivity,
              proximityMaxDistance: updated.proximityMaxDistance,
              spatialAudio: updated.spatialAudio,
              radioFilterEnabled: updated.radioFilterEnabled,
            });
            return updated;
          });
        }}
        roomId={roomId}
      />

      {/* Match Scoreboard Modal */}
      <ScoreboardModal
        isOpen={isScoreboardOpen}
        onClose={() => setIsScoreboardOpen(false)}
        players={playersList}
        alphaScore={alphaScore}
        bravoScore={bravoScore}
        myId={myPlayerId}
      />
    </div>
  );
}
