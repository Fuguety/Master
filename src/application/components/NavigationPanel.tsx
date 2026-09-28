import styles from './NavigationPanel.module.css';

export interface NavigationItem
{
    badge?: number;
    description: string;
    icon: string;
    id: string;
    label: string;
}

export interface NavigationPanelProps
{
    items: readonly NavigationItem[];
    onSelect: (itemId: string) => void;
}



/**
 * Renders the expanded mobile navigation counterpart to the compact tool rail.
 * Used by the header menu action on small screens.
 * Emits the selected root tool identifier.
 */
export function NavigationPanel({ items, onSelect }: NavigationPanelProps)
{
    return (
        <nav aria-label="Application tools" className={styles.navigation}>
            {items.map((item) => (
                <button key={item.id} onClick={() => onSelect(item.id)} type="button">
                    <span aria-hidden="true" className={styles.icon}>{item.icon}</span>
                    <span className={styles.text}>
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                    </span>
                    {item.badge !== undefined && item.badge > 0
                        ? <span className={styles.badge}>{item.badge}</span>
                        : null}
                </button>
            ))}
        </nav>
    );
}
