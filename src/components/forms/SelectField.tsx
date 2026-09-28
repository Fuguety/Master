import { useId } from "react";
import type { ChangeEvent } from "react";
import { FormField } from "./FormField";
import { getDescriptionIds } from "./formAccessibility";
import styles from "./FormControls.module.css";

export interface SelectOption<TValue extends string = string>
{
    label: string;
    value: TValue;
}

export interface SelectFieldProps<TValue extends string = string>
{
    disabled?: boolean;
    emptyLabel?: string;
    error?: string;
    hint?: string;
    label: string;
    name?: string;
    onChange: (value: TValue) => void;
    options: readonly SelectOption<TValue>[];
    required?: boolean;
    value: TValue | "";
}

/**
 * Renders a controlled native select with typed string options.
 * Used by categorical tag fields, filters, map styles, and themes.
 * Emits the selected option value to the owning component.
 */
export function SelectField<TValue extends string = string>({
    disabled = false,
    emptyLabel = "Select an option",
    error,
    hint,
    label,
    name,
    onChange,
    options,
    required = false,
    value,
}: SelectFieldProps<TValue>)
{
    const generatedId = useId();
    const controlId = name ?? generatedId;
    const handleChange = (event: ChangeEvent<HTMLSelectElement>): void =>
    {
        onChange(event.currentTarget.value as TValue);
    };

    return (
        <FormField controlId={controlId} error={error} hint={hint} label={label} required={required}>
            <select
                aria-describedby={getDescriptionIds(controlId, hint, error)}
                aria-invalid={Boolean(error)}
                className={styles.control}
                disabled={disabled}
                id={controlId}
                name={name}
                onChange={handleChange}
                required={required}
                value={value}
            >
                {!required || value === "" ? <option value="">{emptyLabel}</option> : null}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </FormField>
    );
}

