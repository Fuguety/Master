import { z } from "zod";
import type { ScoringConfig, ThemeConfig } from "../types";

interface NumericInterval
{
    minimum: number;
    maximum: number;
}

interface InputInterval
{
    inputMin: number;
    inputMax: number;
}

/**
 * Checks that an output interval has increasing finite endpoints.
 * Used by scoring-configuration validation.
 */
function isIncreasingOutputInterval(interval: NumericInterval): boolean
{
    return interval.maximum > interval.minimum;
}



/**
 * Checks that a normalization interval has increasing finite endpoints.
 * Used by linear and inverse-linear configuration validation.
 */
function isIncreasingInputInterval(interval: InputInterval): boolean
{
    return interval.inputMax > interval.inputMin;
}

const outputScoreSchema = z.number().finite().min(0).max(5);

const rangeNormalizationShape = {
    inputMin: z.number().finite(),
    inputMax: z.number().finite(),
};

const linearNormalizationSchema = z.object({
    kind: z.literal("linear"),
    ...rangeNormalizationShape,
}).strict().refine(isIncreasingInputInterval, {
    message: "inputMax must be greater than inputMin.",
});

const inverseNormalizationSchema = z.object({
    kind: z.literal("inverse-linear"),
    ...rangeNormalizationShape,
}).strict().refine(isIncreasingInputInterval, {
    message: "inputMax must be greater than inputMin.",
});

const booleanNormalizationSchema = z.object({
    kind: z.literal("boolean"),
    mapping: z.string().trim().min(1),
}).strict();

const categoricalNormalizationSchema = z.object({
    kind: z.literal("categorical"),
    mapping: z.string().trim().min(1),
}).strict();

const normalizationSchema = z.union([
    linearNormalizationSchema,
    inverseNormalizationSchema,
    booleanNormalizationSchema,
    categoricalNormalizationSchema,
]);

const criterionShape = {
    label: z.string().trim().min(1).max(120),
    weight: z.number().finite().positive(),
    normalization: normalizationSchema,
};

const universityCriterionSchema = z.object({
    field: z.enum([
        "locationScore",
        "qualityOfLife",
        "affordability",
        "jobOpportunities",
        "jobPlacementSupport",
        "regionalCompanies",
        "globalReputation",
        "localReputation",
        "globalRanking",
        "localRanking",
        "commuteQuality",
        "countryTier",
    ]),
    ...criterionShape,
}).strict();

const companyCriterionSchema = z.object({
    field: z.enum([
        "payment",
        "careerGrowth",
        "locationScore",
        "countryTier",
        "workModel",
        "internshipAvailability",
    ]),
    ...criterionShape,
}).strict();

const scoringConfigBaseSchema = z.object({
    version: z.number().int().positive(),
    outputRange: z.object({
        minimum: outputScoreSchema,
        maximum: outputScoreSchema,
    }).strict().refine(isIncreasingOutputInterval, {
        message: "The output maximum must be greater than the minimum.",
    }),
    missingValueStrategy: z.literal("exclude"),
    booleanMappings: z.record(z.string(), z.object({
        true: outputScoreSchema,
        false: outputScoreSchema,
    }).strict()),
    categoricalMappings: z.record(z.string(), z.object({
        values: z.record(z.string(), outputScoreSchema),
        default: outputScoreSchema.nullable(),
    }).strict()),
    university: z.object({
        criteria: z.array(universityCriterionSchema).min(1),
    }).strict(),
    company: z.object({
        criteria: z.array(companyCriterionSchema).min(1),
    }).strict(),
}).strict();

const booleanScoreFields = new Set(["jobPlacementSupport", "internshipAvailability"]);
const categoricalScoreFields = new Set(["countryTier", "workModel"]);
const inverseRankingFields = new Set(["globalRanking", "localRanking"]);



/**
 * Ensures a criterion uses a normalization compatible with its domain value.
 * Used by scoring configuration cross-validation for both tag models.
 * Reports field-indexed issues without allowing silent score exclusion.
 */
function validateCriterionNormalization(
    field: string,
    normalization: z.infer<typeof normalizationSchema>,
    context: z.RefinementCtx,
    path: (string | number)[],
): void
{
    const normalizationKind = normalization.kind;
    const isCompatible = booleanScoreFields.has(field)
        ? normalizationKind === "boolean"
        : categoricalScoreFields.has(field)
            ? normalizationKind === "categorical"
            : inverseRankingFields.has(field)
                ? normalizationKind === "inverse-linear"
                : normalizationKind === "linear" || normalizationKind === "inverse-linear";

    if (!isCompatible)
    {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, "kind"],
            message: `Normalization kind “${normalizationKind}” is not compatible with “${field}”.`,
        });
    }
}

