import { useState, useEffect } from 'react';

export default function useHolidays() {
    const [holidays, setHolidays] = useState({});

    useEffect(() => {
        const fetchHolidays = async () => {
            const year = new Date().getFullYear();
            try {
                const [res1, res2] = await Promise.all([
                    fetch(`https://libur.deno.dev/api?year=${year}`),
                    fetch(`https://libur.deno.dev/api?year=${year + 1}`)
                ]);
                const d1 = await res1.json();
                const d2 = await res2.json();

                const holMap = {};
                [...d1, ...d2].forEach(h => {
                    if (h.date) holMap[h.date] = h.name;
                });
                setHolidays(holMap);
            } catch (e) {
                console.error("Failed to fetch holidays", e);
            }
        };
        fetchHolidays();
    }, []);

    return holidays;
}
