import { useEffect, useState } from "react";

/**
 * Reads a media query during state initialization when a browser is available.
 * Used by the responsive media-query hook to avoid a desktop first-frame flash.
 * Returns false during server rendering or limited test environments.
 */
function getInitialMatch(query: string): boolean
{
    return typeof window !== "undefined"
        && typeof window.matchMedia === "function"
        && window.matchMedia(query).matches;
}

/**
 * Tracks whether the current viewport matches a CSS media query.
 * Used by responsive UI shells when behavior must change with layout.
 * Returns an SSR-safe initial value and updates on viewport changes.
 */
export function useMediaQuery(query: string): boolean
{
    const [matches, setMatches] = useState(() => getInitialMatch(query));

    useEffect(() =>
    {
        const mediaQuery = window.matchMedia(query);
        const updateMatch = (): void => setMatches(mediaQuery.matches);

        updateMatch();
        mediaQuery.addEventListener("change", updateMatch);

        return () => mediaQuery.removeEventListener("change", updateMatch);
    }, [query]);

    return matches;
}
