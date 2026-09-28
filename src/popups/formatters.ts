/**
 * Formats an optional scored or Boolean metric for popup display.
 * Used by both concrete tag detail adapters.
 * Returns locale-aware numbers or a clear assessment label.
 */
export function formatMetric(
    value: number | boolean | null,
    locale: string | undefined,
): string
{
    if (typeof value === "boolean")
    {
        return value ? "Yes" : "No";
    }

    return value === null
        ? "Not assessed"
        : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}



/**
 * Formats one WGS84 coordinate with consistent locale-aware precision.
 * Used by the shared tag details card.
 * Returns a decimal value with exactly four fraction digits.
 */
export function formatCoordinate(value: number, locale: string | undefined): string
{
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 4,
        minimumFractionDigits: 4,
    }).format(value);
}
