import companiesJson from "./companies.json";
import countryOverlaysJson from "./country-overlays.json";
import universitiesJson from "./universities.json";
import notesJson from "./notes.json";
import {
    parseCompanyTag,
    parseCountryOverlay,
    parseUniversityTag,
    parseNoteTag,
} from "../validation";

/**
 * Provides immutable starter university records.
 * Used to seed local persistence on the first application run.
 */
export const exampleUniversities = universitiesJson.map((university) => parseUniversityTag(university));



/**
 * Provides immutable starter company records.
 * Used to seed local persistence on the first application run.
 */
export const exampleCompanies = companiesJson.map((company) => parseCompanyTag(company));



/**
 * Provides immutable starter sticky-note records.
 * Used to seed local persistence on the first application run.
 */
export const exampleNotes = notesJson.map((note) => parseNoteTag(note));



/**
 * Provides immutable starter country highlight records.
 * Used to seed local persistence on the first application run.
 */
export const exampleCountryOverlays = countryOverlaysJson.map((overlay) => parseCountryOverlay(overlay));

export { default as companiesJson } from "./companies.json";
export { default as countryOverlaysJson } from "./country-overlays.json";
export { default as universitiesJson } from "./universities.json";
export { default as notesJson } from "./notes.json";
export { countries, findCountry } from "./countries";
