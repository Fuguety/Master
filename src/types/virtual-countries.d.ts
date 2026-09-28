declare module "virtual:atlas-countries"
{
    interface VirtualCountry
    {
        alternativeNames: string[];
        alpha2Code: string;
        area: number;
        capital?: string;
        code: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
        name: string;
        originalName?: string;
        officialName: string;
        currencies: Array<{ code: string; name: string }>;
        languages: string[];
        region: string;
        subregion: string;
    }

    const countries: VirtualCountry[];

    export default countries;
}
