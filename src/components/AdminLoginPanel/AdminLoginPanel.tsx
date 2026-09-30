import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../Button/Button';
import { TextField } from '../forms/TextField';
import styles from './AdminLoginPanel.module.css';

export interface AdminLoginPanelProps
{
    authenticatedUsername: string | null;
    error: string | null;
    isAdmin: boolean;
    loading?: boolean;
    onLogin: (username: string, password: string, rememberSession: boolean) => Promise<boolean>;
    onLogout: () => Promise<void> | void;
}



/**
 * Renders Supabase administrator login and logout controls for publishing.
 * Used by the account panel without embedding any administrator credentials.
 * Stores the returned user session only when the user explicitly opts in.
 */
export function AdminLoginPanel({
    authenticatedUsername,
    error,
    isAdmin,
    loading = false,
    onLogin,
    onLogout,
}: AdminLoginPanelProps)
{
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberSession, setRememberSession] = useState(false);
    const handleSubmit = (event: FormEvent<HTMLFormElement>): void =>
    {
        event.preventDefault();

        void onLogin(username.trim(), password, rememberSession).then((loginSucceeded) =>
        {
            if (loginSucceeded)
            {
                setPassword('');
            }
        });
    };

    if (isAdmin)
    {
        return (
            <section className={styles.panel}>
                <div className={styles.signedIn}>
                    <span aria-hidden="true">✓</span>
                    <div>
                        <h3>Administrator active</h3>
                        <p>{authenticatedUsername ?? 'Authenticated administrator'} can publish the current working copy as the shared base.</p>
                    </div>
                </div>
                <Button disabled={loading} onClick={() => void onLogout()} variant="secondary">Log out</Button>
            </section>
        );
    }

    return (
        <form className={styles.panel} onSubmit={handleSubmit}>
            <p className={styles.introduction}>
                Anyone can edit or import a local working copy. Sign in as an administrator to publish it as the shared base dataset.
            </p>
            <TextField
                autoComplete="username"
                disabled={loading}
                label="Username"
                name="username"
                onChange={setUsername}
                required
                value={username}
            />
            <TextField
                autoComplete="current-password"
                disabled={loading}
                error={error ?? undefined}
                label="Password"
                name="password"
                onChange={setPassword}
                required
                type="password"
                value={password}
            />
            <label className={styles.remember}>
                <input
                    checked={rememberSession}
                    onChange={(event) => setRememberSession(event.currentTarget.checked)}
                    type="checkbox"
                />
                Remember this login on this device
            </label>
            <Button disabled={loading || username.trim().length === 0 || password.length === 0} type="submit" variant="primary">
                {loading ? 'Signing in…' : 'Log in'}
            </Button>
        </form>
    );
}
