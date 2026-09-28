import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import styles from "./FloatingWindowManager.module.css";

export interface FloatingWindowItem
{
    content: ReactNode;
    id: string;
    locked?: boolean;
    onActivate?: (() => void) | undefined;
    pinned?: boolean;
    title: string;
}

export interface FloatingWindowManagerProps
{
    items: readonly FloatingWindowItem[];
    onClose: (id: string) => void;
    onObstructionChange?: ((rightInset: number) => void) | undefined;
    onPinChange?: ((id: string) => void) | undefined;
}

interface WindowState
{
    height?: number;
    minimized: boolean;
    width?: number;
    x: number;
    y: number;
    zIndex: number;
}

/**
 * Creates a safe cascading position for each newly opened detail window.
 * Used by the floating window manager to avoid exact overlap.
 */
function createWindowState(id: string, index: number): WindowState
{
    try
    {
        const stored = JSON.parse(window.localStorage.getItem(`atlas-note-window-${id}`) ?? "null") as Partial<WindowState> | null;

        if (stored !== null && Number.isFinite(stored.x) && Number.isFinite(stored.y))
        {
            return {
                minimized: stored.minimized === true,
                height: Number.isFinite(stored.height) ? Number(stored.height) : undefined,
                width: Number.isFinite(stored.width) ? Number(stored.width) : undefined,
                x: Number(stored.x),
                y: Number(stored.y),
                zIndex: index + 1,
            };
        }
    }
    catch
    {
        // Window placement remains usable when preferences are unavailable.
    }

    const cascade = (index % 8) * 28;

    return { minimized: false, x: Math.max(12, window.innerWidth - 420 - cascade), y: 82 + cascade, zIndex: index + 1 };
}



/**
 * Manages independent draggable, minimizable, resizable tag detail windows.
 * Used above the map and preserves each mounted window's own scroll position.
 */
export function FloatingWindowManager({ items, onClose, onObstructionChange, onPinChange }: FloatingWindowManagerProps)
{
    const [states, setStates] = useState<Record<string, WindowState>>({});
    const dragState = useRef<{ id: string; offsetX: number; offsetY: number; pointerId: number } | null>(null);
    const highestZIndex = useRef(1);
    const uniqueItems = useMemo(() => [...new Map(items.map((item) => [item.id, item])).values()], [items]);

    useEffect(() =>
    {
        setStates((current) =>
        {
            const next = { ...current };

            uniqueItems.forEach((item, index) =>
            {
                next[item.id] ??= createWindowState(item.id, index);
            });

            return next;
        });
    }, [uniqueItems]);

    useEffect(() =>
    {
        for (const item of uniqueItems)
        {
            const state = states[item.id];

            if (state !== undefined)
            {
                try
                {
                    window.localStorage.setItem(`atlas-note-window-${item.id}`, JSON.stringify(state));
                }
                catch
                {
                    // Window preferences are optional.
                }
            }
        }

        const windows = document.querySelectorAll<HTMLElement>(`.${styles.window}`);
        let rightInset = 0;

        windows.forEach((windowElement) =>
        {
            const bounds = windowElement.getBoundingClientRect();

            if (bounds.right > window.innerWidth * 0.6)
            {
                rightInset = Math.max(rightInset, window.innerWidth - bounds.left + 12);
            }
        });
        onObstructionChange?.(rightInset);
    }, [onObstructionChange, states, uniqueItems]);

    const focusWindow = (id: string): void =>
    {
        highestZIndex.current += 1;
        setStates((current) => ({
            ...current,
            [id]: { ...(current[id] ?? createWindowState(id, 0)), zIndex: highestZIndex.current },
        }));
    };
    const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void =>
    {
        const drag = dragState.current;

        if (drag?.pointerId !== event.pointerId)
        {
            return;
        }

        const maximumX = Math.max(8, window.innerWidth - 280);
        const maximumY = Math.max(64, window.innerHeight - 56);
        setStates((current) => ({
            ...current,
            [drag.id]: {
                ...(current[drag.id] ?? createWindowState(drag.id, 0)),
                x: Math.min(maximumX, Math.max(8, event.clientX - drag.offsetX)),
                y: Math.min(maximumY, Math.max(64, event.clientY - drag.offsetY)),
            },
        }));
    };

    return (
        <div className={styles.layer} onPointerMove={handlePointerMove}>
            {uniqueItems.map((item) =>
            {
                const state = states[item.id] ?? createWindowState(item.id, 0);

                return (
                    <section
                        aria-label={`${item.title} detail window`}
                        className={styles.window}
                        data-minimized={state.minimized}
                        data-locked={item.locked ?? false}
                        key={item.id}
                        onPointerDown={() =>
                        {
                            focusWindow(item.id);
                            item.onActivate?.();
                        }}
                        onPointerUp={(event) =>
                        {
                            if (!state.minimized && !item.locked)
                            {
                                const bounds = event.currentTarget.getBoundingClientRect();
                                setStates((current) => ({
                                    ...current,
                                    [item.id]: { ...state, height: bounds.height, width: bounds.width },
                                }));
                            }
                        }}
                        style={{
                            height: state.height,
                            left: state.x,
                            top: state.y,
                            width: state.width,
                            zIndex: state.zIndex,
                        }}
                    >
                        <header
                            className={styles.titleBar}
                            onPointerDown={(event) =>
                            {
                                if (item.locked || (event.target as HTMLElement).closest("button") !== null)
                                {
                                    return;
                                }

                                const bounds = event.currentTarget.parentElement?.getBoundingClientRect();

                                if (bounds !== undefined)
                                {
                                    dragState.current = {
                                        id: item.id,
                                        offsetX: event.clientX - bounds.left,
                                        offsetY: event.clientY - bounds.top,
                                        pointerId: event.pointerId,
                                    };
                                    event.currentTarget.setPointerCapture(event.pointerId);
                                }
                            }}
                            onPointerUp={() =>
                            {
                                dragState.current = null;
                            }}
                        >
                            <strong>{item.title}</strong>
                            <div>
                                <button
                                    aria-label={item.pinned ? `Unpin ${item.title}` : `Pin ${item.title}`}
                                    aria-pressed={item.pinned ?? false}
                                    onClick={() => onPinChange?.(item.id)}
                                    type="button"
                                >
                                    {item.pinned ? "●" : "○"}
                                </button>
                                <button
                                    aria-label={state.minimized ? `Restore ${item.title}` : `Minimize ${item.title}`}
                                    onClick={() => setStates((current) => ({
                                        ...current,
                                        [item.id]: { ...state, minimized: !state.minimized },
                                    }))}
                                    type="button"
                                >
                                    {state.minimized ? "□" : "—"}
                                </button>
                                <button aria-label={`Close ${item.title}`} onClick={() => onClose(item.id)} type="button">×</button>
                            </div>
                        </header>
                        <div className={styles.content}>{item.content}</div>
                    </section>
                );
            })}
        </div>
    );
}
