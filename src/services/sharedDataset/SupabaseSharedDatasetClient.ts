import type { AppDataBundle } from '@/types';
import { parseAppDataBundle } from '@/validation';

const DATASET_IDENTIFIER = 'atlas';
const LOCAL_SESSION_KEY = 'atlas-notebook-supabase-session';

interface AuthenticationResponse
{
    access_token: string;
    expires_in: number;
    refresh_token: string;
    user: {
        email?: string;
    };
}

interface StoredSession
{
    accessToken: string;
    email: string;
    expiresAt: number;
    refreshToken: string;
    remember: boolean;
}

interface DatasetRow
{
    data: unknown;
    updated_at: string;
}

export interface AdminSession
{
    email: string;
}

export interface SharedDatasetSnapshot
{
    bundle: AppDataBundle;
    updatedAt: string;
}

type FetchImplementation = typeof fetch;



/**
 * Converts an unsuccessful Supabase response into a concise user-facing error.
 * Used at the shared network boundary without exposing request credentials.
 * Prefers the API message while retaining a stable fallback.
 */
async function describeResponseError(response: Response, fallback: string): Promise<string>
{
    try
    {
        const body = await response.json() as { error_description?: string; message?: string };
        return body.error_description ?? body.message ?? fallback;
    }
    catch
    {
        return fallback;
    }
}



/**
 * Validates a stored browser session before it reaches authorization headers.
 * Used while restoring optional remembered and tab-scoped login state.
 * Returns null for malformed or incomplete browser values.
 */
function parseStoredSession(value: string | null): StoredSession | null
{
    if (value === null)
    {
        return null;
    }

    try
    {
        const input = JSON.parse(value) as Partial<StoredSession>;

        if (
            typeof input.accessToken !== 'string'
            || typeof input.refreshToken !== 'string'
            || typeof input.email !== 'string'
            || typeof input.expiresAt !== 'number'
            || typeof input.remember !== 'boolean'
        )
        {
            return null;
        }

        return input as StoredSession;
    }
    catch
    {
        return null;
    }
}



/**
 * Implements the small Supabase Auth and PostgREST surface needed by the app.
 * Used by React hooks while keeping public configuration and user tokens centralized.
 * Relies on database row-level security as the authoritative write boundary.
 */
export class SupabaseSharedDatasetClient
{
    private readonly anonymousKey: string;
    private readonly fetchImplementation: FetchImplementation;
    private readonly projectUrl: string;
    private session: StoredSession | null = null;

    public constructor(
        projectUrl: string | undefined,
        anonymousKey: string | undefined,
        fetchImplementation: FetchImplementation = fetch,
    )
    {
        this.projectUrl = (projectUrl ?? '').replace(/\/$/u, '');
        this.anonymousKey = anonymousKey ?? '';
        this.fetchImplementation = fetchImplementation;
    }

    public isConfigured(): boolean
    {
        return this.projectUrl.length > 0 && this.anonymousKey.length > 0;
    }

    public async loadDataset(): Promise<SharedDatasetSnapshot>
    {
        this.requireConfiguration();
        const response = await this.fetchImplementation(
            `${this.projectUrl}/rest/v1/shared_datasets?id=eq.${DATASET_IDENTIFIER}&select=data,updated_at&limit=1`,
            {
                headers: { apikey: this.anonymousKey },
            },
        );

        if (!response.ok)
        {
            throw new Error(await describeResponseError(response, 'The shared dataset could not be loaded.'));
        }

        const rows = await response.json() as DatasetRow[];
        const row = rows[0];

        if (row === undefined)
        {
            throw new Error('The shared dataset has not been initialized in Supabase.');
        }

        return {
            bundle: parseAppDataBundle(row.data),
            updatedAt: row.updated_at,
        };
    }

    public async saveDataset(bundle: AppDataBundle): Promise<SharedDatasetSnapshot>
    {
        this.requireConfiguration();
        const accessToken = await this.requireAccessToken();
        const response = await this.fetchImplementation(
            `${this.projectUrl}/rest/v1/shared_datasets?id=eq.${DATASET_IDENTIFIER}&select=data,updated_at`,
            {
                body: JSON.stringify({ data: parseAppDataBundle(bundle) }),
                headers: {
                    ...this.createHeaders(accessToken),
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation',
                },
                method: 'PATCH',
            },
        );

        if (!response.ok)
        {
            throw new Error(await describeResponseError(response, 'The shared dataset could not be saved.'));
        }

        const rows = await response.json() as DatasetRow[];
        const row = rows[0];

        if (row === undefined)
        {
            throw new Error('Supabase rejected the write. Verify that this account is an administrator.');
        }

        return {
            bundle: parseAppDataBundle(row.data),
            updatedAt: row.updated_at,
        };
    }

