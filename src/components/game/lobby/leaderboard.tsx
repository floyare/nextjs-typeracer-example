"use client";

import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Trophy, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type LeaderboardProps = {
    roomId: Id<"rooms">;
    playerId: Id<"players"> | null;
    handlePlayNewGame: () => void;
    isJoiningNew: boolean;
};

export default function Leaderboard({ roomId, playerId, handlePlayNewGame, isJoiningNew }: LeaderboardProps) {
    const players = useQuery(api.game.getPlayers, { roomId });

    if (!players) return null;

    return (
        <div className="bg-white border rounded-xl p-8 shadow-sm text-center flex flex-col items-center gap-6">
            <Trophy className="w-20 h-20 text-yellow-400" />
            <h3 className="text-4xl font-black">Well done!</h3>
            <div className="w-full max-w-md">
                <h4 className="font-bold text-xl mb-4 text-left">Final Leaderboard</h4>
                <ul className="flex flex-col gap-3">
                    {players.sort((a, b) => b.wpm - a.wpm).map((p, index) => (
                        <li key={p._id} className={cn("flex justify-between items-center p-4 rounded-lg border", p._id === playerId ? "bg-indigo-50 border-indigo-200" : "bg-slate-50")}>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-400">#{index + 1}</span>
                                <span className="font-bold text-lg">{p.nickname}</span>
                            </div>
                            <div className="font-black text-indigo-600 text-lg">{p.wpm} WPM</div>
                        </li>
                    ))}
                </ul>
            </div>
            <Button size="lg" className="px-12 h-14 text-lg font-bold" onClick={handlePlayNewGame} disabled={isJoiningNew}>
                {isJoiningNew ? <LoaderCircle className="animate-spin" /> : "Play new game"}
            </Button>
        </div>
    );
}
