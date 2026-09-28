export {
    calculateCompanyRating,
    calculateUniversityRating,
    calculateWeightedRating,
    withCalculatedCompanyRating,
    withCalculatedUniversityRating,
} from "./calculator";
export {
    clamp,
    isMissingScoreValue,
    normalizeBooleanValue,
    normalizeCategoricalValue,
    normalizeCriterionValue,
    normalizeInverseLinearValue,
    normalizeLinearValue,
    roundRating,
} from "./normalization";
export type { NormalizationResult } from "./normalization";
export { synchronizeBundleRatings } from "./bundleRatings";
