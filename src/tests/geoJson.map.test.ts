import { exampleCompanies, exampleUniversities } from "../data";
import { tagToPointFeature, tagsToFeatureCollection } from "../utils/geoJson";

describe("clustered map GeoJSON", () =>
{
    it("preserves only compact marker properties", () =>
    {
        const university = exampleUniversities[0]!;
        const feature = tagToPointFeature(university);

        expect(feature?.geometry.coordinates).toEqual([
            university.coordinates.longitude,
            university.coordinates.latitude,
        ]);
        expect(feature?.properties).toEqual(
        {
            id: university.id,
            type: "university",
            name: university.name,
            city: university.city,
            country: university.country,
            rating: university.finalRating,
            locked: false,
        });
        expect(feature?.properties).not.toHaveProperty("notes");
    });

    it("builds one feature per valid university and company", () =>
    {
        const tags = [exampleUniversities[0]!, exampleCompanies[0]!];
        const collection = tagsToFeatureCollection(tags);

        expect(collection.features).toHaveLength(2);
        expect(collection.features.map((feature) => feature.properties.type)).toEqual([
            "university",
            "company",
        ]);
    });
});
