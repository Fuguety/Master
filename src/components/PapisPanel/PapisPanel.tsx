import { useMemo, useState } from 'react';
import { addTagNote, deleteTagNote, updateTagNote } from '@/application/tagMutations';
import type { PapisStatus, UniversityTag } from '@/types';
import { formatRating, formatRatingStars } from '@/utils/ratingFormat';
import { NoteListEditor } from '../NoteListEditor/NoteListEditor';
import styles from './PapisPanel.module.css';

type PapisTab = 'all' | 'approved' | 'favorites' | 'disapproved';
type PapisSort = 'alphabetical' | 'country' | 'rating-high' | 'rating-low';

export interface PapisPanelProps
{
    disabled?: boolean;
    locale?: string;
    onChange: (university: UniversityTag) => void;
    universities: readonly UniversityTag[];
}

const TABS: ReadonlyArray<{ label: string; value: PapisTab }> = [
    { label: 'All', value: 'all' },
    { label: 'Approved', value: 'approved' },
    { label: 'Favorites', value: 'favorites' },
    { label: 'Disapproved', value: 'disapproved' },
];



/**
 * Returns whether a university belongs in the selected Papis review tab.
 * Used before sorting so tab counts and result order remain independent.
 */
function matchesTab(university: UniversityTag, tab: PapisTab): boolean
{
    if (tab === 'favorites')
    {
        return university.papisFavorite === true;
    }

    return tab === 'all' || university.papisStatus === tab;
}



/**
 * Creates a sorted copy of the visible Papis university collection.
 * Used by the list view without mutating the application data bundle.
 */
function sortUniversities(
    universities: readonly UniversityTag[],
    sort: PapisSort,
    locale: string | undefined,
): UniversityTag[]
{
    return [...universities].sort((first, second) =>
    {
        if (sort === 'country')
        {
            return first.country.localeCompare(second.country, locale)
                || first.name.localeCompare(second.name, locale);
        }

        if (sort === 'rating-high')
        {
            return second.finalRating - first.finalRating
                || first.name.localeCompare(second.name, locale);
        }

        if (sort === 'rating-low')
        {
            return first.finalRating - second.finalRating
                || first.name.localeCompare(second.name, locale);
        }

        return first.name.localeCompare(second.name, locale);
    });
}



/**
 * Returns a university copy with one public Papis decision toggled.
 * Used by the approve and disapprove buttons while preserving exclusivity.
 */
function toggleStatus(university: UniversityTag, status: PapisStatus): UniversityTag
{
    const updatedUniversity: UniversityTag = {
        ...university,
        papisStatus: status,
        updatedAt: new Date().toISOString(),
    };

    if (university.papisStatus === status)
    {
        delete updatedUniversity.papisStatus;
    }

    return updatedUniversity;
}



/**
 * Renders the public university review workspace with sorting and status tabs.
 * Used by the Papis application tab and persists edits through its parent.
 * Keeps at most one university expanded for focused note editing.
 */
