import type { RatingResult, UniversityTag } from "../../types";
import { UniversityIcon } from "../../tags/icons/UniversityIcon";
import { TagDetailsCard } from "../TagDetailsCard/TagDetailsCard";
import { formatMetric } from "../formatters";

export interface UniversityPopupProps
{
    busy?: boolean;
    locale?: string;
    onClose?: () => void;
    onDelete: (tagId: string) => void;
    onEdit: (tagId: string) => void;
    ratingResult: RatingResult;
    tag: UniversityTag;
}

/**
 * Adapts every university-specific field into the shared tag details card.
 * Used inside the floating React map-details overlay.
 * Preserves university-specific labels, iconography, and actions.
 */
export function UniversityPopup({
    busy = false,
    locale,
    onClose,
    onDelete,
    onEdit,
    ratingResult,
    tag,
}: UniversityPopupProps)
{
    const detailFields = [
        { label: "Location", value: formatMetric(tag.locationScore, locale) },
        { label: "Quality of life", value: formatMetric(tag.qualityOfLife, locale) },
        { label: "Affordability", value: formatMetric(tag.affordability, locale) },
        { label: "Job opportunities", value: formatMetric(tag.jobOpportunities, locale) },
        { label: "Job placement help", value: formatMetric(tag.jobPlacementSupport, locale) },
        { label: "Regional companies", value: formatMetric(tag.regionalCompanies, locale) },
        { label: "Global reputation", value: formatMetric(tag.globalReputation, locale) },
        { label: "Local reputation", value: formatMetric(tag.localReputation, locale) },
        { label: "Global ranking", value: formatMetric(tag.globalRanking, locale) },
        { label: "Local ranking", value: formatMetric(tag.localRanking, locale) },
        { label: "Commute", value: formatMetric(tag.commuteQuality, locale) },
        { label: "Country tier", value: tag.countryTier.replace("-", " ") },
    ];

    return (
        <TagDetailsCard
            busy={busy}
            detailFields={detailFields}
            icon={<UniversityIcon />}
            locale={locale}
            onClose={onClose}
            onDelete={onDelete}
            onEdit={onEdit}
            ratingResult={ratingResult}
            tag={tag}
        />
    );
}
