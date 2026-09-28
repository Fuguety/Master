import { useId } from "react";
import type { ChangeEvent, HTMLInputAutoCompleteAttribute, InputHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { getDescriptionIds } from "./formAccessibility";
import styles from "./FormControls.module.css";

export interface TextFieldProps
{
    autoComplete?: HTMLInputAutoCompleteAttribute;
    disabled?: boolean;
    error?: string;
    hint?: string;
    inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
    label: string;
    maxLength?: number;
    name?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    type?: "email" | "search" | "text" | "url";
    value: string;
}

/**
 * Renders a controlled single-line text field with accessible descriptions.
 * Used by tag, overlay, filtering, and settings forms.
 * Emits the sanitized browser string value to its owner.
 */
export function TextField({
    autoComplete,
    disabled = false,
    error,
    hint,
    inputMode,
    label,
    maxLength,
    name,
    onChange,
    placeholder,
    required = false,
    type = "text",
    value,
}: TextFieldProps)
{
    const generatedId = useId();
    const controlId = name ?? generatedId;
    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => onChange(event.currentTarget.value);

    return (
        <FormField controlId={controlId} error={error} hint={hint} label={label} required={required}>
            <input
                aria-describedby={getDescriptionIds(controlId, hint, error)}
                aria-invalid={Boolean(error)}
                autoComplete={autoComplete}
                className={styles.control}
                disabled={disabled}
                id={controlId}
                inputMode={inputMode}
                maxLength={maxLength}
                name={name}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                type={type}
                value={value}
            />
        </FormField>
    );
}
