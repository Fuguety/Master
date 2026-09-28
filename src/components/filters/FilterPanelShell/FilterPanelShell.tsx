import type { ReactNode } from "react";
import { Button } from "../../Button/Button";
import styles from "./FilterPanelShell.module.css";

export interface FilterPanelShellProps
{
    activeCount: number;
    children: ReactNode;
    disabled?: boolean;
    onReset: () => void;
    title: string;
}

/**
 * Provides the shared heading, active-count summary, and reset action for filters.
 * Used by university and company filter panels.
 * Keeps filter UI controlled and delegates clearing to the filtering feature.
 */
export function FilterPanelShell({
    activeCount,
    children,
    disabled = false,
    onReset,
    title,
}: FilterPanelShellProps)
{
    return (
        <section aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-filters-title`} className={styles.panel}>
            <header className={styles.header}>
                <div>
                    <p>Combinable filters</p>
                    <h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-filters-title`}>{title}</h2>
                    <span aria-live="polite">{activeCount} active {activeCount === 1 ? "filter" : "filters"}</span>
                </div>
                <Button disabled={disabled || activeCount === 0} onClick={onReset} variant="quiet">
                    Reset all
                </Button>
            </header>
            <div className={styles.body}>{children}</div>
        </section>
    );
}

