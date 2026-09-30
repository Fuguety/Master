import { act, renderHook } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApplicationController } from "../application/useApplicationController";
import type { UseAtlasDataResult } from "../application/useAtlasData";
import countryRecords from "../data/countries.json";
import { exampleCountryOverlays } from "../data";
import { CountryOverlayManager } from "../map/CountryOverlayManager";
import { COUNTRY_HIT_LAYER_ID, COUNTRY_HOVER_FILL_LAYER_ID } from "../map/layerIds";
import { getCountryInformation } from "../services";
import { createCompanyFixture } from "./domainFixtures";

const company = createCompanyFixture({ country: "Germany", countryCode: "DEU" });

/**
 * Creates a controlled in-memory data boundary for controller regression tests.
 * Used to inspect selection transitions without mounting the complete WebGL application.
 */
function createControllerData(): UseAtlasDataResult
{
    return {
        bundle: {
            companies: [company],
            countryOverlays: exampleCountryOverlays,
            exportedAt: "2026-08-05T00:00:00.000Z",
            notes: [],
            universities: [],
            version: 2,
        },
        clearAll: vi.fn(),
        deleteCountryOverlay: vi.fn(),
        deleteTag: vi.fn(),
        error: null,
        exportJson: vi.fn(),
        hasPublishedThisSession: false,
        importJson: vi.fn(),
        isDirty: false,
        isSharedConfigured: true,
        lastSavedAt: null,
        message: null,
        refetch: vi.fn(),
        saveCountryOverlay: vi.fn(),
        saveSharedDataset: vi.fn(),
        saveTag: vi.fn(),
        status: "ready",
    };
}



/**
 * Replays controller state transitions under React's strict development checks.
 * Used by creation regressions to expose impure updater functions.
 */
function StrictModeWrapper({ children }: { children: ReactNode })
{
    return <StrictMode>{children}</StrictMode>;
}

afterEach(() =>
{
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

beforeEach(() =>
{
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: () => Promise.resolve([]), ok: true }));
});

describe("synchronized tag selection", () =>
{
    it("allows every visitor to create tags in a local working copy", async () =>
    {
        const { result } = renderHook(() => useApplicationController(createControllerData()));

        act(() => result.current.toggleCreateTagMode());
        expect(result.current.createTagMode).toBe(true);

        await act(() => result.current.handleLocationTagCreation({ longitude: 12, latitude: 51 }));
        expect(result.current.activePanel).toBe("tag-type");

        act(() => result.current.handleCountryTagCreation("university", { longitude: 12, latitude: 51 }));

        expect(result.current.tagEditor.draft?.type).toBe("university");
        expect(result.current.activePanel).toBe("tag-editor");
    });

    it("enables creation through a pure Strict Mode-safe state transition", () =>
    {
        const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const { result } = renderHook(
            () => useApplicationController(createControllerData()),
            { wrapper: StrictModeWrapper },
        );

        act(() => result.current.handleTagSelection(company));
        act(() => result.current.toggleCreateTagMode());

        expect(result.current.createTagMode).toBe(true);
        expect(result.current.selectedTagId).toBeNull();
        expect(consoleError).not.toHaveBeenCalled();
    });

    it("clears the old entity before map creation and exits placement mode", async () =>
    {
        const { result } = renderHook(() => useApplicationController(createControllerData()));

        act(() => result.current.handleTagSelection(company));
        expect(result.current.selectedTagId).toBe(company.id);
        act(() => result.current.toggleCreateTagMode());
        expect(result.current.selectedTagId).toBeNull();

        await act(() => result.current.handleMapClick({ longitude: 12, latitude: 51 }));
        expect(result.current.activePanel).toBe("tag-type");
        expect(result.current.selectedTagId).toBeNull();
        expect(result.current.createTagMode).toBe(false);
    });

    it("ignores background clicks until Create Tag Mode is enabled", async () =>
    {
        const { result } = renderHook(() => useApplicationController(createControllerData()));

        await act(() => result.current.handleMapClick({ longitude: 12, latitude: 51 }));
        expect(result.current.activePanel).toBeNull();
        expect(result.current.tagEditor.pendingCoordinates).toBeNull();
    });

    it("exits Create Tag Mode when Escape is pressed", () =>
    {
        const { result } = renderHook(() => useApplicationController(createControllerData()));

        act(() => result.current.toggleCreateTagMode());
        expect(result.current.createTagMode).toBe(true);
        act(() =>
        {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        });
        expect(result.current.createTagMode).toBe(false);
    });

    it("cancels an active draft without restoring the previous selection", async () =>
    {
        const { result } = renderHook(() => useApplicationController(createControllerData()));

        act(() => result.current.handleTagSelection(company));
        act(() => result.current.toggleCreateTagMode());
        await act(() => result.current.handleMapClick({ longitude: -170, latitude: 20 }));
        expect(result.current.tagEditor.pendingCoordinates).toEqual({ longitude: -170, latitude: 20 });

        act(() =>
        {
            result.current.closePanel();
        });
        expect(result.current.tagEditor.pendingCoordinates).toBeNull();
        expect(result.current.selectedTagId).toBeNull();
    });

    it("validates and saves a newly created company without collapsing application state", async () =>
    {
        const data = createControllerData();
        const { result } = renderHook(() => useApplicationController(data));

        act(() => result.current.toggleCreateTagMode());
        await act(() => result.current.handleMapClick({ longitude: 190, latitude: 51 }));
        act(() => result.current.handleTagTypeSelection("company"));

        const draft = result.current.tagEditor.draft;
        expect(draft?.type).toBe("company");

        if (draft?.type !== "company")
        {
            throw new Error("Expected a company draft.");
        }

        act(() => result.current.tagEditor.setDraft({
            ...draft,
            name: "New Company",
            city: "Berlin",
            country: "Germany",
            countryCode: "DEU",
        }));
        await act(() => result.current.handleTagSubmit());

        expect(data.saveTag).toHaveBeenCalledOnce();
        expect(result.current.tagEditor.draft).toBeNull();
        expect(result.current.activePanel).toBeNull();
        expect(result.current.selectedTagId).toBe(draft.id);
        expect(result.current.statusMessage).toBe("New Company was saved to your local working copy.");
    });

    it("clears deleted references and preserves closed selection only when pinned", async () =>
    {
        const data = createControllerData();
        const { result } = renderHook(() => useApplicationController(data));

        act(() => result.current.handleTagSelection(company));
        act(() => result.current.closeTagDetails(company.id));
        expect(result.current.selectedTagId).toBeNull();

        act(() => result.current.handleTagSelection(company));
        act(() => result.current.toggleTagPinned(company.id));
        act(() => result.current.closeTagDetails(company.id));
        expect(result.current.selectedTagId).toBe(company.id);

        await act(() => result.current.handleTagDelete(company.id));
        expect(result.current.selectedTagId).toBeNull();
        expect(result.current.openTagIds).not.toContain(company.id);
        expect(result.current.pinnedTagIds).not.toContain(company.id);
    });
});

