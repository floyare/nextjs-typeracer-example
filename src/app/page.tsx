import JoinGameComponent from "@/components/game/lobby/join-game";

export default function HomePage() {
    return (
        <main className="grid place-items-center gap-2 p-6">
            <h1 className="text-2xl font-semibold">NextJS Typeracer Example</h1>
            <JoinGameComponent />
        </main>
    );
}
