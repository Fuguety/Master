import type { Coordinates, SourceReference } from "./common";

/**
 * Represents a map-based sticky note without rating or country-tier fields.
 * Used by Note editing, markers, floating windows, persistence, and import/export.
 */
export interface NoteTag
{
    id: string;
    type: "note";
    name: string;
    content: string;
    color?: string | undefined;
    country: string;
    countryCode?: string | undefined;
    city: string;
    coordinates: Coordinates;
    sources: SourceReference[];
    locked: boolean;
    createdAt: string;
    updatedAt: string;
    finalRating?: undefined;
}
