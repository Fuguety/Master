import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./ResizablePanel.module.css";

export interface ResizablePanelProps
{
    children: ReactNode;
    className?: string;
    maxWidth?: number;
    minWidth?: number;
    onWidthChange: (width: number) => void;
    width: number;
}

/**
 * Adds pointer-driven edge resizing to desktop panels with bounded dimensions.
 * Used by sidebars and editors while the responsive mobile layout remains fixed.
 */
export function ResizablePanel({
    children,
    className,
    maxWidth = 720,
    minWidth = 340,
    onWidthChange,
    width,
}: ResizablePanelProps)
{
    const rootReference = useRef<HTMLDivElement>(null);
    const dragState = useRef<{ pointerId: number; startWidth: number; startX: number } | null>(null);

    useEffect(() =>
    {
        return () => document.body.classList.remove(styles.resizing!);
    }, []);

    return (
        <div
            className={className}
            ref={rootReference}
            style={{ "--resizable-width": `${width}px` } as CSSProperties}
        >
            {children}
            <div
                aria-label="Resize panel"
                aria-orientation="vertical"
                className={styles.handle}
                onPointerDown={(event) =>
                {
                    dragState.current = { pointerId: event.pointerId, startWidth: width, startX: event.clientX };
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    document.body.classList.add(styles.resizing!);
                }}
                onPointerMove={(event) =>
                {
                    const state = dragState.current;

                    if (state?.pointerId !== event.pointerId)
                    {
                        return;
                    }

                    onWidthChange(Math.min(maxWidth, Math.max(minWidth, state.startWidth + event.clientX - state.startX)));
                }}
                onPointerUp={(event) =>
                {
                    if (dragState.current?.pointerId === event.pointerId)
                    {
                        dragState.current = null;
                        document.body.classList.remove(styles.resizing!);
                    }
                }}
                role="separator"
                tabIndex={0}
            />
        </div>
    );
}
