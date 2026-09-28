import { useId } from "react";
import type { ChangeEvent } from "react";
import { FormField } from "./FormField";
import styles from "./ColorField.module.css";

export interface ColorFieldProps
{
    disabled?: boolean;
    error?: string;
    hint?: string;
    label: string;
    onChange: (value: string) => void;
    value: string;
}

/**
 * Renders synchronized browser color and hexadecimal text inputs.
 * Used by the country overlay editor for custom highlight colors.
 * Emits the chosen CSS color string for external validation.
 */
export function ColorField({
    disabled = false,
    error,
    hint,
    label,
    onChange,
    value,
}: ColorFieldProps)
{
    const controlId = useId();
    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => onChange(event.currentTarget.value);

    return (
        <FormField controlId={controlId} error={error} hint={hint} label={label}>
            <div className={styles.row}>
                <input
                    aria-label={`${label} color picker`}
                    className={styles.picker}
                    disabled={disabled}
                    onChange={handleChange}
                    type="color"
                    value={value}
                />
                <input
                    aria-invalid={Boolean(error)}
                    className={styles.text}
                    disabled={disabled}
                    id={controlId}
                    maxLength={7}
                    onChange={handleChange}
                    pattern="#[0-9a-fA-F]{6}"
                    spellCheck={false}
                    type="text"
                    value={value}
                />
            </div>
        </FormField>
    );
}

