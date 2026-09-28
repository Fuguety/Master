import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CountryAutocomplete } from "../components/CountryAutocomplete/CountryAutocomplete";
import { SearchableMultiSelect } from "../components/SearchableMultiSelect/SearchableMultiSelect";
import { StarRatingInput } from "../components/StarRatingInput/StarRatingInput";
import { SourceListEditor } from "../components/SourceListEditor/SourceListEditor";

describe("shared searchable and rating controls", () =>
{
    it("searches countries and supports keyboard selection and escape", () =>
    {
        const onChange = vi.fn();
        const onSelect = vi.fn();
        const { rerender } = render(
            <CountryAutocomplete onChange={onChange} onSelect={onSelect} value="Bra" />,
        );
        const input = screen.getByRole("combobox", { name: "Country" });

        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "Enter" });
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ code: "BRA", name: "Brazil" }));

        rerender(<CountryAutocomplete onChange={onChange} onSelect={onSelect} value="Uni" />);
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "Escape" });
        expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("commits and clears half-step star ratings with the keyboard", () =>
    {
        const onChange = vi.fn();
        render(<StarRatingInput label="Payment" onChange={onChange} value={2.5} />);
        const slider = screen.getByRole("slider", { name: "Payment" });

        fireEvent.keyDown(slider, { key: "ArrowRight" });
        expect(onChange).toHaveBeenCalledWith(3);
        fireEvent.click(screen.getByRole("button", { name: "Clear" }));
        expect(onChange).toHaveBeenCalledWith(null);
        expect(screen.getByText("2.5")).toBeInTheDocument();
    });

    it("searches, checks, chips, removes, and clears multiple filter values", () =>
    {
        const onChange = vi.fn();
        const options = [
            { label: "Brazil", value: "Brazil" },
            { label: "Germany", value: "Germany" },
        ];
        const { rerender } = render(
            <SearchableMultiSelect label="Countries" onChange={onChange} options={options} value={[]} />,
        );
        const input = screen.getByRole("combobox", { name: "Countries" });

        fireEvent.change(input, { target: { value: "Ger" } });
        fireEvent.click(screen.getByRole("checkbox", { name: "Germany" }));
        expect(onChange).toHaveBeenCalledWith(["Germany"]);

        rerender(<SearchableMultiSelect label="Countries" onChange={onChange} options={options} value={["Germany"]} />);
        fireEvent.click(screen.getByRole("button", { name: /Germany/u }));
        expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it("ignores empty sources and validates partially completed rows", () =>
    {
        const onAdd = vi.fn();
        render(
            <SourceListEditor
                onAdd={onAdd}
                onDelete={() => undefined}
                onUpdate={() => undefined}
                sources={[]}
            />,
        );
        const addButton = screen.getByRole("button", { name: "Add source" });

        expect(addButton).toBeDisabled();
        fireEvent.change(screen.getByRole("textbox", { name: "Source title" }), { target: { value: "Ranking" } });
        expect(screen.getByText(/Complete both title/u)).toBeInTheDocument();
        expect(onAdd).not.toHaveBeenCalled();
    });
});

