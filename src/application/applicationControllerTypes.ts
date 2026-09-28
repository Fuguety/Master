import type { Dispatch, SetStateAction } from "react";
import type { ExportScope, ImportMode } from "../components";
import type { CountrySelection } from "../map";
import type { Coordinates, CountryOverlay, MapTag, TagType } from "../types";
import type { ActivePanelId, ToolPanelId } from "./appConfig";
import type { UseTagEditorResult } from "./useTagEditor";

/**
 * Defines the complete UI workflow boundary returned by the application controller.
 * Used by the root application shell and focused panel composition.
 */
export interface UseApplicationControllerResult
{
    activePanel: ActivePanelId;
    closePanel: () => boolean;
    closeTagDetails: (tagId: string) => void;
    createTagMode: boolean;
    countryActionCoordinates: Coordinates | null;
    dismissCountryActions: () => void;
    handleCountrySelection: (selection: CountrySelection) => void;
    handleCountryTagCreation: (type: TagType, coordinates: Coordinates) => void;
    handleExport: (scope: ExportScope) => void;
    handleImport: (file: File, mode: ImportMode) => Promise<void>;
    handleLocationTagCreation: (coordinates: Coordinates) => Promise<void>;
    handleMapClick: (coordinates: Coordinates) => Promise<void>;
    handleOverlayCancel: () => void;
    handleOverlayDelete: (overlayId: string) => Promise<void>;
    handleOverlayListSelect: (overlayId: string) => void;
    handleOverlaySave: () => Promise<void>;
    handleOverlayVisibilityChange: (overlayId: string, isVisible: boolean) => Promise<void>;
    handleTagDelete: (tagId: string) => Promise<void>;
    handleTagEdit: (tagId: string) => void;
    handleTagMove: (tagId: string, coordinates: Coordinates) => Promise<boolean>;
    handleTagSelection: (tag: MapTag) => void;
    handleTagSubmit: () => Promise<void>;
    handleTagTypeSelection: (type: TagType) => void;
    lastExportedAt: string | undefined;
    openTool: (panelId: ToolPanelId) => void;
    overlayDraft: CountryOverlay | null;
    overlayErrors: Record<string, string>;
    openTagIds: readonly string[];
    pinnedTagIds: readonly string[];
    selectedCountryCode: string | null;
    selectedTagId: string | null;
    setOverlayDraft: Dispatch<SetStateAction<CountryOverlay | null>>;
    setSelectedTagId: Dispatch<SetStateAction<string | null>>;
    setStatusMessage: Dispatch<SetStateAction<string | null>>;
    statusMessage: string | null;
    tagEditor: UseTagEditorResult;
    toggleCreateTagMode: () => void;
    toggleTagPinned: (tagId: string) => void;
}
