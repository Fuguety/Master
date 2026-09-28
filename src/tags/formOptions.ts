import type { CountryTier, WorkModel } from "../types";
import type { SelectOption } from "../components/forms/SelectField";

export const countryTierOptions: readonly SelectOption<CountryTier>[] = [
    { value: "tier-1", label: "Tier 1" },
    { value: "tier-2", label: "Tier 2" },
    { value: "tier-3", label: "Tier 3" },
    { value: "tier-4", label: "Tier 4" },
];

export const workModelOptions: readonly SelectOption<WorkModel>[] = [
    { value: "remote", label: "Remote" },
    { value: "hybrid", label: "Hybrid" },
    { value: "on-site", label: "On-site" },
];

export const scoreFieldHint = "Optional score from 0 (weak) to 5 (excellent).";

