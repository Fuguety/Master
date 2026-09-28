import { useId } from "react";
import type { ChangeEvent } from "react";
import styles from "./FormControls.module.css";

export interface CheckboxFieldProps
{
    checked: boolean;
    disabled?: boolean;
    hint?: string;
    label: string;
    name?: string;
    onChange: (checked: boolean) => void;
}

/**
 * Renders a controlled checkbox with a generously sized label target.
 * Used by overlay visibility and binary filter controls.
 * Emits the browser's checked state as a boolean.
 */
export function CheckboxField({
    checked,
    disabled = false,
    hint,
    label,
    name,
    onChange,
}: CheckboxFieldProps)
{
    const generatedId = useId();
    const controlId = name ?? generatedId;
    const hintId = hint ? `${controlId}-hint` : undefined;
    const handleChange = (event: ChangeEvent<HTMLInputElement>): void => onChange(event.currentTarget.checked);

    return (
        <div className={styles.checkboxField}>
            <label className={styles.checkboxLabel} htmlFor={controlId}>
                <input
                    aria-describedby={hintId}
                    checked={checked}
                    disabled={disabled}
                    id={controlId}
                    name={name}
                    onChange={handleChange}
                    type="checkbox"
                />
                <span>{label}</span>
            </label>
            {hint ? <p className={styles.hint} id={hintId}>{hint}</p> : null}
        </div>
    );
}

