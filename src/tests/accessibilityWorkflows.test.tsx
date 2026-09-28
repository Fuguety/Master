import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CountryOverlayList } from "../components/CountryOverlayList/CountryOverlayList";
import { TagBrowser } from "../components/TagBrowser/TagBrowser";
import { createCompanyFixture } from "./domainFixtures";

afterEach(() =>
{
    cleanup();
});

describe("keyboard record workflows", () =>
{
    it("creates a tag workflow from entered coordinates and opens list details", () =>
    {
        const onCreate = vi.fn();
        const onSelect = vi.fn();
        const company = createCompanyFixture();

        render(
            <TagBrowser
                onCreate={onCreate}
                onSelect={onSelect}
                tags={[company]}
            />,
        );

        fireEvent.change(screen.getByRole("combobox", { name: /^Country$/u }), {
            target: { value: "Germany" },
        });
        fireEvent.click(screen.getByRole("option", { name: /Germany DEU/u }));
        fireEvent.change(screen.getByRole("spinbutton", { name: /^Longitude/u }), {
            target: { value: "13.405" },
        });
        fireEvent.change(screen.getByRole("spinbutton", { name: /^Latitude/u }), {
            target: { value: "52.52" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Create tag here" }));
        fireEvent.click(screen.getByRole("button", { name: /Fixture Company/u }));

        expect(onCreate).toHaveBeenCalledWith({ longitude: 13.405, latitude: 52.52 });
        expect(onSelect).toHaveBeenCalledWith(company);
    });

    it("creates a country highlight from a name and alpha-3 code", () =>
    {
        const onCreate = vi.fn();

        render(
            <CountryOverlayList
                onCreate={onCreate}
                onSelect={() => undefined}
                onVisibilityChange={() => undefined}
                overlays={[]}
            />,
        );

        fireEvent.change(screen.getByRole("combobox", { name: /^Country$/u }), {
            target: { value: "France" },
        });
        fireEvent.click(screen.getByRole("option", { name: /France FRA/u }));
        fireEvent.click(screen.getByRole("button", { name: "Create country highlight" }));

        expect(onCreate).toHaveBeenCalledWith("FRA", "France");
    });
});
