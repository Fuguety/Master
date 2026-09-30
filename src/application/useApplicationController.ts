import { useEffect, useRef, useState } from 'react';
import type { ExportScope, ImportMode } from '@/components';
import type { CountrySelection } from '@/map';
import { readImportFile } from '@/storage';
import type { Coordinates, CountryOverlay, MapTag, TagType } from '@/types';
import type { ActivePanelId, ToolPanelId } from './appConfig';
import { findTag } from './appConfig';
import { createCountryOverlay } from './countryOverlayFactory';
import { exportBundleFile } from './exportFile';
import { validateCountryOverlay } from './overlayValidation';
import { moveTag } from './tagMutations';
import type { UseAtlasDataResult } from './useAtlasData';
import { useTagEditor } from './useTagEditor';
import type { UseApplicationControllerResult } from './applicationControllerTypes';
import { NominatimGeocodingService } from '@/services';
import interactionConfig from '@/config/interaction-config.json';

const geocodingService = new NominatimGeocodingService();



/**
 * Coordinates transient map workflows and delegates durable writes to the data layer.
 * Used by the root application while keeping map, forms, and panels fully controlled.
 * Returns selection, editor, import/export, overlay, and tag action state.
 */
export function useApplicationController(
    data: UseAtlasDataResult,
): UseApplicationControllerResult
{
    const tagEditor = useTagEditor(data.saveTag);
    const geocodingRequest = useRef<AbortController | null>(null);
    const [activePanel, setActivePanel] = useState<ActivePanelId>(null);
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [openTagIds, setOpenTagIds] = useState<string[]>([]);
    const [pinnedTagIds, setPinnedTagIds] = useState<string[]>([]);
    const [createTagMode, setCreateTagMode] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
    const [countryActionCoordinates, setCountryActionCoordinates] = useState<Coordinates | null>(null);
    const [overlayDraft, setOverlayDraft] = useState<CountryOverlay | null>(null);
    const [overlayErrors, setOverlayErrors] = useState<Record<string, string>>({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [lastExportedAt, setLastExportedAt] = useState<string | undefined>(undefined);
    const dataIsBusy = data.status === 'loading' || data.status === 'saving';

    useEffect(() =>
    {
        const availableTagIds = new Set([
            ...data.bundle.universities.map((tag) => tag.id),
            ...data.bundle.companies.map((tag) => tag.id),
            ...(data.bundle.notes ?? []).map((tag) => tag.id),
        ]);

        setOpenTagIds((current) =>
        {
            const next = current.filter((tagId) => availableTagIds.has(tagId));
            return next.length === current.length ? current : next;
        });
        setPinnedTagIds((current) =>
        {
            const next = current.filter((tagId) => availableTagIds.has(tagId));
            return next.length === current.length ? current : next;
        });
        setSelectedTagId((current) => current !== null && availableTagIds.has(current) ? current : null);
    }, [data.bundle.companies, data.bundle.notes, data.bundle.universities]);

    useEffect(() =>
    {
        if (!createTagMode)
        {
            return undefined;
        }

        const handleEscape = (event: KeyboardEvent): void =>
        {
            if (event.key === 'Escape')
            {
                setCreateTagMode(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [createTagMode]);

    /**
     * Closes the active responsive panel and clears its transient draft state.
     * Used by panel close, cancel, and successful-save actions.
     */
    function closePanel(): boolean
    {
        const hasUnsavedDraft = tagEditor.draft !== null || overlayDraft !== null;

        if (hasUnsavedDraft && !window.confirm('Discard unsaved changes?'))
        {
            return false;
        }

        tagEditor.cancel();
        setOverlayDraft(null);
        setOverlayErrors({});
        setSelectedCountryCode(null);
        setCountryActionCoordinates(null);
        setActivePanel(null);
        return true;
    }

    /**
     * Opens one root tool and clears mutually exclusive map selection workflows.
     * Used by the desktop rail, mobile menu, and settings header button.
     */
    function openTool(panelId: ToolPanelId): void
    {
        const hasUnsavedDraft = tagEditor.draft !== null || overlayDraft !== null;

        if (hasUnsavedDraft && !window.confirm('Discard unsaved changes and open another tool?'))
        {
            return;
        }

        tagEditor.cancel();
        setOverlayDraft(null);
        setOverlayErrors({});
        setSelectedTagId(null);
        setSelectedCountryCode(null);
        setCountryActionCoordinates(null);
        setCreateTagMode(false);
        setActivePanel(panelId);
    }

    /**
     * Toggles explicit map placement and clears mutually exclusive country state.
     * Used by the map toolbar to prevent accidental background-click creation.
     */
    function toggleCreateTagMode(): void
    {
        const nextCreateTagMode = !createTagMode;

        if (nextCreateTagMode)
        {
            tagEditor.cancel();
            setSelectedTagId(null);
            setSelectedCountryCode(null);
            setCountryActionCoordinates(null);
            setOverlayDraft(null);
            setOverlayErrors({});
            setActivePanel(null);
        }

        setCreateTagMode(nextCreateTagMode);
    }

    /**
     * Begins type selection at a free coordinate unless country mode or editing is active.
     * Used by the map's single click-to-create callback.
     */
    async function handleMapClick(coordinates: Coordinates): Promise<void>
    {
        if (
            dataIsBusy
            || !createTagMode
            || activePanel === 'countries'
            || activePanel === 'country-editor'
            || tagEditor.draft !== null
        )
        {
            return;
        }

        await beginTagCreation(coordinates, interactionConfig.createTagMode.exitAfterPlacement);
    }

    /**
     * Begins an explicit search-driven creation without requiring map placement mode.
     * Used by Tag Workspace after the user presses its dedicated Create button.
     */
    async function handleLocationTagCreation(coordinates: Coordinates): Promise<void>
    {
        if (dataIsBusy || tagEditor.draft !== null)
        {
            return;
        }

        await beginTagCreation(coordinates, false);
    }

    /**
     * Clears stale entity selection and starts one reverse-geocoded creation workflow.
     * Used by map placement and search-driven creation through one synchronized path.
     */
    async function beginTagCreation(coordinates: Coordinates, exitCreateMode: boolean): Promise<void>
    {
        setSelectedTagId(null);
        setSelectedCountryCode(null);
        setCountryActionCoordinates(null);
        setOverlayDraft(null);
        setOverlayErrors({});
        tagEditor.requestCreation(coordinates);
        setActivePanel('tag-type');

        if (exitCreateMode)
        {
            setCreateTagMode(false);
        }

        geocodingRequest.current?.abort();
        const request = new AbortController();
        geocodingRequest.current = request;
        const detectedLocation = await geocodingService.reverse(coordinates, request.signal);

        if (detectedLocation !== null && !request.signal.aborted)
        {
            tagEditor.applyDetectedLocation(detectedLocation);
        }
    }

    /**
     * Creates the chosen concrete draft after map coordinate selection.
     * Used by the type chooser.
     */
    function handleTagTypeSelection(type: TagType): void
    {
        if (dataIsBusy)
        {
            return;
        }

        tagEditor.chooseType(type);
        setActivePanel('tag-editor');
    }

    /**
     * Validates, scores, and persists the active controlled tag draft.
     * Used by either tag form submission.
     */
    async function handleTagSubmit(): Promise<void>
    {
        if (dataIsBusy)
        {
            return;
        }

        try
        {
            const savedTag = await tagEditor.submit();

            if (savedTag !== null)
            {
                setSelectedTagId(savedTag.id);
                setActivePanel(null);
                setStatusMessage(`${savedTag.name} was saved to your local working copy.`);
            }
        }
        catch
        {
            // The data hook exposes a safe live error message.
        }
    }

    /**
     * Opens a stored tag in its concrete editor form.
     * Used by the details popup edit action.
     */
    function handleTagEdit(tagId: string): void
    {
        if (dataIsBusy)
        {
            return;
        }

        const tag = findTag(data.bundle.universities, data.bundle.companies, tagId, data.bundle.notes ?? []);

        if (tag !== undefined)
        {
            tagEditor.edit(tag);
            setSelectedTagId(null);
            setOpenTagIds((current) => current.filter((openTagId) => openTagId !== tagId));
            setActivePanel('tag-editor');
        }
    }

    /**
     * Confirms and deletes one selected university or company.
     * Used by the details popup destructive action.
     */
    async function handleTagDelete(tagId: string): Promise<void>
    {
        if (dataIsBusy)
        {
            return;
        }

        const tag = findTag(data.bundle.universities, data.bundle.companies, tagId, data.bundle.notes ?? []);

        if (tag === undefined || !window.confirm(`Delete ${tag.name}? This cannot be undone.`))
        {
            return;
        }

        try
        {
            await data.deleteTag(tag);
            setSelectedTagId((current) => current === tag.id ? null : current);
            setOpenTagIds((current) => current.filter((tagId) => tagId !== tag.id));
            setPinnedTagIds((current) => current.filter((tagId) => tagId !== tag.id));

            if (tagEditor.draft?.id === tag.id)
            {
                tagEditor.cancel();
                setActivePanel(null);
            }
            setStatusMessage(`${tag.name} was deleted.`);
        }
        catch
        {
            // The data hook exposes a safe live error message.
        }
    }

    /**
     * Persists normalized coordinates after a marker drag ends.
     * Used by the map interaction manager's final move callback.
     */
    async function handleTagMove(tagId: string, coordinates: Coordinates): Promise<boolean>
    {
        if (
            dataIsBusy
            || activePanel === 'tag-type'
            || activePanel === 'tag-editor'
            || activePanel === 'country-editor'
        )
        {
            return false;
        }

        const tag = findTag(data.bundle.universities, data.bundle.companies, tagId, data.bundle.notes ?? []);

        if (tag === undefined)
        {
            return false;
        }

        try
        {
            await data.saveTag(moveTag(tag, coordinates));
            setStatusMessage(`${tag.name} location updated.`);
            return true;
        }
        catch
        {
            // The data hook exposes a safe live error message.
            return false;
        }
    }

    /**
     * Shows details for one clicked marker and closes overlapping panels.
     * Used by the map tag click callback.
     */
    function handleTagSelection(tag: MapTag): void
    {
        if (
            dataIsBusy
            || activePanel === 'tag-type'
            || activePanel === 'tag-editor'
            || activePanel === 'country-editor'
        )
        {
            return;
        }

        setSelectedTagId(tag.id);
        setSelectedCountryCode(null);
        setCountryActionCoordinates(null);
        setOverlayDraft(null);
        setOpenTagIds((current) => current.includes(tag.id) ? current : [...current, tag.id]);
        setActivePanel(null);
    }

    /**
     * Opens an existing or new overlay draft for a clicked country boundary.
     * Used while explicit country-selection mode is active.
     */
    function handleCountrySelection(selection: CountrySelection): void
    {
        if (dataIsBusy)
        {
            return;
        }

        setCreateTagMode(false);
        setSelectedTagId(null);

        const highlightEditMode = activePanel === 'countries' || activePanel === 'country-editor';

        if (highlightEditMode && selectedCountryCode === selection.countryCode && selection.coordinates !== undefined)
        {
            setCountryActionCoordinates(selection.coordinates);
            return;
        }

        const existingOverlay = data.bundle.countryOverlays.find(
            (overlay) => overlay.countryCode === selection.countryCode,
        );

        if (!highlightEditMode)
        {
            if (
                interactionConfig.countrySelection.closeOnRepeatedBrowseClick
                && selectedCountryCode === selection.countryCode
                && activePanel === 'country-info'
            )
            {
                setSelectedCountryCode(null);
                setCountryActionCoordinates(null);
                setActivePanel(null);
                return;
            }

            if (existingOverlay !== undefined)
            {
                setSelectedCountryCode(selection.countryCode);
                setCountryActionCoordinates(null);
                setOverlayDraft(null);
                setOverlayErrors({});
                setActivePanel('country-info');
            }

            return;
        }

        setSelectedCountryCode(selection.countryCode);
        setOverlayDraft(existingOverlay ?? createCountryOverlay(selection.countryCode, selection.countryName));
        setOverlayErrors({});
        setActivePanel('country-editor');
    }

    function handleCountryTagCreation(type: TagType, coordinates: Coordinates): void
    {
        setSelectedTagId(null);
        setSelectedCountryCode(null);
        setCreateTagMode(false);
        tagEditor.createAt(type, coordinates);
        setCountryActionCoordinates(null);
        setActivePanel('tag-editor');
    }

    /**
     * Validates and persists the active country color and opacity settings.
     * Used by the country overlay editor submission.
     */
    async function handleOverlaySave(): Promise<void>
    {
        if (dataIsBusy || overlayDraft === null)
        {
            return;
        }

        const validation = validateCountryOverlay(overlayDraft);

        if (!validation.success)
        {
            setOverlayErrors(validation.errors);
            return;
        }

        try
        {
            await data.saveCountryOverlay(validation.overlay);
            setSelectedCountryCode(validation.overlay.countryCode);
            setOverlayDraft(null);
            setOverlayErrors({});
            setActivePanel('countries');
            setStatusMessage(`${validation.overlay.countryName} highlight saved.`);
        }
        catch
        {
            // The data hook exposes a safe live error message.
        }
    }

    /**
     * Confirms and deletes a persisted country highlight.
     * Used by the overlay editor for existing records.
     */
    async function handleOverlayDelete(overlayId: string): Promise<void>
    {
        if (dataIsBusy)
        {
            return;
        }

        const overlay = data.bundle.countryOverlays.find((item) => item.id === overlayId);

        if (overlay === undefined || !window.confirm(`Delete the ${overlay.countryName} highlight?`))
        {
            return;
        }

        try
        {
            await data.deleteCountryOverlay(overlayId);
            setOverlayDraft(null);
            setSelectedCountryCode(null);
            setActivePanel('countries');
            setStatusMessage(`${overlay.countryName} highlight deleted.`);
        }
        catch
        {
            // The data hook exposes a safe live error message.
        }
    }

    /**
     * Opens one persisted highlight from the searchable country list.
     * Used by country overlay list selection.
     */
    function handleOverlayListSelect(overlayId: string): void
    {
        if (dataIsBusy)
        {
            return;
        }

        const overlay = data.bundle.countryOverlays.find((item) => item.id === overlayId);

        if (overlay !== undefined)
        {
            setSelectedCountryCode(overlay.countryCode);

            setOverlayDraft(overlay);
            setActivePanel('country-editor');
        }
    }

    /**
     * Persists a country highlight visibility toggle immediately.
     * Used by the country overlay list without opening the full editor.
     */
    async function handleOverlayVisibilityChange(overlayId: string, isVisible: boolean): Promise<void>
    {
        if (dataIsBusy)
        {
            return;
        }

        const overlay = data.bundle.countryOverlays.find((item) => item.id === overlayId);

        if (overlay === undefined)
        {
            return;
        }

        try
        {
            await data.saveCountryOverlay({
                ...overlay,
                isVisible,
                updatedAt: new Date().toISOString(),
            });
        }
        catch
        {
            // The data hook exposes a safe live error message.
        }
    }

    /**
     * Returns from country editing to active boundary-selection mode.
     * Used by the overlay editor cancel action.
     */
    function handleOverlayCancel(): void
    {
        if (overlayDraft !== null && !window.confirm('Discard changes to this country highlight?'))
        {
            return;
        }

        setOverlayDraft(null);
        setOverlayErrors({});
        setActivePanel('countries');
    }

    /**
     * Reads and imports one validated user-selected JSON file.
     * Used by data management merge and replace actions.
     */
    async function handleImport(file: File, mode: ImportMode): Promise<void>
    {
        if (dataIsBusy)
        {
            return;
        }

        const confirmation = mode === 'replace'
            ? 'Import and replace your entire local working copy? The shared base is not changed by importing.'
            : 'Import and merge this file into your local working copy? The shared base is not changed by importing.';

        if (!window.confirm(confirmation))
        {
            return;
        }

        try
        {
            const json = await readImportFile(file);
            await data.importJson(json, mode);
            tagEditor.cancel();
            setSelectedTagId(null);
            setSelectedCountryCode(null);
            setStatusMessage(`${file.name} was validated and imported into your local working copy in ${mode} mode.`);
        }
        catch (error)
        {
            const isSizeError = error instanceof Error
                && error.message.startsWith('The import exceeds');

            setStatusMessage(isSizeError
                ? `Import failed. ${error.message}`
                : 'Import failed. Choose a readable JSON backup that matches the application schema.');
        }
    }

    /**
     * Downloads a schema-valid scoped JSON backup without server transfer.
     * Used by data management export actions.
     */
    function handleExport(scope: ExportScope): void
    {
        const exportedAt = exportBundleFile(data.bundle, scope);
        setLastExportedAt(exportedAt);
        setStatusMessage(`${scope} data exported.`);
    }

    /**
     * Closes the floating tag details card.
     * Used by the popup dismiss action.
     */
    function closeTagDetails(tagId: string): void
    {
        setOpenTagIds((current) => current.filter((openTagId) => openTagId !== tagId));
        setSelectedTagId((current) => current === tagId && !pinnedTagIds.includes(tagId) ? null : current);
    }

    /**
     * Toggles whether closing a detail window preserves its active map selection.
     * Used by floating-window pin controls and cleared whenever the record is deleted.
     */
    function toggleTagPinned(tagId: string): void
    {
        setPinnedTagIds((current) => current.includes(tagId)
            ? current.filter((pinnedTagId) => pinnedTagId !== tagId)
            : [...current, tagId]);
    }

    return {
        activePanel,
        createTagMode,
        countryActionCoordinates,
        dismissCountryActions: () => setCountryActionCoordinates(null),
        closePanel,
        closeTagDetails,
        handleCountrySelection,
        handleCountryTagCreation,
        handleExport,
        handleImport,
        handleLocationTagCreation,
        handleMapClick,
        handleOverlayCancel,
        handleOverlayDelete,
        handleOverlayListSelect,
        handleOverlaySave,
        handleOverlayVisibilityChange,
        handleTagDelete,
        handleTagEdit,
        handleTagMove,
        handleTagSelection,
        handleTagSubmit,
        handleTagTypeSelection,
        lastExportedAt,
        openTool,
        overlayDraft,
        overlayErrors,
        openTagIds,
        pinnedTagIds,
        selectedCountryCode,
        selectedTagId,
        setOverlayDraft,
        setSelectedTagId,
        setStatusMessage,
        statusMessage,
        tagEditor,
        toggleCreateTagMode,
        toggleTagPinned,
    };
}
