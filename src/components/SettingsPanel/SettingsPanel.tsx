import type { MapStyleId } from "../../map/mapStyles";
import type { GeographicNameMode, ThemeDefinition, ThemeId } from "../../types";
import { CheckboxField } from "../forms/CheckboxField";
import { MapStyleControl } from "../MapStyleControl/MapStyleControl";
import { ThemeSelector } from "../ThemeSelector/ThemeSelector";
import { SelectField } from "../forms/SelectField";
import styles from "./SettingsPanel.module.css";

export interface SettingsPanelProps
{
    clusteringEnabled: boolean;
    mapStyle: MapStyleId;
    geographicNameMode: GeographicNameMode;
    onClusteringChange: (enabled: boolean) => void;
    onMapStyleChange: (style: MapStyleId) => void;
    onGeographicNameModeChange: (mode: GeographicNameMode) => void;
    onThemeChange: (theme: ThemeId) => void;
    theme: ThemeId;
    themes: readonly ThemeDefinition[];
}

/**
 * Renders controlled presentation and map-rendering settings.
 * Used inside the settings panel without mutating application logic.
 * Emits independent theme, map-style, and clustering preferences.
 */
export function SettingsPanel({
    clusteringEnabled,
    mapStyle,
    geographicNameMode,
    onClusteringChange,
    onMapStyleChange,
    onGeographicNameModeChange,
    onThemeChange,
    theme,
    themes,
}: SettingsPanelProps)
{
    return (
        <div className={styles.settings}>
            <section>
                <h3>Appearance</h3>
                <p>Themes change presentation only; tags and scores remain unchanged.</p>
                <ThemeSelector onChange={onThemeChange} themes={themes} value={theme} />
                <SelectField
                    label="Geographic names"
                    onChange={onGeographicNameModeChange}
                    options={[
                        { label: "English names", value: "english" },
                        { label: "Original / local names", value: "original" },
                        { label: "English with original name", value: "english-original" },
                    ]}
                    value={geographicNameMode}
                />
            </section>
            <section>
                <h3>Map canvas</h3>
                <p>Choose the base map and tune dense marker presentation.</p>
                <MapStyleControl onChange={onMapStyleChange} value={mapStyle} />
                <CheckboxField
                    checked={clusteringEnabled}
                    hint="Groups nearby tags at lower zoom levels for faster rendering."
                    label="Cluster nearby tags"
                    onChange={onClusteringChange}
                />
            </section>
        </div>
    );
}
