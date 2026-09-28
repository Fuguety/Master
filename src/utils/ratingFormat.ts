/**
 * Formats a saved rating with one locale-aware decimal place.
 * Used by tag lists and compact map previews for consistent score text.
 */
export function formatRating(rating: number, locale?: string): string
{
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
    }).format(Math.max(0, Math.min(5, rating)));
}



/**
 * Converts a zero-to-five rating into a compact five-character star summary.
 * Used by marker previews alongside the precise one-decimal rating.
 */
export function formatRatingStars(rating: number): string
{
    const filledCount = Math.round(Math.max(0, Math.min(5, rating)));
    return `${"★".repeat(filledCount)}${"☆".repeat(5 - filledCount)}`;
}
