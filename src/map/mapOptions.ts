import type { MapOptions, StyleSpecification } from "maplibre-gl";
import { normalizeCoordinates } from "../utils/geoCoordinates";
import type { MapViewport } from "./types";

/**
 * Builds the fixed flat-map options shared by every Atlas base style.
 * Used by the map controller when constructing the sole MapLibre instance.
 * Enables unbounded horizontal world copies while normalizing initial storage coordinates.
 */
export function createMapOptions(
    container: HTMLElement,
    style: StyleSpecification | string,
    initialViewport: MapViewport,
): MapOptions
{
    const initialCoordinates = normalizeCoordinates({
        longitude: initialViewport.longitude,
        latitude: initialViewport.latitude,
    });

    return {
        container,
        style,
        center: [initialCoordinates.longitude, initialCoordinates.latitude],
        zoom: initialViewport.zoom,
        minZoom: 1,
        maxZoom: 19,
        pitch: 0,
        bearing: 0,
        maxPitch: 0,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        renderWorldCopies: true,
        attributionControl: false,
        cooperativeGestures: false,
        fadeDuration: 150,
    };
}
