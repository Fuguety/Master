import { useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { highlightMatch } from "../../Autocomplete/highlightMatch";
import styles from "./FilterSearch.module.css";

export interface FilterSearchEntry
{
    category: string;
    label: string;
}

export interface FilterSearchProps
{
    entries: readonly FilterSearchEntry[];
    onChange: (query: string) => void;
    query: string;
}

/**
 * Searches filter categories and individual option labels with keyboard navigation.
 * Used at the top of both University and Company filter panels.
 */
export function FilterSearch({ entries, onChange, query }: FilterSearchProps)
{
    const [activeIndex, setActiveIndex] = useState(0);
    const inputId = useId();
    const matches = useMemo(() =>
    {
        const normalized = query.trim().toLocaleLowerCase();
        return normalized.length === 0
            ? []
            : entries.filter((entry) => `${entry.category} ${entry.label}`.toLocaleLowerCase().includes(normalized));
    }, [entries, query]);
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void =>
    {
        if (event.key === "ArrowDown" || event.key === "ArrowUp")
        {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((current) => (current + direction + matches.length) % Math.max(matches.length, 1));
        }
        else if (event.key === "Enter" && matches[activeIndex] !== undefined)
        {
            onChange(matches[activeIndex].label);
        }
        else if (event.key === "Escape")
        {
            onChange("");
        }
    };

    return (
        <div className={styles.search}>
            <label htmlFor={inputId}>Search filters</label>
            <div className={styles.inputRow}>
                <input
                    id={inputId}
                    onChange={(event) =>
                    {
                        onChange(event.currentTarget.value);
                        setActiveIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Category or option"
                    type="search"
                    value={query}
                />
                {query.length === 0 ? null : <button onClick={() => onChange("")} type="button">Clear</button>}
            </div>
            {query.length > 0 && matches.length > 0 ? (
                <ul>
                    {matches.slice(0, 8).map((entry, index) => (
                        <li key={`${entry.category}-${entry.label}`}>
                            <button data-active={index === activeIndex} onClick={() => onChange(entry.label)} type="button">
                                <span>{highlightMatch(entry.label, query)}</span><small>{entry.category}</small>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