export function PapisPanel({
    disabled = false,
    locale,
    onChange,
    universities,
}: PapisPanelProps)
{
    const [activeTab, setActiveTab] = useState<PapisTab>('all');
    const [sort, setSort] = useState<PapisSort>('alphabetical');
    const [expandedUniversityId, setExpandedUniversityId] = useState<string | null>(null);
    const visibleUniversities = useMemo(() => sortUniversities(
        universities.filter((university) => matchesTab(university, activeTab)),
        sort,
        locale,
    ), [activeTab, locale, sort, universities]);
    const counts: Record<PapisTab, number> = {
        all: universities.length,
        approved: universities.filter((university) => university.papisStatus === 'approved').length,
        favorites: universities.filter((university) => university.papisFavorite === true).length,
        disapproved: universities.filter((university) => university.papisStatus === 'disapproved').length,
    };

    return (
        <section className={styles.panel}>
            <div aria-label="Papis university views" className={styles.tabs} role="tablist">
                {TABS.map((tab) => (
                    <button
                        aria-selected={activeTab === tab.value}
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        role="tab"
                        type="button"
                    >
                        {tab.label}
                        <span>{counts[tab.value]}</span>
                    </button>
                ))}
            </div>

            <div className={styles.toolbar}>
                <label htmlFor="papis-sort">Sort universities</label>
                <select
                    id="papis-sort"
                    onChange={(event) => setSort(event.currentTarget.value as PapisSort)}
                    value={sort}
                >
                    <option value="alphabetical">Alphabetical</option>
                    <option value="country">Country</option>
                    <option value="rating-high">Stars: high to low</option>
                    <option value="rating-low">Stars: low to high</option>
                </select>
            </div>

            {visibleUniversities.length === 0 ? (
                <p className={styles.empty}>No universities match this view.</p>
            ) : (
                <ol className={styles.list}>
                    {visibleUniversities.map((university) =>
                    {
                        const isExpanded = expandedUniversityId === university.id;

                        return (
                            <li className={styles.card} key={university.id}>
                                <div className={styles.summary}>
                                    <button
                                        aria-expanded={isExpanded}
                                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${university.name}`}
                                        className={styles.expandButton}
                                        onClick={() => setExpandedUniversityId(isExpanded ? null : university.id)}
                                        type="button"
                                    >
                                        <span aria-hidden="true" className={styles.chevron}>{isExpanded ? '−' : '+'}</span>
                                        <span className={styles.identity}>
                                            <strong>{university.name}</strong>
                                            <small>{university.city}, {university.country}</small>
                                        </span>
                                        <span aria-label={`${formatRating(university.finalRating, locale)} out of 5 stars`} className={styles.rating}>
                                            <span aria-hidden="true">{formatRatingStars(university.finalRating)}</span>
                                            <small>{formatRating(university.finalRating, locale)}</small>
                                        </span>
                                    </button>

                                    <div aria-label={`Review ${university.name}`} className={styles.reviewActions}>
                                        <button
                                            aria-label={`Approve ${university.name}`}
                                            aria-pressed={university.papisStatus === 'approved'}
                                            disabled={disabled}
                                            onClick={() => onChange(toggleStatus(university, 'approved'))}
                                            type="button"
                                        >
                                            <span aria-hidden="true">✓</span> Approved
                                        </button>
                                        <button
                                            aria-label={`Disapprove ${university.name}`}
                                            aria-pressed={university.papisStatus === 'disapproved'}
                                            disabled={disabled}
                                            onClick={() => onChange(toggleStatus(university, 'disapproved'))}
                                            type="button"
                                        >
                                            <span aria-hidden="true">×</span> Disapproved
                                        </button>
                                        <button
                                            aria-label={`Favorite ${university.name}`}
                                            aria-pressed={university.papisFavorite === true}
                                            disabled={disabled}
                                            onClick={() => onChange({
                                                ...university,
                                                papisFavorite: university.papisFavorite !== true,
                                                updatedAt: new Date().toISOString(),
                                            })}
                                            type="button"
                                        >
                                            <span aria-hidden="true">★</span> Favorite
                                        </button>
                                    </div>
                                </div>

                                {isExpanded ? (
                                    <div className={styles.details}>
                                        <dl>
                                            <div><dt>Global rank</dt><dd>{university.globalRanking ?? 'Not set'}</dd></div>
                                            <div><dt>Local rank</dt><dd>{university.localRanking ?? 'Not set'}</dd></div>
                                            <div><dt>Country tier</dt><dd>{university.countryTier.replace('-', ' ')}</dd></div>
                                        </dl>
                                        <NoteListEditor
                                            disabled={disabled}
                                            locale={locale}
                                            notes={university.notes}
                                            onAdd={(text) => onChange(addTagNote(university, text))}
                                            onDelete={(noteId) => onChange(deleteTagNote(university, noteId))}
                                            onUpdate={(noteId, text) => onChange(updateTagNote(university, noteId, text))}
                                        />
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
