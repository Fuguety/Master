import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AppHeader,
    FloatingWindowManager,
    ToolRail,
    type ToolRailItem,
} from '@/components';
import {
    calculateTagRating,
    countCompanyFilters,
    countUniversityFilters,
    createFilterOptions,
    useAtlasData,
    useApplicationController,
} from '@/application';
import {
    createEmptyCompanyFilters,
    createEmptyUniversityFilters,
    filterCompanies,
    filterUniversities,
} from '@/filters';
import { WorldMap, type MapCameraTarget, type MapStyleId } from '@/map';
import { createCameraTarget } from '@/map/cameraIntent';
import { ThemeProvider, useTheme } from '@/themes';
import type {
    CompanyFilters,
    Coordinates,
    GeographicNameMode,
    MapTag,
    TagType,
    UniversityFilters,
} from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useStoredPreference } from '@/hooks/useStoredPreference';
import type { NavigationItem } from '@/application/components/NavigationPanel';
import { ApplicationPanelContent } from '@/application/components/ApplicationPanelContent';
import { scheduleCameraAfterCardRender } from '@/services';
import { ResponsivePanel } from '@/application/components/ResponsivePanel';
import { TagDetailsOverlay } from '@/application/components/TagDetailsOverlay';
import {
    findTag,
    getHeaderSaveStatus,
    isBoolean,
    isGeographicNameMode,
    isMapStyle,
    isPanelWidth,
    isTagTypeList,
    PANEL_METADATA,
    TOOL_DEFINITIONS,
    type ToolDefinition,
    type ToolPanelId,
} from '@/application/appConfig';
import styles from './App.module.css';



/**
 * Composes the complete interactive world-map workspace below ThemeProvider.
 * Used once by App and coordinates map, UI, scoring, filtering, and persistence modules.
 * Keeps presentation components controlled by one typed application boundary.
 */
