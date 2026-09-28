import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createNoteTag } from "../application/tagFactory";
import { CountryActionMenu } from "../components/CountryActionMenu/CountryActionMenu";
import { CountryInformationPanel } from "../components/CountryInformationPanel/CountryInformationPanel";
import { FilterSearch } from "../components/filters/FilterSearch/FilterSearch";
import { LocationSearch } from "../components/LocationSearch/LocationSearch";
import { exampleNotes } from "../data";
import { createLocationCameraOptions } from "../map/camera";
import { canDragMapTag } from "../map/noteMarker";
import {
    convertCurrency,
    formatGeographicName,
    queryCountryTags,
    scheduleCameraAfterCardRender,
} from "../services";
import { createDataAccess } from "../storage";
import { parseNoteTag } from "../validation";
import { createCompanyFixture, createUniversityFixture } from "./domainFixtures";

afterEach(() =>
{
    cleanup();
    vi.restoreAllMocks();
});

beforeEach(() =>
{
    window.localStorage.clear();
});

describe("workspace presentation and search", () =>
{
    it("keeps the Tag Workspace padded at desktop and mobile sizes", () =>
    {
        const css = readFileSync(join(process.cwd(), "src/application/components/ApplicationPanelContent.module.css"), "utf8");

        expect(css).toContain("padding: var(--space-5)");
        expect(css).toContain("overflow-x: hidden");
        expect(css).toContain("padding: var(--space-4)");
    });

    it("finds options, highlights text, supports keys, and clears", () =>
    {
        const onChange = vi.fn();

        render(<FilterSearch entries={[{ category: "Career", label: "Payment" }]} onChange={onChange} query="pay" />);

        expect(screen.getByText("Pay")).toBeInTheDocument();
        fireEvent.keyDown(screen.getByRole("searchbox", { name: "Search filters" }), { key: "Enter" });
        expect(onChange).toHaveBeenCalledWith("Payment");
        fireEvent.click(screen.getByRole("button", { name: "Clear" }));
        expect(onChange).toHaveBeenCalledWith("");
    });
});

describe("location and viewport coordination", () =>
{
    it("resolves a canonical country selection for quick creation", () =>
    {
        const onResolve = vi.fn();

        render(<LocationSearch onResolve={onResolve} value={null} />);
        fireEvent.change(screen.getByRole("combobox", { name: /^Country$/u }), { target: { value: "Germany" } });
        fireEvent.click(screen.getByRole("option", { name: /Germany DEU/u }));

        expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({ country: "Germany", countryCode: "DEU" }));
    });

    it("defers camera movement until the next rendered frame", () =>
    {
        let frameCallback: FrameRequestCallback | undefined;
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) =>
        {
            frameCallback = callback;
            return 7;
        });
        const moveCamera = vi.fn();
        const coordinates = { longitude: 11.5, latitude: 48.1 };

        scheduleCameraAfterCardRender(coordinates, moveCamera);
        expect(moveCamera).not.toHaveBeenCalled();
        frameCallback?.(0);
        expect(moveCamera).toHaveBeenCalledWith(coordinates);
    });

    it("applies detail-window padding to wrapped camera options", () =>
    {
        const options = createLocationCameraOptions(
            { longitude: -170, latitude: 10 },
            175,
            4,
            false,
            { right: 420, top: 32 },
        );

        expect(options.padding).toEqual({ top: 32, right: 420, bottom: 0, left: 0 });
        expect(options.center).toEqual([190, 10]);
    });
});

describe("Note records", () =>
{
    it("creates, validates, and persists a Note without a score", async () =>
    {
        const draft = createNoteTag({ longitude: 8.6, latitude: 50.1 });
        const note = parseNoteTag({ ...draft, name: "Visit", content: "Follow up", city: "Frankfurt", country: "Germany" });
        const dataAccess = await createDataAccess({
            databaseName: "atlas-note-persistence-test",
            localStorage: window.localStorage,
            persistence: "localstorage",
        });

        await dataAccess.initialize({ companies: [], countryOverlays: [], notes: [note], universities: [] });
        expect(await dataAccess.notes.getById(note.id)).toEqual(note);
        expect(note.finalRating).toBeUndefined();
        dataAccess.close();
    });

    it("allows unlocked Note dragging and blocks locked Note dragging", () =>
    {
        expect(canDragMapTag({ ...exampleNotes[0]!, locked: false })).toBe(true);
        expect(canDragMapTag({ ...exampleNotes[0]!, locked: true })).toBe(false);
        expect(canDragMapTag(createCompanyFixture())).toBe(true);
    });
});

describe("country data and actions", () =>
{
    it("formats English, original, and combined geographic names", () =>
    {
        expect(formatGeographicName("Munich", "München", "english")).toBe("Munich");
        expect(formatGeographicName("Munich", "München", "original")).toBe("München");
        expect(formatGeographicName("Munich", "München", "english-original")).toBe("Munich (München)");
    });

    it("renders country facts and explicitly labels unavailable data", () =>
    {
        render(<CountryInformationPanel countryCode="DEU" nameMode="english" onTagSelect={() => undefined} tags={[]} />);

        expect(screen.getByRole("heading", { name: "Germany" })).toBeInTheDocument();
        expect(screen.getByText("ISO alpha-3").nextElementSibling).toHaveTextContent("DEU");
        expect(screen.getAllByText("Data unavailable").length).toBeGreaterThan(0);
    });

    it("lists, filters, and sorts all record types in a country", () =>
    {
        const university = createUniversityFixture({ countryCode: "DEU", name: "Z University" });
        const company = createCompanyFixture({ countryCode: "DEU", name: "A Company" });
        const note = { ...exampleNotes[0]!, countryCode: "DEU", name: "Middle Note" };
        const results = queryCountryTags([university, company, note], { countryCode: "DEU", sortBy: "name" });

        expect(results.map((tag) => tag.type)).toEqual(["company", "note", "university"]);
        expect(queryCountryTags(results, { countryCode: "DEU", query: "middle" })).toEqual([note]);
    });

    it("converts currency through the configured key-free provider and caches the result", async () =>
    {
        const fetchMock = vi.fn().mockResolvedValue({
            json: () => Promise.resolve({ date: "2026-08-05", rates: { EUR: 0.2 } }),
            ok: true,
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(convertCurrency(100, "BRL", "EUR")).resolves.toEqual({ amount: 20, currency: "EUR", rateDate: "2026-08-05" });
        await convertCurrency(100, "BRL", "EUR");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("uses exact repeated-click coordinates only after an explicit action", () =>
    {
        const onCreate = vi.fn();
        const coordinates = { longitude: 19.94, latitude: 50.06 };

        render(<CountryActionMenu coordinates={coordinates} onCreate={onCreate} onDismiss={() => undefined} />);
        expect(onCreate).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: "Add Note here" }));
        expect(onCreate).toHaveBeenCalledWith("note", coordinates);
    });
});
