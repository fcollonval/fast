import { children, elements, html, ref, when } from "@microsoft/fast-element";
import type { ViewTemplate } from "@microsoft/fast-element";
import type { DataGrid } from "./data-grid";
import { DataGridRow } from "./data-grid-row";

function createRowItemTemplate(context): ViewTemplate {
    const rowTag = context.tagFor(DataGridRow);
    return html`
    <${rowTag}
        style="
            grid-row:${(x, c) => c.index + c.parent.virtualizedIndexOffset};
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
                    display: grid;
                    height: ${x => x.totalStackSpan}px;
                    grid-template-rows:${x => x.gridTemplateSpans};
                "
                ${ref("containerElement")}
            >
                <slot></slot>
            </div>
        </template>
    `;
};
