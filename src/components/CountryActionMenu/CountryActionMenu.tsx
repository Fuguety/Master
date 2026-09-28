import type { Coordinates, TagType } from "../../types";
import styles from "./CountryActionMenu.module.css";

export interface CountryActionMenuProps
{
    coordinates: Coordinates;
    onCreate: (type: TagType, coordinates: Coordinates) => void;
    onDismiss: () => void;
}

/**
 * Presents explicit actions after a repeated click inside the selected country.
 * Used to avoid accidental creation while preserving the exact clicked coordinates.
 */
export function CountryActionMenu({ coordinates, onCreate, onDismiss }: CountryActionMenuProps)
{
    return (
        <aside className={styles.menu} aria-label="Selected country actions">
            <strong>What would you like to do here?</strong>
            <span>{coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</span>
            <div>
                <button onClick={() => onCreate("university", coordinates)} type="button">Add University here</button>
                <button onClick={() => onCreate("company", coordinates)} type="button">Add Company here</button>
                <button onClick={() => onCreate("note", coordinates)} type="button">Add Note here</button>
                <button onClick={onDismiss} type="button">Edit country highlight</button>
                <button onClick={onDismiss} type="button">View country information</button>
            </div>
        </aside>
    );
}
