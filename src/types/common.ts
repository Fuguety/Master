/**
 * Identifies the two supported kinds of map tags.
 * Used by map, form, filtering, and persistence features.
 */
export type TagType = "university" | "company" | "note";



/**
 * Represents a longitude and latitude pair in WGS84 decimal degrees.
 * Used by every map tag and by drag interactions.
 */
export interface Coordinates
{
    longitude: number;
    latitude: number;
}



/**
 * Stores a user-authored note attached to a tag.
 * Used by the note editor and tag detail popup.
 */
export interface TagNote
{
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
}



/**
 * Describes a source supporting information stored on a tag.
 * Used by tag forms and detail popups.
 */
export interface SourceReference
{
    id: string;
    title: string;
    url: string;
    accessedAt?: string | undefined;
}



/**
 * Defines the supported country-tier categories.
 * Used by both scoring models and filters.
 */
export type CountryTier = "tier-1" | "tier-2" | "tier-3" | "tier-4";



/**
 * Contains fields shared by all persisted tags.
 * Extended by the university and company domain models.
 */
export interface BaseTag
{
    id: string;
    name: string;
    coordinates: Coordinates;
    city: string;
    country: string;
    countryCode?: string | undefined;
    countryTier: CountryTier;
    notes: TagNote[];
    sources: SourceReference[];
    finalRating: number;
    createdAt: string;
    updatedAt: string;
}
