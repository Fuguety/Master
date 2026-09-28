import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import styles from "./Autocomplete.module.css";
import { highlightMatch } from "./highlightMatch";

export interface AutocompleteOption
{
    id: string;
    label: string;
    description?: string;
}

export interface AutocompleteProps<TOption extends AutocompleteOption>
{
    disabled?: boolean;
    emptyMessage?: string;
    error?: string;
    label: string;
    loading?: boolean;
    onInputChange: (value: string) => void;
    onSelect: (option: TOption) => void;
    options: readonly TOption[];
    placeholder?: string;
    renderOption?: (option: TOption, query: string) => ReactNode;
    required?: boolean;
    value: string;
}

/**
 * Renders matching label fragments with semantic emphasis.
 * Used by autocomplete suggestions to expose why each result matched.
 */
/**
 * Provides a reusable accessible combobox with keyboard, pointer, and outside-click behavior.
 * Used by country and city location fields with synchronous or asynchronous options.
 */
export function Autocomplete<TOption extends AutocompleteOption>({
    disabled = false,
    emptyMessage = "No matches found",
    error,
    label,
    loading = false,
    onInputChange,
    onSelect,
    options,
    placeholder,
    renderOption,
    required = false,
    value,
}: AutocompleteProps<TOption>)
{
    const generatedId = useId();
    const rootReference = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const activeOption = options[activeIndex];
    const listId = `${generatedId}-list`;
    const activeId = activeOption === undefined ? undefined : `${generatedId}-${activeOption.id}`;

    useEffect(() =>
    {
        setActiveIndex(0);
    }, [options]);

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

    const hasResults = options.length > 0;
    const status = useMemo(() => loading ? "Searching…" : hasResults ? "" : emptyMessage, [emptyMessage, hasResults, loading]);
    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void =>
    {
        if (event.key === "Escape")
        {
            setIsOpen(false);
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowUp")
        {
            event.preventDefault();
            setIsOpen(true);
            const direction = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex((current) => (current + direction + options.length) % Math.max(options.length, 1));
            return;
        }

        if (event.key === "Enter" && isOpen && activeOption !== undefined)
        {
            event.preventDefault();
            onSelect(activeOption);
            setIsOpen(false);
        }
    };

    return (
        <div className={styles.field} ref={rootReference}>
            <label className={styles.label} htmlFor={generatedId}>
                {label}
                {required ? <span aria-hidden="true" className={styles.required}>*</span> : null}
            </label>
            <input
                aria-activedescendant={isOpen ? activeId : undefined}
                aria-autocomplete="list"
                aria-controls={listId}
                aria-expanded={isOpen}
                aria-invalid={error === undefined ? undefined : true}
                autoComplete="off"
                className={styles.input}
                disabled={disabled}
                id={generatedId}
                onChange={(event) =>
                {
                    onInputChange(event.currentTarget.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                required={required}
                role="combobox"
                value={value}
            />
            {error === undefined ? null : <p className={styles.error} role="alert">{error}</p>}
            {isOpen ? (
                <div className={styles.popover} id={listId} role="listbox">
                    {options.map((option, index) => (
                        <button
                            aria-selected={index === activeIndex}
                            className={styles.option}
                            id={`${generatedId}-${option.id}`}
                            key={option.id}
                            onClick={() =>
                            {
                                onSelect(option);
                                setIsOpen(false);
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                            role="option"
                            type="button"
                        >
                            <span>{renderOption?.(option, value) ?? highlightMatch(option.label, value)}</span>
                            {option.description === undefined ? null : <small>{option.description}</small>}
                        </button>
                    ))}
                    {status.length > 0 ? <p aria-live="polite" className={styles.status}>{status}</p> : null}
                </div>
            ) : null}
        </div>
    );
}
