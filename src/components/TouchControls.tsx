import React, { useRef, useState, useEffect } from "react";
import { Crosshair, Shield, RefreshCw, Zap, Radio, ChevronsUp, Target, Bomb } from "lucide-react";
import { Weapon } from "../types";

interface TouchControlsProps {
  onMove: (moveX: number, moveY: number, isSprinting: boolean) => void;
  onLook: (deltaYaw: number, deltaPitch: number) => void;
  onFireStart: () => void;
  onFireEnd: () => void;
  onToggleADS: () => void;
  onSlide: () => void;
  onJump: () => void;
  onReload: () => void;
  onSwitchWeapon: () => void;
  onInsertPlate: () => void;
  onThrowGrenade: () => void;
  onActivateUAV: () => void;
  isADS: boolean;
  currentWeapon: Weapon;
  armorPlates: number;
  armorValue: number;
  uavReady: boolean;
  opacity?: number;
  sensitivity?: number;
  gyroEnabled?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onLook,
  onFireStart,
  onFireEnd,
  onToggleADS,
  onSlide,
  onJump,
  onReload,
  onSwitchWeapon,
  onInsertPlate,
  onThrowGrenade,
  onActivateUAV,
  isADS,
  currentWeapon,
  armorPlates,
  armorValue,
  uavReady,
  opacity = 0.85,
  sensitivity = 1.0,
  gyroEnabled = false,
}) => {
  // Joystick State
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickOrigin, setJoystickOrigin] = useState<{ x: number; y: number } | null>(null);
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSprintLocked, setIsSprintLocked] = useState(false);

  // Tracking Touches
  const joystickTouchId = useRef<number | null>(null);
  const lookTouchId = useRef<number | null>(null);
  const lastLookPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch area references
  const leftTouchAreaRef = useRef<HTMLDivElement>(null);
  const rightTouchAreaRef = useRef<HTMLDivElement>(null);

  // Gyroscope aim assist
  useEffect(() => {
    if (!gyroEnabled || typeof window === "undefined" || !window.DeviceOrientationEvent) return;

    let lastGamma = 0;
    let lastBeta = 0;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const dGamma = (e.gamma - lastGamma) * 0.0015 * sensitivity;
      const dBeta = (e.beta - lastBeta) * 0.0015 * sensitivity;
      lastGamma = e.gamma;
      lastBeta = e.beta;

      if (Math.abs(dGamma) < 0.1 && Math.abs(dBeta) < 0.1) {
        onLook(-dGamma, -dBeta);
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [gyroEnabled, sensitivity, onLook]);

  // Left Touch Area (Joystick)
  const handleLeftTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (joystickTouchId.current !== null) return;

    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    const origin = { x: touch.clientX, y: touch.clientY };
    setJoystickOrigin(origin);
    setJoystickPos({ x: 0, y: 0 });
    setJoystickActive(true);
  };

  const handleLeftTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (joystickTouchId.current === null || !joystickOrigin) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        const dx = touch.clientX - joystickOrigin.x;
        const dy = touch.clientY - joystickOrigin.y;
        const maxDist = 55;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(maxDist, dist);
        const angle = Math.atan2(dy, dx);

        const clampedX = Math.cos(angle) * clampedDist;
        const clampedY = Math.sin(angle) * clampedDist;

        setJoystickPos({ x: clampedX, y: clampedY });

        const normX = clampedX / maxDist;
        const normY = clampedY / maxDist;

        // Upward sprint threshold
        const isSprinting = normY < -0.65 || isSprintLocked;
        if (normY < -0.85) {
          setIsSprintLocked(true);
        }

        onMove(normX, -normY, isSprinting);
        break;
      }
    }
  };

  const handleLeftTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        setJoystickActive(false);
        setJoystickOrigin(null);
        setJoystickPos({ x: 0, y: 0 });
        setIsSprintLocked(false);
        onMove(0, 0, false);
        break;
      }
    }
  };

  // Right Touch Area (Look / Pan)
  const handleRightTouchStart = (e: React.TouchEvent) => {
    // Only capture if not clicking a button
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (lookTouchId.current === null) {
        lookTouchId.current = touch.identifier;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  };

  const handleRightTouchMove = (e: React.TouchEvent) => {
    if (lookTouchId.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastLookPos.current.x;
        const dy = touch.clientY - lastLookPos.current.y;
        lastLookPos.current = { x: touch.clientX, y: touch.clientY };

        const lookFactor = (isADS ? 0.0022 : 0.0038) * sensitivity;
        onLook(-dx * lookFactor, -dy * lookFactor);
        break;
      }
    }
  };

  const handleRightTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        break;
      }
    }
  };

  return (
    <div
      id="touch-controls-container"
      className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden"
      style={{ opacity }}
    >
      {/* Left Touch Surface (Dynamic Joystick) */}
      <div
        id="touch-move-area"
        ref={leftTouchAreaRef}
        className="absolute left-0 top-16 bottom-0 w-1/2 pointer-events-auto"
        onTouchStart={handleLeftTouchStart}
        onTouchMove={handleLeftTouchMove}
        onTouchEnd={handleLeftTouchEnd}
        onTouchCancel={handleLeftTouchEnd}
      >
        {/* Render Virtual Joystick when active or hint base */}
        {joystickActive && joystickOrigin && (
          <div
            className="absolute rounded-full border-2 border-amber-400/40 bg-black/30 backdrop-blur-xs flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{
              left: joystickOrigin.x,
              top: joystickOrigin.y,
              width: 120,
              height: 120,
            }}
          >
            {/* Sprint Lock Indicator */}
            <div
              className={`absolute -top-7 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border transition-colors ${
                isSprintLocked
                  ? "bg-amber-500 text-black border-amber-300"
                  : "bg-black/60 text-amber-400/70 border-amber-500/30"
              }`}
            >
              <ChevronsUp className="w-3 h-3 inline mr-0.5" />
              Sprint
            </div>

            {/* Thumb Nub */}
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-lg shadow-amber-500/50 border border-white/40 transform transition-transform duration-75"
              style={{
                transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              }}
            />
          </div>
        )}

        {!joystickActive && (
          <div className="absolute left-8 bottom-12 flex flex-col items-center pointer-events-none opacity-40">
            <div className="w-20 h-20 rounded-full border border-dashed border-white/40 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/20" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 mt-1">
              Drag to Move
            </span>
          </div>
        )}
      </div>

      {/* Right Touch Surface (Aim Look Pad) */}
      <div
        id="touch-look-area"
        ref={rightTouchAreaRef}
        className="absolute right-0 top-16 bottom-0 w-1/2 pointer-events-auto"
        onTouchStart={handleRightTouchStart}
        onTouchMove={handleRightTouchMove}
        onTouchEnd={handleRightTouchEnd}
        onTouchCancel={handleRightTouchEnd}
      />

      {/* Tactical Action Buttons (Ergonomic layout for thumb and claw grips) */}

      {/* Primary Fire Button (Large ergonomic round trigger) */}
      <button
        id="btn-touch-fire"
        type="button"
        className="absolute right-6 bottom-24 w-18 h-18 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-red-400 shadow-xl shadow-red-900/60 flex items-center justify-center pointer-events-auto transition-transform active:scale-92"
        onTouchStart={(e) => {
          e.stopPropagation();
          onFireStart();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onFireEnd();
        }}
        onMouseDown={onFireStart}
        onMouseUp={onFireEnd}
      >
        <Crosshair className="w-9 h-9 text-white drop-shadow" />
      </button>

      {/* Aim Down Sights (ADS) Button */}
      <button
        id="btn-touch-ads"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleADS();
        }}
        className={`absolute right-28 bottom-28 w-14 h-14 rounded-full border-2 flex items-center justify-center pointer-events-auto shadow-lg transition-all active:scale-90 ${
          isADS
            ? "bg-amber-500 border-yellow-200 text-black shadow-amber-500/50 scale-105"
            : "bg-zinc-900/80 border-zinc-500 text-zinc-200"
        }`}
      >
        <Target className="w-7 h-7" />
      </button>

      {/* Bloodstrike Slide / Crouch Button */}
      <button
        id="btn-touch-slide"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSlide();
        }}
        className="absolute right-8 bottom-6 w-13 h-13 rounded-full bg-zinc-900/80 active:bg-amber-600 border border-zinc-500/80 shadow-md flex items-center justify-center pointer-events-auto active:scale-90 text-zinc-100"
      >
        <div className="flex flex-col items-center leading-none">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-[9px] font-bold uppercase tracking-tight text-amber-300">SLIDE</span>
        </div>
      </button>

      {/* Jump Button */}
      <button
        id="btn-touch-jump"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onJump();
        }}
        className="absolute right-24 bottom-12 w-13 h-13 rounded-full bg-zinc-900/80 active:bg-zinc-700 border border-zinc-500/80 shadow-md flex items-center justify-center pointer-events-auto active:scale-90 text-zinc-100"
      >
        <div className="flex flex-col items-center leading-none">
          <ChevronsUp className="w-5 h-5 text-sky-400" />
          <span className="text-[9px] font-bold uppercase tracking-tight text-sky-300">JUMP</span>
        </div>
      </button>

      {/* Reload Button */}
      <button
        id="btn-touch-reload"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onReload();
        }}
        className="absolute right-40 bottom-16 w-12 h-12 rounded-full bg-zinc-900/80 active:bg-zinc-700 border border-zinc-500/80 shadow-md flex items-center justify-center pointer-events-auto active:scale-90 text-zinc-200"
      >
        <div className="flex flex-col items-center leading-none">
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span className="text-[8px] font-mono font-bold text-emerald-300 mt-0.5">
            {currentWeapon.currentAmmo}
          </span>
        </div>
      </button>

      {/* Warzone / Bloodstrike Armor Plate Insertion Button */}
      <button
        id="btn-touch-armor-plate"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onInsertPlate();
        }}
        disabled={armorPlates <= 0 || armorValue >= 150}
        className={`absolute left-36 bottom-6 w-13 h-13 rounded-xl border flex items-center justify-center pointer-events-auto shadow-md active:scale-90 transition-all ${
          armorPlates > 0 && armorValue < 150
            ? "bg-blue-950/80 border-blue-400/80 text-blue-300 active:bg-blue-600 active:text-white"
            : "bg-zinc-900/50 border-zinc-700/40 text-zinc-600 opacity-60"
        }`}
      >
        <div className="flex flex-col items-center leading-none">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="text-[9px] font-bold text-blue-200 mt-0.5">PLATE ({armorPlates})</span>
        </div>
      </button>

      {/* Weapon Swap Button */}
      <button
        id="btn-touch-weapon-swap"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSwitchWeapon();
        }}
        className="absolute right-6 top-20 px-3 py-1.5 rounded-lg bg-black/70 active:bg-zinc-800 border border-zinc-600 shadow-md flex items-center gap-1.5 pointer-events-auto active:scale-95"
      >
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
            {currentWeapon.name}
          </div>
          <div className="text-[9px] text-zinc-400 font-mono">
            {currentWeapon.currentAmmo} / {currentWeapon.reserveAmmo}
          </div>
        </div>
        <RefreshCw className="w-3.5 h-3.5 text-zinc-300" />
      </button>

      {/* Tactical Frag Grenade Button */}
      <button
        id="btn-touch-grenade"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onThrowGrenade();
        }}
        className="absolute right-42 bottom-30 w-11 h-11 rounded-full bg-zinc-900/80 active:bg-amber-700 border border-zinc-600 shadow-md flex items-center justify-center pointer-events-auto active:scale-90 text-zinc-200"
      >
        <Bomb className="w-5 h-5 text-amber-500" />
      </button>

      {/* Scorestreak: UAV Button */}
      <button
        id="btn-touch-uav"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (uavReady) onActivateUAV();
        }}
        disabled={!uavReady}
        className={`absolute left-4 bottom-24 w-12 h-12 rounded-lg border flex items-center justify-center pointer-events-auto transition-all active:scale-90 ${
          uavReady
            ? "bg-amber-950/80 border-amber-400 text-amber-300 animate-pulse shadow-lg shadow-amber-500/40"
            : "bg-zinc-950/60 border-zinc-800 text-zinc-600 opacity-50"
        }`}
      >
        <div className="flex flex-col items-center leading-none">
          <Radio className="w-4 h-4 text-amber-400" />
          <span className="text-[8px] font-bold uppercase tracking-tight mt-0.5">UAV</span>
        </div>
      </button>
    </div>
  );
};
