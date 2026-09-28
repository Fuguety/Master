import { ZodError } from 'zod';
import {
    calculateCompanyRating,
    calculateUniversityRating,
    withCalculatedCompanyRating,
    withCalculatedUniversityRating,
} from '@/scoring';
import type { MapTag, RatingResult } from '@/types';
import { parseCompanyTag, parseNoteTag, parseUniversityTag } from '@/validation';

const NOTE_RATING_RESULT: RatingResult = {
    rating: 0,
    preciseRating: 0,
    totalConfiguredWeight: 0,
    totalEffectiveWeight: 0,
    breakdown: [],
    explanation: 'Sticky notes do not use scoring.',
};



/**
 * Builds a safe unavailable score when unexpected draft data cannot be calculated.
 * Used by submission validation so a malformed draft reports an error instead of crashing React.
 * Returns a complete zero-valued result compatible with rating UI components.
 */
function createUnavailableRatingResult(): RatingResult
{
    return {
        rating: 0,
        preciseRating: 0,
        totalConfiguredWeight: 0,
        totalEffectiveWeight: 0,
        breakdown: [],
        explanation: 'The rating could not be calculated until the invalid fields are corrected.',
    };
}

export interface ValidTagResult
{
    errors: Record<string, never>;
    rating: RatingResult;
    success: true;
    tag: MapTag;
}

export interface InvalidTagResult
{
    errors: Record<string, string>;
    rating: RatingResult;
    success: false;
}

export type TagValidationResult = InvalidTagResult | ValidTagResult;



/**
 * Converts structured Zod issue paths into form-compatible field messages.
 * Used by the tag save workflow after schema validation fails.
 * Returns only the first message for each field to keep forms concise.
 */
function mapValidationErrors(error: ZodError): Record<string, string>
{
    const errors: Record<string, string> = {};

    for (const issue of error.issues)
    {
        const path = issue.path.join('.');
        const field = path === 'coordinates.longitude'
            ? 'longitude'
            : path === 'coordinates.latitude'
                ? 'latitude'
                : issue.path[0]?.toString() ?? 'form';

        errors[field] ??= issue.message;
    }

    return errors;
}



/**
 * Calculates the live rating for either concrete tag type.
 * Used by editors and detail popups without duplicating discriminator checks.
 * Returns a transparent score result containing the full breakdown.
 */
export function calculateTagRating(tag: MapTag): RatingResult
{
    try
    {
        if (tag.type === 'note')
        {
            return NOTE_RATING_RESULT;
        }

        return tag.type === 'university' ? calculateUniversityRating(tag) : calculateCompanyRating(tag);
    }
    catch
    {
        return createUnavailableRatingResult();
    }
}



/**
 * Recalculates, trims, and validates a tag before it reaches persistence.
 * Used by both university and company form submission workflows.
 * Returns either a trusted scored tag or field-indexed validation errors.
 */
export function validateAndScoreTag(tag: MapTag): TagValidationResult
{
    const rating = calculateTagRating(tag);

    try
    {
        const updatedTag = {
            ...tag,
            updatedAt: new Date().toISOString(),
        };
        const parsedTag = updatedTag.type === 'university'
            ? parseUniversityTag(withCalculatedUniversityRating(updatedTag))
            : updatedTag.type === 'company'
                ? parseCompanyTag(withCalculatedCompanyRating(updatedTag))
                : parseNoteTag(updatedTag);

        return {
            errors: {},
            rating,
            success: true,
            tag: parsedTag,
        };
    }
    catch (error)
    {
        if (error instanceof ZodError)
        {
            return {
                errors: mapValidationErrors(error),
                rating,
                success: false,
            };
        }

        return {
            errors: {
                form: 'The tag contains invalid data and could not be saved.',
            },
            rating,
            success: false,
        };
    }
}
