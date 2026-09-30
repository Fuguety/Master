export type {
    BaseTag,
    Coordinates,
    CountryTier,
    SourceReference,
    TagNote,
    TagType,
} from "./common";
export type { CompanyScoreField, CompanyScoreInput, CompanyTag, WorkModel } from "./company";
export type { CountryOverlay } from "./countryOverlay";
export type { AppDataBundle } from "./data";
export type { CompanyFilters, NumericRange, UniversityFilters } from "./filters";
export type { NoteTag } from "./note";
export type { CountryLocation, ResolvedLocation } from "./location";
export type { GeographicNameMode } from "./geographicNames";
export type {
    BooleanScoreMapping,
    CategoryScoreMapping,
    NormalizationConfig,
    NormalizationKind,
    RatingBreakdown,
    RatingResult,
    ScoreBreakdownItem,
    ScoreCriterionConfig,
    ScoreResult,
    ScoringConfig,
} from "./scoring";
export type { ThemeConfig, ThemeDefinition, ThemeId } from "./theme";
export type { PapisStatus, UniversityScoreField, UniversityScoreInput, UniversityTag } from "./university";

import type { CompanyTag } from "./company";
import type { UniversityTag } from "./university";
import type { NoteTag } from "./note";

/**
 * Represents any supported marker record.
 * Used by shared map and persistence features for discriminated narrowing.
 */
export type MapTag = UniversityTag | CompanyTag | NoteTag;
