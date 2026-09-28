export type DisplayCurrency = "LOCAL" | "EUR" | "USD" | "BRL";

export interface CurrencyConversion
{
    amount: number;
    currency: string;
    rateDate: string;
}

interface RateResponse
{
    date?: string;
    rates?: Record<string, number>;
}

const CACHE_DURATION = 12 * 60 * 60 * 1_000;

/**
 * Converts a local monetary value through a configurable, key-free provider endpoint.
 * Used by country minimum-wage display with timestamped local caching and safe nulls.
 */
export async function convertCurrency(
    amount: number,
    sourceCurrency: string,
    targetCurrency: DisplayCurrency,
): Promise<CurrencyConversion | null>
{
    if (targetCurrency === "LOCAL" || targetCurrency === sourceCurrency)
    {
        return { amount, currency: sourceCurrency, rateDate: new Date().toISOString().slice(0, 10) };
    }

    const cacheKey = `atlas-currency-${sourceCurrency}-${targetCurrency}`;

    try
    {
        const cached = JSON.parse(window.localStorage.getItem(cacheKey) ?? "null") as
            (CurrencyConversion & { cachedAt: number }) | null;

        if (cached !== null && Date.now() - cached.cachedAt < CACHE_DURATION)
        {
            return { amount: cached.amount, currency: cached.currency, rateDate: cached.rateDate };
        }

        const environment = import.meta.env as Record<string, unknown>;
        const configuredEndpoint = environment["VITE_CURRENCY_RATE_ENDPOINT"];
        const endpoint = typeof configuredEndpoint === "string"
            ? configuredEndpoint
            : "https://api.frankfurter.app/latest";
        const parameters = new URLSearchParams({ from: sourceCurrency, to: targetCurrency });
        const response = await fetch(`${endpoint}?${parameters}`);

        if (!response.ok)
        {
            return null;
        }

        const payload = await response.json() as RateResponse;
        const rate = payload.rates?.[targetCurrency];

        if (!Number.isFinite(rate))
        {
            return null;
        }

        const conversion: CurrencyConversion = {
            amount: amount * (rate ?? 0),
            currency: targetCurrency,
            rateDate: payload.date ?? new Date().toISOString().slice(0, 10),
        };
        window.localStorage.setItem(cacheKey, JSON.stringify({ ...conversion, cachedAt: Date.now() }));
        return conversion;
    }
    catch
    {
        return null;
    }
}
