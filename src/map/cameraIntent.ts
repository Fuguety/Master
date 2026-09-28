import type { Coordinates } from "../types";
import type { MapCameraTarget } from "./types";

/**
 * Creates an immutable, ordered camera request for one latest user action.
 * Used by App to distinguish draft editing focus from normal detail focus.
 */
export function createCameraTarget(
    coordinates: Coordinates,
    intent: MapCameraTarget["intent"],
    requestId: number,
): MapCameraTarget
{
    return { coordinates: { ...coordinates }, intent, requestId };
}
