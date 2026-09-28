import type { CompanyScoreField } from "./company";
import type { UniversityScoreField } from "./university";

/**
 * Selects the algorithm used to normalize a scoring input.
 * Used by the generic scoring engine and JSON configuration.
 */
export type NormalizationKind = "linear" | "inverse-linear" | "boolean" | "categorical";



/**
 * Configures how a raw field is converted to the common rating scale.
 * Used by each configurable scoring criterion.
 */
export interface NormalizationConfig
{
    kind: NormalizationKind;
    inputMin?: number;
    inputMax?: number;
    mapping?: string;
}



/**
 * Configures a single weighted field in a scoring model.
 * Used by the generic scoring calculator.
 */
export interface ScoreCriterionConfig<TField extends string = string>
{
    field: TField;
    label: string;
    weight: number;
    normalization: NormalizationConfig;
}



/**
 * Configures numeric values for a boolean input.
 * Used for job support and internship availability.
 */
export interface BooleanScoreMapping
{
    true: number;
    false: number;
}



/**
 * Configures numeric values for categorical inputs.
 * Used for country tier and work-model scoring.
 */
export interface CategoryScoreMapping
{
    values: Record<string, number>;
    default: number | null;
}



/**
 * Describes the complete externalized scoring configuration.
 * Used by scoring services and configuration validation.
 */
export interface ScoringConfig
{
    version: number;
    outputRange: {
        minimum: number;
        maximum: number;
    };
    missingValueStrategy: "exclude";
    booleanMappings: Record<string, BooleanScoreMapping>;
    categoricalMappings: Record<string, CategoryScoreMapping>;
    university: {
        criteria: ScoreCriterionConfig<UniversityScoreField>[];
    };
    company: {
        criteria: ScoreCriterionConfig<CompanyScoreField>[];
    };
}



/**
 * Describes one field's contribution to a calculated score.
 * Used by tag detail popups to explain the rating.
 */
export interface ScoreBreakdownItem
{
    field: string;
    label: string;
    rawValue: unknown;
    normalizedScore: number | null;
    weight: number;
    effectiveWeight: number;
    weightedContribution: number;
    included: boolean;
    explanation: string;
}



/**
 * Contains a final rating and its transparent calculation details.
 * Used by scoring consumers and popup score breakdowns.
 */
export interface ScoreResult
{
    rating: number;
    preciseRating: number;
    totalConfiguredWeight: number;
    totalEffectiveWeight: number;
    breakdown: ScoreBreakdownItem[];
    explanation: string;
}



/**
 * Provides a domain-friendly alias for one score contribution.
 * Used by UI consumers that refer to ratings rather than scores.
 */
export type RatingBreakdown = ScoreBreakdownItem;



/**
 * Provides a domain-friendly alias for the complete score result.
 * Used by popup and form consumers that refer to ratings.
 */
export type RatingResult = ScoreResult;
