import { booleanPointInPolygon, point } from "@turf/turf";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { MapTag } from "../../types";

export interface CountryTagQuery
{
    countryCode: string;
    minimumRating?: number;
    query?: string;
    sortBy?: "name" | "rating" | "city" | "updatedAt";
    types?: MapTag["type"][];
}

/**
 * Finds and sorts records inside a country using codes and optional polygon fallback.
 * Used by Country Information lists for Universities, Companies, and Notes.
 */
export function queryCountryTags(
    tags: readonly MapTag[],
    criteria: CountryTagQuery,
    polygon?: Feature<Polygon | MultiPolygon>,
): MapTag[]
{
    const normalizedQuery = criteria.query?.trim().toLocaleLowerCase() ?? "";
    const matches = tags.filter((tag) =>
    {
        const countryMatches = tag.countryCode === criteria.countryCode
            || (tag.countryCode === undefined && polygon !== undefined
                && booleanPointInPolygon(point([tag.coordinates.longitude, tag.coordinates.latitude]), polygon));
        const typeMatches = criteria.types === undefined || criteria.types.length === 0 || criteria.types.includes(tag.type);
        const textMatches = normalizedQuery.length === 0
            || `${tag.name} ${tag.city} ${tag.country}`.toLocaleLowerCase().includes(normalizedQuery);
        const ratingMatches = criteria.minimumRating === undefined || tag.type === "note"
            || tag.finalRating >= criteria.minimumRating;

        return countryMatches && typeMatches && textMatches && ratingMatches;
    });
    const sortBy = criteria.sortBy ?? "name";

    return [...matches].sort((left, right) =>
    {
        if (sortBy === "rating")
        {
            return (right.type === "note" ? -1 : right.finalRating)
                - (left.type === "note" ? -1 : left.finalRating);
        }

        return String(left[sortBy]).localeCompare(String(right[sortBy]));
    });
}

