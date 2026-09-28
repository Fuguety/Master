import { ZodError } from 'zod';
import type { CountryOverlay } from '@/types';
import { parseCountryOverlay } from '@/validation';

export type OverlayValidationResult =
    | { success: true; overlay: CountryOverlay; errors: Record<string, never> }
    | { success: false; errors: Record<string, string> };



/**
 * Validates a country overlay and maps schema issues to controlled form fields.
 * Used before overlay settings are written to local persistence.
 * Returns either a trusted overlay or concise field-indexed errors.
 */
export function validateCountryOverlay(overlay: CountryOverlay): OverlayValidationResult
{
    try
    {
        return {
            success: true,
            overlay: parseCountryOverlay({ ...overlay, updatedAt: new Date().toISOString() }),
            errors: {},
        };
    }
    catch (error)
    {
        if (!(error instanceof ZodError))
        {
            throw error;
        }

        const errors: Record<string, string> = {};

        for (const issue of error.issues)
        {
            const field = issue.path[0]?.toString() ?? 'form';
            errors[field] ??= issue.message;
        }

        return { success: false, errors };
    }
}
