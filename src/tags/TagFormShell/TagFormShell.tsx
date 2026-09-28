import type { FormEvent, ReactNode } from "react";
import { Button } from "../../components/Button/Button";
import styles from "./TagFormShell.module.css";

export interface TagFormShellProps
{
    busy?: boolean;
    children: ReactNode;
    description: string;
    disabled?: boolean;
    eyebrow: string;
    icon: ReactNode;
    onCancel: () => void;
    onSubmit: () => void;
    submitLabel: string;
    title: string;
}

/**
 * Provides the semantic form shell and action footer shared by both tag types.
 * Used by university and company editors to avoid duplicated layout logic.
 * Emits validated submit intent to the owning tag workflow.
 */
export function TagFormShell({
    busy = false,
    children,
    description,
    disabled = false,
    eyebrow,
    icon,
    onCancel,
    onSubmit,
    submitLabel,
    title,
}: TagFormShellProps)
{
    const handleSubmit = (event: FormEvent<HTMLFormElement>): void =>
    {
        event.preventDefault();
        onSubmit();
    };

    return (
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
            <header className={styles.header}>
                <span className={styles.icon}>{icon}</span>
                <div>
                    <p className={styles.eyebrow}>{eyebrow}</p>
                    <h2>{title}</h2>
                    <p className={styles.description}>{description}</p>
                </div>
            </header>
            <div className={styles.body}>{children}</div>
            <footer className={styles.footer}>
                <Button disabled={disabled || busy} onClick={onCancel} variant="quiet">
                    Cancel
                </Button>
                <Button disabled={disabled || busy} type="submit" variant="primary">
                    {busy ? "Saving…" : submitLabel}
                </Button>
            </footer>
        </form>
    );
}

