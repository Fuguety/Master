import { IconButton } from "../IconButton/IconButton";
import { Button } from "../Button/Button";
import styles from "./AppHeader.module.css";

export interface AppHeaderProps
{
    companyCount: number;
    isDirty?: boolean;
    isAdmin?: boolean;
    onOpenAdmin: () => void;
    onOpenMenu: () => void;
    onOpenSettings: () => void;
    onSave: () => void;
    saveStatus?: "saved" | "dirty" | "loading" | "saving" | "error";
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
    isDirty = false,
    isAdmin = false,
    onOpenAdmin,
    onOpenMenu,
    onOpenSettings,
    onSave,
    saveStatus = "saved",
    title = "Atlas Notebook",
    universityCount,
}: AppHeaderProps)
{
    const statusLabel = saveStatus === "loading"
        ? "Loading shared data"
        : saveStatus === "saving"
        ? "Saving shared data"
        : saveStatus === "error"
            ? "Shared data error"
            : saveStatus === "dirty"
                ? isAdmin ? "Ready to publish" : "Local changes"
                : "Shared data current";

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
            {isAdmin ? (
                <Button
                    className={styles.saveButton}
                    disabled={!isDirty || saveStatus === "saving" || saveStatus === "loading"}
                    onClick={onSave}
                    variant="primary"
                >
                    {saveStatus === "saving" ? "Saving…" : "Save"}
                </Button>
            ) : null}
            <IconButton label={isAdmin ? "Administrator account" : "Administrator login"} onClick={onOpenAdmin}>
                <span aria-hidden="true">{isAdmin ? "✓" : "♙"}</span>
            </IconButton>
            <IconButton label="Open settings" onClick={onOpenSettings}>
                <span aria-hidden="true">⚙</span>
            </IconButton>
        </header>
    );
}

