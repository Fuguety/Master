import { useEffect, useMemo, useState } from "react";
import {
    convertCurrency,
    formatGeographicName,
    getCountryInformation,
    queryCountryTags,
    type CurrencyConversion,
    type DisplayCurrency,
} from "../../services";
import type { GeographicNameMode, MapTag, TagType } from "../../types";
import { MultiSelectField } from "../forms/MultiSelectField";
import { NumberField } from "../forms/NumberField";
import { SelectField } from "../forms/SelectField";
import { TextField } from "../forms/TextField";
import styles from "./CountryInformationPanel.module.css";

export interface CountryInformationPanelProps
{
    countryCode: string;
    nameMode: GeographicNameMode;
    onTagSelect: (tag: MapTag) => void;
    tags: readonly MapTag[];
}

/**
 * Formats optional country facts without fabricating absent provider data.
 * Used throughout the Country Information definition list.
 */
function displayValue(value: string | number | undefined): string
{
    return value === undefined || value === "" ? "Data unavailable" : String(value);
}



/**
 * Renders canonical country facts and searchable records located in the country.
 * Used when a highlighted country is selected from the map or country list.
 */
export function CountryInformationPanel({ countryCode, nameMode, onTagSelect, tags }: CountryInformationPanelProps)
{
    const information = useMemo(() => getCountryInformation(countryCode), [countryCode]);
    const [query, setQuery] = useState("");
    const [types, setTypes] = useState<TagType[]>([]);
    const [minimumRating, setMinimumRating] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<"name" | "rating" | "city" | "updatedAt">("name");
    const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("LOCAL");
    const [wageConversion, setWageConversion] = useState<CurrencyConversion | null>(null);
    const results = useMemo(() => queryCountryTags(tags, {
        countryCode,
        minimumRating: minimumRating ?? undefined,
        query,
        sortBy,
        types,
    }), [countryCode, minimumRating, query, sortBy, tags, types]);
    const counts = {
        university: results.filter((tag) => tag.type === "university").length,
        company: results.filter((tag) => tag.type === "company").length,
        note: results.filter((tag) => tag.type === "note").length,
    };
    const tierTag = tags.find((tag) => tag.countryCode === countryCode && tag.type !== "note");
    const countryTier = tierTag?.type === "note" ? information?.countryTier : tierTag?.countryTier ?? information?.countryTier;

    useEffect(() =>
    {
        let active = true;

        if (information?.minimumMonthlyWage === undefined)
        {
            setWageConversion(null);
            return () =>
            {
                active = false;
            };
        }

        if (displayCurrency === "LOCAL")
        {
            setWageConversion({
                amount: information.minimumMonthlyWage.amount,
                currency: information.minimumMonthlyWage.currency,
                rateDate: information.minimumMonthlyWage.rateDate,
            });
            return () =>
            {
                active = false;
            };
        }

        void convertCurrency(
            information.minimumMonthlyWage.amount,
            information.minimumMonthlyWage.currency,
            displayCurrency,
        ).then((conversion) =>
        {
            if (active)
            {
                setWageConversion(conversion);
            }
        });

        return () =>
        {
            active = false;
        };
    }, [displayCurrency, information]);

    if (information === undefined)
    {
        return <p className={styles.unavailable}>Country information is unavailable.</p>;
    }

    return (
        <section className={styles.panel} aria-labelledby="country-information-title">
            <header>
                <p>Country information</p>
                <h2 id="country-information-title">
                    {formatGeographicName(information.englishName, information.originalName, nameMode)}
                </h2>
            </header>
            <dl className={styles.facts}>
                <div><dt>English name</dt><dd>{information.englishName}</dd></div>
                <div><dt>Original name</dt><dd>{displayValue(information.originalName)}</dd></div>
                <div><dt>ISO alpha-2</dt><dd>{information.alpha2Code}</dd></div>
                <div><dt>ISO alpha-3</dt><dd>{information.alpha3Code}</dd></div>
                <div><dt>Capital</dt><dd>{displayValue(information.capital)}</dd></div>
                <div><dt>Currency</dt><dd>{displayValue(information.currencies.map((currency) => `${currency.code} — ${currency.name}${currency.symbol === undefined ? "" : ` (${currency.symbol})`}`).join(", "))}</dd></div>
                <div><dt>Population</dt><dd>{displayValue(information.population)}</dd></div>
                <div><dt>Languages</dt><dd>{displayValue(information.languages.join(", "))}</dd></div>
                <div><dt>Area</dt><dd>{information.area.toLocaleString()} km²</dd></div>
                <div><dt>Country tier</dt><dd>{displayValue(countryTier)}</dd></div>
                <div><dt>NATO membership</dt><dd>{information.natoMember === undefined ? "Data unavailable" : information.natoMember ? "Member" : "Not a member"}</dd></div>
                <div><dt>Region</dt><dd>{information.region}</dd></div>
                <div><dt>Continent</dt><dd>{information.continent}</dd></div>
                <div><dt>Subregion</dt><dd>{information.subregion}</dd></div>
                <div>
                    <dt>Minimum monthly wage</dt>
                    <dd>
                        {wageConversion === null
                            ? "Data unavailable"
                            : `${wageConversion.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${wageConversion.currency}`}
                    </dd>
                </div>
                <div><dt>Exchange-rate date</dt><dd>{displayValue(wageConversion?.rateDate)}</dd></div>
                <div><dt>Data source</dt><dd>{information.dataSource}</dd></div>
                <div><dt>Last updated</dt><dd>{displayValue(information.lastUpdated)}</dd></div>
            </dl>
            <SelectField<DisplayCurrency>
                label="Display currency"
                onChange={setDisplayCurrency}
                options={[
                    { label: "Local currency", value: "LOCAL" },
                    { label: "EUR", value: "EUR" },
                    { label: "USD", value: "USD" },
                    { label: "BRL", value: "BRL" },
                ]}
                value={displayCurrency}
            />
            <div className={styles.records}>
                <h3>Records in this country</h3>
                <p>{counts.university} universities · {counts.company} companies · {counts.note} notes</p>
                <TextField label="Search country records" onChange={setQuery} type="search" value={query} />
                <MultiSelectField<TagType>
                    label="Record types"
                    onChange={setTypes}
                    options={[{ label: "Universities", value: "university" }, { label: "Companies", value: "company" }, { label: "Notes", value: "note" }]}
                    value={types}
                />
                <NumberField label="Minimum rating" max={5} min={0} onChange={setMinimumRating} step={0.5} value={minimumRating} />
                <SelectField
                    label="Sort records"
                    onChange={setSortBy}
                    options={[{ label: "Name", value: "name" }, { label: "Rating", value: "rating" }, { label: "City", value: "city" }, { label: "Updated date", value: "updatedAt" }]}
                    value={sortBy}
                />
                {results.length === 0 ? <p>No records found.</p> : (
                    <ul>
                        {results.map((tag) => (
                            <li key={tag.id}>
                                <button onClick={() => onTagSelect(tag)} type="button">
                                    <strong>{tag.name}</strong><span>{tag.city} · {tag.type}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
