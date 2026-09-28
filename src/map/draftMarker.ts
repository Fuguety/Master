import { Marker, type Map as MapLibreMap } from "maplibre-gl";
import type { Coordinates } from "../types";

export interface DraftMarker
{
    addTo: (map: MapLibreMap) => DraftMarker;
    remove: () => DraftMarker;
    setLngLat: (coordinates: [number, number]) => DraftMarker;
}

type DraftMarkerFactory = () => DraftMarker;

/**
 * Creates a MapLibre draft marker only after assigning its first valid location.
 * Used by Create Tag preview rendering to prevent addTo from reading an undefined LngLat.
 * Returns the attached marker for subsequent coordinate updates and cleanup.
 */
export function createDraftMarker(
    map: MapLibreMap,
    coordinates: Coordinates,
    markerFactory: DraftMarkerFactory = () => new Marker({ color: "#f4c95d", scale: 0.8 }),
): DraftMarker
{
    const marker = markerFactory();
    marker.setLngLat([coordinates.longitude, coordinates.latitude]);
    marker.addTo(map);
    return marker;
}
