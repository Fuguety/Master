import { useEffect, useState } from "react";

/**
 * Delays a changing value until input activity pauses for the requested duration.
 * Used by asynchronous city geocoding and other search-backed controls.
 */
export function useDebouncedValue<TValue>(value: TValue, delay: number): TValue
{
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() =>
    {
        const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);

        return () => window.clearTimeout(timeoutId);
    }, [delay, value]);

    return debouncedValue;
}

