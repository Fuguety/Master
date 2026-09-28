import type { ReactNode } from 'react';
import {
    CompanyFilterPanel,
    CountryOverlayEditor,
    CountryInformationPanel,
    CountryActionMenu,
    CountryOverlayList,
    DataManagerPanel,
    SettingsPanel,
    TagBrowser,
    TagTypeChooser,
    TagVisibilityControl,
    UniversityFilterPanel,
    type ExportScope,
    type ImportMode,
} from '@/components';
import type { ActivePanelId, ToolPanelId } from '@/application/appConfig';
import type { FilterOption } from '@/application/filterViewModel';
import type { UseTagEditorResult } from '@/application/useTagEditor';
import type { NavigationItem } from './NavigationPanel';
import { NavigationPanel } from './NavigationPanel';
import { TagEditorPanel } from './TagEditorPanel';
import type { MapStyleId } from '@/map';
import type {
    CompanyFilters,
    Coordinates,
    CountryOverlay,
    GeographicNameMode,
    MapTag,
    TagType,
    ThemeDefinition,
    ThemeId,
    UniversityFilters,
} from '@/types';
import styles from './ApplicationPanelContent.module.css';

export interface ApplicationPanelContentProps
{
    activePanel: ActivePanelId;
    areaOptions: readonly FilterOption[];
    busy: boolean;
    clusteringEnabled: boolean;
    companyCount: number;
    companyFilterCount: number;
    companyFilters: CompanyFilters;
    companyCityOptions: readonly FilterOption[];
    countryOptions: readonly FilterOption[];
    countryActionCoordinates: Coordinates | null;
    dataStatusMessage?: string;
    industryOptions: readonly FilterOption[];
    geographicNameMode: GeographicNameMode;
    lastExportedAt?: string;
    locale: string;
    mapStyle: MapStyleId;
    navigationItems: readonly NavigationItem[];
    noteCount: number;
    onClusteringChange: (enabled: boolean) => void;
    onClose: () => void;
    onCompanyFiltersChange: (filters: CompanyFilters) => void;
    onCompanyFiltersReset: () => void;
    onCountryCreate: (countryCode: string, countryName: string) => void;
    onCountryActionDismiss: () => void;
    onCountryTagCreate: (type: TagType, coordinates: Coordinates) => void;
    onCreateTagAtCoordinates: (coordinates: Coordinates) => void;
    onExport: (scope: ExportScope) => void;
    onImport: (file: File, mode: ImportMode) => void;
    onMapStyleChange: (style: MapStyleId) => void;
    onGeographicNameModeChange: (mode: GeographicNameMode) => void;
    onLocationResolved: (coordinates: Coordinates) => void;
    onQuickCreatePreview: (coordinates: Coordinates | null) => void;
    onNavigationSelect: (panelId: ToolPanelId) => void;
    onOverlayCancel: () => void;
    onOverlayChange: (overlay: CountryOverlay) => void;
    onOverlayDelete: (overlayId: string) => void;
    onOverlaySave: () => void;
    onOverlaySelect: (overlayId: string) => void;
    onOverlayVisibilityChange: (overlayId: string, isVisible: boolean) => void;
    onTagSubmit: () => void;
    onTagSelect: (tag: MapTag) => void;
    onTagTypeSelect: (type: TagType) => void;
    onThemeChange: (theme: ThemeId) => void;
    onUniversityFiltersChange: (filters: UniversityFilters) => void;
    onUniversityFiltersReset: () => void;
    onVisibleTypesChange: (types: TagType[]) => void;
    overlayDraft: CountryOverlay | null;
    overlayErrors: Record<string, string>;
    overlayIsPersisted: boolean;
    overlays: readonly CountryOverlay[];
    selectedCountryCode: string | null;
    tagEditor: UseTagEditorResult;
    tags: readonly MapTag[];
    theme: ThemeId;
    themes: readonly ThemeDefinition[];
    universityCount: number;
    universityFilterCount: number;
    universityFilters: UniversityFilters;
    universityCityOptions: readonly FilterOption[];
    visibleTypes: readonly TagType[];
}



/**
 * Composes the focused contents for every responsive application panel.
 * Used by the root shell to keep tool-specific presentation out of state orchestration.
 * Returns one controlled feature surface or null when no panel is active.
 */