    public async signIn(email: string, password: string, remember: boolean): Promise<AdminSession>
    {
        this.requireConfiguration();
        const response = await this.fetchImplementation(
            `${this.projectUrl}/auth/v1/token?grant_type=password`,
            {
                body: JSON.stringify({ email, password }),
                headers: {
                    apikey: this.anonymousKey,
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            },
        );

        if (!response.ok)
        {
            throw new Error(await describeResponseError(response, 'The email or password is incorrect.'));
        }

        const authentication = await response.json() as AuthenticationResponse;
        this.session = this.createSession(authentication, remember);

        try
        {
            if (!await this.checkAdministrator())
            {
                throw new Error('This account is authenticated but is not an administrator.');
            }
        }
        catch (administratorError)
        {
            await this.signOut();
            throw administratorError;
        }

        this.persistSession();
        return { email: this.session.email };
    }

    public async restoreAdminSession(): Promise<AdminSession | null>
    {
        if (!this.isConfigured())
        {
            return null;
        }

        this.session = this.readPersistedSession();

        if (this.session === null)
        {
            return null;
        }

        try
        {
            if (!await this.checkAdministrator())
            {
                this.clearSession();
                return null;
            }

            return { email: this.session.email };
        }
        catch
        {
            this.clearSession();
            return null;
        }
    }

    public async signOut(): Promise<void>
    {
        const accessToken = this.session?.accessToken;

        try
        {
            if (accessToken !== undefined && this.isConfigured())
            {
                await this.fetchImplementation(`${this.projectUrl}/auth/v1/logout`, {
                    headers: this.createHeaders(accessToken),
                    method: 'POST',
                });
            }
        }
        finally
        {
            this.clearSession();
        }
    }

    private async checkAdministrator(): Promise<boolean>
    {
        const accessToken = await this.requireAccessToken();
        const response = await this.fetchImplementation(`${this.projectUrl}/rest/v1/rpc/is_admin`, {
            body: '{}',
            headers: {
                ...this.createHeaders(accessToken),
                'Content-Type': 'application/json',
            },
            method: 'POST',
        });

        if (!response.ok)
        {
            throw new Error(await describeResponseError(response, 'Administrator access could not be verified.'));
        }

        return await response.json() === true;
    }

    private clearSession(): void
    {
        this.session = null;

        try
        {
            window.localStorage.removeItem(LOCAL_SESSION_KEY);
            window.sessionStorage.removeItem(LOCAL_SESSION_KEY);
        }
        catch
        {
            // In-memory logout still succeeds when browser storage is unavailable.
        }
    }

    private createHeaders(accessToken: string): Record<string, string>
    {
        return {
            apikey: this.anonymousKey,
            Authorization: `Bearer ${accessToken}`,
        };
    }

    private createSession(authentication: AuthenticationResponse, remember: boolean): StoredSession
    {
        return {
            accessToken: authentication.access_token,
            email: authentication.user.email ?? '',
            expiresAt: Date.now() + (authentication.expires_in * 1_000),
            refreshToken: authentication.refresh_token,
            remember,
        };
    }

    private persistSession(): void
    {
        if (this.session === null)
        {
            return;
        }

        try
        {
            const selectedStorage = this.session.remember ? window.localStorage : window.sessionStorage;
            const otherStorage = this.session.remember ? window.sessionStorage : window.localStorage;

            selectedStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(this.session));
            otherStorage.removeItem(LOCAL_SESSION_KEY);
        }
        catch
        {
            // The authenticated in-memory session remains usable in restricted browsers.
        }
    }

    private readPersistedSession(): StoredSession | null
    {
        try
        {
            return parseStoredSession(window.localStorage.getItem(LOCAL_SESSION_KEY))
                ?? parseStoredSession(window.sessionStorage.getItem(LOCAL_SESSION_KEY));
        }
        catch
        {
            return null;
        }
    }

    private async refreshSession(): Promise<void>
    {
        if (this.session === null)
        {
            throw new Error('Administrator login is required to save the shared dataset.');
        }

        const response = await this.fetchImplementation(
            `${this.projectUrl}/auth/v1/token?grant_type=refresh_token`,
            {
                body: JSON.stringify({ refresh_token: this.session.refreshToken }),
                headers: {
                    apikey: this.anonymousKey,
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            },
        );

        if (!response.ok)
        {
            this.clearSession();
            throw new Error('The administrator session expired. Please log in again.');
        }

        const authentication = await response.json() as AuthenticationResponse;
        this.session = this.createSession(authentication, this.session.remember);
        this.persistSession();
    }

    private async requireAccessToken(): Promise<string>
    {
        if (this.session === null)
        {
            throw new Error('Administrator login is required to save the shared dataset.');
        }

        if (this.session.expiresAt <= Date.now() + 30_000)
        {
            await this.refreshSession();
        }

        if (this.session === null)
        {
            throw new Error('The administrator session expired. Please log in again.');
        }

        return this.session.accessToken;
    }

    private requireConfiguration(): void
    {
        if (!this.isConfigured())
        {
            throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
        }
    }
}

export const sharedDatasetClient = new SupabaseSharedDatasetClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
);