function AtlasApplication()
{
    const data = useAtlasData();
    const {
        activePanel,
        closePanel,
        closeTagDetails,
        createTagMode,
        countryActionCoordinates,
        dismissCountryActions,
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
    } = useApplicationController(data);
    const { theme, themes, setTheme } = useTheme();
    const isMobile = useMediaQuery('(max-width: 48rem)');
    const [mapStyle, setMapStyle] = useStoredPreference<MapStyleId>(
        'atlas-notebook-map-style',
        'cartographic',
        isMapStyle,
    );
    const [clusteringEnabled, setClusteringEnabled] = useStoredPreference<boolean>(
        'atlas-notebook-clustering',
        true,
        isBoolean,
    );
    const [visibleTypes, setVisibleTypes] = useStoredPreference<TagType[]>(
        'atlas-notebook-visible-types',
        ['university', 'company', 'note'],
        isTagTypeList,
    );
    const [panelWidth, setPanelWidth] = useStoredPreference<number>(
        'atlas-notebook-panel-width',
        432,
        isPanelWidth,
    );
    const [geographicNameMode, setGeographicNameMode] = useStoredPreference<GeographicNameMode>(
        'atlas-notebook-geographic-name-mode',
        'english',
        isGeographicNameMode,
    );
    const [cameraTarget, setCameraTarget] = useState<MapCameraTarget | null>(null);
    const cameraRequestId = useRef(0);
    const [detailInsetRight, setDetailInsetRight] = useState(0);
    const [quickCreatePreview, setQuickCreatePreview] = useState<Coordinates | null>(null);
    const [universityFilters, setUniversityFilters] = useState<UniversityFilters>(createEmptyUniversityFilters);
    const [companyFilters, setCompanyFilters] = useState<CompanyFilters>(createEmptyCompanyFilters);
    const locale = typeof navigator === 'undefined' ? 'en' : navigator.language;
    const isBusy = data.status === 'loading' || data.status === 'saving';
    const universityFilterCount = countUniversityFilters(universityFilters);
    const companyFilterCount = countCompanyFilters(companyFilters);

    const requestCamera = useCallback((coordinates: Coordinates, intent: MapCameraTarget['intent']): void =>
    {
        cameraRequestId.current += 1;
        setCameraTarget(createCameraTarget(coordinates, intent, cameraRequestId.current));
    }, []);

    const cancelCamera = useCallback((): void =>
    {
        cameraRequestId.current += 1;
        setCameraTarget(null);
    }, []);

    const visibleUniversities = useMemo(() =>
    {
        return visibleTypes.includes('university')
            ? filterUniversities(data.bundle.universities, universityFilters)
            : [];
    }, [data.bundle.universities, universityFilters, visibleTypes]);

    const visibleCompanies = useMemo(() =>
    {
        return visibleTypes.includes('company')
            ? filterCompanies(data.bundle.companies, companyFilters)
            : [];
    }, [companyFilters, data.bundle.companies, visibleTypes]);
    const visibleNotes = useMemo(
        () => visibleTypes.includes('note') ? data.bundle.notes ?? [] : [],
        [data.bundle.notes, visibleTypes],
    );

    const visibleTags = useMemo<MapTag[]>(
        () => [...visibleUniversities, ...visibleCompanies, ...visibleNotes],
        [visibleCompanies, visibleNotes, visibleUniversities],
    );
    const allTags = useMemo<MapTag[]>(
        () => [...data.bundle.universities, ...data.bundle.companies, ...(data.bundle.notes ?? [])],
        [data.bundle.companies, data.bundle.notes, data.bundle.universities],
    );
    const mapTags = useMemo<MapTag[]>(() =>
    {
        const draft = tagEditor.draft;

        return draft === null
            ? visibleTags
            : [...visibleTags.filter((tag) => tag.id !== draft.id), draft];
    }, [tagEditor.draft, visibleTags]);
    const openTags = openTagIds
        .map((tagId) => findTag(data.bundle.universities, data.bundle.companies, tagId, data.bundle.notes ?? []))
        .filter((tag): tag is MapTag => tag !== undefined);
    const selectedTag = selectedTagId === null
        ? undefined
        : findTag(data.bundle.universities, data.bundle.companies, selectedTagId, data.bundle.notes ?? []);
    const countryOptions = useMemo(
        () => createFilterOptions([
            ...data.bundle.universities.map((tag) => tag.country),
            ...data.bundle.companies.map((tag) => tag.country),
        ], locale),
        [data.bundle.companies, data.bundle.universities, locale],
    );
    const universityCityOptions = useMemo(
        () => createFilterOptions(data.bundle.universities.map((tag) => tag.city), locale),
        [data.bundle.universities, locale],
    );
    const companyCityOptions = useMemo(
        () => createFilterOptions(data.bundle.companies.map((tag) => tag.city), locale),
        [data.bundle.companies, locale],
    );
    const industryOptions = useMemo(
        () => createFilterOptions(data.bundle.companies.map((tag) => tag.industry), locale),
        [data.bundle.companies, locale],
    );
    const areaOptions = useMemo(
        () => createFilterOptions(data.bundle.companies.map((tag) => tag.companyArea), locale),
        [data.bundle.companies, locale],
    );
    const toolBadges: Partial<Record<ToolDefinition['id'], number>> = {
        visibility: Math.max(0, 2 - visibleTypes.length),
        'university-filters': universityFilterCount,
        'company-filters': companyFilterCount,
        countries: data.bundle.countryOverlays.length,
    };
    const toolItems: ToolRailItem[] = [{
        id: 'create-tag',
        label: 'Create Tag',
        icon: <span aria-hidden="true">+</span>,
    }, ...TOOL_DEFINITIONS.map((definition) => ({
        id: definition.id,
        label: definition.label,
        icon: <span aria-hidden="true">{definition.icon}</span>,
        badge: toolBadges[definition.id],
    }))];
    const navigationItems: NavigationItem[] = [
        ...TOOL_DEFINITIONS.map((definition) => ({
            id: definition.id,
            label: definition.label,
            icon: definition.icon,
            description: definition.description,
            badge: toolBadges[definition.id],
        })),
        { id: 'settings', label: 'Settings', icon: '⚙', description: 'Theme and map presentation' },
    ];

    useEffect(() =>
    {
        if (statusMessage === null)
        {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => setStatusMessage(null), 5_000);

        return () => window.clearTimeout(timeoutId);
    }, [setStatusMessage, statusMessage]);

    useEffect(() =>
    {
        if (selectedTag === undefined)
        {
            return undefined;
        }

        return scheduleCameraAfterCardRender(
            selectedTag.coordinates,
            (coordinates) => requestCamera(coordinates, 'detail'),
        );
    }, [requestCamera, selectedTag]);

    const handlePanelClose = (): void =>
    {
        if (closePanel())
        {
            setQuickCreatePreview(null);
            cancelCamera();
        }
    };

    const panelContent = activePanel === null ? null : (
        <ApplicationPanelContent
            activePanel={activePanel}
            areaOptions={areaOptions}
            busy={isBusy}
            clusteringEnabled={clusteringEnabled}
            companyCityOptions={companyCityOptions}
            companyCount={data.bundle.companies.length}
            noteCount={data.bundle.notes?.length ?? 0}
            companyFilterCount={companyFilterCount}
            companyFilters={companyFilters}
            countryOptions={countryOptions}
            countryActionCoordinates={countryActionCoordinates}
            dataStatusMessage={data.error ?? statusMessage ?? undefined}
            industryOptions={industryOptions}
            geographicNameMode={geographicNameMode}
            lastExportedAt={lastExportedAt === undefined
                ? undefined
                : new Date(lastExportedAt).toLocaleString(locale)}
            locale={locale}
            mapStyle={mapStyle}
            navigationItems={navigationItems}
            onClusteringChange={setClusteringEnabled}
            onClose={handlePanelClose}
            onCompanyFiltersChange={setCompanyFilters}
            onCompanyFiltersReset={() => setCompanyFilters(createEmptyCompanyFilters())}
            onCountryCreate={(countryCode, countryName) => handleCountrySelection({ countryCode, countryName })}
            onCountryActionDismiss={dismissCountryActions}
            onCountryTagCreate={handleCountryTagCreation}
            onCreateTagAtCoordinates={(coordinates) => void handleLocationTagCreation(coordinates)}
            onExport={handleExport}
            onImport={(file, mode) => void handleImport(file, mode)}
            onMapStyleChange={setMapStyle}
            onGeographicNameModeChange={(mode) =>
            {
                window.localStorage.setItem('atlas-notebook-geographic-name-mode', mode);
                setGeographicNameMode(mode);
            }}
            onLocationResolved={(coordinates) => requestCamera(coordinates, 'draft')}
            onQuickCreatePreview={(coordinates) =>
            {
                setQuickCreatePreview(coordinates);

                if (coordinates === null)
                {
                    cancelCamera();
                }
                else
                {
                    requestCamera(coordinates, 'draft');
                }
            }}
            onNavigationSelect={openTool}
            onOverlayCancel={handleOverlayCancel}
            onOverlayChange={setOverlayDraft}
            onOverlayDelete={(overlayId) => void handleOverlayDelete(overlayId)}
            onOverlaySave={() => void handleOverlaySave()}
            onOverlaySelect={handleOverlayListSelect}
            onOverlayVisibilityChange={(overlayId, isVisible) =>
                void handleOverlayVisibilityChange(overlayId, isVisible)}
            onTagSubmit={() =>
            {
                setQuickCreatePreview(null);
                void handleTagSubmit();
            }}
            onTagSelect={handleTagSelection}
            onTagTypeSelect={(type) =>
            {
                setQuickCreatePreview(null);
                handleTagTypeSelection(type);
            }}
            onThemeChange={setTheme}
            onUniversityFiltersChange={setUniversityFilters}
            onUniversityFiltersReset={() => setUniversityFilters(createEmptyUniversityFilters())}
            onVisibleTypesChange={setVisibleTypes}
            overlayDraft={overlayDraft}
            overlayErrors={overlayErrors}
            overlayIsPersisted={overlayDraft !== null
                && data.bundle.countryOverlays.some((overlay) => overlay.id === overlayDraft.id)}
            overlays={data.bundle.countryOverlays}
            selectedCountryCode={selectedCountryCode}
            tagEditor={tagEditor}
            tags={allTags}
            theme={theme}
            themes={themes}
            universityCityOptions={universityCityOptions}
            universityCount={data.bundle.universities.length}
            universityFilterCount={universityFilterCount}
            universityFilters={universityFilters}
            visibleTypes={visibleTypes}
        />
    );

    const panelMetadata = activePanel === null ? null : PANEL_METADATA[activePanel];
    const controlInsets = useMemo(() => ({
        top: isMobile ? 56 : 64,
        right: isMobile ? 0 : detailInsetRight,
        bottom: isMobile ? 64 : 0,
        left: isMobile ? 0 : 68 + (activePanel === null ? 0 : panelWidth),
    }), [activePanel, detailInsetRight, isMobile, panelWidth]);

    return (
        <div className={styles.application}>
            <main className={styles.mapWorkspace} id="main-content">
                <WorldMap
                    cameraTarget={cameraTarget}
                    clusteringEnabled={clusteringEnabled}
                    controlInsets={controlInsets}
                    countryOverlays={data.bundle.countryOverlays}
                    createTagMode={createTagMode}
                    countrySelectionEnabled={activePanel === 'countries' || activePanel === 'country-editor'}
                    highlightedCountryInteractionEnabled={!createTagMode}
                    interactionDisabled={isBusy}
                    openTagIds={openTagIds}
                    previewCoordinates={quickCreatePreview}
                    onCountryClick={handleCountrySelection}
                    onError={(details) => setStatusMessage(`Map resource: ${details.message}`)}
                    onMapClick={(coordinates) =>
                    {
                        if (!createTagMode)
                        {
                            return;
                        }

                        setQuickCreatePreview(coordinates);
                        requestCamera(coordinates, 'draft');
                        void handleMapClick(coordinates);
                    }}
                    onStyleChange={setMapStyle}
                    onTagClick={handleTagSelection}
                    onTagMove={handleTagMove}
                    selectedCountryCode={selectedCountryCode}
                    selectedTagId={tagEditor.draft?.id ?? selectedTagId}
                    styleId={mapStyle}
                    tags={mapTags}
                />
            </main>

            <AppHeader
                companyCount={visibleCompanies.length}
                onOpenMenu={() => openTool('navigation')}
                onOpenSettings={() => openTool('settings')}
                saveStatus={getHeaderSaveStatus(data.status)}
                universityCount={visibleUniversities.length}
            />
            <ToolRail
                activeItemId={createTagMode ? 'create-tag' : activePanel}
                items={toolItems}
                onSelect={(itemId) =>
                {
                    if (itemId === 'create-tag')
                    {
                        setQuickCreatePreview(null);
                        cancelCamera();
                        toggleCreateTagMode();
                    }
                    else
                    {
                        openTool(itemId as ToolPanelId);
                    }
                }}
            />

            {activePanel !== null && panelContent !== null && panelMetadata !== null
                ? (
                    <ResponsivePanel
                        description={panelMetadata.description}
                        headingId={`atlas-${activePanel}-panel`}
                        onClose={handlePanelClose}
                        onWidthChange={setPanelWidth}
                        title={panelMetadata.title}
                        width={panelWidth}
                    >
                        {panelContent}
                    </ResponsivePanel>
                )
                : null}

            <FloatingWindowManager
                items={openTags.map((tag) => ({
                    id: tag.id,
                    title: tag.name,
                    locked: tag.type === 'note' && tag.locked,
                    pinned: pinnedTagIds.includes(tag.id),
                    onActivate: () => setSelectedTagId(tag.id),
                    content: (
                        <TagDetailsOverlay
                            busy={isBusy}
                            locale={locale}
                            onClose={() => closeTagDetails(tag.id)}
                            onDelete={(tagId) => void handleTagDelete(tagId)}
                            onEdit={handleTagEdit}
                            onToggleNoteLock={(note) => void data.saveTag({
                                ...note,
                                locked: !note.locked,
                                updatedAt: new Date().toISOString(),
                            })}
                            rating={calculateTagRating(tag)}
                            tag={tag}
                        />
                    ),
                }))}
                onClose={closeTagDetails}
                onObstructionChange={setDetailInsetRight}
                onPinChange={toggleTagPinned}
            />

            {data.status === 'loading' ? <p className={styles.loading}>Loading local research…</p> : null}
            {data.error !== null || statusMessage !== null
                ? (
                    <p
                        aria-live="polite"
                        className={styles.status}
                        data-error={data.error !== null}
                    >
                        {data.error ?? statusMessage}
                    </p>
                )
                : null}
        </div>
    );
}



/**
 * Provides presentation-only theme state around the complete Atlas application.
 * Used by the React entry point.
 * Returns the production full-screen interactive map application.
 */
export function App()
{
    return (
        <ThemeProvider>
            <AtlasApplication />
        </ThemeProvider>
    );
}
