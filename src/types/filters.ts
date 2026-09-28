import type { CountryTier } from "./common";
import type { WorkModel } from "./company";

/**
 * Defines an inclusive optional numeric interval.
 * Used by independent university and company filter dimensions.
 */
export interface NumericRange
{
    minimum?: number;
    maximum?: number;
}



/**
 * Stores all independently combinable university filter selections.
 * Used by the university filtering service and filter UI.
 */
export interface UniversityFilters
{
    countries?: string[];
    cities?: string[];
    minimumRating?: number;
    price?: NumericRange;
    affordability?: NumericRange;
    qualityOfLife?: NumericRange;
    jobOpportunities?: NumericRange;
    jobPlacementSupport?: boolean;
    regionalCompanies?: NumericRange;
    reputation?: NumericRange;
    globalReputation?: NumericRange;
    localReputation?: NumericRange;
    ranking?: NumericRange;
    globalRanking?: NumericRange;
    localRanking?: NumericRange;
    commute?: NumericRange;
    commuteQuality?: NumericRange;
    countryTiers?: CountryTier[];
}



/**
 * Stores all independently combinable company filter selections.
 * Used by the company filtering service and filter UI.
 */
export interface CompanyFilters
{
    countries?: string[];
    cities?: string[];
    minimumRating?: number;
    payment?: NumericRange;
    careerGrowth?: NumericRange;
    location?: NumericRange;
    locationScore?: NumericRange;
    workModels?: WorkModel[];
    internshipAvailability?: boolean;
    industries?: string[];
    companyAreas?: string[];
    countryTiers?: CountryTier[];
}
