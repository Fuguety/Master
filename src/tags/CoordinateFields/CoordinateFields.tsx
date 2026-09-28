import type { Coordinates } from "../../types";
import { NumberField } from "../../components/forms/NumberField";

export interface CoordinateFieldsProps
{
    disabled?: boolean;
    latitudeError?: string;
    longitudeError?: string;
    onChange: (coordinates: Coordinates) => void;
    value: Coordinates;
}

/**
 * Renders precise WGS84 longitude and latitude inputs as a controlled pair.
 * Used by both tag forms after map click or marker drag interactions.
 * Emits a complete coordinate object whenever either value changes.
 */
export function CoordinateFields({
    disabled = false,
    latitudeError,
    longitudeError,
    onChange,
    value,
}: CoordinateFieldsProps)
{
    return (
        <>
            <NumberField
                disabled={disabled}
                error={longitudeError}
                hint="Decimal degrees from −180 to 180."
                label="Longitude"
                max={180}
                min={-180}
                name="longitude"
                onChange={(longitude) => onChange({ ...value, longitude: longitude ?? 0 })}
                required
                step={0.000001}
                value={value.longitude}
            />
            <NumberField
                disabled={disabled}
                error={latitudeError}
                hint="Decimal degrees from −90 to 90."
                label="Latitude"
                max={90}
                min={-90}
                name="latitude"
                onChange={(latitude) => onChange({ ...value, latitude: latitude ?? 0 })}
                required
                step={0.000001}
                value={value.latitude}
            />
        </>
    );
}

