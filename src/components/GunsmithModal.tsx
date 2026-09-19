import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import {
  CustomLoadout,
  AttachmentCategory,
  Weapon,
} from "../types";
import {
  WEAPON_PRESETS,
  ATTACHMENTS,
  PERKS,
  createWeaponMesh,
  computeModifiedWeaponStats,
} from "../game/weapons";
import { sounds } from "../game/audio";
import {
  Shield,
  Crosshair,
  Zap,
  Check,
  ChevronRight,
  RotateCw,
  Edit2,
  Lock,
  Layers,
  Sparkles,
  Eye,
  Sliders,
  Flame,
} from "lucide-react";

interface GunsmithModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadouts: CustomLoadout[];
  activeLoadoutId: string;
  onSaveLoadouts: (loadouts: CustomLoadout[]) => void;
  onSelectActiveLoadout: (id: string) => void;
}

export const GunsmithModal: React.FC<GunsmithModalProps> = ({
  isOpen,
  onClose,
  loadouts,
  activeLoadoutId,
  onSaveLoadouts,
  onSelectActiveLoadout,
}) => {
  const [selectedLoadoutId, setSelectedLoadoutId] = useState<string>(activeLoadoutId);
  const [activeTab, setActiveTab] = useState<"primary" | "secondary" | "perks" | "equipment">("primary");
  const [selectedSlot, setSelectedSlot] = useState<AttachmentCategory | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // 3D Gunsmith Preview Canvas Ref
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const weaponMeshRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const previousMousePosRef = useRef({ x: 0, y: 0 });
  const rotationAngleRef = useRef({ yaw: 0.3, pitch: 0.1 });

  const currentLoadout = loadouts.find((l) => l.id === selectedLoadoutId) || loadouts[0];

  const primaryWeaponBase = WEAPON_PRESETS[currentLoadout.primaryWeaponId] || WEAPON_PRESETS["M4A1"];
  const modifiedPrimary = computeModifiedWeaponStats(primaryWeaponBase, currentLoadout.primaryAttachments);

  const secondaryWeaponBase = WEAPON_PRESETS[currentLoadout.secondaryWeaponId] || WEAPON_PRESETS["DEAGLE"];
  const modifiedSecondary = computeModifiedWeaponStats(secondaryWeaponBase, currentLoadout.secondaryAttachments);

  const activeWeaponModified = activeTab === "secondary" ? modifiedSecondary : modifiedPrimary;

  // Initialize and update 3D inspect canvas
  useEffect(() => {
    if (!isOpen || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0.1, 1.3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Atmospheric Workshop Lighting
    const amb = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0x60a5fa, 2.5);
    keyLight.position.set(2, 3, 2);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 2.0);
    rimLight.position.set(-2, -1, -2);
    scene.add(rimLight);

    // Build Weapon Mesh
    const targetWepId = activeTab === "secondary" ? currentLoadout.secondaryWeaponId : currentLoadout.primaryWeaponId;
    const targetAtts = activeTab === "secondary" ? currentLoadout.secondaryAttachments : currentLoadout.primaryAttachments;

    const wepMesh = createWeaponMesh(targetWepId, targetAtts);
    weaponMeshRef.current = wepMesh.root;
    scene.add(wepMesh.root);

    // Drag to rotate handlers
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePosRef.current.x;
      const deltaY = e.clientY - previousMousePosRef.current.y;
      previousMousePosRef.current = { x: e.clientX, y: e.clientY };

      rotationAngleRef.current.yaw += deltaX * 0.01;
      rotationAngleRef.current.pitch = Math.max(-0.6, Math.min(0.6, rotationAngleRef.current.pitch + deltaY * 0.01));
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isDraggingRef.current) {
        // Subtle idle rotation
        rotationAngleRef.current.yaw += 0.003;
      }

      if (weaponMeshRef.current) {
        weaponMeshRef.current.rotation.y = rotationAngleRef.current.yaw;
        weaponMeshRef.current.rotation.x = rotationAngleRef.current.pitch;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.dispose();
    };
  }, [isOpen, activeTab, selectedLoadoutId, currentLoadout]);

  if (!isOpen) return null;

  const handleUpdateLoadout = (updates: Partial<CustomLoadout>) => {
    const updated = loadouts.map((l) => (l.id === selectedLoadoutId ? { ...l, ...updates } : l));
    onSaveLoadouts(updated);
    sounds.playRadioBeep();
  };

  const handleSelectPrimary = (wepId: string) => {
    handleUpdateLoadout({ primaryWeaponId: wepId, primaryAttachments: {} });
    sounds.playReload();
  };

  const handleSelectSecondary = (wepId: string) => {
    handleUpdateLoadout({ secondaryWeaponId: wepId, secondaryAttachments: {} });
    sounds.playReload();
  };

  const handleToggleAttachment = (cat: AttachmentCategory, attId: string) => {
    const isPrimary = activeTab === "primary";
    const currentAtts = isPrimary
      ? { ...currentLoadout.primaryAttachments }
      : { ...currentLoadout.secondaryAttachments };

    if (currentAtts[cat] === attId) {
      delete currentAtts[cat];
    } else {
      currentAtts[cat] = attId;
    }

    if (isPrimary) {
      handleUpdateLoadout({ primaryAttachments: currentAtts });
    } else {
      handleUpdateLoadout({ secondaryAttachments: currentAtts });
    }
    sounds.playArmorPlate();
  };

  const handleTogglePerk = (slot: 1 | 2 | 3, perkId: string) => {
    const perks = [...currentLoadout.perks] as [string, string, string];
    perks[slot - 1] = perkId;
    handleUpdateLoadout({ perks });
    sounds.playRadioBeep();
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      handleUpdateLoadout({ name: renameValue.trim() });
    }
    setIsRenaming(false);
  };

  const ATTACHMENT_SLOTS: { category: AttachmentCategory; label: string }[] = [
    { category: "optic", label: "Optic" },
    { category: "muzzle", label: "Muzzle" },
    { category: "barrel", label: "Barrel" },
    { category: "underbarrel", label: "Underbarrel" },
    { category: "magazine", label: "Ammunition" },
    { category: "stock", label: "Stock" },
  ];

  const availableAttachmentsForSlot = selectedSlot
    ? Object.values(ATTACHMENTS).filter((a) => a.category === selectedSlot)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-6 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-7xl h-[92vh] flex flex-col bg-[#0b0e14] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Top Gunsmith Header */}
        <div className="h-16 px-6 bg-gradient-to-r from-[#141820] via-[#10141b] to-[#141820] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                  TACTICAL ARSENAL
                </span>
                <span className="text-xs text-white/40">/</span>
                <span className="text-xs font-medium text-white/70">GUNSMITH 2.0</span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-wide">WEAPON CUSTOMIZATION & LOADOUTS</h1>
            </div>
          </div>

          {/* Close & Equip Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelectActiveLoadout(selectedLoadoutId);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm tracking-wider uppercase transition shadow-lg shadow-amber-500/20 active:scale-95 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>DEPLOY WITH CLASS</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Loadout Slots Ribbon */}
        <div className="px-6 py-2 bg-[#080a0f] border-b border-white/5 flex items-center gap-2 overflow-x-auto shrink-0">
          {loadouts.map((loadout, idx) => {
            const isCurrent = loadout.id === selectedLoadoutId;
            const isActiveInMatch = loadout.id === activeLoadoutId;
            return (
              <button
                key={loadout.id}
                onClick={() => {
                  setSelectedLoadoutId(loadout.id);
                  sounds.playRadioBeep();
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 border ${
                  isCurrent
                    ? "bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/10"
                    : "bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{`0${idx + 1}`}</span>
                <span>{loadout.name}</span>
                {isActiveInMatch && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                )}
              </button>
            );
          })}

          {/* Rename class button */}
          <div className="ml-auto flex items-center gap-2">
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Loadout name..."
                  className="px-2 py-1 bg-black/80 border border-amber-500/50 rounded text-xs text-white outline-none w-36"
                  autoFocus
                />
                <button
                  onClick={handleRenameSubmit}
                  className="px-2 py-1 bg-amber-500 text-black text-xs font-bold rounded"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setRenameValue(currentLoadout.name);
                  setIsRenaming(true);
                }}
                className="text-xs text-white/50 hover:text-amber-400 flex items-center gap-1 transition"
              >
                <Edit2 className="w-3 h-3" />
                <span>Rename Class</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Split Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: 3D Gunsmith Interactive Viewport & Live Stat Bars */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0b0e14] to-[#07090d] border-b lg:border-b-0 lg:border-r border-white/10 relative overflow-hidden">
            {/* 3D Workshop Canvas */}
            <div className="relative flex-1 min-h-[260px] lg:min-h-0">
              <canvas ref={previewCanvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

              {/* 360 Drag Badge */}
              <div className="absolute top-4 left-4 pointer-events-none px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 backdrop-blur text-[11px] font-mono text-white/60 flex items-center gap-1.5">
                <RotateCw className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: "10s" }} />
                <span>DRAG TO INSPECT 360°</span>
              </div>

              {/* Weapon Display Name Header */}
              <div className="absolute bottom-4 left-6 pointer-events-none">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/80">
                  {activeWeaponModified.category} CLASS
                </span>
                <h2 className="text-3xl font-extrabold text-white tracking-wider drop-shadow-md">
                  {activeWeaponModified.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-white/60">Caliber: 5.56 NATO Match</span>
                  <span className="text-white/30">•</span>
                  <span className="text-xs text-amber-400 font-mono">
                    {Object.keys(
                      activeTab === "primary"
                        ? currentLoadout.primaryAttachments
                        : currentLoadout.secondaryAttachments
                    ).length}
                    /5 ATTACHMENTS
                  </span>
                </div>
              </div>
            </div>

            {/* Live Gunsmith Stat Radar / Bars */}
            <div className="p-5 bg-black/40 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-white/70">
                  <span>DAMAGE</span>
                  <span className="text-amber-400 font-bold">{activeWeaponModified.damage}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (activeWeaponModified.damage / 140) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-white/70">
                  <span>FIRE RATE</span>
                  <span className="text-amber-400 font-bold">{activeWeaponModified.fireRate} RPM</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (activeWeaponModified.fireRate / 1100) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-white/70">
                  <span>ACCURACY & SPREAD</span>
                  <span className="text-amber-400 font-bold">
                    {Math.round((1 - activeWeaponModified.spread * 10) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(10, Math.min(100, (1 - activeWeaponModified.spread * 10) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-white/70">
                  <span>RANGE</span>
                  <span className="text-amber-400 font-bold">{activeWeaponModified.range}m</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (activeWeaponModified.range / 250) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customization Tabs (Primary, Secondary, Perks, Equipment) */}
          <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col bg-[#0d1017] shrink-0 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="h-12 bg-black/40 border-b border-white/10 flex items-stretch">
              <button
                onClick={() => {
                  setActiveTab("primary");
                  setSelectedSlot(null);
                  sounds.playRadioBeep();
                }}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition border-b-2 ${
                  activeTab === "primary"
                    ? "border-amber-500 text-amber-400 bg-white/5"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Crosshair className="w-4 h-4" />
                <span>PRIMARY</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("secondary");
                  setSelectedSlot(null);
                  sounds.playRadioBeep();
                }}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition border-b-2 ${
                  activeTab === "secondary"
                    ? "border-amber-500 text-amber-400 bg-white/5"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>SECONDARY</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("perks");
                  setSelectedSlot(null);
                  sounds.playRadioBeep();
                }}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition border-b-2 ${
                  activeTab === "perks"
                    ? "border-amber-500 text-amber-400 bg-white/5"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>PERKS</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("equipment");
                  setSelectedSlot(null);
                  sounds.playRadioBeep();
                }}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition border-b-2 ${
                  activeTab === "equipment"
                    ? "border-amber-500 text-amber-400 bg-white/5"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>TACTICAL</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* PRIMARY / SECONDARY WEAPON & ATTACHMENT SLOTS */}
              {(activeTab === "primary" || activeTab === "secondary") && (
                <>
                  {/* Weapon Selection Strip */}
                  <div>
                    <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider block mb-2">
                      SELECT WEAPON PLATFORM
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.values(WEAPON_PRESETS)
                        .filter((w) => (activeTab === "secondary" ? !!w.isSecondary : !w.isSecondary))
                        .map((wep) => {
                          const isChosen =
                            activeTab === "primary"
                              ? currentLoadout.primaryWeaponId === wep.id
                              : currentLoadout.secondaryWeaponId === wep.id;
                          return (
                            <button
                              key={wep.id}
                              onClick={() => {
                                if (activeTab === "primary") handleSelectPrimary(wep.id);
                                else handleSelectSecondary(wep.id);
                              }}
                              className={`p-3 rounded-xl border text-left transition relative overflow-hidden ${
                                isChosen
                                  ? "bg-amber-500/20 border-amber-500 text-white"
                                  : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              <span className="text-[10px] font-mono text-amber-400/80 block">{wep.category}</span>
                              <span className="text-sm font-bold block truncate">{wep.name}</span>
                              <span className="text-[11px] text-white/40 block mt-1">
                                {wep.damage} DMG • {wep.fireRate} RPM
                              </span>
                              {isChosen && (
                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400" />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Attachment Slots */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
                        GUNSMITH ATTACHMENTS ({activeTab.toUpperCase()})
                      </span>
                      <span className="text-[11px] text-amber-400 font-mono">5 SLOTS MAX</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {ATTACHMENT_SLOTS.map((slot) => {
                        const equippedId =
                          activeTab === "primary"
                            ? currentLoadout.primaryAttachments[slot.category]
                            : currentLoadout.secondaryAttachments[slot.category];
                        const equippedAtt = equippedId ? ATTACHMENTS[equippedId] : null;
                        const isSelectedSlot = selectedSlot === slot.category;

                        return (
                          <button
                            key={slot.category}
                            onClick={() => {
                              setSelectedSlot(isSelectedSlot ? null : slot.category);
                              sounds.playRadioBeep();
                            }}
                            className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                              isSelectedSlot
                                ? "bg-amber-500/25 border-amber-400 text-white"
                                : equippedAtt
                                ? "bg-white/10 border-white/20 text-white"
                                : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                            }`}
                          >
                            <div className="truncate">
                              <span className="text-[10px] font-mono text-white/40 uppercase block">
                                {slot.label}
                              </span>
                              <span
                                className={`text-xs font-bold block truncate ${
                                  equippedAtt ? "text-amber-400" : "text-white/40"
                                }`}
                              >
                                {equippedAtt ? equippedAtt.name : "Factory Default"}
                              </span>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 text-white/40 transition-transform ${
                                isSelectedSlot ? "rotate-90 text-amber-400" : ""
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attachment Drawer when a slot is clicked */}
                  {selectedSlot && (
                    <div className="p-4 rounded-xl bg-black/60 border border-amber-500/30 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase font-mono">
                          SELECT {selectedSlot.toUpperCase()}
                        </span>
                        <button
                          onClick={() => setSelectedSlot(null)}
                          className="text-xs text-white/50 hover:text-white"
                        >
                          Close
                        </button>
                      </div>

                      <div className="space-y-2">
                        {availableAttachmentsForSlot.map((att) => {
                          const isEquipped =
                            (activeTab === "primary"
                              ? currentLoadout.primaryAttachments[selectedSlot]
                              : currentLoadout.secondaryAttachments[selectedSlot]) === att.id;

                          return (
                            <div
                              key={att.id}
                              onClick={() => handleToggleAttachment(selectedSlot, att.id)}
                              className={`p-3 rounded-lg border cursor-pointer transition ${
                                isEquipped
                                  ? "bg-amber-500/15 border-amber-500 text-white"
                                  : "bg-white/5 border-white/5 hover:bg-white/10 text-white/80"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-white">{att.name}</span>
                                {isEquipped && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold">
                                    EQUIPPED
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/60 mt-1">{att.description}</p>

                              {/* Pros & Cons */}
                              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                                {att.pros.length > 0 && (
                                  <div>
                                    <span className="text-emerald-400 font-bold block">PROS</span>
                                    {att.pros.map((pro, i) => (
                                      <span key={i} className="text-emerald-300 block text-[10px]">
                                        + {pro}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {att.cons.length > 0 && (
                                  <div>
                                    <span className="text-red-400 font-bold block">CONS</span>
                                    {att.cons.map((con, i) => (
                                      <span key={i} className="text-red-300 block text-[10px]">
                                        - {con}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PERKS CUSTOMIZATION TAB */}
              {activeTab === "perks" && (
                <div className="space-y-4">
                  {[1, 2, 3].map((slotNum) => {
                    const slot = slotNum as 1 | 2 | 3;
                    const perksInSlot = Object.values(PERKS).filter((p) => p.slot === slot);
                    const currentPerkId = currentLoadout.perks[slot - 1];

                    return (
                      <div key={slot} className="space-y-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                          PERK SLOT {slot}
                        </span>

                        <div className="space-y-2">
                          {perksInSlot.map((perk) => {
                            const isSelected = currentPerkId === perk.id;
                            return (
                              <button
                                key={perk.id}
                                onClick={() => handleTogglePerk(slot, perk.id)}
                                className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                                  isSelected
                                    ? "bg-blue-500/15 border-blue-500 text-white"
                                    : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10"
                                }`}
                              >
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                                  style={{
                                    backgroundColor: `${perk.color}20`,
                                    borderColor: perk.color,
                                    color: perk.color,
                                  }}
                                >
                                  <Shield className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-sm text-white">{perk.name}</span>
                                    {isSelected && (
                                      <span className="px-2 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold">
                                        ACTIVE
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-white/60 mt-1 leading-relaxed">
                                    {perk.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* EQUIPMENT TAB */}
              {activeTab === "equipment" && (
                <div className="space-y-4">
                  {/* Lethal */}
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block mb-2">
                      LETHAL ORDNANCE
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleUpdateLoadout({ lethal: "frag" })}
                        className={`p-3 rounded-xl border text-left transition ${
                          currentLoadout.lethal === "frag"
                            ? "bg-red-500/20 border-red-500 text-white"
                            : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-sm font-bold block">M67 Frag Grenade</span>
                        <span className="text-xs text-white/40 block mt-1">Cookable explosive with 8m lethal radius</span>
                      </button>

                      <button
                        onClick={() => handleUpdateLoadout({ lethal: "semtex" })}
                        className={`p-3 rounded-xl border text-left transition ${
                          currentLoadout.lethal === "semtex"
                            ? "bg-red-500/20 border-red-500 text-white"
                            : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-sm font-bold block">Sticky Semtex</span>
                        <span className="text-xs text-white/40 block mt-1">Adheres to enemy players and surfaces</span>
                      </button>
                    </div>
                  </div>

                  {/* Tactical */}
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 block mb-2">
                      TACTICAL GEAR
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleUpdateLoadout({ tactical: "stim" })}
                        className={`p-3 rounded-xl border text-left transition ${
                          currentLoadout.tactical === "stim"
                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                            : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-sm font-bold block">Adrenaline Stim</span>
                        <span className="text-[11px] text-white/40 block mt-1">Instant full HP regen</span>
                      </button>

                      <button
                        onClick={() => handleUpdateLoadout({ tactical: "flash" })}
                        className={`p-3 rounded-xl border text-left transition ${
                          currentLoadout.tactical === "flash"
                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                            : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-sm font-bold block">Flashbang</span>
                        <span className="text-[11px] text-white/40 block mt-1">Blinds enemy vision</span>
                      </button>

                      <button
                        onClick={() => handleUpdateLoadout({ tactical: "smoke" })}
                        className={`p-3 rounded-xl border text-left transition ${
                          currentLoadout.tactical === "smoke"
                            ? "bg-emerald-500/20 border-emerald-500 text-white"
                            : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-sm font-bold block">Smoke Screen</span>
                        <span className="text-[11px] text-white/40 block mt-1">Dense thermal cover</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