export function ApplicationPanelContent(props: ApplicationPanelContentProps): ReactNode
{
    switch (props.activePanel)
    {
        case 'navigation':
            return <NavigationPanel items={props.navigationItems} onSelect={(id) => props.onNavigationSelect(id as ToolPanelId)} />;
        case 'visibility':
            return (
                <div className={styles.tagWorkspace}>
                    <TagVisibilityControl
                        companyCount={props.companyCount}
                        disabled={props.busy}
                        noteCount={props.noteCount}
                        onChange={props.onVisibleTypesChange}
                        universityCount={props.universityCount}
                        value={props.visibleTypes}
                    />
                    <TagBrowser
                        disabled={props.busy}
                        locale={props.locale}
                        onCreate={props.onCreateTagAtCoordinates}
                        onLocationPreview={props.onQuickCreatePreview}
                        onSelect={props.onTagSelect}
                        tags={props.tags}
                    />
                </div>
            );
        case 'university-filters':
            return (
                <UniversityFilterPanel
                    activeCount={props.universityFilterCount}
                    cityOptions={props.universityCityOptions}
                    countryOptions={props.countryOptions}
                    disabled={props.busy}
                    onChange={props.onUniversityFiltersChange}
                    onReset={props.onUniversityFiltersReset}
                    value={props.universityFilters}
                />
            );
        case 'company-filters':
            return (
                <CompanyFilterPanel
                    activeCount={props.companyFilterCount}
                    areaOptions={props.areaOptions}
                    cityOptions={props.companyCityOptions}
                    countryOptions={props.countryOptions}
                    disabled={props.busy}
                    industryOptions={props.industryOptions}
                    onChange={props.onCompanyFiltersChange}
                    onReset={props.onCompanyFiltersReset}
                    value={props.companyFilters}
                />
            );
        case 'countries':
            return (
                <>
                    <p className={styles.countryHint}>Country selection is active. Click a land area on the map to create or edit its highlight.</p>
                    <CountryOverlayList
                        disabled={props.busy}
                        onCreate={props.onCountryCreate}
                        onSelect={props.onOverlaySelect}
                        onVisibilityChange={props.onOverlayVisibilityChange}
                        overlays={props.overlays}
                    />
                </>
            );
        case 'data':
            return (
                <DataManagerPanel
                    busy={props.busy}
                    lastExportedAt={props.lastExportedAt}
                    onExport={props.onExport}
                    onImport={props.onImport}
                    statusMessage={props.dataStatusMessage}
                />
            );
        case 'settings':
            return (
                <SettingsPanel
                    clusteringEnabled={props.clusteringEnabled}
                    geographicNameMode={props.geographicNameMode}
                    mapStyle={props.mapStyle}
                    onClusteringChange={props.onClusteringChange}
                    onMapStyleChange={props.onMapStyleChange}
                    onGeographicNameModeChange={props.onGeographicNameModeChange}
                    onThemeChange={props.onThemeChange}
                    theme={props.theme}
                    themes={props.themes}
                />
            );
        case 'tag-type':
            return props.tagEditor.pendingCoordinates === null ? null : (
                <TagTypeChooser
                    coordinates={props.tagEditor.pendingCoordinates}
                    locale={props.locale}
                    onCancel={props.onClose}
                    onSelect={props.onTagTypeSelect}
                />
            );
        case 'tag-editor':
            return props.tagEditor.draft === null ? null : (
                <TagEditorPanel
                    busy={props.busy}
                    errors={props.tagEditor.errors}
                    isNew={props.tagEditor.isNew}
                    onAddNote={props.tagEditor.addNote}
                    onAddSource={props.tagEditor.addSource}
                    onCancel={props.onClose}
                    onChange={props.tagEditor.setDraft}
                    onDeleteNote={props.tagEditor.deleteNote}
                    onDeleteSource={props.tagEditor.deleteSource}
                    onLocationResolved={props.onLocationResolved}
                    onSubmit={props.onTagSubmit}
                    onUpdateNote={props.tagEditor.updateNote}
                    onUpdateSource={props.tagEditor.updateSource}
                    rating={props.tagEditor.rating}
                    tag={props.tagEditor.draft}
                />
            );
        case 'country-editor':
            return props.overlayDraft === null ? null : (
                <>
                {props.countryActionCoordinates === null ? null : (
                    <CountryActionMenu
                        coordinates={props.countryActionCoordinates}
                        onCreate={props.onCountryTagCreate}
                        onDismiss={props.onCountryActionDismiss}
                    />
                )}
                <CountryInformationPanel
                    countryCode={props.overlayDraft.countryCode}
                    nameMode={props.geographicNameMode}
                    onTagSelect={props.onTagSelect}
                    tags={props.tags}
                />
                <CountryOverlayEditor
                    busy={props.busy}
                    errors={props.overlayErrors}
                    onCancel={props.onOverlayCancel}
                    onChange={props.onOverlayChange}
                    onDelete={props.overlayIsPersisted ? props.onOverlayDelete : undefined}
                    onSave={props.onOverlaySave}
                    value={props.overlayDraft}
                />
                </>
            );
        case 'country-info':
            return props.selectedCountryCode === null ? null : (
                <CountryInformationPanel
                    countryCode={props.selectedCountryCode}
                    nameMode={props.geographicNameMode}
                    onTagSelect={props.onTagSelect}
                    tags={props.tags}
                />
            );
        default:
            return null;
    }
}
