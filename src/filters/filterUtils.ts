import type { NumericRange } from "../types";

/**
 * Normalizes human-readable filter text for case-insensitive matching.
 * Used while compiling country, city, industry, and area filters.
 */
export function normalizeFilterText(value: string): string
{
    return value.trim().toLocaleLowerCase();
}



/**
 * Compiles selected text values into a normalized lookup set.
 * Used once per filter update to avoid repeated array scans per tag.
 */
export function createTextFilterSet(values: readonly string[] | undefined): ReadonlySet<string> | null
{
    if (values === undefined || values.length === 0)
    {
        return null;
    }

    const normalizedValues = new Set<string>();

    for (const value of values)
    {
        const normalizedValue = normalizeFilterText(value);

        if (normalizedValue.length > 0)
        {
            normalizedValues.add(normalizedValue);
        }
    }

    return normalizedValues.size > 0 ? normalizedValues : null;
}



/**
 * Tests a text value against an optional precompiled selection set.
 * Used by university and company predicates.
 */
export function matchesTextFilter(value: string | undefined, selections: ReadonlySet<string> | null): boolean
{
    return selections === null || (value !== undefined && selections.has(normalizeFilterText(value)));
}



/**
 * Detects whether a numeric range actually sets either boundary.
 * Used so an empty range object behaves like a reset filter.
 */
export function hasActiveNumericRange(range: NumericRange | undefined): boolean
{
    return range !== undefined
        && (typeof range.minimum === "number" || typeof range.maximum === "number");
}



/**
 * Tests a nullable numeric value against an inclusive optional range.
 * Used for all independently combinable score and ranking filters.
 */
export function matchesNumericRange(value: number | null, range: NumericRange | undefined): boolean
{
    if (!hasActiveNumericRange(range))
    {
        return true;
    }

    if (value === null || !Number.isFinite(value) || range === undefined)
    {
        return false;
    }

    if (typeof range.minimum === "number"
        && Number.isFinite(range.minimum)
        && value < range.minimum)
    {
        return false;
    }

    if (typeof range.maximum === "number"
        && Number.isFinite(range.maximum)
        && value > range.maximum)
    {
        return false;
    }

    return true;
}



/**
 * Averages the available members of a small nullable numeric collection.
 * Used for combined university reputation and ranking filters.
 */
export function averageAvailableValues(values: readonly (number | null)[]): number | null
{
    let count = 0;
    let total = 0;

    for (const value of values)
    {
        if (value !== null && Number.isFinite(value))
        {
            total += value;
            count += 1;
        }
    }

    return count === 0 ? null : total / count;
}
