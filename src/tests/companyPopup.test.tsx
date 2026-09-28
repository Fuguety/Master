import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { calculateTagRating } from "../application";
import { TagDetailsOverlay } from "../application/components/TagDetailsOverlay";
import { FloatingWindowManager } from "../components/FloatingWindowManager/FloatingWindowManager";
import { createCompanyFixture } from "./domainFixtures";

describe("company marker details popup", () =>
{
    it("keeps long company content available inside the responsive floating window", () =>
    {
        const company = createCompanyFixture({
            name: "A Company With A Very Long Name That Must Remain Fully Readable",
            industry: "Advanced research, sustainable infrastructure, and international technology services",
            companyArea: "A highly specialized area whose description needs to wrap without clipping",
            notes: [{
                id: "long-note",
                text: "A long research note that remains visible and wraps inside the popup instead of overflowing its window.",
                createdAt: "2026-08-05T00:00:00.000Z",
                updatedAt: "2026-08-05T00:00:00.000Z",
            }],
            sources: [{
                id: "long-source",
                title: "Official company careers and research information with a long readable title",
                url: "https://example.com/company/careers/research/international-opportunities",
            }],
        });

        render(
            <FloatingWindowManager
                items={[{
                    content: (
                        <TagDetailsOverlay
                            onClose={vi.fn()}
                            onDelete={vi.fn()}
                            onEdit={vi.fn()}
                            rating={calculateTagRating(company)}
                            tag={company}
                        />
                    ),
                    id: company.id,
                    title: company.name,
                }]}
                onClose={vi.fn()}
            />,
        );

        expect(screen.getByRole("heading", { name: company.name })).toBeVisible();
        expect(screen.getByText(company.companyArea!)).toBeVisible();
        expect(screen.getByText(company.notes[0]!.text)).toBeVisible();
        expect(screen.getByRole("link", { name: company.sources[0]!.title })).toHaveAttribute(
            "href",
            company.sources[0]!.url,
        );
        expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
        expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();
    });
});
