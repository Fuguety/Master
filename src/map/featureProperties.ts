import type { MapGeoJSONFeature } from "maplibre-gl";

/**
 * Reads a string from MapLibre's deliberately untyped feature-property boundary.
 * Used by tag click and marker drag routing.
 * Returns null when the property is absent or not a string.
 */
export function getStringFeatureProperty(
    feature: MapGeoJSONFeature | null,
    propertyName: string,
): string | null
{
    const rawProperties: unknown = feature?.properties;

    if (typeof rawProperties !== "object" || rawProperties === null)
    {
        return null;
    }

    const value = (rawProperties as Record<string, unknown>)[propertyName];

    return typeof value === "string" ? value : null;
}
