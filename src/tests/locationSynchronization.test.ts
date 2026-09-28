import { afterEach, describe, expect, it, vi } from "vitest";
import { createCompanyTag } from "../application";
import { findCountry } from "../data/countries";
import { createLocationCameraOptions } from "../map/camera";
import { NominatimGeocodingService, synchronizeCountry, synchronizeResolvedLocation } from "../services";

afterEach(() =>
{
    vi.unstubAllGlobals();
});

describe("location synchronization and map movement", () =>
{
    it("synchronizes country identity, code, center, and camera transition", () =>
    {
        const brazil = findCountry("BRA");
        expect(brazil).toBeDefined();

        const synchronized = synchronizeCountry(createCompanyTag({ longitude: 0, latitude: 0 }), brazil!);
        expect(synchronized).toMatchObject({ country: "Brazil", countryCode: "BRA" });
        expect(synchronized.coordinates).toEqual(brazil!.coordinates);

        const camera = createLocationCameraOptions(brazil!.coordinates, 540, 3, false);
        expect(camera.center).toEqual([brazil!.coordinates.longitude + 720, brazil!.coordinates.latitude]);
        expect(camera.zoom).toBe(7);
        expect(camera.duration).toBe(700);
    });

    it("reverse geocodes a clicked coordinate and applies every related field", async () =>
    {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                address: { city: "São Paulo", country: "Brazil", country_code: "br" },
                lat: "-23.5505",
                lon: "-46.6333",
            }),
        }));
        const service = new NominatimGeocodingService("https://geocoder.test");
        const location = await service.reverse({ longitude: -46.63, latitude: -23.55 });

        expect(location).not.toBeNull();
        const synchronized = synchronizeResolvedLocation(
            createCompanyTag({ longitude: 0, latitude: 0 }),
            location!,
        );
        expect(synchronized).toMatchObject({ city: "São Paulo", country: "Brazil", countryCode: "BRA" });
        expect(synchronized.coordinates.longitude).toBeCloseTo(-46.6333, 6);
    });

    it("fails geocoding safely without corrupting form state", async () =>
    {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
        const service = new NominatimGeocodingService("https://geocoder.test");

        await expect(service.reverse({ longitude: 1, latitude: 2 })).resolves.toBeNull();
        await expect(service.searchCities("Paris")).resolves.toEqual([]);
    });

    it("treats a missing reverse-geocoded country code as optional", () =>
    {
        const synchronized = synchronizeResolvedLocation(
            createCompanyTag({ longitude: 8.97, latitude: 20.41 }),
            {
                city: "",
                country: "Niger",
                countryCode: "",
                coordinates: { longitude: 8.97, latitude: 20.41 },
            },
        );

        expect(synchronized.countryCode).toBeUndefined();
        expect(findCountry("br")?.code).toBe("BRA");
    });
});
