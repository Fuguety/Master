import type { BaseTag } from "./common";

export type PapisStatus = "approved" | "disapproved";

/**
 * Lists the university fields that contribute to automatic scoring.
 * Used to type scoring configuration criteria.
 */
export type UniversityScoreField =
    | "locationScore"
    | "qualityOfLife"
    | "affordability"
    | "jobOpportunities"
    | "jobPlacementSupport"
    | "regionalCompanies"
    | "globalReputation"
    | "localReputation"
    | "globalRanking"
    | "localRanking"
    | "commuteQuality"
    | "countryTier";



/**
 * Represents a university marker and all university-specific research data.
 * Used by forms, map popups, scoring, filtering, and persistence.
 */
export interface UniversityTag extends BaseTag
{
    type: "university";
    locationScore: number | null;
    qualityOfLife: number | null;
    affordability: number | null;
    jobOpportunities: number | null;
    jobPlacementSupport: boolean | null;
    regionalCompanies: number | null;
    globalReputation: number | null;
    localReputation: number | null;
    globalRanking: number | null;
    localRanking: number | null;
    commuteQuality: number | null;
    papisFavorite?: boolean;
    papisStatus?: PapisStatus;
}



/**
 * Contains only the fields required to calculate a university rating.
 * Used by forms to preview scores before a complete tag is persisted.
 */
export type UniversityScoreInput = Pick<UniversityTag, UniversityScoreField>;
