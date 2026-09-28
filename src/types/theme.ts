/**
 * Identifies one of the five supported presentation themes.
 * Used by theme configuration and theme selection controls.
 */
export type ThemeId = "modern" | "tron" | "nineties" | "ww2" | "pirate";



/**
 * Describes metadata and the CSS selector for one visual theme.
 * Used by the theme manager without coupling presentation to app logic.
 */
export interface ThemeDefinition
{
    id: ThemeId;
    label: string;
    description: string;
    cssClass: string;
    prefersDark: boolean;
}



/**
 * Describes the external theme configuration file.
 * Used to build the switcher and select a default theme.
 */
export interface ThemeConfig
{
    defaultTheme: ThemeId;
    themes: ThemeDefinition[];
}
