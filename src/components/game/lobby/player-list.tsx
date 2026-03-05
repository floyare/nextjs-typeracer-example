"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

type PlayerListProps = {
    roomId: Id<"rooms">;
    playerId: Id<"players"> | null;
};

export default function PlayerList({ roomId, playerId }: PlayerListProps) {
    const players = useQuery(api.game.getPlayers, { roomId });

    if (!players) return null;

    return (
        <div className="col-span-1 bg-white border rounded-xl p-6 h-fit">
            <h3 className="font-bold text-xl mb-6">Live players</h3>
            <ul className="flex flex-col gap-4">
                {players.sort((a, b) => b.wpm - a.wpm).map((p, index) => (
                    <li key={p._id} className="flex justify-between items-center p-3 bg-slate-50 rounded border">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-400">#{index + 1}</span>
                            <div>
                                <p className="font-bold">{p.nickname} {p._id === playerId ? "(You)" : ""}</p>
                                <p className="text-xs text-slate-500 truncate w-32">{p.progress}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-green-600 font-bold">{p.wpm} WPM</p>
                            <p className="text-xs text-slate-500">{(p.accuracy).toFixed(0)}%</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
