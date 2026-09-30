import { useEffect, useState } from 'react';
import { sharedDatasetClient } from '@/services';

const ADMIN_AUTHENTICATION_EMAIL = 'admin@atlas.invalid';
const ADMIN_USERNAME = 'admin';

export type AdminSessionStatus = 'checking' | 'anonymous' | 'authenticating' | 'authenticated';

export interface UseAdminSessionResult
{
    error: string | null;
    isAdmin: boolean;
    login: (username: string, password: string, rememberSession: boolean) => Promise<boolean>;
    logout: () => Promise<void>;
    status: AdminSessionStatus;
    username: string | null;
}



/**
 * Converts an authentication failure into a safe concise message.
 * Used by both initial restoration and explicit administrator login.
 * Never includes submitted credentials or authorization headers.
 */
function describeAuthenticationError(error: unknown): string
{
    return error instanceof Error ? error.message : 'Administrator authentication failed.';
}



/**
 * Owns the Supabase-backed administrator session for protected edit workflows.
 * Used by the application shell and login panel while the database enforces writes.
 * Returns asynchronous login/logout actions and restoration state.
 */
export function useAdminSession(): UseAdminSessionResult
{
    const [authenticatedUsername, setAuthenticatedUsername] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<AdminSessionStatus>('checking');

    useEffect(() =>
    {
        let isActive = true;

        async function restoreSession(): Promise<void>
        {
            const session = await sharedDatasetClient.restoreAdminSession();

            if (!isActive)
            {
                return;
            }

            setAuthenticatedUsername(session === null ? null : ADMIN_USERNAME);
            setStatus(session === null ? 'anonymous' : 'authenticated');
        }

        void restoreSession();

        return () =>
        {
            isActive = false;
        };
    }, []);

    const login = async (username: string, password: string, rememberSession: boolean): Promise<boolean> =>
    {
        setError(null);
        setStatus('authenticating');

        if (username !== ADMIN_USERNAME)
        {
            setAuthenticatedUsername(null);
            setError('The username or password is incorrect.');
            setStatus('anonymous');
            return false;
        }

        try
        {
            await sharedDatasetClient.signIn(ADMIN_AUTHENTICATION_EMAIL, password, rememberSession);
            setAuthenticatedUsername(ADMIN_USERNAME);
            setStatus('authenticated');
            return true;
        }
        catch (authenticationError)
        {
            setAuthenticatedUsername(null);
            setError(describeAuthenticationError(authenticationError));
            setStatus('anonymous');
            return false;
        }
    };
    const logout = async (): Promise<void> =>
    {
        await sharedDatasetClient.signOut();
        setAuthenticatedUsername(null);
        setError(null);
        setStatus('anonymous');
    };

    return {
        error,
        isAdmin: status === 'authenticated',
        login,
        logout,
        status,
        username: authenticatedUsername,
    };
}
