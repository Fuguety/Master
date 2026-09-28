import { useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import type { ThemeContextValue } from "./ThemeContext";

/**
 * Returns the active presentation theme and theme setter.
 * Used by theme controls rendered below ThemeProvider.
 * Throws a clear integration error when no provider is present.
 */
export function useTheme(): ThemeContextValue
{
    const context = useContext(ThemeContext);

    if (context === null)
    {
        throw new Error("useTheme must be used inside ThemeProvider.");
    }

    return context;
}

