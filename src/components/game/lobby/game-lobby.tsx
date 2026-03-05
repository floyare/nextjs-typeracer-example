"use client";

import { useQuery, useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import type { Id } from "convex/_generated/dataModel";
import { api } from "convex/_generated/api";
import RacingInput from "../racing-input";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { generateId } from "@/lib/utils";
import CountdownHeader from "./countdown-header";
import VisualCountdown from "./visual-countdown";
import PlayerList from "./player-list";
import Leaderboard from "./leaderboard";

export default function GameLobby({ roomId, playerId }: { roomId: Id<"rooms">, playerId: Id<"players"> | null }) {
    const room = useQuery(api.game.getRoom, { roomId });
    const currentPlayer = useQuery(api.game.getPlayer, { playerId: playerId as string });

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

    if (!room || !playerId) {
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
                        <Leaderboard
                            roomId={roomId}
                            playerId={playerId}
                            handlePlayNewGame={handlePlayNewGame}
                            isJoiningNew={isJoiningNew}
                        />
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

            <PlayerList roomId={roomId} playerId={playerId} />

        </div>
    );
}