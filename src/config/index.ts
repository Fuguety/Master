import scoringConfigJson from "./scoring-config.json";
import themeConfigJson from "./theme-config.json";
import { parseScoringConfig, parseThemeConfig } from "../validation/configSchemas";

/**
 * Exposes the validated-at-build-time default scoring configuration.
 * Used by scoring services while allowing callers to inject alternatives.
 */
export const scoringConfig = parseScoringConfig(scoringConfigJson);



/**
 * Exposes metadata for all presentation themes.
 * Used by theme controls without importing presentation logic.
 */
export const themeConfig = parseThemeConfig(themeConfigJson);

export { default as scoringConfigJson } from "./scoring-config.json";
export { default as themeConfigJson } from "./theme-config.json";
