import { useState } from "react";
import type { CountryTier, UniversityFilters } from "../../../types";
import { useFieldUpdater } from "../../../hooks/useFieldUpdater";
import { BooleanSelectField } from "../../forms/BooleanSelectField";
import { MultiSelectField } from "../../forms/MultiSelectField";
import { NumericRangeField } from "../../forms/NumericRangeField";
import { RangeField } from "../../forms/RangeField";
import type { SelectOption } from "../../forms/SelectField";
import { countryTierOptions } from "../../../tags/formOptions";
import { FilterGroup } from "../FilterGroup/FilterGroup";
import { FilterPanelShell } from "../FilterPanelShell/FilterPanelShell";
import { FilterSearch } from "../FilterSearch/FilterSearch";

const UNIVERSITY_FILTER_ENTRIES = [
    { category: "Place", label: "Countries" }, { category: "Place", label: "Cities" },
    { category: "Place", label: "Country tiers" }, { category: "Place", label: "Minimum rating" },
    { category: "Life and opportunity", label: "Price affordability" },
    { category: "Life and opportunity", label: "Quality of life" },
    { category: "Life and opportunity", label: "Job opportunities" },
    { category: "Life and opportunity", label: "Job-placement support" },
    { category: "Life and opportunity", label: "Regional companies" },
    { category: "Life and opportunity", label: "Commute" },
    { category: "Reputation and ranking", label: "Global reputation" },
    { category: "Reputation and ranking", label: "Local reputation" },
    { category: "Reputation and ranking", label: "Global ranking" },
    { category: "Reputation and ranking", label: "Local ranking" },
];

export interface UniversityFilterPanelProps
{
    activeCount: number;
    cityOptions: readonly SelectOption[];
    countryOptions: readonly SelectOption[];
    disabled?: boolean;
    onChange: (filters: UniversityFilters) => void;
    onReset: () => void;
    value: UniversityFilters;
}

/**
 * Renders every independent and combinable university filter dimension.
 * Used by the university filter tool without evaluating tag records itself.
 * Emits immutable UniversityFilters objects to the optimized filtering service.
 */
export function UniversityFilterPanel({
    activeCount,
    cityOptions,
    countryOptions,
    disabled = false,
    onChange,
    onReset,
    value,
}: UniversityFilterPanelProps)
{
    const updateField = useFieldUpdater(value, onChange);
    const [searchQuery, setSearchQuery] = useState("");
    const hasMatches = searchQuery.trim().length === 0 || UNIVERSITY_FILTER_ENTRIES.some((entry) =>
        `${entry.category} ${entry.label}`.toLocaleLowerCase().includes(searchQuery.trim().toLocaleLowerCase()));

    return (
        <FilterPanelShell activeCount={activeCount} disabled={disabled} onReset={onReset} title="University filters">
            <FilterSearch entries={UNIVERSITY_FILTER_ENTRIES} onChange={setSearchQuery} query={searchQuery} />
            {!hasMatches ? <p role="status">No matching filters</p> : null}
            <FilterGroup description="Choose any number of places. Empty selections include all places." searchQuery={searchQuery} searchTerms={["Countries", "Cities", "Country tiers", "Minimum rating"]} title="Place">
                <MultiSelectField
                    disabled={disabled}
                    label="Countries"
                    onChange={(countries) => updateField("countries", countries.length > 0 ? countries : undefined)}
                    options={countryOptions}
                    value={value.countries ?? []}
                />
                <MultiSelectField
                    disabled={disabled}
                    label="Cities"
                    onChange={(cities) => updateField("cities", cities.length > 0 ? cities : undefined)}
                    options={cityOptions}
                    value={value.cities ?? []}
                />
                <MultiSelectField<CountryTier>
                    disabled={disabled}
                    label="Country tiers"
                    onChange={(countryTiers) => updateField("countryTiers", countryTiers.length > 0 ? countryTiers : undefined)}
                    options={countryTierOptions}
                    value={value.countryTiers ?? []}
                />
                <RangeField
                    disabled={disabled}
                    hint="Only show universities at or above this final score."
                    label="Minimum rating"
                    onChange={(minimumRating) => updateField("minimumRating", minimumRating ?? undefined)}
                    step={0.1}
                    value={value.minimumRating ?? null}
                />
            </FilterGroup>

            <FilterGroup description="All ranges are inclusive and use the common 0–5 scale." searchQuery={searchQuery} searchTerms={["Price affordability", "Quality of life", "Job opportunities", "Job-placement support", "Regional companies", "Commute"]} title="Life and opportunity">
                <NumericRangeField
                    disabled={disabled}
                    label="Price / affordability"
                    onChange={(affordability) => updateField("affordability", affordability)}
                    value={value.affordability}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Quality of life"
                    onChange={(qualityOfLife) => updateField("qualityOfLife", qualityOfLife)}
                    value={value.qualityOfLife}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Job opportunities"
                    onChange={(jobOpportunities) => updateField("jobOpportunities", jobOpportunities)}
                    value={value.jobOpportunities}
                />
                <BooleanSelectField
                    disabled={disabled}
                    label="Job-placement support"
                    nullLabel="Any support status"
                    onChange={(jobPlacementSupport) => updateField("jobPlacementSupport", jobPlacementSupport ?? undefined)}
                    value={value.jobPlacementSupport ?? null}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Regional companies"
                    onChange={(regionalCompanies) => updateField("regionalCompanies", regionalCompanies)}
                    value={value.regionalCompanies}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Commute"
                    onChange={(commuteQuality) => updateField("commuteQuality", commuteQuality)}
                    value={value.commuteQuality}
                />
            </FilterGroup>

            <FilterGroup description="Use the combined signals or narrow global and local values independently." searchQuery={searchQuery} searchTerms={["Reputation", "Global reputation", "Local reputation", "Ranking", "Global ranking", "Local ranking"]} title="Reputation and ranking">
                <NumericRangeField
                    disabled={disabled}
                    label="Reputation (combined)"
                    onChange={(reputation) => updateField("reputation", reputation)}
                    value={value.reputation}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Global reputation"
                    onChange={(globalReputation) => updateField("globalReputation", globalReputation)}
                    value={value.globalReputation}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Local reputation"
                    onChange={(localReputation) => updateField("localReputation", localReputation)}
                    value={value.localReputation}
                />
                <NumericRangeField
                    disabled={disabled}
                    hint="Published ranking positions; lower numbers are better."
                    label="Ranking (combined)"
                    max={10000}
                    min={1}
                    onChange={(ranking) => updateField("ranking", ranking)}
                    step={1}
                    value={value.ranking}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Global ranking"
                    max={10000}
                    min={1}
                    onChange={(globalRanking) => updateField("globalRanking", globalRanking)}
                    step={1}
                    value={value.globalRanking}
                />
                <NumericRangeField
                    disabled={disabled}
                    label="Local ranking"
                    max={10000}
                    min={1}
                    onChange={(localRanking) => updateField("localRanking", localRanking)}
                    step={1}
                    value={value.localRanking}
                />
            </FilterGroup>
        </FilterPanelShell>
    );
}
