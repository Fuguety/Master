import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { createCompanyTag, createUniversityTag } from '@/application';
import { CompanyForm, UniversityForm } from '@/tags';

afterEach(() =>
{
    cleanup();
});

const collectionHandlers = {
    onAddNote: (): void => undefined,
    onAddSource: (): void => undefined,
    onDeleteNote: (): void => undefined,
    onDeleteSource: (): void => undefined,
    onUpdateNote: (): void => undefined,
    onUpdateSource: (): void => undefined,
};

describe('tag form semantics', () =>
{
    it('renders the complete University editor as one valid form tree', () =>
    {
        const value = createUniversityTag({ longitude: -46.63, latitude: -23.55 });
        const { container } = render(
            <UniversityForm
                {...collectionHandlers}
                onCancel={() => undefined}
                onChange={() => undefined}
                onSubmit={() => undefined}
                value={value}
            />,
        );

        expect(container.querySelectorAll('form')).toHaveLength(1);
        expect(container.querySelector('form form')).toBeNull();
        expect(screen.getByRole('textbox', { name: /^Country code/u })).toHaveAttribute('maxlength', '3');
        expect(screen.getByRole('spinbutton', { name: /^Global ranking/u })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /^University helps students find jobs/u })).toBeInTheDocument();
    });

    it('renders the complete Company editor as one valid form tree', () =>
    {
        const value = createCompanyTag({ longitude: 13.4, latitude: 52.52 });
        const { container } = render(
            <CompanyForm
                {...collectionHandlers}
                onCancel={() => undefined}
                onChange={() => undefined}
                onSubmit={() => undefined}
                value={value}
            />,
        );

        expect(container.querySelectorAll('form')).toHaveLength(1);
        expect(container.querySelector('form form')).toBeNull();
        expect(screen.getByRole('textbox', { name: /^Country code/u })).toHaveAttribute('maxlength', '3');
        expect(screen.getByRole('combobox', { name: /^Work model/u })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /^Internship availability/u })).toBeInTheDocument();
    });
});
