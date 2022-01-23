import { children, elements, html, ref, when } from "@microsoft/fast-element";
import type { ViewTemplate } from "@microsoft/fast-element";
import type { DataGrid } from "./data-grid";
import { DataGridRow } from "./data-grid-row";

function createRowItemTemplate(context): ViewTemplate {
    const rowTag = context.tagFor(DataGridRow);
    return html`
    <${rowTag}
        style="
            grid-row:${(x, c) => c.index + 2};
            height:100%;
            width: 100%;
        "
        :rowData="${x => x}"
        :cellItemTemplate="${(x, c) => c.parent.cellItemTemplate}"
        :headerCellItemTemplate="${(x, c) => c.parent.headerCellItemTemplate}"
    ></${rowTag}>
`;
}

/**
 * Generates a template for the {@link @microsoft/fast-foundation#DataGrid} component using
 * the provided prefix.
 *
 * @public
 */
export const dataGridTemplate: (context, definition) => ViewTemplate<DataGrid> = (
    context,
    definition
) => {
    const rowItemTemplate: ViewTemplate = createRowItemTemplate(context);
    const rowTag = context.tagFor(DataGridRow);
    return html<DataGrid>`
        <template
            role="grid"
            tabindex="0"
            :rowElementTag="${() => rowTag}"
            :defaultRowItemTemplate="${rowItemTemplate}"
            ${children({
                property: "rowElements",
                filter: elements("[role=row]"),
            })}
        >
            <div
                style="
                    height: ${x => x.totalHeight}px;
                    display: grid;
                    grid-template-rows: ${x => x.topSpacerHeight}px repeat(${(x, c) =>
                    x.visibleItems.length}, ${x => x.itemSpan}px) ${x =>
                    x.bottomSpacerHeight}px;
                "
                ${ref("containerElement")}
            >
                <slot></slot>
            </div>
        </template>
    `;
};
