import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

interface PlayerState {
  id: string;
  name: string;
  team: "alpha" | "bravo";
  isBot: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  health: number;
  armor: number; // 0 to 150 (3 plates max, 50 each)
  plates: number; // reserve plates (max 5)
  isAlive: boolean;
  isSliding: boolean;
  isSprinting: boolean;
  isADS: boolean;
  isFiring: boolean;
  selectedWeapon: string;
  kills: number;
  deaths: number;
  score: number;
  ping: number;
  lastPingTime: number;
}

interface Room {
  id: string;
  name: string;
  map: string;
  mode: "TDM" | "FFA";
  scoreLimit: number;
  teamAlphaScore: number;
  teamBravoScore: number;
  players: Map<string, PlayerState>;
  clients: Map<string, WebSocket>;
  botTimers: NodeJS.Timeout[];
}

const rooms = new Map<string, Room>();

const BOT_NAMES = [
  "Ghost_74",
  "Soap_Echo",
  "Viper_Strike",
  "Apex_Reaper",
  "Zero_Hour",
  "Spectre_X",
  "Shadow_9",
  "Krypton",
];

function getOrCreateRoom(roomId: string = "match_1"): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      name: "Warzone Shipping Yard",
      map: "shipping_dock",
      mode: "TDM",
      scoreLimit: 50,
      teamAlphaScore: 0,
      teamBravoScore: 0,
      players: new Map(),
      clients: new Map(),
      botTimers: [],
    };
    rooms.set(roomId, room);

    // Populate initial competitive tactical bots (total 5v5 = 9 bots + 1 player initially)
    initBots(room);
  }
  return room;
}

const SPAWN_POINTS = [
  { x: -35, y: 1.5, z: -35, team: "alpha" },
  { x: -30, y: 1.5, z: -40, team: "alpha" },
  { x: -40, y: 1.5, z: -30, team: "alpha" },
  { x: -25, y: 1.5, z: -35, team: "alpha" },
  { x: -35, y: 1.5, z: -25, team: "alpha" },
  { x: 35, y: 1.5, z: 35, team: "bravo" },
  { x: 30, y: 1.5, z: 40, team: "bravo" },
  { x: 40, y: 1.5, z: 30, team: "bravo" },
  { x: 25, y: 1.5, z: 35, team: "bravo" },
  { x: 35, y: 1.5, z: 25, team: "bravo" },
];

function getRandomSpawn(team: "alpha" | "bravo") {
  const teamSpawns = SPAWN_POINTS.filter((s) => s.team === team);
  const spawn = teamSpawns[Math.floor(Math.random() * teamSpawns.length)] || {
    x: (Math.random() - 0.5) * 40,
    y: 1.5,
    z: (Math.random() - 0.5) * 40,
  };
  return {
    x: spawn.x + (Math.random() - 0.5) * 4,
    y: 1.5,
    z: spawn.z + (Math.random() - 0.5) * 4,
  };
}

function initBots(room: Room) {
  // Clear any existing bot loops
  room.botTimers.forEach((t) => clearInterval(t));
  room.botTimers = [];

  const neededBots = 7;
  for (let i = 0; i < neededBots; i++) {
    const botId = `bot_${i + 1}`;
    const team: "alpha" | "bravo" = i % 2 === 0 ? "bravo" : "alpha";
    const spawn = getRandomSpawn(team);
    const bot: PlayerState = {
      id: botId,
      name: BOT_NAMES[i % BOT_NAMES.length],
      team,
      isBot: true,
      x: spawn.x,
      y: spawn.y,
      z: spawn.z,
      yaw: Math.random() * Math.PI * 2,
      pitch: 0,
      health: 100,
      armor: 100,
      plates: 3,
      isAlive: true,
      isSliding: false,
      isSprinting: false,
      isADS: false,
      isFiring: false,
      selectedWeapon: i % 2 === 0 ? "M4A1" : i % 3 === 0 ? "KAG-6" : "MP5",
      kills: Math.floor(Math.random() * 3),
      deaths: Math.floor(Math.random() * 2),
      score: 100,
      ping: Math.floor(18 + Math.random() * 12),
      lastPingTime: Date.now(),
    };
    room.players.set(botId, bot);
  }

  // Bot tactical behavior loop (runs at 15Hz to conserve CPU and emulate smooth competitive AI)
  const botInterval = setInterval(() => {
    runBotTacticalLoop(room);
  }, 66);
  room.botTimers.push(botInterval);
}

