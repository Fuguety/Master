import type { CompanyTag, RatingResult } from "../../types";
import { CompanyIcon } from "../../tags/icons/CompanyIcon";
import { TagDetailsCard } from "../TagDetailsCard/TagDetailsCard";
import { formatMetric } from "../formatters";

export interface CompanyPopupProps
{
    busy?: boolean;
    locale?: string;
    onClose?: () => void;
    onDelete: (tagId: string) => void;
    onEdit: (tagId: string) => void;
    ratingResult: RatingResult;
    tag: CompanyTag;
}

/**
 * Adapts every company-specific field into the shared tag details card.
 * Used inside the floating React map-details overlay.
 * Preserves company-specific labels, iconography, and actions.
 */
export function CompanyPopup({
    busy = false,
    locale,
    onClose,
    onDelete,
    onEdit,
    ratingResult,
    tag,
}: CompanyPopupProps)
{
    const detailFields = [
        { label: "Payment", value: formatMetric(tag.payment, locale) },
        { label: "Career growth", value: formatMetric(tag.careerGrowth, locale) },
        { label: "Location", value: formatMetric(tag.locationScore, locale) },
        { label: "Country tier", value: tag.countryTier.replace("-", " ") },
        { label: "Work model", value: tag.workModel },
        { label: "Internships", value: formatMetric(tag.internshipAvailability, locale) },
        { label: "Industry", value: tag.industry ?? "Not specified" },
        { label: "Area", value: tag.companyArea ?? "Not specified" },
    ];

    return (
        <TagDetailsCard
            busy={busy}
            detailFields={detailFields}
            icon={<CompanyIcon />}
            locale={locale}
            onClose={onClose}
            onDelete={onDelete}
            onEdit={onEdit}
            ratingResult={ratingResult}
            tag={tag}
        />
    );
}
