import type { GeographicNameMode } from "../../types";

export const GEOGRAPHIC_NAME_MODE_KEY = "atlas-notebook-geographic-name-mode";

/**
 * Formats canonical English and original names according to the presentation setting.
 * Used across autocomplete, country panels, filters, and cards without changing identifiers.
 */
export function formatGeographicName(
    englishName: string,
    originalName: string | undefined,
    mode: GeographicNameMode,
): string
{
    if (originalName === undefined || originalName === englishName)
    {
        return englishName;
    }

    if (mode === "original")
    {
        return originalName;
    }

    return mode === "english-original" ? `${englishName} (${originalName})` : englishName;
}



/**
 * Reads the current geographic-name preference without coupling controls to App state.
 * Used by shared autocomplete and country presentation components.
 */
export function getGeographicNameMode(): GeographicNameMode
{
    try
    {
        const value = window.localStorage.getItem(GEOGRAPHIC_NAME_MODE_KEY);
        return value === "original" || value === "english-original" ? value : "english";
    }
    catch
    {
        return "english";
    }
}