function runBotTacticalLoop(room: Room) {
  const players = Array.from(room.players.values());
  const alivePlayers = players.filter((p) => p.isAlive);

  for (const bot of alivePlayers) {
    if (!bot.isBot) continue;

    // Find closest enemy
    let closestEnemy: PlayerState | null = null;
    let closestDistSq = Infinity;

    for (const other of alivePlayers) {
      if (other.id !== bot.id && other.team !== bot.team) {
        const dx = other.x - bot.x;
        const dz = other.z - bot.z;
        const distSq = dx * dx + dz * dz;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestEnemy = other;
        }
      }
    }

    if (closestEnemy && closestDistSq < 55 * 55) {
      // Turn towards enemy
      const dx = closestEnemy.x - bot.x;
      const dz = closestEnemy.z - bot.z;
      const targetYaw = Math.atan2(dx, dz);
      // Smooth yaw rotation
      bot.yaw += (targetYaw - bot.yaw) * 0.18;

      const dist = Math.sqrt(closestDistSq);
      // Move towards or strafe
      if (dist > 14) {
        // Sprint towards enemy
        bot.isSprinting = true;
        bot.isSliding = Math.random() < 0.05; // tactical slide
        const speed = bot.isSliding ? 0.35 : 0.22;
        bot.x += Math.sin(targetYaw) * speed;
        bot.z += Math.cos(targetYaw) * speed;
      } else if (dist < 6) {
        // Backpedal while shooting
        bot.isSprinting = false;
        bot.x -= Math.sin(targetYaw) * 0.12;
        bot.z -= Math.cos(targetYaw) * 0.12;
      } else {
        // Combat strafe
        bot.isSprinting = false;
        const strafeDir = Math.sin(Date.now() * 0.003 + parseInt(bot.id.slice(4) || "0"));
        bot.x += Math.cos(targetYaw) * strafeDir * 0.14;
        bot.z -= Math.sin(targetYaw) * strafeDir * 0.14;
      }

      // Keep bot in map bounds (-48 to 48)
      bot.x = Math.max(-48, Math.min(48, bot.x));
      bot.z = Math.max(-48, Math.min(48, bot.z));

      // Combat engagement
      bot.isADS = dist > 10;
      // Bot shooting chance
      if (Math.random() < 0.25) {
        bot.isFiring = true;
        // Bot damage application
        if (Math.random() < 0.35) {
          const dmg = 12 + Math.floor(Math.random() * 10);
          applyDamage(room, bot.id, closestEnemy.id, dmg, false);
        }
      } else {
        bot.isFiring = false;
      }

      // Tactical armor plating if low armor
      if (bot.armor < 50 && bot.plates > 0 && Math.random() < 0.08) {
        bot.armor = Math.min(150, bot.armor + 50);
        bot.plates--;
      }
    } else {
      // Roam patrol
      bot.isFiring = false;
      bot.isSprinting = true;
      bot.isSliding = false;
      bot.x += Math.sin(bot.yaw) * 0.16;
      bot.z += Math.cos(bot.yaw) * 0.16;

      if (bot.x < -45 || bot.x > 45 || bot.z < -45 || bot.z > 45) {
        bot.yaw += Math.PI * 0.75;
      } else if (Math.random() < 0.04) {
        bot.yaw += (Math.random() - 0.5) * 1.5;
      }
    }
  }
}

