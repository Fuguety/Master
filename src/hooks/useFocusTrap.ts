import { useEffect, useRef } from "react";
import type { RefObject } from "react";

const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Collects visible keyboard-focusable descendants of a layer.
 * Used by the focus-trap hook for dialogs and mobile drawers.
 * Returns elements in document tab order.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[]
{
    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) =>
    {
        return !element.hidden && element.getAttribute("aria-hidden") !== "true";
    });
}



/**
 * Traps keyboard focus inside an active modal layer and restores it on close.
 * Used by dialogs and mobile drawers to satisfy accessible modal behavior.
 * Returns a ref that must be assigned to the layer container.
 */
export function useFocusTrap<TElement extends HTMLElement>(
    isActive: boolean,
    onEscape?: () => void,
): RefObject<TElement | null>
{
    const layerReference = useRef<TElement>(null);
    const escapeHandlerReference = useRef(onEscape);
    escapeHandlerReference.current = onEscape;

    useEffect(() =>
    {
        if (!isActive || layerReference.current === null)
        {
            return undefined;
        }

        const layer = layerReference.current;
        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const initialFocusTarget = getFocusableElements(layer)[0] ?? layer;

        initialFocusTarget.focus();

        const handleKeyDown = (event: KeyboardEvent): void =>
        {
            if (event.key === "Escape" && escapeHandlerReference.current !== undefined)
            {
                event.preventDefault();
                escapeHandlerReference.current();
                return;
            }

            if (event.key !== "Tab")
            {
                return;
            }

            const focusableElements = getFocusableElements(layer);

            if (focusableElements.length === 0)
            {
                event.preventDefault();
                layer.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (firstElement === undefined || lastElement === undefined)
            {
                return;
            }

            if (event.shiftKey && document.activeElement === firstElement)
            {
                event.preventDefault();
                lastElement.focus();
            }
            else if (!event.shiftKey && document.activeElement === lastElement)
            {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () =>
        {
            document.removeEventListener("keydown", handleKeyDown);
            previouslyFocused?.focus();
        };
    }, [isActive]);

    return layerReference;
}
