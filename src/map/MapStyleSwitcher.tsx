import type { KeyboardEvent } from "react";
import type { MapStyleId } from "./mapStyles";
import type { MapStyleSwitcherProps } from "./types";
import styles from "./MapStyleSwitcher.module.css";

const STYLE_OPTIONS: ReadonlyArray<{ id: MapStyleId; label: string }> =
[
    { id: "cartographic", label: "Map" },
    { id: "satellite", label: "Satellite" },
];



/**
 * Handles arrow-key movement between style-switcher radio buttons.
 * Used by the accessible segmented style control.
 * Selects the adjacent style and keeps focus within the control.
 */
function handleStyleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
    onChange: (styleId: MapStyleId) => void,
): void
{
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
    {
        return;
    }

    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + offset + STYLE_OPTIONS.length) % STYLE_OPTIONS.length;
    const nextOption = STYLE_OPTIONS[nextIndex];
    const nextButton = event.currentTarget.parentElement?.children.item(nextIndex) as HTMLElement | null;

    if (nextOption === undefined)
    {
        return;
    }

    onChange(nextOption.id);
    nextButton?.focus();
}



/**
 * Renders a compact keyboard-accessible base-map style selector.
 * Used as a map overlay on desktop and mobile.
 */
export function MapStyleSwitcher({ activeStyleId, onChange }: MapStyleSwitcherProps)
{
    return (
        <div className={styles.switcher} role="radiogroup" aria-label="Map style">
            {STYLE_OPTIONS.map((option, index) =>
            (
                <button
                    className={styles.option}
                    data-active={option.id === activeStyleId}
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={option.id === activeStyleId}
                    tabIndex={option.id === activeStyleId ? 0 : -1}
                    onClick={() => onChange(option.id)}
                    onKeyDown={(event) => handleStyleKeyDown(event, index, onChange)}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
