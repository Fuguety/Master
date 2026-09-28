import type { UniversityFilters, UniversityTag } from "../types";
import {
    averageAvailableValues,
    createTextFilterSet,
    matchesNumericRange,
    matchesTextFilter,
} from "./filterUtils";

/**
 * Provides a stable immutable initial university filter state.
 * Used by application state and reset controls.
 */
export const EMPTY_UNIVERSITY_FILTERS: UniversityFilters = Object.freeze({});

/**
 * Compiles independent university filters into one reusable predicate.
 * Used by filter hooks to efficiently evaluate large tag collections.
 */
export function createUniversityFilterPredicate(
    filters: UniversityFilters,
): (university: UniversityTag) => boolean
{
    const countries = createTextFilterSet(filters.countries);
    const cities = createTextFilterSet(filters.cities);
    const countryTiers = createTextFilterSet(filters.countryTiers);
    const minimumRating = Number.isFinite(filters.minimumRating)
        ? filters.minimumRating
        : undefined;

    /**
     * Evaluates one university against the compiled selections.
     * Used by the returned predicate and returns true only when all filters match.
     */
    function universityMatchesFilters(university: UniversityTag): boolean
    {
        const countryMatches = matchesTextFilter(university.country, countries)
            || matchesTextFilter(university.countryCode, countries);

        if (!countryMatches
            || !matchesTextFilter(university.city, cities)
            || !matchesTextFilter(university.countryTier, countryTiers))
        {
            return false;
        }

        if (minimumRating !== undefined && university.finalRating < minimumRating)
        {
            return false;
        }

        if (!matchesNumericRange(university.affordability, filters.price)
            || !matchesNumericRange(university.affordability, filters.affordability)
            || !matchesNumericRange(university.qualityOfLife, filters.qualityOfLife)
            || !matchesNumericRange(university.jobOpportunities, filters.jobOpportunities)
            || !matchesNumericRange(university.regionalCompanies, filters.regionalCompanies)
            || !matchesNumericRange(university.globalReputation, filters.globalReputation)
            || !matchesNumericRange(university.localReputation, filters.localReputation)
            || !matchesNumericRange(university.globalRanking, filters.globalRanking)
            || !matchesNumericRange(university.localRanking, filters.localRanking)
            || !matchesNumericRange(university.commuteQuality, filters.commute)
            || !matchesNumericRange(university.commuteQuality, filters.commuteQuality))
        {
            return false;
        }

        if (filters.jobPlacementSupport !== undefined
            && university.jobPlacementSupport !== filters.jobPlacementSupport)
        {
            return false;
        }

        const combinedReputation = averageAvailableValues([
            university.globalReputation,
            university.localReputation,
        ]);
        const combinedRanking = averageAvailableValues([
            university.globalRanking,
            university.localRanking,
        ]);

        return matchesNumericRange(combinedReputation, filters.reputation)
            && matchesNumericRange(combinedRanking, filters.ranking);
    }

    return universityMatchesFilters;
}



/**
 * Applies all active university filters in a single collection pass.
 * Used by map marker selectors and university list views.
 */
export function filterUniversities(
    universities: readonly UniversityTag[],
    filters: UniversityFilters,
): UniversityTag[]
{
    const predicate = createUniversityFilterPredicate(filters);
    const matches: UniversityTag[] = [];

    for (const university of universities)
    {
        if (predicate(university))
        {
            matches.push(university);
        }
    }

    return matches;
}



/**
 * Creates a reset university filter state with no active constraints.
 * Used by filter reset controls and initial state.
 */
export function createEmptyUniversityFilters(): UniversityFilters
{
    return { ...EMPTY_UNIVERSITY_FILTERS };
}
