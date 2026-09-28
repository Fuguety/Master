import { fireEvent, render, screen } from "@testing-library/react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";
import { exampleNotes } from "../data";
import { KeyboardMarkerNavigator } from "../map/KeyboardMarkerNavigator";
import { createTagPreviewElement, TagPreviewManager } from "../map/TagPreviewManager";
import type { MapTag } from "../types";
import { createCompanyFixture, createUniversityFixture } from "./domainFixtures";

vi.mock("maplibre-gl", () => ({
    Popup: class TestPopup
    {
    },
}));

describe("marker preview content", () =>
{
    it("formats University and Company previews with type and rating stars", () =>
    {
        const university = createUniversityFixture({ finalRating: 4.2, name: "Preview University" });
        const company = createCompanyFixture({ finalRating: 3.4, name: "Preview Company" });

        expect(createTagPreviewElement(university, "en-US").textContent)
            .toBe("Preview UniversityUniversity · ★★★★☆ 4.2/5");
        expect(createTagPreviewElement(company, "en-US").textContent)
            .toBe("Preview CompanyCompany · ★★★☆☆ 3.4/5");
    });

    it("renders Notes as title-only previews without rating text", () =>
    {
        const note = { ...exampleNotes[0]!, name: "Remember this place" };
        const preview = createTagPreviewElement(note, "en-US");

        expect(preview.textContent).toBe("Remember this place");
        expect(preview.textContent).not.toContain("★");
        expect(preview.textContent).not.toContain("Note ·");
    });
});

describe("marker preview lifecycle", () =>
{
    it("uses the nearest wrapped marker and cleans up for detail, deletion, and leave", () =>
    {
        const records = new Map<string, MapTag>();
        const university = createUniversityFixture({
            coordinates: { longitude: -170, latitude: 12 },
        });
        records.set(university.id, university);
        const popup = {
            addTo: vi.fn().mockReturnThis(),
            remove: vi.fn().mockReturnThis(),
            setDOMContent: vi.fn().mockReturnThis(),
            setLngLat: vi.fn().mockReturnThis(),
        };
        const map = { getCenter: () => ({ lng: 175 }) } as MapLibreMap;
        const manager = new TagPreviewManager(map, (tagId) => records.get(tagId), () => popup);

        manager.show(university.id, "pointer");
        expect(popup.setLngLat).toHaveBeenCalledWith([190, 12]);
        manager.hide("pointer");
        expect(popup.remove).toHaveBeenCalled();

        manager.show(university.id, "keyboard");
        manager.setSuppressedTagIds([university.id]);
        expect(popup.remove).toHaveBeenCalledTimes(2);

        manager.setSuppressedTagIds([]);
        manager.show(university.id, "pointer");
        records.delete(university.id);
        manager.reconcile();
        expect(popup.remove).toHaveBeenCalledTimes(3);
    });
});

describe("keyboard marker focus", () =>
{
    it("shows on focus, hides on blur, and opens the typed record on activation", () =>
    {
        const university = createUniversityFixture({ name: "Keyboard University" });
        const clusteredCompany = createCompanyFixture({ name: "Clustered Company" });
        const onBlur = vi.fn();
        const onFocus = vi.fn();
        const onSelect = vi.fn();

        render(
            <KeyboardMarkerNavigator
                onBlur={onBlur}
                onFocus={onFocus}
                onSelect={onSelect}
                tags={[university, clusteredCompany]}
                visibleTagIds={[university.id]}
            />,
        );

        const markerButton = screen.getByRole("button", { name: /Keyboard University/u });
        expect(screen.queryByRole("button", { name: /Clustered Company/u })).not.toBeInTheDocument();
        fireEvent.focus(markerButton);
        expect(onFocus).toHaveBeenCalledWith(university.id);
        fireEvent.blur(markerButton);
        expect(onBlur).toHaveBeenCalledWith(university.id);
        fireEvent.click(markerButton);
        expect(onSelect).toHaveBeenCalledWith(university);
    });
});
