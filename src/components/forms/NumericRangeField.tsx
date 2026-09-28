import { useId } from "react";
import type { NumericRange } from "../../types";
import { NumberField } from "./NumberField";
import styles from "./NumericRangeField.module.css";

export interface NumericRangeFieldProps
{
    disabled?: boolean;
    hint?: string;
    label: string;
    max?: number;
    min?: number;
    onChange: (value: NumericRange | undefined) => void;
    step?: number;
    value?: NumericRange;
}

/**
 * Renders independent minimum and maximum inputs for a numeric filter range.
 * Used by university and company filter panels.
 * Emits undefined when both bounds are empty so inactive filters remain cheap.
 */
export function NumericRangeField({
    disabled = false,
    hint,
    label,
    max = 5,
    min = 0,
    onChange,
    step = 0.5,
    value,
}: NumericRangeFieldProps)
{
    const groupId = useId();
    const updateBound = (bound: keyof NumericRange, nextValue: number | null): void =>
    {
        const nextRange = { ...value, [bound]: nextValue ?? undefined };
        const hasBounds = nextRange.minimum !== undefined || nextRange.maximum !== undefined;
        onChange(hasBounds ? nextRange : undefined);
    };

    return (
        <fieldset aria-describedby={hint ? `${groupId}-hint` : undefined} className={styles.fieldset}>
            <legend>{label}</legend>
            <div className={styles.controls}>
                <NumberField
                    disabled={disabled}
                    label="Minimum"
                    max={max}
                    min={min}
                    onChange={(minimum) => updateBound("minimum", minimum)}
                    step={step}
                    value={value?.minimum ?? null}
                />
                <NumberField
                    disabled={disabled}
                    label="Maximum"
                    max={max}
                    min={min}
                    onChange={(maximum) => updateBound("maximum", maximum)}
                    step={step}
                    value={value?.maximum ?? null}
                />
            </div>
            {hint ? <p className={styles.hint} id={`${groupId}-hint`}>{hint}</p> : null}
        </fieldset>
    );
}

