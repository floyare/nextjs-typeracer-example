"use client"

import { LoaderCircle, Play } from "lucide-react";
import { Button } from "../../ui/button";
import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "convex/_generated/api";
import { Input } from "../../ui/input";
import { generateId } from "@/lib/utils";

const JoinGameComponent = () => {
    const [nickname, nicknameSet] = useState("");
    const [isLoading, isLoadingSet] = useState(false);
    const joinGame = useMutation(api.game.join);
    const router = useRouter();

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) return;

        let sessionId = localStorage.getItem("typeracer_session_id");
        if (!sessionId) {
            sessionId = generateId();
            localStorage.setItem("typeracer_session_id", sessionId);
        }

        isLoadingSet(true);
        try {
            const { roomId, playerId } = await joinGame({ nickname, sessionId });
            router.push(`/game/${roomId}?playerId=${playerId}`);
        } catch (error) {
            console.error("Failed while joining the game:", error);
            isLoadingSet(false);
        }
    };

    return (
        <section>
            <div className="max-w-48 flex flex-col items-center justify-center gap-2">
                <Input placeholder="Your nickname..." value={nickname} onChange={(e) => nicknameSet(e.target.value)} min={3} max={18} disabled={isLoading} />
                <Button disabled={isLoading || !nickname} onClick={handleJoin}>
                    {isLoading ? <><LoaderCircle className="animate-spin" /> Joining...</> : <><Play /> Join the game!</>}
                </Button>
            </div>
        </section>
    );
}

export default JoinGameComponent;