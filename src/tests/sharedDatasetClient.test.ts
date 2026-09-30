import { describe, expect, it, vi } from 'vitest';
import { exampleCompanies, exampleCountryOverlays, exampleNotes, exampleUniversities } from '@/data';
import { SupabaseSharedDatasetClient } from '@/services/sharedDataset';
import type { AppDataBundle } from '@/types';

const exampleBundle: AppDataBundle = {
    version: 2,
    exportedAt: '2026-09-30T00:00:00.000Z',
    universities: exampleUniversities,
    companies: exampleCompanies,
    notes: exampleNotes,
    countryOverlays: exampleCountryOverlays,
};



/**
 * Creates one JSON response for the Supabase client contract tests.
 * Used to keep status and response headers consistent across mocked endpoints.
 */
function jsonResponse(body: unknown, status = 200): Response
{
    return new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/json' },
        status,
    });
}



describe('Supabase shared dataset client', () =>
{
    it('loads the same public dataset with only the publishable anonymous key', async () =>
    {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([{
            data: exampleBundle,
            updated_at: '2026-09-30T10:00:00.000Z',
        }]));
        const client = new SupabaseSharedDatasetClient(
            'https://example.supabase.co',
            'public-anon-key',
            fetchMock,
        );

        const snapshot = await client.loadDataset();
        const request = fetchMock.mock.calls[0];
        const headers = new Headers(request?.[1]?.headers);

        expect(snapshot.bundle.universities).toHaveLength(exampleUniversities.length);
        expect(headers.get('apikey')).toBe('public-anon-key');
        expect(headers.get('Authorization')).toBeNull();
    });

    it('rejects anonymous saves before making a database request', async () =>
    {
        const fetchMock = vi.fn<typeof fetch>();
        const client = new SupabaseSharedDatasetClient(
            'https://example.supabase.co',
            'public-anon-key',
            fetchMock,
        );

        await expect(client.saveDataset(exampleBundle)).rejects.toThrow('Administrator login is required');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('publishes an administrator change that a new visitor can refetch', async () =>
    {
        let storedBundle = exampleBundle;
        const fetchMock = vi.fn<typeof fetch>((input, initialization): Promise<Response> =>
        {
            const url = typeof input === 'string'
                ? input
                : input instanceof URL
                    ? input.href
                    : input.url;

            if (url.includes('/auth/v1/token'))
            {
                return Promise.resolve(jsonResponse({
                    access_token: 'administrator-access-token',
                    expires_in: 3600,
                    refresh_token: 'administrator-refresh-token',
                    user: { email: 'admin@example.com' },
                }));
            }

            if (url.includes('/rpc/is_admin'))
            {
                return Promise.resolve(jsonResponse(true));
            }

            if (initialization?.method === 'PATCH')
            {
                if (typeof initialization.body !== 'string')
                {
                    throw new Error('Expected a JSON request body.');
                }

                storedBundle = (JSON.parse(initialization.body) as { data: AppDataBundle }).data;
                return Promise.resolve(jsonResponse([{
                    data: storedBundle,
                    updated_at: '2026-09-30T11:00:00.000Z',
                }]));
            }

            return Promise.resolve(jsonResponse([{
                data: storedBundle,
                updated_at: '2026-09-30T11:00:00.000Z',
            }]));
        });
        const administratorClient = new SupabaseSharedDatasetClient(
            'https://example.supabase.co',
            'public-anon-key',
            fetchMock,
        );
        const changedBundle = {
            ...exampleBundle,
            universities: exampleBundle.universities.map((university, index) => index === 0
                ? { ...university, name: 'Published University Name' }
                : university),
        };

        await administratorClient.signIn('admin@example.com', 'not-stored-in-source', false);
        await administratorClient.saveDataset(changedBundle);

        const visitorClient = new SupabaseSharedDatasetClient(
            'https://example.supabase.co',
            'public-anon-key',
            fetchMock,
        );
        const visitorSnapshot = await visitorClient.loadDataset();
        const patchCall = fetchMock.mock.calls.find((call) => call[1]?.method === 'PATCH');
        const patchHeaders = new Headers(patchCall?.[1]?.headers);

        expect(patchHeaders.get('Authorization')).toBe('Bearer administrator-access-token');
        expect(visitorSnapshot.bundle.universities[0]?.name).toBe('Published University Name');
    });

    it('rejects authenticated users who are absent from the server-side admin table', async () =>
    {
        const fetchMock = vi.fn<typeof fetch>((input): Promise<Response> =>
        {
            const url = typeof input === 'string'
                ? input
                : input instanceof URL
                    ? input.href
                    : input.url;

            if (url.includes('/auth/v1/token'))
            {
                return Promise.resolve(jsonResponse({
                    access_token: 'normal-user-token',
                    expires_in: 3600,
                    refresh_token: 'normal-user-refresh-token',
                    user: { email: 'reader@example.com' },
                }));
            }

            if (url.includes('/rpc/is_admin'))
            {
                return Promise.resolve(jsonResponse(false));
            }

            return Promise.resolve(new Response(null, { status: 204 }));
        });
        const client = new SupabaseSharedDatasetClient(
            'https://example.supabase.co',
            'public-anon-key',
            fetchMock,
        );

        await expect(client.signIn('reader@example.com', 'reader-password', false))
            .rejects.toThrow('not an administrator');
        await expect(client.saveDataset(exampleBundle)).rejects.toThrow('Administrator login is required');
    });
});
