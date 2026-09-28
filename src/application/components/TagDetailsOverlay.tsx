import { useEffect, useRef } from 'react';
import { CompanyPopup, NotePopup, UniversityPopup } from '@/popups';
import type { MapTag, NoteTag, RatingResult } from '@/types';
import styles from './TagDetailsOverlay.module.css';

export interface TagDetailsOverlayProps
{
    busy?: boolean;
    locale?: string;
    onClose: () => void;
    onDelete: (tagId: string) => void;
    onEdit: (tagId: string) => void;
    onToggleNoteLock?: ((tag: NoteTag) => void) | undefined;
    rating: RatingResult;
    tag: MapTag;
}



/**
 * Displays the correct detailed popup adapter for a selected map tag.
 * Used above the map while keeping MapLibre marker rendering independent of React cards.
 * Exposes edit, delete, and dismiss actions for either tag type.
 */
export function TagDetailsOverlay({
    busy = false,
    locale,
    onClose,
    onDelete,
    onEdit,
    onToggleNoteLock,
    rating,
    tag,
}: TagDetailsOverlayProps)
{
    const overlayReference = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        overlayReference.current?.focus();
    }, [tag.id]);

    return (
        <div
            aria-label={`${tag.name} details`}
            className={styles.overlay}
            ref={overlayReference}
            tabIndex={-1}
        >
            {tag.type === 'note'
                ? (
                    <NotePopup
                        busy={busy}
                        onClose={onClose}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onToggleLock={onToggleNoteLock ?? (() => undefined)}
                        tag={tag}
                    />
                )
                : tag.type === 'university'
                ? (
                    <UniversityPopup
                        busy={busy}
                        locale={locale}
                        onClose={onClose}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        ratingResult={rating}
                        tag={tag}
                    />
                )
                : (
                    <CompanyPopup
                        busy={busy}
                        locale={locale}
                        onClose={onClose}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        ratingResult={rating}
                        tag={tag}
                    />
                )}
        </div>
    );
}
