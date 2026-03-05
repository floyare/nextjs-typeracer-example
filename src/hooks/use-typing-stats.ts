import { useState, useEffect } from "react";

// AI Generated
export const useTypingStats = (correctCharsCount: number, isFinished: boolean, startsAt?: number, endsAt?: number) => {
    const [timeElapsed, setTimeElapsed] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);

    useEffect(() => {
        if (!startsAt || !endsAt || isFinished) return;

        const updateTimers = () => {
            const now = Date.now();
            if (now >= startsAt && now <= endsAt) {
                setTimeElapsed(Math.floor((now - startsAt) / 1000));
            } else if (now > endsAt) {
                setTimeElapsed(Math.floor((endsAt - startsAt) / 1000));
            }
            if (now >= startsAt) {
                const left = Math.ceil((endsAt - now) / 1000);
                setTimeLeft(left > 0 ? left : 0);
            } else {
                setTimeLeft(Math.ceil((endsAt - startsAt) / 1000));
            }
        };

        updateTimers();
        const interval = setInterval(updateTimers, 1000);

        return () => clearInterval(interval);
    }, [startsAt, endsAt, isFinished]);

    const minutes = timeElapsed / 60;
    const wpm = minutes > 0 ? Math.round((correctCharsCount / 5) / minutes) : 0;
    const accuracy = totalKeystrokes > 0 ? Math.floor((correctCharsCount / totalKeystrokes) * 100) : 100;

    const registerKeystroke = () => {
        setTotalKeystrokes(prev => prev + 1);
    };

    return {
        wpm,
        accuracy,
        timeElapsed,
        timeLeft,
        registerKeystroke
    };
};