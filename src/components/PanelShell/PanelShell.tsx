import type { ReactNode } from "react";
import { IconButton } from "../IconButton/IconButton";
import { ResizablePanel } from "../ResizablePanel/ResizablePanel";
import styles from "./PanelShell.module.css";

export interface PanelShellProps
{
    children: ReactNode;
    description?: string;
    footer?: ReactNode;
    headingId: string;
    onClose: () => void;
    onWidthChange?: ((width: number) => void) | undefined;
    title: string;
    width?: number;
}

/**
 * Renders the non-modal desktop side panel with isolated scrolling and footer.
 * Used by filters, tag forms, overlays, data, and settings tools.
 * Keeps map controls clear by occupying the declared panel width.
 */
export function PanelShell({
    children,
    description,
    footer,
    headingId,
    onClose,
    onWidthChange,
    title,
    width = 432,
}: PanelShellProps)
{
    return (
        <ResizablePanel
            className={styles.panel}
            onWidthChange={onWidthChange ?? (() => undefined)}
            width={width}
        >
        <aside aria-labelledby={headingId} className={styles.panelContent}>
            <header className={styles.header}>
                <div>
                    <h2 id={headingId}>{title}</h2>
                    {description ? <p>{description}</p> : null}
                </div>
                <IconButton label={`Close ${title}`} onClick={onClose}>
                    <span aria-hidden="true">×</span>
                </IconButton>
            </header>
            <div className={styles.body}>{children}</div>
            {footer ? <footer className={styles.footer}>{footer}</footer> : null}
        </aside>
        </ResizablePanel>
    );
}
