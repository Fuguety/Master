import type { ReactNode } from "react";
import styles from "./FormSection.module.css";

export interface FormSectionProps
{
    children: ReactNode;
    description?: string;
    title: string;
}

/**
 * Groups related tag fields in a titled semantic section.
 * Used by university and company forms for scannable long-form editing.
 * Lays out child fields responsively without owning their values.
 */
export function FormSection({ children, description, title }: FormSectionProps)
{
    return (
        <section className={styles.section}>
            <div className={styles.heading}>
                <h3>{title}</h3>
                {description ? <p>{description}</p> : null}
            </div>
            <div className={styles.grid}>{children}</div>
        </section>
    );
}

