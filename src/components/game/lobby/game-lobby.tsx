"use client";

import { useQuery, useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import type { Id } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import RacingInput from "../racing-input";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trophy } from "lucide-react";
import { cn, generateId } from "@/lib/utils";

// AI generated
const VisualCountdown = ({ startsAt }: { startsAt: number }) => {
    const [count, setCount] = useState(() => Math.ceil((startsAt - Date.now()) / 1000));

    useEffect(() => {
        const interval = setInterval(() => {
            const next = Math.ceil((startsAt - Date.now()) / 1000);
            setCount(prev => (next !== prev ? next : prev));
        }, 100);
        return () => clearInterval(interval);
    }, [startsAt]);

    if (count <= 0) return null;

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
            <span className="text-9xl font-black animate-pulse text-indigo-600">{count}</span>
        </div>
    );
};

// AI generated
const CountdownHeader = ({ startsAt }: { startsAt: number }) => {
    const [count, setCount] = useState(() => Math.ceil((startsAt - Date.now()) / 1000));

    useEffect(() => {
        const interval = setInterval(() => {
            const next = Math.ceil((startsAt - Date.now()) / 1000);
            setCount(prev => (next !== prev ? next : prev));
        }, 100);
        return () => clearInterval(interval);
    }, [startsAt]);

    if (count <= 0) return "It's gaming time!";

    return `Game starts in ${count}...`;
}

export default function GameLobby({ roomId, playerId }: { roomId: Id<"rooms">, playerId: Id<"players"> | null }) {
    const room = useQuery(api.game.getRoom, { roomId });
    const players = useQuery(api.game.getPlayers, { roomId });

    const router = useRouter();

    useEffect(() => {
        if (room === null) {
            alert("Game room does not exist!");
            router.push("/");
        }
    }, [room, router]);

    const joinGame = useMutation(api.game.join);
    const forceStart = useMutation(api.game.forceGameStart);
    const updateProgress = useMutation(api.game.updateProgress);
    const heartbeat = useMutation(api.game.heartbeat);

    const [isFinishedLocal, setIsFinishedLocal] = useState(false);

    const [isRaceStarted, setIsRaceStarted] = useState(false);

    useEffect(() => {
        if (room?.status === "playing" && room.startsAt) {
            const delay = room.startsAt - Date.now();
            if (delay <= 0) {
                setIsRaceStarted(true);
            } else {
                setIsRaceStarted(false);
                const timer = setTimeout(() => setIsRaceStarted(true), delay);
                return () => clearTimeout(timer);
            }
        } else {
            setIsRaceStarted(false);
            setIsFinishedLocal(false);
        }
    }, [room?.status, room?.startsAt, room?.roundNumber]);

    useEffect(() => {
        if (!playerId) return;

        // AI generated part
        const interval = setInterval(() => {
            void heartbeat({ playerId });
        }, 10000);

        return () => clearInterval(interval);
    }, [playerId, heartbeat]);

    const showCountdown = !isRaceStarted && room?.status === "playing" && room.startsAt && (room.startsAt > Date.now());

    const isTimeUp = useMemo(() => room?.endsAt ? Date.now() > room.endsAt : false, [room?.endsAt]);

    const currentPlayer = useMemo(() => players?.find(p => p._id === playerId), [players, playerId]);

    const [isJoiningNew, setIsJoiningNew] = useState(false);

    const handlePlayNewGame = async () => {
        if (!currentPlayer) return;
        setIsJoiningNew(true);

        try {
            let sessionId = localStorage.getItem("typeracer_session_id");
            if (!sessionId) {
                sessionId = generateId();
                localStorage.setItem("typeracer_session_id", sessionId);
            }

            const { roomId: newRoomId, playerId: newPlayerId } = await joinGame({
                nickname: currentPlayer.nickname,
                sessionId: sessionId
            });
            router.push(`/game/${newRoomId}?playerId=${newPlayerId}`);
        } catch (e) {
            console.error(e);
            setIsJoiningNew(false);
        }
    };

    const showEndScreen = useMemo(() => {
        if (room?.status === "finished") return true;
        if (isTimeUp) return true;
        if (isFinishedLocal) return true;
        if (currentPlayer?.progress === room?.sentence && room?.sentence !== "Waiting for the players to join...") return true;

        return false;
    }, [isTimeUp, currentPlayer?.progress, room?.sentence, isFinishedLocal, room?.status]);

    const handleProgressUpdate = useCallback(async (progress: string, wpm: number, acc: number) => {
        if (!playerId) return;
        if (progress === room?.sentence) {
            setIsFinishedLocal(true);
        }

        await updateProgress({ playerId, progress, wpm, accuracy: acc });
    }, [playerId, updateProgress, room?.sentence]);

    if (!currentPlayer && (room && room.status !== "waiting")) {
        router.push("/")
        alert("Player does not exist in the lobby!")
        return
    }

    if (!room || !players || !playerId) {
        return <div className="p-24 text-center text-xl">Loading the game...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-6 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-xl border">
                    <div>
                        <h2 className="text-2xl font-bold">
                            {room.status === "waiting" ? "Waiting for the players..." :
                                showEndScreen ? "Game over!" :
                                    showCountdown ? <CountdownHeader startsAt={room.startsAt} /> : "It's gaming time!"}
                        </h2>
                    </div>
                    {room.status === "waiting" && (
                        <Button onClick={() => forceStart({ roomId })} size="lg">Force start</Button>
                    )}
                </div>

                <div className="relative">
                    {showEndScreen ? (
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
                    ) : (
                        <>
                            {showCountdown && <VisualCountdown startsAt={room.startsAt} />}

                            <RacingInput
                                key={room.roundNumber}
                                quote={room.sentence}
                                isDisabled={room.status === "waiting" || !isRaceStarted}
                                startsAt={room.startsAt}
                                endsAt={room.endsAt}
                                onProgressUpdate={handleProgressUpdate}
                            />
                        </>
                    )}
                </div>
            </div>

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

        </div>
    );
}