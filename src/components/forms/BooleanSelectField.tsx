import { useId } from "react";
import type { ChangeEvent } from "react";
import { FormField } from "./FormField";
import { getDescriptionIds } from "./formAccessibility";
import styles from "./FormControls.module.css";

export interface BooleanSelectFieldProps
{
    disabled?: boolean;
    error?: string;
    falseLabel?: string;
    hint?: string;
    label: string;
    name?: string;
    nullLabel?: string;
    onChange: (value: boolean | null) => void;
    trueLabel?: string;
    value: boolean | null;
}

/**
 * Renders a three-state yes, no, or not-assessed select.
 * Used by job-placement and internship fields with configurable scoring.
 * Emits a boolean or null without string leakage into domain data.
 */
export function BooleanSelectField({
    disabled = false,
    error,
    falseLabel = "No",
    hint,
    label,
    name,
    nullLabel = "Not assessed",
    onChange,
    trueLabel = "Yes",
    value,
}: BooleanSelectFieldProps)
{
    const generatedId = useId();
    const controlId = name ?? generatedId;
    const serializedValue = value === null ? "" : String(value);
    const handleChange = (event: ChangeEvent<HTMLSelectElement>): void =>
    {
        const nextValue = event.currentTarget.value;
        onChange(nextValue === "" ? null : nextValue === "true");
    };

    return (
        <FormField controlId={controlId} error={error} hint={hint} label={label}>
            <select
                aria-describedby={getDescriptionIds(controlId, hint, error)}
                aria-invalid={Boolean(error)}
                className={styles.control}
                disabled={disabled}
                id={controlId}
                name={name}
                onChange={handleChange}
                value={serializedValue}
            >
                <option value="">{nullLabel}</option>
                <option value="true">{trueLabel}</option>
                <option value="false">{falseLabel}</option>
            </select>
        </FormField>
    );
}

