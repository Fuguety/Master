import { createPortal } from "react-dom";
import type { MouseEvent, ReactNode } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { IconButton } from "../IconButton/IconButton";
import styles from "./MobileDrawer.module.css";

export interface MobileDrawerProps
{
    children: ReactNode;
    description?: string;
    footer?: ReactNode;
    headingId: string;
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

/**
 * Renders a focus-trapped mobile bottom sheet above the map and tool rail.
 * Used as the small-screen counterpart to PanelShell.
 * Portals to the document body and restores focus when dismissed.
 */
export function MobileDrawer({
    children,
    description,
    footer,
    headingId,
    isOpen,
    onClose,
    title,
}: MobileDrawerProps)
{
    const drawerReference = useFocusTrap<HTMLDivElement>(isOpen, onClose);
    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>): void =>
    {
        if (event.target === event.currentTarget)
        {
            onClose();
        }
    };

    if (!isOpen || typeof document === "undefined")
    {
        return null;
    }

    return createPortal(
        <div className={styles.backdrop} onMouseDown={handleBackdropClick}>
            <div
                aria-labelledby={headingId}
                aria-modal="true"
                className={styles.drawer}
                ref={drawerReference}
                role="dialog"
                tabIndex={-1}
            >
                <span aria-hidden="true" className={styles.handle} />
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
            </div>
        </div>,
        document.body,
    );
}