function applyDamage(
  room: Room,
  attackerId: string,
  targetId: string,
  rawDamage: number,
  isHeadshot: boolean
) {
  const target = room.players.get(targetId);
  const attacker = room.players.get(attackerId);
  if (!target || !target.isAlive) return;

  const damage = isHeadshot ? Math.round(rawDamage * 1.8) : rawDamage;

  // Absorb with armor plates first (Warzone / Bloodstrike mechanic)
  if (target.armor > 0) {
    if (target.armor >= damage) {
      target.armor -= damage;
    } else {
      const remainingDamage = damage - target.armor;
      target.armor = 0;
      target.health = Math.max(0, target.health - remainingDamage);
    }
  } else {
    target.health = Math.max(0, target.health - damage);
  }

  // Notify target of hit
  broadcastToRoom(room, {
    type: "hit_event",
    attackerId,
    targetId,
    damage,
    isHeadshot,
    targetHealth: target.health,
    targetArmor: target.armor,
  });

  if (target.health <= 0) {
    target.isAlive = false;
    target.deaths++;

    if (attacker) {
      attacker.kills++;
      attacker.score += isHeadshot ? 150 : 100;
      if (attacker.team === "alpha") {
        room.teamAlphaScore++;
      } else {
        room.teamBravoScore++;
      }
    }

    // Broadcast killfeed event
    broadcastToRoom(room, {
      type: "killfeed",
      attackerName: attacker ? attacker.name : "KILLED",
      attackerTeam: attacker ? attacker.team : "alpha",
      targetName: target.name,
      targetTeam: target.team,
      weapon: attacker ? attacker.selectedWeapon : "Unknown",
      isHeadshot,
      teamAlphaScore: room.teamAlphaScore,
      teamBravoScore: room.teamBravoScore,
    });

    // Respawn after 3.5s
    setTimeout(() => {
      if (room.players.has(targetId)) {
        const p = room.players.get(targetId)!;
        const newSpawn = getRandomSpawn(p.team);
        p.x = newSpawn.x;
        p.y = newSpawn.y;
        p.z = newSpawn.z;
        p.health = 100;
        p.armor = 100;
        p.plates = 3;
        p.isAlive = true;

        broadcastToRoom(room, {
          type: "player_respawn",
          playerId: targetId,
          x: p.x,
          y: p.y,
          z: p.z,
          health: 100,
          armor: 100,
        });
      }
    }, 3500);
  }
}

