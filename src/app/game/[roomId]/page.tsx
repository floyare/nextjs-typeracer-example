import GameLobby from "@/components/game/lobby/game-lobby";

import type { Id } from "@/convex/_generated/dataModel";
import { Suspense } from "react";

type PageProps = {
    params: Promise<{ roomId: Id<"rooms"> }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const GameRoomPage = async ({ params, searchParams }: PageProps) => {
    const { roomId } = await params;
    const sParams = await searchParams;
    const playerId = sParams.playerId as Id<"players">;

    return (
        <section>
            <Suspense fallback={<div className="p-20 text-center text-slate-500">Loading game lobby..</div>}>
                <GameLobby roomId={roomId} playerId={playerId} />
            </Suspense>
        </section>
    );
}

export default GameRoomPage;