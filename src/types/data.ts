import type { CompanyTag } from "./company";
import type { CountryOverlay } from "./countryOverlay";
import type { UniversityTag } from "./university";
import type { NoteTag } from "./note";

/**
 * Groups all user-editable application records for import and export.
 * Used as the stable boundary between storage adapters and UI consumers.
 */
export interface AppDataBundle
{
    version: number;
    exportedAt: string;
    universities: UniversityTag[];
    companies: CompanyTag[];
    notes?: NoteTag[];
    countryOverlays: CountryOverlay[];
}
