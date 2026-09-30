import type { ReactNode } from "react";
import type { CompanyTag, RatingResult, UniversityTag } from "../../types";
import { Button } from "../../components/Button/Button";
import { IconButton } from "../../components/IconButton/IconButton";
import { ScoreBreakdown } from "../ScoreBreakdown/ScoreBreakdown";
import styles from "./TagDetailsCard.module.css";
import { formatCoordinate } from "../formatters";

export interface TagDetailField
{
    label: string;
    value: string;
}

export interface TagDetailsCardProps
{
    busy?: boolean;
    detailFields: readonly TagDetailField[];
    editable?: boolean;
    icon: ReactNode;
    locale?: string;
    onClose?: () => void;
    onDelete: (tagId: string) => void;
    onEdit: (tagId: string) => void;
    ratingResult: RatingResult;
    tag: UniversityTag | CompanyTag;
}

/**
 * Formats a tag rating with one locale-aware decimal place.
 * Used by the popup hero score.
 * Returns a safely bounded string from 0.0 to 5.0.
 */
function formatRating(value: number, locale: string | undefined): string
{
    const safeRating = Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0));
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
    }).format(safeRating);
}



/**
 * Renders the shared accessible content of a map tag popup.
 * Used by type-specific university and company popup adapters.
 * Exposes details, notes, sources, score explanation, and edit/delete actions.
 */
export function TagDetailsCard({
    busy = false,
    detailFields,
    editable = true,
    icon,
    locale,
    onClose,
    onDelete,
    onEdit,
    ratingResult,
    tag,
}: TagDetailsCardProps)
{
    return (
        <article className={styles.card} data-tag-type={tag.type}>
            <header className={styles.header}>
                <span className={styles.icon}>{icon}</span>
                <div className={styles.heading}>
                    <p>{tag.type === "university" ? "University" : "Company"}</p>
                    <h2>{tag.name}</h2>
                    <span>{tag.city}, {tag.country}</span>
                </div>
                {onClose ? (
                    <IconButton className={styles.close} label="Close details" onClick={onClose}>
                        <span aria-hidden="true">×</span>
                    </IconButton>
                ) : null}
            </header>

            <div className={styles.scrollArea}>
                <section aria-label="Rating" className={styles.rating}>
                    <strong>{formatRating(ratingResult.rating, locale)}</strong>
                    <span aria-hidden="true">★</span>
                    <div>
                        <b>Final rating</b>
                        <small>out of 5</small>
                    </div>
                </section>

                <dl className={styles.details}>
                    <div>
                        <dt>Coordinates</dt>
                        <dd>{formatCoordinate(tag.coordinates.latitude, locale)}, {formatCoordinate(tag.coordinates.longitude, locale)}</dd>
                    </div>
                    {detailFields.map((field) => (
                        <div key={field.label}>
                            <dt>{field.label}</dt>
                            <dd>{field.value}</dd>
                        </div>
                    ))}
                </dl>

                {tag.notes.length > 0 ? (
                    <section className={styles.section}>
                        <h3>Notes</h3>
                        <ul className={styles.noteList}>
                            {tag.notes.map((note) => <li key={note.id}>{note.text}</li>)}
                        </ul>
                    </section>
                ) : null}

                {tag.sources.length > 0 ? (
                    <section className={styles.section}>
                        <h3>Sources</h3>
                        <ul className={styles.sourceList}>
                            {tag.sources.map((source) => (
                                <li key={source.id}>
                                    <a href={source.url} rel="noopener noreferrer" target="_blank">
                                        {source.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                <ScoreBreakdown locale={locale} result={ratingResult} />
            </div>

            {editable ? <footer className={styles.actions}>
                <Button disabled={busy} onClick={() => onEdit(tag.id)} variant="secondary">Edit</Button>
                <Button disabled={busy} onClick={() => onDelete(tag.id)} variant="danger">Delete</Button>
            </footer> : null}
        </article>
    );
}
