import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    rooms: defineTable({
        status: v.union(v.literal("waiting"), v.literal("playing"), v.literal("finished")),
        sentence: v.string(),
        startsAt: v.number(),
        endsAt: v.number(),
        roundNumber: v.number(),
    }),

    players: defineTable({
        roomId: v.id("rooms"),
        nickname: v.string(),
        progress: v.string(),
        wpm: v.number(),
        accuracy: v.number(),
        isReady: v.boolean(),
        lastSeen: v.number(),
    }).index("by_room", ["roomId"]),
});