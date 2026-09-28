import { useId, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Button } from "../Button/Button";
import styles from "./StarRatingInput.module.css";

export interface StarRatingInputProps
{
    clearLabel?: string;
    disabled?: boolean;
    error?: string;
    hint?: string;
    label: string;
    name?: string;
    onChange: (value: number | null) => void;
    value: number | null;
}

/**
 * Resolves a pointer position within one star to a half or whole value.
 * Used by mouse and pointer commits in the shared rating control.
 */
function getPointerRating(event: MouseEvent<HTMLButtonElement>, star: number): number
{
    const bounds = event.currentTarget.getBoundingClientRect();
    const isFirstHalf = event.clientX - bounds.left <= bounds.width / 2;

    return star - (isFirstHalf ? 0.5 : 0);
}



/**
 * Renders an accessible zero-to-five star input with half-star hover previews.
 * Used by every score form field and minimum-rating filter.
 */
export function StarRatingInput({
    clearLabel = "Clear",
    disabled = false,
    error,
    hint,
    label,
    name,
    onChange,
    value,
}: StarRatingInputProps)
{
    const generatedId = useId();
    const controlId = name ?? generatedId;
    const [preview, setPreview] = useState<number | null>(null);
    const displayedValue = preview ?? value;
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void =>
    {
        if (disabled)
        {
            return;
        }

        const currentValue = value ?? 0;

        if (event.key === "ArrowRight" || event.key === "ArrowUp")
        {
            event.preventDefault();
            onChange(Math.min(5, currentValue + 0.5));
        }
        else if (event.key === "ArrowLeft" || event.key === "ArrowDown")
        {
            event.preventDefault();
            onChange(Math.max(0, currentValue - 0.5));
        }
        else if (event.key === "Home")
        {
            event.preventDefault();
            onChange(0);
        }
        else if (event.key === "End")
        {
            event.preventDefault();
            onChange(5);
        }
        else if (event.key === "Delete" || event.key === "Backspace")
        {
            event.preventDefault();
            onChange(null);
        }
    };

    return (
        <div className={styles.field}>
            <span className={styles.label} id={`${controlId}-label`}>{label}</span>
            <div className={styles.row}>
                <div
                    aria-labelledby={`${controlId}-label`}
                    aria-valuemax={5}
                    aria-valuemin={0}
                    aria-valuenow={value ?? undefined}
                    aria-valuetext={value === null ? "Not assessed" : `${value.toFixed(1)} out of 5`}
                    className={styles.stars}
                    onKeyDown={handleKeyDown}
                    onMouseLeave={() => setPreview(null)}
                    role="slider"
                    tabIndex={disabled ? -1 : 0}
                >
                    {[1, 2, 3, 4, 5].map((star) =>
                    {
                        const fill = Math.max(0, Math.min(1, (displayedValue ?? 0) - (star - 1)));

                        return (
                            <button
                                aria-hidden="true"
                                className={styles.star}
                                disabled={disabled}
                                key={star}
                                onClick={(event) => onChange(getPointerRating(event, star))}
                                onMouseMove={(event) => setPreview(getPointerRating(event, star))}
                                style={{ "--star-fill": `${fill * 100}%` } as React.CSSProperties}
                                tabIndex={-1}
                                type="button"
                            >
                                ★
                            </button>
                        );
                    })}
                </div>
                <output className={styles.value} htmlFor={controlId}>
                    {displayedValue === null ? "Not assessed" : displayedValue.toFixed(1)}
                </output>
                {value === null ? null : (
                    <Button disabled={disabled} onClick={() => onChange(null)} variant="quiet">
                        {clearLabel}
                    </Button>
                )}
            </div>
            {hint === undefined ? null : <p className={styles.hint}>{hint}</p>}
            {error === undefined ? null : <p className={styles.error}>{error}</p>}
        </div>
    );
}

