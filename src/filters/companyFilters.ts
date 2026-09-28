import type { CompanyFilters, CompanyTag } from "../types";
import {
    createTextFilterSet,
    matchesNumericRange,
    matchesTextFilter,
} from "./filterUtils";

/**
 * Provides a stable immutable initial company filter state.
 * Used by application state and reset controls.
 */
export const EMPTY_COMPANY_FILTERS: CompanyFilters = Object.freeze({});

/**
 * Compiles independent company filters into one reusable predicate.
 * Used by filter hooks to efficiently evaluate large tag collections.
 */
export function createCompanyFilterPredicate(
    filters: CompanyFilters,
): (company: CompanyTag) => boolean
{
    const countries = createTextFilterSet(filters.countries);
    const cities = createTextFilterSet(filters.cities);
    const workModels = createTextFilterSet(filters.workModels);
    const industries = createTextFilterSet(filters.industries);
    const companyAreas = createTextFilterSet(filters.companyAreas);
    const countryTiers = createTextFilterSet(filters.countryTiers);
    const minimumRating = Number.isFinite(filters.minimumRating)
        ? filters.minimumRating
        : undefined;

    /**
     * Evaluates one company against the compiled selections.
     * Used by the returned predicate and returns true only when all filters match.
     */
    function companyMatchesFilters(company: CompanyTag): boolean
    {
        const countryMatches = matchesTextFilter(company.country, countries)
            || matchesTextFilter(company.countryCode, countries);

        if (!countryMatches
            || !matchesTextFilter(company.city, cities)
            || !matchesTextFilter(company.workModel, workModels)
            || !matchesTextFilter(company.industry, industries)
            || !matchesTextFilter(company.companyArea, companyAreas)
            || !matchesTextFilter(company.countryTier, countryTiers))
        {
            return false;
        }

        if (minimumRating !== undefined && company.finalRating < minimumRating)
        {
            return false;
        }

        if (!matchesNumericRange(company.payment, filters.payment)
            || !matchesNumericRange(company.careerGrowth, filters.careerGrowth)
            || !matchesNumericRange(company.locationScore, filters.location)
            || !matchesNumericRange(company.locationScore, filters.locationScore))
        {
            return false;
        }

        if (filters.internshipAvailability !== undefined
            && company.internshipAvailability !== filters.internshipAvailability)
        {
            return false;
        }

        return true;
    }

    return companyMatchesFilters;
}



/**
 * Applies all active company filters in a single collection pass.
 * Used by map marker selectors and company list views.
 */
export function filterCompanies(
    companies: readonly CompanyTag[],
    filters: CompanyFilters,
): CompanyTag[]
{
    const predicate = createCompanyFilterPredicate(filters);
    const matches: CompanyTag[] = [];

    for (const company of companies)
    {
        if (predicate(company))
        {
            matches.push(company);
        }
    }

    return matches;
}



/**
 * Creates a reset company filter state with no active constraints.
 * Used by filter reset controls and initial state.
 */
export function createEmptyCompanyFilters(): CompanyFilters
{
    return { ...EMPTY_COMPANY_FILTERS };
}
