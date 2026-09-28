import type { ReactNode } from "react";
import styles from "./FilterGroup.module.css";

export interface FilterGroupProps
{
    children: ReactNode;
    description?: string;
    searchQuery?: string;
    searchTerms?: readonly string[];
    title: string;
}

/**
 * Groups related filter dimensions in a collapsible accessible section.
 * Used within both type-specific filter panels to keep long lists manageable.
 * Leaves all values and filtering behavior with controlled child inputs.
 */
export function FilterGroup({ children, description, searchQuery = "", searchTerms = [], title }: FilterGroupProps)
{
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const matches = normalizedQuery.length === 0
        || [title, description ?? "", ...searchTerms].some((term) => term.toLocaleLowerCase().includes(normalizedQuery));

    if (!matches)
    {
        return null;
    }

    return (
        <details className={styles.group} open={normalizedQuery.length > 0 || undefined}>
            <summary>{title}</summary>
            {description ? <p>{description}</p> : null}
            <div className={styles.fields}>{children}</div>
        </details>
    );
}
