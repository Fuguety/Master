import type { AppDataBundle } from '@/types';
import {
    withCalculatedCompanyRating,
    withCalculatedUniversityRating,
} from './calculator';



/**
 * Recalculates every persisted tag rating with the active scoring configuration.
 * Used after startup and import so filters, map data, exports, and popups cannot drift.
 * Returns a new bundle while preserving identifiers and timestamps.
 */
export function synchronizeBundleRatings(bundle: AppDataBundle): AppDataBundle
{
    return {
        ...bundle,
        universities: bundle.universities.map((university) => withCalculatedUniversityRating(university)),
        companies: bundle.companies.map((company) => withCalculatedCompanyRating(company)),
    };
}
