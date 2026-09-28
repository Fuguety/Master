import type { BaseTag } from "./common";

/**
 * Defines the supported company work arrangements.
 * Used by company forms, scoring, popups, and filters.
 */
export type WorkModel = "remote" | "hybrid" | "on-site";



/**
 * Lists the company fields that contribute to automatic scoring.
 * Used to type scoring configuration criteria.
 */
export type CompanyScoreField =
    | "payment"
    | "careerGrowth"
    | "locationScore"
    | "countryTier"
    | "workModel"
    | "internshipAvailability";



/**
 * Represents a company marker and all company-specific research data.
 * Used by forms, map popups, scoring, filtering, and persistence.
 */
export interface CompanyTag extends BaseTag
{
    type: "company";
    payment: number | null;
    careerGrowth: number | null;
    locationScore: number | null;
    workModel: WorkModel;
    internshipAvailability: boolean | null;
    industry?: string | undefined;
    companyArea?: string | undefined;
}



/**
 * Contains only the fields required to calculate a company rating.
 * Used by forms to preview scores before a complete tag is persisted.
 */
export type CompanyScoreInput = Pick<CompanyTag, CompanyScoreField>;
