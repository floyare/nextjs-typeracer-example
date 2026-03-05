import { v } from "convex/values";
import { mutation, query } from "@/convex/_generated/server";
import { api } from "@/convex/_generated/api";

// AI Generated sentences
const SENTENCES = [
    "Racing through words, your fingers dance with speed and precision. Every keystroke brings you closer to victory.",
    "Type as if the world is watching, letting your thoughts flow onto the screen. The finish line is just a sentence away.",
    "With each letter, you chase the thrill of perfect accuracy. The keyboard becomes your racetrack, and you are in the lead.",
    "Compete with friends and strangers, testing your skills in a battle of wits and reflexes. Only the fastest will claim the crown.",
    "Every typo is a hurdle, every correction a comeback. Stay focused, and let your passion for typing guide you to the end."
];

const INACTIVITY_THRESHOLD = 30000;
const getRandomSentence = () => SENTENCES[Math.floor(Math.random() * SENTENCES.length)]

export const cleanupInactive = mutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        const inactivePlayers = await ctx.db
            .query("players")
            .filter((q) => q.lt(q.field("lastSeen"), now - INACTIVITY_THRESHOLD))
            .collect();

        for (const player of inactivePlayers) {
            await ctx.db.delete(player._id);
        }

        const rooms = await ctx.db.query("rooms").collect();
        for (const room of rooms) {
            const players = await ctx.db
                .query("players")
                .withIndex("by_room", (q) => q.eq("roomId", room._id))
                .collect();

            if (players.length === 0) {
                await ctx.db.delete(room._id);
            }
        }
    },
});

export const deleteRoom = mutation({
    args: { roomId: v.string() },
    handler: async (ctx, args) => {
        const roomId = ctx.db.normalizeId("rooms", args.roomId);
        if (!roomId) return;

        const players = await ctx.db
            .query("players")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .collect();

        for (const player of players) {
            await ctx.db.delete(player._id);
        }

        await ctx.db.delete(roomId);
    },
});

export const join = mutation({
    args: { nickname: v.string(), sessionId: v.string() },
    handler: async (ctx, args) => {
        // * clean old sessions
        const existingSessions = await ctx.db
            .query("players")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        for (const p of existingSessions) {
            const oldRoomId = p.roomId;
            await ctx.db.delete(p._id);

            const remainingPlayers = await ctx.db
                .query("players")
                .withIndex("by_room", (q) => q.eq("roomId", oldRoomId))
                .collect();

            if (remainingPlayers.length === 0) {
                await ctx.db.delete(oldRoomId);
            }
        }

        // * clean empty rooms
        const now = Date.now();
        const inactivePlayers = await ctx.db.query("players").filter(q => q.lt(q.field("lastSeen"), now - INACTIVITY_THRESHOLD)).collect();
        for (const p of inactivePlayers) await ctx.db.delete(p._id);

        const waitingRoom = await ctx.db.query("rooms").filter((q) => q.eq(q.field("status"), "waiting")).first();
        let roomId;

        if (waitingRoom) {
            roomId = waitingRoom._id;
        } else {
            roomId = await ctx.db.insert("rooms", {
                status: "waiting",
                sentence: "Waiting for the players to join...",
                startsAt: 0,
                endsAt: 0,
                roundNumber: 0,
            });
        }

        const playerId = await ctx.db.insert("players", {
            roomId: roomId,
            nickname: args.nickname,
            progress: "",
            wpm: 0,
            accuracy: 100,
            isReady: true,
            lastSeen: Date.now(),
            sessionId: args.sessionId,
        });

        const playersCount = (await ctx.db.query("players").withIndex("by_room", (q) => q.eq("roomId", roomId)).collect()).length;
        const newSentence = getRandomSentence()

        if (playersCount >= 2 && waitingRoom?.status === "waiting") {
            await ctx.db.patch(roomId, {
                sentence: newSentence,
                status: "playing",
                startsAt: Date.now() + 5000,
                endsAt: Date.now() + 5000 + 90000,
                roundNumber: 1, // todo: useless for now
            }); // todo: make it DRY
        }

        return { roomId, playerId };
    },
});

export const forceGameStart = mutation({
    args: { roomId: v.string() },
    handler: async (ctx, args) => {
        const roomId = ctx.db.normalizeId("rooms", args.roomId);
        if (!roomId) return;

        const room = await ctx.db.get(roomId);
        if (!room || room?.status !== "waiting") return;

        const newSentence = getRandomSentence();
        await ctx.db.patch(roomId, {
            status: "playing",
            sentence: newSentence,
            startsAt: Date.now() + 5000,
            endsAt: Date.now() + 5000 + 90000,
            roundNumber: (room.roundNumber ?? 0) + 1,
        }); // todo: make it DRY
    },
});

export const getRoom = query({
    args: { roomId: v.string() },
    handler: async (ctx, args) => {
        const roomId = ctx.db.normalizeId("rooms", args.roomId);
        if (!roomId) return null;
        return await ctx.db.get(roomId);
    },
});

export const getPlayers = query({
    args: { roomId: v.string() },
    handler: async (ctx, args) => {
        const roomId = ctx.db.normalizeId("rooms", args.roomId);
        if (!roomId) return [];
        return await ctx.db
            .query("players")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .collect();
    },
});

export const getPlayer = query({
    args: { playerId: v.string() },
    handler: async (ctx, args) => {
        const playerId = ctx.db.normalizeId("players", args.playerId);
        if (!playerId) return null;
        return await ctx.db.get(playerId);
    },
});

export const updateProgress = mutation({
    args: {
        playerId: v.string(),
        progress: v.string(),
        wpm: v.number(),
        accuracy: v.number()
    },
    handler: async (ctx, args) => {
        const playerId = ctx.db.normalizeId("players", args.playerId);
        if (!playerId) return;

        const player = await ctx.db.get(playerId);
        if (!player) return;

        await ctx.db.patch(playerId, {
            progress: args.progress,
            wpm: args.wpm,
            accuracy: args.accuracy,
            lastSeen: Date.now(),
        });

        const roomId = player.roomId;
        const room = await ctx.db.get(roomId);
        if (!room || room?.status !== "playing") return;

        if (room.endsAt && Date.now() > room.endsAt) {
            await ctx.db.patch(roomId, { status: "finished" });
            await ctx.scheduler.runAfter(100000, api.game.deleteRoom, { roomId }); // todo: make it DRY
            return;
        }

        const players = await ctx.db
            .query("players")
            .withIndex("by_room", (q) => q.eq("roomId", roomId))
            .collect();

        const allFinished = players.every((p) => p.progress === room.sentence);

        if (allFinished) {
            await ctx.db.patch(roomId, { status: "finished" });
            await ctx.scheduler.runAfter(100000, api.game.deleteRoom, { roomId }); // todo: make it DRY
        }
    },
});

export const heartbeat = mutation({
    args: { playerId: v.string() },
    handler: async (ctx, args) => {
        const playerId = ctx.db.normalizeId("players", args.playerId);
        if (!playerId) return;
        await ctx.db.patch(playerId, { lastSeen: Date.now() });
    },
});