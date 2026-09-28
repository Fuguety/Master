import { IconButton } from "../IconButton/IconButton";
import styles from "./AppHeader.module.css";

export interface AppHeaderProps
{
    companyCount: number;
    onOpenMenu: () => void;
    onOpenSettings: () => void;
    saveStatus?: "saved" | "saving" | "error";
    title?: string;
    universityCount: number;
}

/**
 * Renders the fixed application identity, data counts, and global actions.
 * Used at the top of the full-screen map workspace on desktop and mobile.
 * Exposes menu and settings intents while reflecting persistence status.
 */
export function AppHeader({
    companyCount,
    onOpenMenu,
    onOpenSettings,
    saveStatus = "saved",
    title = "Atlas Notebook",
    universityCount,
}: AppHeaderProps)
{
    const statusLabel = saveStatus === "saving"
        ? "Saving changes"
        : saveStatus === "error"
            ? "Save failed"
            : "All changes saved";

    return (
        <header className={styles.header}>
            <IconButton className={styles.menuButton} label="Open navigation" onClick={onOpenMenu}>
                <span aria-hidden="true">☰</span>
            </IconButton>
            <div className={styles.brand}>
                <span aria-hidden="true" className={styles.brandMark}>A</span>
                <div>
                    <h1>{title}</h1>
                    <p>Research places, compare opportunities</p>
                </div>
            </div>
            <dl className={styles.counts} aria-label="Visible tag totals">
                <div>
                    <dt>Universities</dt>
                    <dd>{universityCount}</dd>
                </div>
                <div>
                    <dt>Companies</dt>
                    <dd>{companyCount}</dd>
                </div>
            </dl>
            <span aria-live="polite" className={styles.saveStatus} data-status={saveStatus}>
                <span aria-hidden="true" />
                {statusLabel}
            </span>
            <IconButton label="Open settings" onClick={onOpenSettings}>
                <span aria-hidden="true">⚙</span>
            </IconButton>
        </header>
    );
}

