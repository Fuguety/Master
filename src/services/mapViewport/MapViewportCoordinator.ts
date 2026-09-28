import type { Coordinates } from "../../types";

/**
 * Defers a camera target until React has committed the selected detail window.
 * Used by App to preserve card-before-camera ordering and returns cleanup for unmounts.
 */
export function scheduleCameraAfterCardRender(
    target: Coordinates,
    moveCamera: (coordinates: Coordinates) => void,
): () => void
{
    const animationFrame = window.requestAnimationFrame(() => moveCamera({ ...target }));

    return () => window.cancelAnimationFrame(animationFrame);
}
