import type { Feature, FeatureCollection, Point } from "geojson";
import type { MapTag } from "../types";
import { isValidCoordinates } from "./geoCoordinates";

export interface MapTagFeatureProperties
{
    id: string;
    type: MapTag["type"];
    name: string;
    city: string;
    country: string;
    rating: number;
    locked: boolean;
}



/**
 * Converts one validated domain tag into a compact GeoJSON point feature.
 * Used by the clustered MapLibre source while complete records remain outside map style data.
 * Returns null when imported coordinates are invalid.
 */
export function tagToPointFeature(tag: MapTag): Feature<Point, MapTagFeatureProperties> | null
{
    if (!isValidCoordinates(tag.coordinates))
    {
        return null;
    }

    return {
        type: "Feature",
        id: tag.id,
        geometry:
        {
            type: "Point",
            coordinates: [tag.coordinates.longitude, tag.coordinates.latitude],
        },
        properties:
        {
            id: tag.id,
            type: tag.type,
            name: tag.name,
            city: tag.city,
            country: tag.country,
            rating: tag.type === "note" ? 0 : tag.finalRating,
            locked: tag.type === "note" && tag.locked,
        },
    };
}



/**
 * Converts application tags to a cluster-ready GeoJSON feature collection.
 * Used whenever visible filters or marker coordinates change.
 * Invalid records are safely omitted rather than breaking the map source.
 */
export function tagsToFeatureCollection(
    tags: readonly MapTag[],
): FeatureCollection<Point, MapTagFeatureProperties>
{
    const features: Array<Feature<Point, MapTagFeatureProperties>> = [];

    for (const tag of tags)
    {
        const feature = tagToPointFeature(tag);

        if (feature !== null)
        {
            features.push(feature);
        }
    }

    return {
        type: "FeatureCollection",
        features,
    };
}
