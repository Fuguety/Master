import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAdminSession } from '@/application/useAdminSession';
import { AdminLoginPanel } from '@/components/AdminLoginPanel/AdminLoginPanel';
import { PapisPanel } from '@/components/PapisPanel/PapisPanel';
import { createUniversityFixture } from './domainFixtures';

const sharedDatasetClientMock = vi.hoisted(() => ({
    restoreAdminSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('@/services', () => ({
    sharedDatasetClient: sharedDatasetClientMock,
}));

describe('Papis university workspace', () =>
{
    it('sorts universities and emits public review changes', () =>
    {
        const onChange = vi.fn();
        const universities = [
            createUniversityFixture({ id: 'zeta', name: 'Zeta University', country: 'Austria', finalRating: 2 }),
            createUniversityFixture({ id: 'alpha', name: 'Alpha University', country: 'Germany', finalRating: 5 }),
        ];
        render(<PapisPanel onChange={onChange} universities={universities} />);

        const cards = screen.getAllByRole('listitem');
        expect(within(cards[0]!).getByText('Alpha University')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Sort universities'), { target: { value: 'country' } });
        const countrySortedCards = screen.getAllByRole('listitem');
        expect(within(countrySortedCards[0]!).getByText('Zeta University')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Approve Zeta University' }));
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
            id: 'zeta',
            papisStatus: 'approved',
        }));

        fireEvent.click(screen.getByRole('button', { name: 'Favorite Alpha University' }));
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
            id: 'alpha',
            papisFavorite: true,
        }));
    });

    it('expands one university and supports adding notes', () =>
    {
        const onChange = vi.fn();
        const university = createUniversityFixture({ name: 'Open University' });
        render(<PapisPanel onChange={onChange} universities={[university]} />);

        fireEvent.click(screen.getByRole('button', { name: 'Expand Open University' }));
        fireEvent.change(screen.getByRole('textbox', { name: 'Add a note' }), {
            target: { value: 'Check the application deadline' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add note' }));

        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
            notes: [expect.objectContaining({ text: 'Check the application deadline' })],
        }));
    });
});

describe('administrator login panel', () =>
{
    it('uses the remote administrator session instead of frontend credentials', async () =>
    {
        sharedDatasetClientMock.restoreAdminSession.mockResolvedValue(null);
        sharedDatasetClientMock.signIn.mockResolvedValue({ email: 'admin@atlas.invalid' });
        const firstSession = renderHook(() => useAdminSession());

        await act(async () =>
        {
            expect(await firstSession.result.current.login('reader', 'admin', true)).toBe(false);
        });
        expect(sharedDatasetClientMock.signIn).not.toHaveBeenCalled();

        await act(async () =>
        {
            expect(await firstSession.result.current.login('admin', 'admin', true)).toBe(true);
        });
        expect(sharedDatasetClientMock.signIn).toHaveBeenCalledWith('admin@atlas.invalid', 'admin', true);
        expect(firstSession.result.current.isAdmin).toBe(true);

        await act(async () => firstSession.result.current.logout());
        expect(sharedDatasetClientMock.signOut).toHaveBeenCalledOnce();
        expect(firstSession.result.current.isAdmin).toBe(false);
    });

    it('submits credentials and the remember-session choice', async () =>
    {
        const onLogin = vi.fn().mockResolvedValue(true);
        render(
            <AdminLoginPanel
                authenticatedUsername={null}
                error={null}
                isAdmin={false}
                onLogin={onLogin}
                onLogout={() => undefined}
            />,
        );

        fireEvent.change(screen.getByRole('textbox', { name: 'Username' }), { target: { value: 'admin' } });
        fireEvent.change(screen.getByLabelText(/Password/u), { target: { value: 'admin' } });
        fireEvent.click(screen.getByRole('checkbox', { name: /Remember this login/u }));
        fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

        await waitFor(() =>
        {
            expect(onLogin).toHaveBeenCalledWith('admin', 'admin', true);
        });
    });
});
