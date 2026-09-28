import { CompanyForm, NoteForm, UniversityForm } from '@/tags';
import type { Coordinates, MapTag, RatingResult } from '@/types';
import type { SourceInput } from '@/application/useTagEditor';

export interface TagEditorPanelProps
{
    busy: boolean;
    errors: Record<string, string>;
    isNew: boolean;
    onAddNote: (text: string) => void;
    onAddSource: (source: SourceInput) => void;
    onCancel: () => void;
    onChange: (tag: MapTag) => void;
    onDeleteNote: (noteId: string) => void;
    onDeleteSource: (sourceId: string) => void;
    onLocationResolved: (coordinates: Coordinates) => void;
    onSubmit: () => void;
    onUpdateNote: (noteId: string, text: string) => void;
    onUpdateSource: (sourceId: string, source: SourceInput) => void;
    rating: RatingResult | undefined;
    tag: MapTag;
}



/**
 * Narrows one discriminated tag draft into its complete controlled form.
 * Used inside the responsive editor panel for create and edit workflows.
 * Shares note, source, validation, score, and persistence callbacks.
 */
export function TagEditorPanel({
    busy,
    errors,
    isNew,
    onAddNote,
    onAddSource,
    onCancel,
    onChange,
    onDeleteNote,
    onDeleteSource,
    onLocationResolved,
    onSubmit,
    onUpdateNote,
    onUpdateSource,
    rating,
    tag,
}: TagEditorPanelProps)
{
    const sharedProps = {
        busy,
        disabled: busy,
        onAddNote,
        onAddSource,
        onCancel,
        onDeleteNote,
        onDeleteSource,
        onLocationResolved,
        onSubmit,
        onUpdateNote,
        onUpdateSource,
        ratingResult: rating,
        submitLabel: isNew ? 'Create tag' : 'Save changes',
    };

    if (tag.type === 'university')
    {
        return (
            <UniversityForm
                {...sharedProps}
                errors={errors}
                onChange={onChange}
                value={tag}
            />
        );
    }

    if (tag.type === 'note')
    {
        return (
            <NoteForm
                busy={busy}
                disabled={busy}
                errors={errors}
                onAddSource={onAddSource}
                onCancel={onCancel}
                onChange={onChange}
                onDeleteSource={onDeleteSource}
                onLocationResolved={onLocationResolved}
                onSubmit={onSubmit}
                onUpdateSource={onUpdateSource}
                submitLabel={isNew ? 'Create note' : 'Save note'}
                value={tag}
            />
        );
    }

    return (
        <CompanyForm
            {...sharedProps}
            errors={errors}
            onChange={onChange}
            value={tag}
        />
    );
}
