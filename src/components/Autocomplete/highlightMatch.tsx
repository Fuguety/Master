import type { ReactNode } from "react";

/**
 * Renders matching label fragments with semantic emphasis.
 * Used by autocomplete and filter-search suggestions.
 */
export function highlightMatch(label: string, query: string): ReactNode
{
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchIndex = label.toLocaleLowerCase().indexOf(normalizedQuery);

    if (normalizedQuery.length === 0 || matchIndex < 0)
    {
        return label;
    }

    const matchEnd = matchIndex + normalizedQuery.length;
    return <>{label.slice(0, matchIndex)}<mark>{label.slice(matchIndex, matchEnd)}</mark>{label.slice(matchEnd)}</>;
}

