import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { themeConfig } from "../config";
import type { ThemeId } from "../types";
import { ThemeContext } from "./ThemeContext";

export interface ThemeProviderProps
{
    children: ReactNode;
    initialTheme?: ThemeId;
    storageKey?: string;
}

const supportedThemeIds = new Set<ThemeId>(themeConfig.themes.map((theme) => theme.id));

/**
 * Checks whether a persisted string names a supported visual theme.
 * Used by the theme provider before applying browser-stored preferences.
 * Returns a narrowed theme identifier when the value is valid.
 */
function isThemeId(value: string | null): value is ThemeId
{
    return value !== null && supportedThemeIds.has(value as ThemeId);
}



/**
 * Reads a safe initial theme without assuming browser storage is available.
 * Used by the theme provider during its first render.
 * Returns the stored theme or the supplied fallback.
 */
function readInitialTheme(storageKey: string, fallback: ThemeId): ThemeId
{
    if (typeof window === "undefined")
    {
        return fallback;
    }

    try
    {
        const storedTheme = window.localStorage.getItem(storageKey);
        return isThemeId(storedTheme) ? storedTheme : fallback;
    }
    catch
    {
        return fallback;
    }
}



/**
 * Applies and persists one of the five presentation-only themes.
 * Used at the application root to expose theme state to controls.
 * Renders children inside the shared theme context.
 */
export function ThemeProvider({
    children,
    initialTheme = themeConfig.defaultTheme,
    storageKey = "atlas-notebook-theme",
}: ThemeProviderProps)
{
    const [theme, setTheme] = useState<ThemeId>(() => readInitialTheme(storageKey, initialTheme));

    useEffect(() =>
    {
        const root = document.documentElement;
        const activeDefinition = themeConfig.themes.find((definition) => definition.id === theme);

        root.dataset.theme = theme;
        root.classList.remove(...themeConfig.themes.map((definition) => definition.cssClass));

        if (activeDefinition !== undefined)
        {
            root.classList.add(activeDefinition.cssClass);
        }

        root.style.colorScheme = activeDefinition?.prefersDark ? "dark" : "light";

        try
        {
            window.localStorage.setItem(storageKey, theme);
        }
        catch
        {
            // Theme selection still works when storage is blocked or full.
        }
    }, [storageKey, theme]);

    const contextValue = useMemo(
        () => ({ theme, themes: themeConfig.themes, setTheme }),
        [theme],
    );

    return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}