/**
 * Ensures every named scoring mapping exists and fields are unique per model.
 * Used by scoring-configuration validation after structural parsing.
 */
function validateScoringMappings(
    config: z.infer<typeof scoringConfigBaseSchema>,
    context: z.RefinementCtx,
): void
{
    const universityFields = new Set<string>();

    for (let index = 0; index < config.university.criteria.length; index += 1)
    {
        const criterion = config.university.criteria[index];

        if (criterion === undefined)
        {
            continue;
        }

        if (universityFields.has(criterion.field))
        {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["university", "criteria", index, "field"],
                message: "Each university scoring field may appear only once.",
            });
        }

        universityFields.add(criterion.field);
        validateCriterionNormalization(criterion.field, criterion.normalization, context, [
            "university",
            "criteria",
            index,
            "normalization",
        ]);
        validateCriterionMapping(criterion.normalization, config, context, [
            "university",
            "criteria",
            index,
            "normalization",
            "mapping",
        ]);
    }

    const companyFields = new Set<string>();

    for (let index = 0; index < config.company.criteria.length; index += 1)
    {
        const criterion = config.company.criteria[index];

        if (criterion === undefined)
        {
            continue;
        }

        if (companyFields.has(criterion.field))
        {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["company", "criteria", index, "field"],
                message: "Each company scoring field may appear only once.",
            });
        }

        companyFields.add(criterion.field);
        validateCriterionNormalization(criterion.field, criterion.normalization, context, [
            "company",
            "criteria",
            index,
            "normalization",
        ]);
        validateCriterionMapping(criterion.normalization, config, context, [
            "company",
            "criteria",
            index,
            "normalization",
            "mapping",
        ]);
    }
}



/**
 * Reports a missing boolean or categorical mapping reference.
 * Used by the cross-field scoring configuration validator.
 */
function validateCriterionMapping(
    normalization: z.infer<typeof normalizationSchema>,
    config: z.infer<typeof scoringConfigBaseSchema>,
    context: z.RefinementCtx,
    path: (string | number)[],
): void
{
    if (normalization.kind === "boolean"
        && config.booleanMappings[normalization.mapping] === undefined)
    {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: `Unknown boolean mapping “${normalization.mapping}”.`,
        });
    }

    if (normalization.kind === "categorical"
        && config.categoricalMappings[normalization.mapping] === undefined)
    {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: `Unknown categorical mapping “${normalization.mapping}”.`,
        });
    }
}

/**
 * Validates editable scoring weights, ranges, mappings, and references.
 * Used when loading a custom scoring configuration.
 */
export const scoringConfigSchema = scoringConfigBaseSchema.superRefine(validateScoringMappings);

const themeConfigBaseSchema = z.object({
    defaultTheme: z.enum(["modern", "tron", "nineties", "ww2", "pirate"]),
    themes: z.array(z.object({
        id: z.enum(["modern", "tron", "nineties", "ww2", "pirate"]),
        label: z.string().trim().min(1).max(80),
        description: z.string().trim().min(1).max(300),
        cssClass: z.string().regex(/^theme-[a-z0-9-]+$/),
        prefersDark: z.boolean(),
    }).strict()).length(5),
}).strict();

/**
 * Ensures theme metadata contains each supported theme exactly once.
 * Used by theme-configuration validation after structural parsing.
 */
function validateThemeDefinitions(
    config: z.infer<typeof themeConfigBaseSchema>,
    context: z.RefinementCtx,
): void
{
    const themeIds = new Set<string>();

    for (const theme of config.themes)
    {
        themeIds.add(theme.id);
    }

    if (themeIds.size !== 5 || !themeIds.has(config.defaultTheme))
    {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["themes"],
            message: "Theme configuration must define all five unique themes and include the default.",
        });
    }
}

/**
 * Validates the five supported presentation theme metadata records.
 * Used when loading external theme configuration.
 */
export const themeConfigSchema = themeConfigBaseSchema.superRefine(validateThemeDefinitions);



/**
 * Parses unknown input into a trusted scoring configuration.
 * Used before injecting custom weights into the scoring engine.
 */
export function parseScoringConfig(input: unknown): ScoringConfig
{
    return scoringConfigSchema.parse(input);
}



/**
 * Parses unknown input into trusted theme metadata.
 * Used before applying an externally loaded theme configuration.
 */
export function parseThemeConfig(input: unknown): ThemeConfig
{
    return themeConfigSchema.parse(input);
}
