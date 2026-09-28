import type { RatingResult, ScoreBreakdownItem } from "../../types";
import styles from "./ScoreBreakdown.module.css";

export interface ScoreBreakdownProps
{
    locale?: string;
    result: RatingResult;
}

/**
 * Formats a finite score-related number for compact locale-aware display.
 * Used throughout the popup score breakdown.
 * Returns an em dash when a normalized value is missing.
 */
function formatNumber(value: number | null, locale: string | undefined, digits = 1): string
{
    if (value === null || !Number.isFinite(value))
    {
        return "—";
    }

    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
    }).format(value);
}



/**
 * Produces a short safe representation of an unnormalized criterion value.
 * Used by breakdown rows to explain the input that entered scoring.
 * Returns plain text for numeric, boolean, category, and missing inputs.
 */
function formatRawValue(item: ScoreBreakdownItem, locale: string | undefined): string
{
    if (typeof item.rawValue === "number")
    {
        return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(item.rawValue);
    }

    if (typeof item.rawValue === "boolean")
    {
        return item.rawValue ? "Yes" : "No";
    }

    if (typeof item.rawValue === "string" && item.rawValue.length > 0)
    {
        return item.rawValue;
    }

    return "Missing";
}



/**
 * Renders the transparent weighted calculation behind a final tag rating.
 * Used inside university and company detail popups.
 * Shows raw values, normalization, weights, contributions, and exclusions.
 */
export function ScoreBreakdown({ locale, result }: ScoreBreakdownProps)
{
    return (
        <details className={styles.breakdown}>
            <summary>How this rating was calculated</summary>
            <p className={styles.explanation}>{result.explanation}</p>
            <ol className={styles.list}>
                {result.breakdown.map((item) => (
                    <li className={styles.item} data-included={item.included} key={item.field}>
                        <div className={styles.itemHeading}>
                            <strong>{item.label}</strong>
                            <span>{item.included ? `${formatNumber(item.weight, locale, 0)} configured weight` : "Not included"}</span>
                        </div>
                        <div className={styles.meterRow}>
                            <progress
                                aria-label={`${item.label} normalized score`}
                                className={styles.track}
                                max={5}
                                value={item.normalizedScore ?? 0}
                            />
                            <strong>{formatNumber(item.normalizedScore, locale)} / 5</strong>
                        </div>
                        <dl className={styles.values}>
                            <div>
                                <dt>Raw</dt>
                                <dd>{formatRawValue(item, locale)}</dd>
                            </div>
                            <div>
                                <dt>Contribution</dt>
                                <dd>{formatNumber(item.weightedContribution, locale, 2)}</dd>
                            </div>
                        </dl>
                        <p>{item.explanation}</p>
                    </li>
                ))}
            </ol>
            <p className={styles.total}>
                Effective weight: {formatNumber(result.totalEffectiveWeight, locale, 0)} of {formatNumber(result.totalConfiguredWeight, locale, 0)}
            </p>
        </details>
    );
}
