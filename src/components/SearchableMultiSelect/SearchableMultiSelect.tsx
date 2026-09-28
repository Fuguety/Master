import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { SelectOption } from "../forms/SelectField";
import styles from "./SearchableMultiSelect.module.css";

export interface SearchableMultiSelectProps<TValue extends string = string>
{
    disabled?: boolean;
    label: string;
    onChange: (value: TValue[]) => void;
    options: readonly SelectOption<TValue>[];
    value: TValue[];
}

/**
 * Renders a searchable checkbox multi-select with chips and keyboard navigation.
 * Used by all large filter dimensions where an empty selection means all values.
 */
export function SearchableMultiSelect<TValue extends string = string>({
    disabled = false,
    label,
    onChange,
    options,
    value,
}: SearchableMultiSelectProps<TValue>)
{
    const generatedId = useId();
    const rootReference = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const filteredOptions = useMemo(() =>
    {
        const normalizedQuery = query.trim().toLocaleLowerCase();

        return options.filter((option) => normalizedQuery.length === 0
            || option.label.toLocaleLowerCase().includes(normalizedQuery));
    }, [options, query]);

    useEffect(() =>
    {
        const handlePointerDown = (event: PointerEvent): void =>
        {
            if (!rootReference.current?.contains(event.target as Node))
            {
                setIsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);

        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, []);

    const toggleValue = (optionValue: TValue): void =>
    {
        onChange(value.includes(optionValue)
            ? value.filter((selectedValue) => selectedValue !== optionValue)
            : [...value, optionValue]);
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void =>
    {
        if (event.key === "Escape")
        {
            setIsOpen(false);
        }
        else if (event.key === "ArrowDown" || event.key === "ArrowUp")
        {
            event.preventDefault();
            setIsOpen(true);
            const direction = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((current) =>
                (current + direction + filteredOptions.length) % Math.max(filteredOptions.length, 1));
        }
        else if (event.key === "Enter" && isOpen && filteredOptions[activeIndex] !== undefined)
        {
            event.preventDefault();
            toggleValue(filteredOptions[activeIndex].value);
        }
    };

    return (
        <div className={styles.field} ref={rootReference}>
            <label className={styles.label} htmlFor={generatedId}>{label}</label>
            {value.length === 0 ? null : (
                <div aria-label={`${label} selected values`} className={styles.chips}>
                    {value.map((selectedValue) =>
                    {
                        const option = options.find((candidate) => candidate.value === selectedValue);

                        return (
                            <button
                                className={styles.chip}
                                disabled={disabled}
                                key={selectedValue}
                                onClick={() => toggleValue(selectedValue)}
                                type="button"
                            >
                                {option?.label ?? selectedValue}<span aria-hidden="true"> ×</span>
                            </button>
                        );
                    })}
                    <button className={styles.clear} disabled={disabled} onClick={() => onChange([])} type="button">
                        Clear all
                    </button>
                </div>
            )}
            <input
                aria-controls={`${generatedId}-options`}
                aria-expanded={isOpen}
                autoComplete="off"
                className={styles.input}
                disabled={disabled}
                id={generatedId}
                onChange={(event) =>
                {
                    setQuery(event.currentTarget.value);
                    setActiveIndex(0);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? "All values — search to select" : "Search more"}
                role="combobox"
                value={query}
            />
            {isOpen ? (
                <div className={styles.options} id={`${generatedId}-options`} role="listbox">
                    {filteredOptions.map((option, index) => (
                        <label
                            className={styles.option}
                            data-active={index === activeIndex}
                            key={option.value}
                            onMouseEnter={() => setActiveIndex(index)}
                        >
                            <input
                                checked={value.includes(option.value)}
                                disabled={disabled}
                                onChange={() => toggleValue(option.value)}
                                type="checkbox"
                            />
                            <span>{option.label}</span>
                        </label>
                    ))}
                    {filteredOptions.length === 0 ? <p className={styles.empty}>No matching options</p> : null}
                </div>
            ) : null}
        </div>
    );
}

