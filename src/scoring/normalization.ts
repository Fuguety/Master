import type {
    BooleanScoreMapping,
    CategoryScoreMapping,
    ScoreCriterionConfig,
    ScoringConfig,
} from "../types";

/**
 * Contains a normalized score and a user-facing reason for the result.
 * Used internally by the weighted scoring calculator.
 */
export interface NormalizationResult
{
    score: number | null;
    explanation: string;
}



/**
 * Constrains a finite number to an inclusive interval.
 * Used by all score normalizers and final rating calculation.
 */
export function clamp(value: number, minimum: number, maximum: number): number
{
    return Math.min(Math.max(value, minimum), maximum);
}



/**
 * Detects values that contain no usable scoring information.
 * Used by the normalization dispatcher to exclude missing criteria safely.
 */
export function isMissingScoreValue(value: unknown): boolean
{
    return value === null
        || value === undefined
        || (typeof value === "string" && value.trim().length === 0);
}



/**
 * Rounds a rating to the required single decimal place.
 * Used before ratings are persisted or displayed.
 */
export function roundRating(value: number): number
{
    return Math.round((value + Number.EPSILON) * 10) / 10;
}



/**
 * Normalizes a numeric value from one interval to another.
 * Used for direct zero-to-five research inputs.
 */
export function normalizeLinearValue(
    value: unknown,
    inputMinimum: number,
    inputMaximum: number,
    outputMinimum: number,
    outputMaximum: number,
): number | null
{
    if (typeof value !== "number" || !Number.isFinite(value))
    {
        return null;
    }

    if (!Number.isFinite(inputMinimum)
        || !Number.isFinite(inputMaximum)
        || inputMaximum <= inputMinimum)
    {
        return null;
    }

    const boundedValue = clamp(value, inputMinimum, inputMaximum);
    const inputPosition = (boundedValue - inputMinimum) / (inputMaximum - inputMinimum);
    const normalizedValue = outputMinimum + inputPosition * (outputMaximum - outputMinimum);

    return clamp(normalizedValue, outputMinimum, outputMaximum);
}



/**
 * Normalizes a lower-is-better number onto the output scale.
 * Used for global and local university ranking fields.
 */
export function normalizeInverseLinearValue(
    value: unknown,
    inputMinimum: number,
    inputMaximum: number,
    outputMinimum: number,
    outputMaximum: number,
): number | null
{
    const linearValue = normalizeLinearValue(
        value,
        inputMinimum,
        inputMaximum,
        outputMinimum,
        outputMaximum,
    );

    if (linearValue === null)
    {
        return null;
    }

    return outputMaximum - linearValue + outputMinimum;
}



/**
 * Converts a boolean to its externally configured numeric value.
 * Used for job-placement and internship scoring.
 */
export function normalizeBooleanValue(
    value: unknown,
    mapping: BooleanScoreMapping | undefined,
): number | null
{
    if (typeof value !== "boolean" || mapping === undefined)
    {
        return null;
    }

    return value ? mapping.true : mapping.false;
}



/**
 * Converts a category to its externally configured numeric value.
 * Used for country-tier and work-model scoring.
 */
export function normalizeCategoricalValue(
    value: unknown,
    mapping: CategoryScoreMapping | undefined,
): number | null
{
    if (typeof value !== "string" || mapping === undefined)
    {
        return null;
    }

    const mappedValue = mapping.values[value];

    if (typeof mappedValue === "number" && Number.isFinite(mappedValue))
    {
        return mappedValue;
    }

    return mapping.default;
}



/**
 * Resolves the numeric bounds required by range normalizers.
 * Used by the normalization dispatcher and returns null for invalid config.
 */
function getInputRange(criterion: ScoreCriterionConfig): [number, number] | null
{
    const { inputMin, inputMax } = criterion.normalization;

    if (typeof inputMin !== "number" || typeof inputMax !== "number")
    {
        return null;
    }

    if (!Number.isFinite(inputMin) || !Number.isFinite(inputMax) || inputMax <= inputMin)
    {
        return null;
    }

    return [inputMin, inputMax];
}



/**
 * Converts one configured raw field into the common rating scale.
 * Used by the generic weighted calculator and returns an explanation.
 */
export function normalizeCriterionValue(
    rawValue: unknown,
    criterion: ScoreCriterionConfig,
    config: ScoringConfig,
): NormalizationResult
{
    if (isMissingScoreValue(rawValue))
    {
        return {
            score: null,
            explanation: "No value supplied; this criterion was excluded and remaining weights were renormalized.",
        };
    }

    const { minimum, maximum } = config.outputRange;
    let normalizedScore: number | null = null;
    let methodDescription = "";

    if (criterion.normalization.kind === "linear"
        || criterion.normalization.kind === "inverse-linear")
    {
        const inputRange = getInputRange(criterion);

        if (inputRange === null)
        {
            return {
                score: null,
                explanation: "The configured numeric range is invalid, so this criterion was excluded.",
            };
        }

        if (criterion.normalization.kind === "linear")
        {
            normalizedScore = normalizeLinearValue(
                rawValue,
                inputRange[0],
                inputRange[1],
                minimum,
                maximum,
            );
            methodDescription = `linearly from ${inputRange[0]}–${inputRange[1]}`;
        }
        else
        {
            normalizedScore = normalizeInverseLinearValue(
                rawValue,
                inputRange[0],
                inputRange[1],
                minimum,
                maximum,
            );
            methodDescription = `as a lower-is-better value from ${inputRange[0]}–${inputRange[1]}`;
        }
    }
    else if (criterion.normalization.kind === "boolean")
    {
        const mappingName = criterion.normalization.mapping ?? "";
        normalizedScore = normalizeBooleanValue(rawValue, config.booleanMappings[mappingName]);
        methodDescription = `with the “${mappingName}” boolean mapping`;
    }
    else
    {
        const mappingName = criterion.normalization.mapping ?? "";
        normalizedScore = normalizeCategoricalValue(rawValue, config.categoricalMappings[mappingName]);
        methodDescription = `with the “${mappingName}” category mapping`;
    }

    if (normalizedScore === null || !Number.isFinite(normalizedScore))
    {
        return {
            score: null,
            explanation: "The value or its scoring mapping is invalid, so this criterion was excluded.",
        };
    }

    const boundedScore = clamp(normalizedScore, minimum, maximum);

    return {
        score: boundedScore,
        explanation: `Normalized ${methodDescription} to ${boundedScore.toFixed(2)} of ${maximum}.`,
    };
}
