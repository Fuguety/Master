import { createContext } from "react";
import type { ThemeDefinition, ThemeId } from "../types";

export interface ThemeContextValue
{
    theme: ThemeId;
    themes: ThemeDefinition[];
    setTheme: (theme: ThemeId) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

