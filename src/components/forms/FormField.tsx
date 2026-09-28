import type { ReactNode } from "react";
import styles from "./FormControls.module.css";

export interface FormFieldProps
{
    children: ReactNode;
    controlId: string;
    error?: string;
    hint?: string;
    label: string;
    required?: boolean;
}

/**
 * Groups a control with its visible label, hint, and validation message.
 * Used by all reusable text, number, select, and range inputs.
 * Produces consistent accessible form-field structure.
 */
export function FormField({
    children,
    controlId,
    error,
    hint,
    label,
    required = false,
}: FormFieldProps)
{
    return (
        <div className={styles.field}>
            <label className={styles.label} htmlFor={controlId}>
                <span>{label}</span>
                {required ? <span aria-hidden="true" className={styles.required}>*</span> : null}
            </label>
            {children}
            {hint ? <p className={styles.hint} id={`${controlId}-hint`}>{hint}</p> : null}
            {error ? (
                <p className={styles.error} id={`${controlId}-error`} role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