function broadcastToRoom(room: Room, message: any, excludeId?: string) {
  const jsonStr = JSON.stringify(message);
  room.clients.forEach((client, clientId) => {
    if (clientId !== excludeId && client.readyState === WebSocket.OPEN) {
      client.send(jsonStr);
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      game: "3D Tactical FPS",
      activeRooms: rooms.size,
      time: Date.now(),
    });
  });

  app.get("/api/rooms", (req, res) => {
    const list = Array.from(rooms.values()).map((r) => ({
      id: r.id,
      name: r.name,
      playersCount: r.players.size,
      scoreLimit: r.scoreLimit,
      teamAlphaScore: r.teamAlphaScore,
      teamBravoScore: r.teamBravoScore,
    }));
    res.json(list);
  });

  const server = http.createServer(app);

  // WebSocket Server for high-performance low-latency multiplayer
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const roomId = url.searchParams.get("room") || "match_1";
    const playerName = url.searchParams.get("name") || `Operator_${Math.floor(100 + Math.random() * 900)}`;
    const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;

    const room = getOrCreateRoom(roomId);

    // Assign team balancing
    const alphaCount = Array.from(room.players.values()).filter((p) => p.team === "alpha").length;
    const bravoCount = Array.from(room.players.values()).filter((p) => p.team === "bravo").length;
    const team: "alpha" | "bravo" = alphaCount <= bravoCount ? "alpha" : "bravo";

    // If human joined, we can replace a bot or keep bots
    const spawn = getRandomSpawn(team);
    const newPlayer: PlayerState = {
      id: playerId,
      name: playerName,
      team,
      isBot: false,
      x: spawn.x,
      y: spawn.y,
      z: spawn.z,
      yaw: 0,
      pitch: 0,
      health: 100,
      armor: 150,
      plates: 3,
      isAlive: true,
      isSliding: false,
      isSprinting: false,
      isADS: false,
      isFiring: false,
      selectedWeapon: "M4A1",
      kills: 0,
      deaths: 0,
      score: 0,
      ping: 20,
      lastPingTime: Date.now(),
    };

    room.players.set(playerId, newPlayer);
    room.clients.set(playerId, ws);

    // Send init packet to the new client
    ws.send(
      JSON.stringify({
        type: "init",
        playerId,
        team,
        room: {
          id: room.id,
          name: room.name,
          scoreLimit: room.scoreLimit,
          teamAlphaScore: room.teamAlphaScore,
          teamBravoScore: room.teamBravoScore,
        },
        players: Array.from(room.players.values()),
      })
    );

    // Broadcast new human player to other clients
    broadcastToRoom(
      room,
      {
        type: "player_joined",
        player: newPlayer,
      },
      playerId
    );

    // Message handler with latency and action handling
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", clientTimestamp: msg.clientTimestamp, serverTime: Date.now() }));
          if (newPlayer) {
            newPlayer.ping = msg.ping || 20;
          }
        } else if (msg.type === "movement") {
          // Low-latency client movement update
          if (newPlayer && newPlayer.isAlive) {
            newPlayer.x = msg.x;
            newPlayer.y = msg.y;
            newPlayer.z = msg.z;
            newPlayer.yaw = msg.yaw;
            newPlayer.pitch = msg.pitch;
            newPlayer.isSprinting = !!msg.isSprinting;
            newPlayer.isSliding = !!msg.isSliding;
            newPlayer.isADS = !!msg.isADS;
            newPlayer.isFiring = !!msg.isFiring;
            if (msg.weapon) newPlayer.selectedWeapon = msg.weapon;
          }
        } else if (msg.type === "shoot") {
          // Client fired weapon
          broadcastToRoom(
            room,
            {
              type: "player_shot",
              playerId,
              weapon: msg.weapon,
              origin: msg.origin,
              direction: msg.direction,
            },
            playerId
          );
        } else if (msg.type === "bullet_hit") {
          // Client registered a raycast hit on target
          if (msg.targetId && msg.damage) {
            applyDamage(room, playerId, msg.targetId, msg.damage, !!msg.isHeadshot);
          }
        } else if (msg.type === "armor_plate") {
          // Insert armor plate
          if (newPlayer && newPlayer.isAlive && newPlayer.plates > 0 && newPlayer.armor < 150) {
            newPlayer.armor = Math.min(150, newPlayer.armor + 50);
            newPlayer.plates--;
            ws.send(
              JSON.stringify({
                type: "armor_updated",
                armor: newPlayer.armor,
                plates: newPlayer.plates,
              })
            );
          }
        } else if (msg.type === "call_uav") {
          // UAV scan streak
          broadcastToRoom(room, {
            type: "uav_activated",
            callerId: playerId,
            callerTeam: newPlayer.team,
            duration: 20000,
          });
        } else if (msg.type === "throw_grenade") {
          // Grenade / tactical explosive
          broadcastToRoom(room, {
            type: "grenade_spawned",
            senderId: playerId,
            position: msg.position,
            velocity: msg.velocity,
          });
        }
      } catch (err) {
        console.error("WS message error", err);
      }
    });

    ws.on("close", () => {
      room.players.delete(playerId);
      room.clients.delete(playerId);
      broadcastToRoom(room, {
        type: "player_left",
        playerId,
      });
    });

    ws.on("error", (e) => {
      console.error("WS error on client", playerId, e);
    });
  });

  // Authoritative room state delta broadcast (25Hz - optimal for low-latency competitive mobile netcode)
  setInterval(() => {
    rooms.forEach((room) => {
      if (room.clients.size === 0) return;
      const snapshot = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        x: Math.round(p.x * 100) / 100,
        y: Math.round(p.y * 100) / 100,
        z: Math.round(p.z * 100) / 100,
        yaw: Math.round(p.yaw * 100) / 100,
        pitch: Math.round(p.pitch * 100) / 100,
        hp: p.health,
        ar: p.armor,
        alive: p.isAlive,
        slide: p.isSliding,
        sprint: p.isSprinting,
        ads: p.isADS,
        fire: p.isFiring,
        wep: p.selectedWeapon,
        k: p.kills,
        d: p.deaths,
        sc: p.score,
        png: p.ping,
      }));

      const deltaPayload = JSON.stringify({
        type: "state_delta",
        time: Date.now(),
        alphaScore: room.teamAlphaScore,
        bravoScore: room.teamBravoScore,
        players: snapshot,
      });

      room.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(deltaPayload);
        }
      });
    });
  }, 40); // 25 times a second

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Tactical FPS Multiplayer Server running on http://localhost:${PORT}`);
  });
}

startServer();
