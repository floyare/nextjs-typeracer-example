import { useEffect, useState } from "react";

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

export default VisualCountdown