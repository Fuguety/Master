import { z } from "zod";
import type { AppDataBundle, CountryOverlay } from "../types";
import {
    countryCodeSchema,
    identifierSchema,
    timestampSchema,
} from "./commonSchemas";
import { companyTagSchema, noteTagSchema, universityTagSchema } from "./tagSchemas";

/**
 * Validates one configurable country highlight.
 * Used by overlay editing and import boundaries.
 */
export const countryOverlaySchema = z.object({
    id: identifierSchema,
    countryCode: countryCodeSchema,
    countryName: z.string().trim().min(1).max(120),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    opacity: z.number().finite().min(0).max(1),
    isVisible: z.boolean(),
    notes: z.string().trim().max(2_000),
    updatedAt: timestampSchema,
}).strict();



/**
 * Validates a versioned import/export data bundle.
 * Used by the data-access layer before replacing local records.
 */
export const appDataBundleSchema = z.object({
    version: z.number().int().positive(),
    exportedAt: timestampSchema,
    universities: z.array(universityTagSchema),
    companies: z.array(companyTagSchema),
    notes: z.array(noteTagSchema),
    countryOverlays: z.array(countryOverlaySchema),
}).strict().superRefine((bundle, context) =>
{
    const tagIds = new Set<string>();

    for (const [index, university] of bundle.universities.entries())
    {
        if (tagIds.has(university.id))
        {
            context.addIssue({
                code: "custom",
                message: `Duplicate tag identifier: ${university.id}`,
                path: ["universities", index, "id"],
            });
        }

        tagIds.add(university.id);
    }

    for (const [index, company] of bundle.companies.entries())
    {
        if (tagIds.has(company.id))
        {
            context.addIssue({
                code: "custom",
                message: `Duplicate tag identifier: ${company.id}`,
                path: ["companies", index, "id"],
            });
        }

        tagIds.add(company.id);
    }

    for (const [index, note] of bundle.notes.entries())
    {
        if (tagIds.has(note.id))
        {
            context.addIssue({
                code: "custom",
                message: `Duplicate tag identifier: ${note.id}`,
                path: ["notes", index, "id"],
            });
        }

        tagIds.add(note.id);
    }

    const overlayIds = new Set<string>();
    const countryCodes = new Set<string>();

    for (const [index, overlay] of bundle.countryOverlays.entries())
    {
        if (overlayIds.has(overlay.id))
        {
            context.addIssue({
                code: "custom",
                message: `Duplicate country overlay identifier: ${overlay.id}`,
                path: ["countryOverlays", index, "id"],
            });
        }

        if (countryCodes.has(overlay.countryCode))
        {
            context.addIssue({
                code: "custom",
                message: `Duplicate country overlay: ${overlay.countryCode}`,
                path: ["countryOverlays", index, "countryCode"],
            });
        }

        overlayIds.add(overlay.id);
        countryCodes.add(overlay.countryCode);
    }
});



/**
 * Parses unknown input into a trusted country overlay.
 * Used by overlay forms and data import.
 */
export function parseCountryOverlay(input: unknown): CountryOverlay
{
    return countryOverlaySchema.parse(input);
}



/**
 * Parses unknown input into a trusted versioned data bundle.
 * Used by JSON import before any local records are changed.
 */
export function parseAppDataBundle(input: unknown): AppDataBundle
{
    return appDataBundleSchema.parse(input);
}
