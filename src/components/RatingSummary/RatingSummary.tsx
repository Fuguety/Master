import type { RatingResult } from "../../types";
import styles from "./RatingSummary.module.css";

export interface RatingSummaryProps
{
    fallbackRating?: number;
    locale?: string;
    result?: RatingResult;
}

/**
 * Formats a safe rating with one locale-aware decimal place.
 * Used by rating summaries and read-only form previews.
 * Returns a 0-to-5 display string.
 */
function formatRating(value: number, locale: string | undefined): string
{
    const safeValue = Math.min(5, Math.max(0, Number.isFinite(value) ? value : 0));
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    }).format(safeValue);
}



/**
 * Displays the automatically calculated rating and concise explanation.
 * Used by both tag forms before save and by detail presentation.
 * Accepts a full rating result or a persisted fallback rating.
 */
export function RatingSummary({ fallbackRating = 0, locale, result }: RatingSummaryProps)
{
    const rating = result?.rating ?? fallbackRating;

    return (
        <aside aria-label="Calculated rating" className={styles.summary}>
            <div className={styles.score}>
                <strong>{formatRating(rating, locale)}</strong>
                <span aria-hidden="true">★</span>
                <small>out of 5</small>
            </div>
            <div>
                <h3>Automatic rating</h3>
                <p>{result?.explanation ?? "The rating updates from available weighted criteria. Missing values are safely excluded."}</p>
            </div>
        </aside>
    );
}

