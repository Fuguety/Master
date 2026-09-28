import { useId } from "react";
import type { ChangeEvent } from "react";
import { FormField } from "./FormField";
import { getDescriptionIds } from "./formAccessibility";
import styles from "./FormControls.module.css";

export interface NumberFieldProps
{
    disabled?: boolean;
    error?: string;
    hint?: string;
    label: string;
    max?: number;
    min?: number;
    name?: string;
    onChange: (value: number | null) => void;
    placeholder?: string;
    required?: boolean;
    step?: number;
    value: number | null;
}

/**
 * Renders a controlled numeric field that safely represents missing values.
 * Used by coordinates, rankings, scores, and numeric filter boundaries.
 * Emits null for an empty or non-finite browser value.
 */
export function NumberField({
    disabled = false,
    error,
    hint,
    label,
    max,
    min,
    name,
    onChange,
    placeholder,
    required = false,
    step = 1,
    value,
}: NumberFieldProps)
{
    const generatedId = useId();
    const controlId = name ?? generatedId;
    const handleChange = (event: ChangeEvent<HTMLInputElement>): void =>
    {
        const nextValue = event.currentTarget.valueAsNumber;
        onChange(Number.isFinite(nextValue) ? nextValue : null);
    };

    return (
        <FormField controlId={controlId} error={error} hint={hint} label={label} required={required}>
            <input
                aria-describedby={getDescriptionIds(controlId, hint, error)}
                aria-invalid={Boolean(error)}
                className={styles.control}
                disabled={disabled}
                id={controlId}
                inputMode="decimal"
                max={max}
                min={min}
                name={name}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                step={step}
                type="number"
                value={value ?? ""}
            />
        </FormField>
    );
}

