import { scoringConfig as defaultScoringConfig } from "../config";
import type {
    CompanyScoreInput,
    CompanyTag,
    ScoreBreakdownItem,
    ScoreCriterionConfig,
    ScoreResult,
    ScoringConfig,
    UniversityScoreInput,
    UniversityTag,
} from "../types";
import {
    clamp,
    normalizeCriterionValue,
    roundRating,
} from "./normalization";

/**
 * Calculates a weighted rating for any record and criterion list.
 * Used by both tag-specific scoring services and custom score previews.
 */
export function calculateWeightedRating<TInput extends object>(
    input: TInput,
    criteria: ScoreCriterionConfig[],
    config: ScoringConfig,
): ScoreResult
{
    const inputRecord = input as unknown as Record<string, unknown>;
    const breakdown: ScoreBreakdownItem[] = [];
    let totalConfiguredWeight = 0;
    let totalEffectiveWeight = 0;
    let weightedScoreSum = 0;
    let includedCriteriaCount = 0;

    for (const criterion of criteria)
    {
        const validWeight = Number.isFinite(criterion.weight) && criterion.weight > 0;
        const criterionWeight = validWeight ? criterion.weight : 0;
        const rawValue = inputRecord[criterion.field];
        const normalization = normalizeCriterionValue(rawValue, criterion, config);
        const isIncluded = normalization.score !== null && validWeight;

        totalConfiguredWeight += criterionWeight;

        if (isIncluded && normalization.score !== null)
        {
            totalEffectiveWeight += criterionWeight;
            weightedScoreSum += normalization.score * criterionWeight;
            includedCriteriaCount += 1;
        }

        breakdown.push({
            field: criterion.field,
            label: criterion.label,
            rawValue,
            normalizedScore: normalization.score,
            weight: criterionWeight,
            effectiveWeight: 0,
            weightedContribution: 0,
            included: isIncluded,
            explanation: validWeight
                ? normalization.explanation
                : "The configured weight is invalid, so this criterion was excluded.",
        });
    }

    if (totalEffectiveWeight === 0)
    {
        return {
            rating: 0,
            preciseRating: 0,
            totalConfiguredWeight,
            totalEffectiveWeight,
            breakdown,
            explanation: "No usable scoring values were supplied, so the rating is 0.0 stars.",
        };
    }

    const preciseRating = clamp(
        weightedScoreSum / totalEffectiveWeight,
        config.outputRange.minimum,
        config.outputRange.maximum,
    );

    for (const item of breakdown)
    {
        if (!item.included || item.normalizedScore === null)
        {
            continue;
        }

        item.effectiveWeight = item.weight / totalEffectiveWeight;
        item.weightedContribution = item.normalizedScore * item.effectiveWeight;
        item.explanation = `${item.explanation} Its effective weight is ${(item.effectiveWeight * 100).toFixed(1)}%, contributing ${item.weightedContribution.toFixed(2)} points.`;
    }

    const rating = roundRating(preciseRating);

    return {
        rating,
        preciseRating,
        totalConfiguredWeight,
        totalEffectiveWeight,
        breakdown,
        explanation: `The rating is the weighted average of ${includedCriteriaCount} available criteria. Missing values were excluded and the remaining weights were scaled to 100%, producing ${rating.toFixed(1)} of ${config.outputRange.maximum} stars.`,
    };
}



/**
 * Calculates a university rating using configurable university criteria.
 * Used by university forms, persistence updates, and detail popups.
 */
export function calculateUniversityRating(
    university: UniversityScoreInput,
    config: ScoringConfig = defaultScoringConfig,
): ScoreResult
{
    return calculateWeightedRating(
        university,
        config.university.criteria,
        config,
    );
}



/**
 * Calculates a company rating using configurable company criteria.
 * Used by company forms, persistence updates, and detail popups.
 */
export function calculateCompanyRating(
    company: CompanyScoreInput,
    config: ScoringConfig = defaultScoringConfig,
): ScoreResult
{
    return calculateWeightedRating(
        company,
        config.company.criteria,
        config,
    );
}



/**
 * Returns a university record with a freshly calculated final rating.
 * Used before a university is saved by the data-access layer.
 */
export function withCalculatedUniversityRating(
    university: UniversityTag,
    config: ScoringConfig = defaultScoringConfig,
): UniversityTag
{
    return {
        ...university,
        finalRating: calculateUniversityRating(university, config).rating,
    };
}



/**
 * Returns a company record with a freshly calculated final rating.
 * Used before a company is saved by the data-access layer.
 */
export function withCalculatedCompanyRating(
    company: CompanyTag,
    config: ScoringConfig = defaultScoringConfig,
): CompanyTag
{
    return {
        ...company,
        finalRating: calculateCompanyRating(company, config).rating,
    };
}
