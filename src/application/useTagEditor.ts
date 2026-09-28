import { useCallback, useMemo, useState } from 'react';
import type { Coordinates, MapTag, RatingResult, ResolvedLocation, TagType } from '@/types';
import {
    addTagNote,
    addTagSource,
    deleteTagNote,
    deleteTagSource,
    updateTagNote,
    updateTagSource,
} from './tagMutations';
import { createTag } from './tagFactory';
import { calculateTagRating, validateAndScoreTag } from './tagValidation';
import { synchronizeResolvedLocation } from '@/services';

export interface SourceInput
{
    accessedAt?: string;
    title: string;
    url: string;
}

export interface UseTagEditorResult
{
    addNote: (text: string) => void;
    addSource: (source: SourceInput) => void;
    applyDetectedLocation: (location: ResolvedLocation) => void;
    cancel: () => void;
    chooseType: (type: TagType) => void;
    createAt: (type: TagType, coordinates: Coordinates) => void;
    deleteNote: (noteId: string) => void;
    deleteSource: (sourceId: string) => void;
    draft: MapTag | null;
    edit: (tag: MapTag) => void;
    errors: Record<string, string>;
    isNew: boolean;
    pendingCoordinates: Coordinates | null;
    rating: RatingResult | undefined;
    requestCreation: (coordinates: Coordinates, location?: ResolvedLocation | null) => void;
    setDraft: (tag: MapTag) => void;
    submit: () => Promise<MapTag | null>;
    updateNote: (noteId: string, text: string) => void;
    updateSource: (sourceId: string, source: SourceInput) => void;
}



/**
 * Owns the controlled create/edit workflow shared by both tag forms.
 * Used by the application shell while persistence remains an injected operation.
 * Returns draft, validation, scoring, note, source, and submission actions.
 */
export function useTagEditor(onSave: (tag: MapTag) => Promise<void>): UseTagEditorResult
{
    const [draft, setDraftState] = useState<MapTag | null>(null);
    const [pendingCoordinates, setPendingCoordinates] = useState<Coordinates | null>(null);
    const [pendingLocation, setPendingLocation] = useState<ResolvedLocation | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isNew, setIsNew] = useState(false);
    const rating = useMemo(
        () => draft === null || draft.type === 'note' ? undefined : calculateTagRating(draft),
        [draft],
    );

    const requestCreation = useCallback((coordinates: Coordinates, location?: ResolvedLocation | null): void =>
    {
        setPendingCoordinates(coordinates);
        setPendingLocation(location ?? null);
        setDraftState(null);
        setErrors({});
        setIsNew(true);
    }, []);

    const applyDetectedLocation = useCallback((location: ResolvedLocation): void =>
    {
        setPendingLocation(location);
        setDraftState((current) => current === null ? null : synchronizeResolvedLocation(current, location));
    }, []);

    const chooseType = useCallback((type: TagType): void =>
    {
        if (pendingCoordinates === null)
        {
            return;
        }

        const tag = createTag(type, pendingCoordinates);
        setDraftState(pendingLocation === null ? tag : synchronizeResolvedLocation(tag, pendingLocation));
        setPendingCoordinates(null);
        setPendingLocation(null);
        setErrors({});
    }, [pendingCoordinates, pendingLocation]);

    const createAt = useCallback((type: TagType, coordinates: Coordinates): void =>
    {
        setDraftState(createTag(type, coordinates));
        setPendingCoordinates(null);
        setPendingLocation(null);
        setErrors({});
        setIsNew(true);
    }, []);

    const edit = useCallback((tag: MapTag): void =>
    {
        setDraftState(tag);
        setPendingCoordinates(null);
        setPendingLocation(null);
        setErrors({});
        setIsNew(false);
    }, []);

    const cancel = useCallback((): void =>
    {
        setDraftState(null);
        setPendingCoordinates(null);
        setPendingLocation(null);
        setErrors({});
        setIsNew(false);
    }, []);

    const setDraft = useCallback((tag: MapTag): void =>
    {
        setDraftState(tag);
        setErrors({});
    }, []);

    const addNote = useCallback((text: string): void =>
    {
        setDraftState((current) => current === null || current.type === 'note' ? current : addTagNote(current, text));
    }, []);

    const updateNote = useCallback((noteId: string, text: string): void =>
    {
        setDraftState((current) => current === null || current.type === 'note'
            ? current
            : updateTagNote(current, noteId, text));
    }, []);

    const deleteNote = useCallback((noteId: string): void =>
    {
        setDraftState((current) => current === null || current.type === 'note'
            ? current
            : deleteTagNote(current, noteId));
    }, []);

    const addSource = useCallback((source: SourceInput): void =>
    {
        setDraftState((current) => current === null ? null : addTagSource(current, source));
    }, []);

    const updateSource = useCallback((sourceId: string, source: SourceInput): void =>
    {
        setDraftState((current) => current === null
            ? null
            : updateTagSource(current, sourceId, source));
    }, []);

    const deleteSource = useCallback((sourceId: string): void =>
    {
        setDraftState((current) => current === null ? null : deleteTagSource(current, sourceId));
    }, []);

    const submit = useCallback(async (): Promise<MapTag | null> =>
    {
        if (draft === null)
        {
            return null;
        }

        const validation = validateAndScoreTag(draft);

        if (!validation.success)
        {
            setErrors(validation.errors);
            return null;
        }

        await onSave(validation.tag);
        setDraftState(null);
        setErrors({});
        setIsNew(false);

        return validation.tag;
    }, [draft, onSave]);

    return {
        addNote,
        addSource,
        applyDetectedLocation,
        cancel,
        chooseType,
        createAt,
        deleteNote,
        deleteSource,
        draft,
        edit,
        errors,
        isNew,
        pendingCoordinates,
        rating,
        requestCreation,
        setDraft,
        submit,
        updateNote,
        updateSource,
    };
}
