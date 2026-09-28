import type { CompanyTag, Coordinates, MapTag, SourceReference, TagNote, UniversityTag } from '@/types';

type ResearchTag = UniversityTag | CompanyTag;
import { createId } from '@/utils/createId';

/**
 * Updates a tag timestamp while retaining its concrete discriminated type.
 * Used by all immutable tag mutation helpers before a record is persisted.
 * Returns a copy with a current ISO timestamp.
 */
function touchTag<TTag extends MapTag>(tag: TTag): TTag
{
    return {
        ...tag,
        updatedAt: new Date().toISOString(),
    };
}



/**
 * Replaces one tag's coordinates after a marker drag.
 * Used by the map-to-storage application workflow.
 * Returns the original union type with normalized coordinates supplied by the map.
 */
export function moveTag<TTag extends MapTag>(tag: TTag, coordinates: Coordinates): TTag
{
    return touchTag({ ...tag, coordinates });
}



/**
 * Appends a bounded plain-text note to a tag draft.
 * Used by the reusable note editor in both tag forms.
 * Returns a new tag value and never mutates React state.
 */
export function addTagNote<TTag extends ResearchTag>(tag: TTag, text: string): TTag
{
    const timestamp = new Date().toISOString();
    const note: TagNote = {
        id: createId('note'),
        text: text.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    return touchTag({ ...tag, notes: [...tag.notes, note] });
}



/**
 * Replaces the text and edit timestamp of one existing note.
 * Used by the form note editor's inline edit action.
 * Returns an unchanged-shape tag when the identifier is absent.
 */
export function updateTagNote<TTag extends ResearchTag>(tag: TTag, noteId: string, text: string): TTag
{
    const updatedAt = new Date().toISOString();
    const notes = tag.notes.map((note) => note.id === noteId
        ? { ...note, text: text.trim(), updatedAt }
        : note);

    return touchTag({ ...tag, notes });
}



/**
 * Removes one note from a tag by identifier.
 * Used by university and company note management.
 * Returns an immutable tag copy suitable for controlled forms.
 */
export function deleteTagNote<TTag extends ResearchTag>(tag: TTag, noteId: string): TTag
{
    return touchTag({ ...tag, notes: tag.notes.filter((note) => note.id !== noteId) });
}



/**
 * Appends a source reference with an optional accessed timestamp.
 * Used by the shared source list editor for either tag type.
 * Returns a new tag value with the source assigned a stable identifier.
 */
export function addTagSource<TTag extends MapTag>(
    tag: TTag,
    source: Pick<SourceReference, 'title' | 'url' | 'accessedAt'>,
): TTag
{
    const reference: SourceReference = {
        id: createId('source'),
        title: source.title.trim(),
        url: source.url.trim(),
        ...(source.accessedAt ? { accessedAt: source.accessedAt } : {}),
    };

    return touchTag({ ...tag, sources: [...tag.sources, reference] });
}



/**
 * Updates the editable fields of one source while preserving its identifier.
 * Used by the shared source editor's save action.
 * Returns an immutable tag record.
 */
export function updateTagSource<TTag extends MapTag>(
    tag: TTag,
    sourceId: string,
    source: Pick<SourceReference, 'title' | 'url' | 'accessedAt'>,
): TTag
{
    const sources = tag.sources.map((reference) => reference.id === sourceId
        ? {
            id: reference.id,
            title: source.title.trim(),
            url: source.url.trim(),
            ...(source.accessedAt ? { accessedAt: source.accessedAt } : {}),
        }
        : reference);

    return touchTag({ ...tag, sources });
}



/**
 * Removes one source reference from a tag by identifier.
 * Used by both controlled tag forms.
 * Returns an immutable tag copy.
 */
export function deleteTagSource<TTag extends MapTag>(tag: TTag, sourceId: string): TTag
{
    return touchTag({ ...tag, sources: tag.sources.filter((source) => source.id !== sourceId) });
}
