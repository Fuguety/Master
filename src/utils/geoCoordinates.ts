import { bbox, booleanPointInPolygon, point } from "@turf/turf";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { Coordinates } from "../types";

const MAX_MERCATOR_LATITUDE = 85.051129;



/**
 * Restricts a latitude to the representable Web Mercator range.
 * Used by map click and marker drag handlers before values are persisted.
 * Returns a finite latitude between approximately -85.05 and 85.05 degrees.
 */
export function clampLatitude(latitude: number): number
{
    if (!Number.isFinite(latitude))
    {
        return 0;
    }

    return Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
}



/**
 * Wraps a longitude into the canonical -180 through 180 degree interval.
 * Used by map interactions when world wrapping or imported data crosses the antimeridian.
 * Returns zero for a non-finite input.
 */
export function wrapLongitude(longitude: number): number
{
    if (!Number.isFinite(longitude))
    {
        return 0;
    }

    if (longitude >= -180 && longitude < 180)
    {
        return Object.is(longitude, -0) ? 0 : longitude;
    }

    const wrappedLongitude = ((longitude + 180) % 360 + 360) % 360 - 180;

    return Object.is(wrappedLongitude, -0) ? 0 : wrappedLongitude;
}



/**
 * Resolves a canonical longitude onto the wrapped world nearest a reference.
 * Used by marker dragging and camera animations on repeated map copies.
 * Returns a display longitude that may exceed the storage range by full turns.
 */
export function getNearestWrappedLongitude(
    longitude: number,
    referenceLongitude: number,
): number
{
    const canonicalLongitude = wrapLongitude(longitude);

    if (!Number.isFinite(referenceLongitude))
    {
        return canonicalLongitude;
    }

    const worldOffset = Math.round((referenceLongitude - canonicalLongitude) / 360) * 360;

    return canonicalLongitude + worldOffset;
}



/**
 * Normalizes user or map coordinates for safe storage and Web Mercator rendering.
 * Used by map clicks, marker dragging, and import preparation.
 * Returns a new longitude and latitude object without mutating its input.
 */
export function normalizeCoordinates(coordinates: Coordinates): Coordinates
{
    return {
        longitude: wrapLongitude(coordinates.longitude),
        latitude: clampLatitude(coordinates.latitude),
    };
}



/**
 * Checks whether a coordinate pair can be safely represented on the map.
 * Used by GeoJSON conversion to omit corrupt imported markers.
 * Returns true only for finite WGS84 longitude and latitude values.
 */
export function isValidCoordinates(coordinates: Coordinates): boolean
{
    return Number.isFinite(coordinates.longitude)
        && Number.isFinite(coordinates.latitude)
        && coordinates.longitude >= -180
        && coordinates.longitude <= 180
        && coordinates.latitude >= -90
        && coordinates.latitude <= 90;
}



/**
 * Calculates a bounding box for polygon GeoJSON using Turf.
 * Used by map features that fit a selected country or imported geometry.
 * Returns southwest and northeast longitude-latitude tuples, or null for empty data.
 */
export function calculateGeometryBounds(
    collection: FeatureCollection<Polygon | MultiPolygon>,
): [[number, number], [number, number]] | null
{
    if (collection.features.length === 0)
    {
        return null;
    }

    const [west, south, east, north] = bbox(collection);

    return [[west, south], [east, north]];
}



/**
 * Determines whether coordinates fall inside a polygon or multipolygon feature.
 * Used by optional country-selection and geographic validation workflows.
 * Returns Turf's boundary-inclusive containment result.
 */
export function isPointInsideGeometry(
    coordinates: Coordinates,
    geometry: Feature<Polygon | MultiPolygon>,
): boolean
{
    return booleanPointInPolygon(
        point([coordinates.longitude, coordinates.latitude]),
        geometry,
        { ignoreBoundary: false },
    );
}
