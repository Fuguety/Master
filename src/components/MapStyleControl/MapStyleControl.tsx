import type { MapStyleId } from "../../map/mapStyles";
import styles from "./MapStyleControl.module.css";

export interface MapStyleControlProps
{
    disabled?: boolean;
    onChange: (styleId: MapStyleId) => void;
    value: MapStyleId;
}

/**
 * Renders the controlled cartographic and satellite map style switcher.
 * Used in map controls and the settings panel.
 * Emits the chosen open-map presentation identifier.
 */
export function MapStyleControl({ disabled = false, onChange, value }: MapStyleControlProps)
{
    return (
        <fieldset className={styles.control} disabled={disabled}>
            <legend>Map style</legend>
            <div className={styles.options}>
                <label data-active={value === "cartographic"}>
                    <input
                        checked={value === "cartographic"}
                        name="map-style"
                        onChange={() => onChange("cartographic")}
                        type="radio"
                        value="cartographic"
                    />
                    <span aria-hidden="true" className={styles.cartographicPreview} />
                    <strong>Cartographic</strong>
                    <small>Roads, labels, and boundaries</small>
                </label>
                <label data-active={value === "satellite"}>
                    <input
                        checked={value === "satellite"}
                        name="map-style"
                        onChange={() => onChange("satellite")}
                        type="radio"
                        value="satellite"
                    />
                    <span aria-hidden="true" className={styles.satellitePreview} />
                    <strong>Satellite</strong>
                    <small>Imagery with place labels</small>
                </label>
            </div>
        </fieldset>
    );
}

