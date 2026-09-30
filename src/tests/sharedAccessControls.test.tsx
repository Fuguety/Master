import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from '@/components/AppHeader/AppHeader';
import { DataManagerPanel } from '@/components/DataManagerPanel/DataManagerPanel';

describe('shared dataset access controls', () =>
{
    it('allows anonymous local imports without rendering the shared Save control', () =>
    {
        render(
            <>
                <AppHeader
                    companyCount={2}
                    isAdmin={false}
                    isDirty
                    onOpenAdmin={vi.fn()}
                    onOpenMenu={vi.fn()}
                    onOpenSettings={vi.fn()}
                    onSave={vi.fn()}
                    saveStatus="dirty"
                    universityCount={2}
                />
                <DataManagerPanel
                    connectionMode="shared"
                    isDirty
                    onExport={vi.fn()}
                    onImport={vi.fn()}
                    onRefresh={vi.fn()}
                />
            </>,
        );

        expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Choose JSON file' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Refresh' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Export JSON' })).toBeVisible();
        expect(screen.getAllByText('Local changes')).toHaveLength(2);
        expect(screen.getByText('Shared online').closest('div')).toHaveAttribute('data-active', 'true');
        expect(screen.getByText('This working copy differs from the shared base and is not published.')).toBeVisible();
    });

    it('shows an enabled Save action only for an administrator with a dirty draft', () =>
    {
        const onSave = vi.fn();
        render(
            <AppHeader
                companyCount={2}
                isAdmin
                isDirty
                onOpenAdmin={vi.fn()}
                onOpenMenu={vi.fn()}
                onOpenSettings={vi.fn()}
                onSave={onSave}
                saveStatus="dirty"
                universityCount={2}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        expect(onSave).toHaveBeenCalledOnce();
        expect(screen.getByText('Ready to publish')).toBeVisible();
    });

    it('shows administrator publishing mode and saved state in Data', () =>
    {
        render(
            <DataManagerPanel
                connectionMode="shared"
                isAdmin
                lastSavedAt="30/09/2026, 16:30"
                onExport={vi.fn()}
                onImport={vi.fn()}
                onRefresh={vi.fn()}
                wasPublished
            />,
        );

        expect(screen.getByText('Publisher online').closest('div')).toHaveAttribute('data-active', 'true');
        expect(screen.getByText('Saved')).toBeVisible();
        expect(screen.getByText(/Shared base published/u)).toBeVisible();
    });
});