describe("highlighted-country browsing", () =>
{
    it("opens information directly and toggles the same highlighted country closed", () =>
    {
        const overlay = exampleCountryOverlays[0]!;
        const selection = { countryCode: overlay.countryCode, countryName: overlay.countryName };
        const { result } = renderHook(() => useApplicationController(createControllerData()));

        act(() => result.current.handleCountrySelection(selection));
        expect(result.current.activePanel).toBe("country-info");
        expect(result.current.overlayDraft).toBeNull();

        act(() => result.current.handleCountrySelection(selection));
        expect(result.current.activePanel).toBeNull();
        expect(result.current.selectedCountryCode).toBeNull();
    });

    it("restricts browse hit targets and hover emphasis to visible overlays", () =>
    {
        const setFilter = vi.fn();
        const setLayoutProperty = vi.fn();
        const map = {
            getLayer: vi.fn().mockReturnValue({}),
            setFilter,
            setLayoutProperty,
            setPaintProperty: vi.fn(),
        } as unknown as MapLibreMap;
        const manager = new CountryOverlayManager(map);

        manager.setOverlays(exampleCountryOverlays);
        manager.setHighlightInteractionEnabled(true);
        manager.setHoveredCountryCode(exampleCountryOverlays[0]!.countryCode);

        expect(setLayoutProperty).toHaveBeenCalledWith(COUNTRY_HIT_LAYER_ID, "visibility", "visible");
        expect(setFilter).toHaveBeenCalledWith(
            COUNTRY_HOVER_FILL_LAYER_ID,
            expect.arrayContaining(["=="]),
        );

        setLayoutProperty.mockClear();
        manager.setSelectedCountryCode(exampleCountryOverlays[0]!.countryCode);
        expect(setLayoutProperty).not.toHaveBeenCalled();
    });
});

describe("bundled sovereign-country facts", () =>
{
    it("contains all 196 sovereign records with maintainable source metadata", () =>
    {
        expect(countryRecords).toHaveLength(196);
        expect(new Set(countryRecords.map((country) => country.iso3)).size).toBe(196);
        expect(countryRecords.every((country) => country.dataSource.startsWith("Bundled Atlas Dataset"))).toBe(true);
        expect(countryRecords.every((country) => country.lastUpdated.length === 10)).toBe(true);
    });

    it("loads population, currency symbols, NATO state, and available wage data locally", () =>
    {
        const brazil = countryRecords.find((country) => country.iso3 === "BRA");
        const germany = getCountryInformation("DEU");

        expect(brazil?.population).toBeGreaterThan(200_000_000);
        expect(brazil?.currency?.symbol).toBe("R$");
        expect(brazil?.minimumMonthlyWage).toEqual({ value: 1518, currency: "BRL" });
        expect(germany?.natoMember).toBe(true);
        expect(germany?.population).toBeGreaterThan(80_000_000);
    });
});
