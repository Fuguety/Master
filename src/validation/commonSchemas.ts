import { z } from "zod";

/**
 * Restricts source links to browser-safe web protocols.
 * Used by source validation and returns true for HTTP or HTTPS URLs.
 */
function isHttpSourceUrl(value: string): boolean
{
    return /^https?:\/\//iu.test(value);
}



/**
 * Checks that every embedded record identifier occurs only once in its list.
 * Used by note and source arrays to keep React keys and CRUD operations singular.
 */
function hasUniqueRecordIdentifiers(records: ReadonlyArray<{ id: string }>): boolean
{
    return new Set(records.map((record) => record.id)).size === records.length;
}

/**
 * Validates a required identifier used by persisted records.
 * Used by all tag, note, source, and overlay schemas.
 */
export const identifierSchema = z.string().trim().min(1).max(120);



/**
 * Validates an ISO 8601 timestamp.
 * Used by persisted domain records and import validation.
 */
export const timestampSchema = z.string().datetime();



/**
 * Validates WGS84 coordinates accepted by the map.
 * Used by university and company tag schemas.
 */
export const coordinatesSchema = z.object({
    longitude: z.number().finite().min(-180).max(180),
    latitude: z.number().finite().min(-90).max(90),
}).strict();



/**
 * Validates one of the supported country-tier identifiers.
 * Used by tag schemas and categorical scoring.
 */
export const countryTierSchema = z.enum(["tier-1", "tier-2", "tier-3", "tier-4"]);



/**
 * Validates a three-letter ISO-style country identifier.
 * Used by tags and country highlight overlays.
 */
export const countryCodeSchema = z.string().regex(/^[A-Z]{3}$/);



/**
 * Validates an optional research score on the zero-to-five input scale.
 * Used by both tag-type schemas.
 */
export const nullableScoreSchema = z.number().finite().min(0).max(5).nullable();



/**
 * Validates a calculated rating rounded to one decimal place.
 * Used by persisted tag records.
 */
export const finalRatingSchema = z.number().finite().min(0).max(5).multipleOf(0.1);



/**
 * Validates a user-authored tag note with bounded safe text.
 * Used by university and company schemas.
 */
export const tagNoteSchema = z.object({
    id: identifierSchema,
    text: z.string().trim().min(1).max(10_000),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
}).strict();



/**
 * Validates a research source reference.
 * Used by university and company schemas.
 */
export const sourceReferenceSchema = z.object({
    id: identifierSchema,
    title: z.string().trim().min(1).max(300),
    url: z.string().url().max(2_048).refine(isHttpSourceUrl, {
        message: "Sources must use an HTTP or HTTPS URL.",
    }),
    accessedAt: timestampSchema.optional(),
}).strict();



/**
 * Provides the shared validated fields for both tag schemas.
 * Used internally by university and company validation modules.
 */
export const baseTagShape = {
    id: identifierSchema,
    name: z.string().trim().min(1).max(200),
    coordinates: coordinatesSchema,
    city: z.string().trim().min(1).max(120),
    country: z.string().trim().min(1).max(120),
    countryCode: countryCodeSchema.optional(),
    countryTier: countryTierSchema,
    notes: z.array(tagNoteSchema).max(1_000).refine(hasUniqueRecordIdentifiers, {
        message: "Note identifiers must be unique within a tag.",
    }),
    sources: z.array(sourceReferenceSchema).max(1_000).refine(hasUniqueRecordIdentifiers, {
        message: "Source identifiers must be unique within a tag.",
    }),
    finalRating: finalRatingSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
};
