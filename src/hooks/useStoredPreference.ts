import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Reads and persists a validated presentation preference in localStorage.
 * Used for map style, clustering, and tag-type visibility settings.
 * Returns React state while tolerating unavailable or corrupt browser storage.
 */
export function useStoredPreference<TValue>(
    key: string,
    fallback: TValue,
    isValid: (value: unknown) => value is TValue,
): [TValue, Dispatch<SetStateAction<TValue>>]
{
    const [value, setValue] = useState<TValue>(() =>
    {
        if (typeof window === 'undefined')
        {
            return fallback;
        }

        try
        {
            const parsedValue = JSON.parse(window.localStorage.getItem(key) ?? 'null') as unknown;
            return isValid(parsedValue) ? parsedValue : fallback;
        }
        catch
        {
            return fallback;
        }
    });

    useEffect(() =>
    {
        if (typeof window === 'undefined')
        {
            return;
        }

        try
        {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
        catch
        {
            // Presentation settings remain usable when browser storage is unavailable.
        }
    }, [key, value]);

    return [value, setValue];
}
