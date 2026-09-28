import type { EaseToOptions } from "maplibre-gl";
import type { Coordinates } from "../types";
import type { MapControlInsets } from "./types";
import { getNearestWrappedLongitude } from "../utils/geoCoordinates";

/**
 * Builds a wrapped, reduced-motion-aware camera transition for resolved locations.
 * Used after country or city autocomplete changes and covered independently in tests.
 */
export function createLocationCameraOptions(
    target: Coordinates,
    currentLongitude: number,
    currentZoom: number,
    reducedMotion: boolean,
    padding: Partial<MapControlInsets> = {},
    minimumZoom = 7,
    zoomIncrement = 0,
): EaseToOptions
{
    return {
        center: [getNearestWrappedLongitude(target.longitude, currentLongitude), target.latitude],
        duration: reducedMotion ? 0 : 700,
        padding: {
            top: padding.top ?? 0,
            right: padding.right ?? 0,
            bottom: padding.bottom ?? 0,
            left: padding.left ?? 0,
        },
        zoom: Math.min(16, Math.max(currentZoom + zoomIncrement, minimumZoom)),
    };
}
