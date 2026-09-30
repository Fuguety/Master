import { z } from "zod";
import type { CompanyTag, MapTag, NoteTag, UniversityTag } from "../types";
import {
    baseTagShape,
    nullableScoreSchema,
} from "./commonSchemas";

/**
 * Validates a complete university tag and rejects unknown fields.
 * Used by forms, JSON import, and storage boundaries.
 */
export const universityTagSchema = z.object({
    ...baseTagShape,
    type: z.literal("university"),
    locationScore: nullableScoreSchema,
    qualityOfLife: nullableScoreSchema,
    affordability: nullableScoreSchema,
    jobOpportunities: nullableScoreSchema,
    jobPlacementSupport: z.boolean().nullable(),
    regionalCompanies: nullableScoreSchema,
    globalReputation: nullableScoreSchema,
    localReputation: nullableScoreSchema,
    globalRanking: z.number().int().positive().nullable(),
    localRanking: z.number().int().positive().nullable(),
    commuteQuality: nullableScoreSchema,
    papisFavorite: z.boolean().optional(),
    papisStatus: z.enum(["approved", "disapproved"]).optional(),
}).strict();



/**
 * Validates a complete company tag and rejects unknown fields.
 * Used by forms, JSON import, and storage boundaries.
 */
export const companyTagSchema = z.object({
    ...baseTagShape,
    type: z.literal("company"),
    payment: nullableScoreSchema,
    careerGrowth: nullableScoreSchema,
    locationScore: nullableScoreSchema,
    workModel: z.enum(["remote", "hybrid", "on-site"]),
    internshipAvailability: z.boolean().nullable(),
    industry: z.string().trim().min(1).max(120).optional(),
    companyArea: z.string().trim().min(1).max(160).optional(),
}).strict();



/**
 * Validates a complete sticky-note tag without applying scoring requirements.
 * Used by Note editing, JSON import, and storage boundaries.
 */
export const noteTagSchema = z.object({
    id: baseTagShape.id,
    type: z.literal("note"),
    name: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(20_000),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/u).optional(),
    country: z.string().trim().min(1).max(120),
    countryCode: baseTagShape.countryCode,
    city: z.string().trim().min(1).max(120),
    coordinates: baseTagShape.coordinates,
    sources: baseTagShape.sources,
    locked: z.boolean(),
    createdAt: baseTagShape.createdAt,
    updatedAt: baseTagShape.updatedAt,
}).strict();



/**
 * Validates either supported tag by its type discriminator.
 * Used by shared import and persistence code.
 */
export const mapTagSchema = z.discriminatedUnion("type", [universityTagSchema, companyTagSchema, noteTagSchema]);



/**
 * Parses unknown input into a trusted university record.
 * Used at form submission and data-access boundaries.
 */
export function parseUniversityTag(input: unknown): UniversityTag
{
    return universityTagSchema.parse(input);
}



/**
 * Parses unknown input into a trusted company record.
 * Used at form submission and data-access boundaries.
 */
export function parseCompanyTag(input: unknown): CompanyTag
{
    return companyTagSchema.parse(input);
}



/**
 * Parses unknown input into a trusted sticky-note record.
 * Used at Note form submission and data-access boundaries.
 */
export function parseNoteTag(input: unknown): NoteTag
{
    return noteTagSchema.parse(input);
}



/**
 * Parses unknown input into either supported map-tag type.
 * Used by generic JSON import handling.
 */
export function parseMapTag(input: unknown): MapTag
{
    return mapTagSchema.parse(input);
}
