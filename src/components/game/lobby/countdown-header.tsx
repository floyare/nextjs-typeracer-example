import { useEffect, useState } from "react";

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

export default CountdownHeader