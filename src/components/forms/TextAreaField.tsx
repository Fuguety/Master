import { useId } from "react";
import type { ChangeEvent } from "react";
import { FormField } from "./FormField";
import { getDescriptionIds } from "./formAccessibility";
import styles from "./FormControls.module.css";

export interface TextAreaFieldProps
{
    disabled?: boolean;
    error?: string;
    hint?: string;
    label: string;
    maxLength?: number;
    name?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    rows?: number;
    value: string;
}

/**
 * Renders a controlled multiline input for free-form, plain-text content.
 * Used by note, overlay, and settings editors.
 * Emits text only and leaves HTML rendering to secure consumers.
 */
export function TextAreaField({
    disabled = false,
    error,
    hint,
    label,
    maxLength,
    name,
    onChange,
    placeholder,
    required = false,
    rows = 4,
    value,
}: TextAreaFieldProps)
{
    const generatedId = useId();
    const controlId = name ?? generatedId;
    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => onChange(event.currentTarget.value);

    return (
        <FormField controlId={controlId} error={error} hint={hint} label={label} required={required}>
            <textarea
                aria-describedby={getDescriptionIds(controlId, hint, error)}
                aria-invalid={Boolean(error)}
                className={`${styles.control} ${styles.textarea}`}
                disabled={disabled}
                id={controlId}
                maxLength={maxLength}
                name={name}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                rows={rows}
                value={value}
            />
        </FormField>
    );
}

