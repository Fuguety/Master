import type { KeyboardEvent, ReactNode } from "react";
import { useRef } from "react";
import styles from "./ToolRail.module.css";

export interface ToolRailItem
{
    badge?: number;
    disabled?: boolean;
    icon: ReactNode;
    id: string;
    label: string;
}

export interface ToolRailProps
{
    activeItemId?: string | null;
    ariaLabel?: string;
    items: readonly ToolRailItem[];
    onSelect: (itemId: string) => void;
}

/**
 * Renders the responsive map tool rail with roving arrow-key navigation.
 * Used beside the desktop map and as a bottom navigation bar on mobile.
 * Emits the selected tool identifier without coupling to panel state.
 */
export function ToolRail({
    activeItemId = null,
    ariaLabel = "Map tools",
    items,
    onSelect,
}: ToolRailProps)
{
    const buttonReferences = useRef<Array<HTMLButtonElement | null>>([]);
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void =>
    {
        if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        {
            return;
        }

        const enabledIndexes = items
            .map((item, index) => item.disabled ? -1 : index)
            .filter((index) => index >= 0);

        if (enabledIndexes.length === 0)
        {
            return;
        }

        const currentIndex = buttonReferences.current.findIndex((button) => button === document.activeElement);
        const currentEnabledPosition = Math.max(0, enabledIndexes.indexOf(currentIndex));
        let targetPosition = currentEnabledPosition;

        if (event.key === "Home")
        {
            targetPosition = 0;
        }
        else if (event.key === "End")
        {
            targetPosition = enabledIndexes.length - 1;
        }
        else if (event.key === "ArrowDown" || event.key === "ArrowRight")
        {
            targetPosition = (currentEnabledPosition + 1) % enabledIndexes.length;
        }
        else
        {
            targetPosition = (currentEnabledPosition - 1 + enabledIndexes.length) % enabledIndexes.length;
        }

        event.preventDefault();
        const targetIndex = enabledIndexes[targetPosition];

        if (targetIndex !== undefined)
        {
            buttonReferences.current[targetIndex]?.focus();
        }
    };

    return (
        <nav aria-label={ariaLabel} className={styles.rail}>
            <div className={styles.list} onKeyDown={handleKeyDown} role="toolbar">
                {items.map((item, index) => (
                    <button
                        aria-label={item.label}
                        aria-pressed={activeItemId === item.id}
                        className={styles.item}
                        disabled={item.disabled}
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        ref={(element) =>
                        {
                            buttonReferences.current[index] = element;
                        }}
                        title={item.label}
                        type="button"
                    >
                        <span className={styles.icon}>{item.icon}</span>
                        <span className={styles.label}>{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 ? (
                            <span aria-label={`${item.badge} active`} className={styles.badge}>{item.badge}</span>
                        ) : null}
                    </button>
                ))}
            </div>
        </nav>
    );
}
