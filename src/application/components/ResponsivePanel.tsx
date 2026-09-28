import type { ReactNode } from 'react';
import { MobileDrawer, PanelShell } from '@/components';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export interface ResponsivePanelProps
{
    children: ReactNode;
    description?: string;
    footer?: ReactNode;
    headingId: string;
    onClose: () => void;
    onWidthChange?: ((width: number) => void) | undefined;
    title: string;
    width?: number;
}



/**
 * Chooses desktop side-panel or mobile bottom-sheet behavior at one breakpoint.
 * Used by every root application tool and editor.
 * Preserves one controlled content tree and accessible heading contract.
 */
export function ResponsivePanel({
    children,
    description,
    footer,
    headingId,
    onClose,
    onWidthChange,
    title,
    width,
}: ResponsivePanelProps)
{
    const isMobile = useMediaQuery('(max-width: 48rem)');

    if (isMobile)
    {
        return (
            <MobileDrawer
                description={description}
                footer={footer}
                headingId={headingId}
                isOpen
                onClose={onClose}
                title={title}
            >
                {children}
            </MobileDrawer>
        );
    }

    return (
        <PanelShell
            description={description}
            footer={footer}
            headingId={headingId}
            onClose={onClose}
            onWidthChange={onWidthChange}
            title={title}
            width={width}
        >
            {children}
        </PanelShell>
    );
}
