import {defineSlotRecipe} from "@pandacss/dev";

export const mainList = defineSlotRecipe({
    className: "main-list",
    slots: [
        "root",
        "toolbar",
        "rows",
        "rowWrapper",
        "rowSelect",
        "rowContent",
        "rowCell",
        "rowButton",
        "rowToolbar",
        "rowHeader",
        "footer",
        "massManage",
        "primaryActions",
        "secondaryActions",
    ],
    base: {
        root: {
            display: "flex",
            flexDirection: "column",
            width: "full",
            gap: "0",
        },
        toolbar: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "4",
            flexWrap: "wrap",
        },
        rows: {
            display: "flex",
            flexDirection: "column",
            gap: "0",
        },
        rowWrapper: {
            display: "flex",
            flexDirection: "row", //must be row for the select and button columns to remain on the same row as the content
            flexWrap: {base: "wrap", md: "nowrap"}, // D2: wrap on small screens to allow toolbar to be below the content
            alignItems: "center",
            gap: 2,
            padding: "0",
            width: "100%",
            justifyContent: "flex-start",
            transition: "all 0.4s ease",
            _hover: {
                bg: "gray.surface.bg.hover",
            },
            // D2: the managed row sits above the row-toolbar overlay (overlay is
            // zIndex 50) when its toolbar is open. Driven by `data-toolbar-open`
            // so the recipe stays the single styling source (findings #8/#9).
            '&[data-toolbar-open="true"]': {
                position: "relative",
                zIndex: "60",
                bg: "gray.surface.bg",
            },
            // Select column width controlled by data-select-mode on the row
            // (avoids slot-targeting variant codegen issue).
            '&[data-select-mode="true"]': {
                "--main-list-select-width": "48px",
            },
            '&[data-select-mode="false"]': {
                "--main-list-select-width": "0px",
            },
            '&[data-select-open="true"]': {
                "--main-list-select-width": "48px",
            },
        },
        rowSelect: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "var(--main-list-select-width, 0px)",
            maxWidth: "var(--main-list-select-width, 0px)",
            overflow: "hidden",
            flexShrink: "0",
            transition: "all 0.4s ease",
        },
        rowContent: {
            flex: "1",
            minWidth: "0",
            display: "flex",
            flexDirection: "row",
            gap: "1",
        },
        rowCell: {
            flex: "0 0 auto",
            minWidth: "0",
            padding: "0 1",
        },
        rowButton: {
            flexShrink: "0",
            order: {base: 0, md: 1}, // at base: before toolbar; at md: after toolbar
            // Custom style for when toolbar is open (button becomes close button)
            '&[aria-expanded="true"]': {
                bg: "gray.surface.bg.active",
            },
        },
        rowToolbar: {
            display: "flex",
            alignItems: "flex-end",
            gap: "2",
            width: {base: "full", md: "unset"}, //no width so that it can grow to fit the content
            maxHeight: {base: "0", md: "200px"},
            maxWidth: {base: "full", md: "0"},
            overflow: "hidden",
            transition: "all 0.4s ease",
            boxShadow: "inset",
            background: "gray.surface.bg.active",
            order: {base: 1, md: 0}, // at base: after button; at md: before button
            '&[data-open="true"]': {
                maxHeight: "200px",
                maxWidth: "full",
            },
        },
        rowHeader: {
            display: "flex",
            alignItems: "center",
            gap: 2,
            paddingTop: 2,
            paddingBottom: 2,
            fontWeight: "bold",
            color: "fg.muted",
            bg: "bg.subtle",
            borderBottomWidth: "1px",
            borderColor: "border",
        },
        footer: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "3",
            borderColor: "border",
        },
        massManage: {
            display: "flex",
            alignItems: "flex-start",
            gap: "2",
            bg: "bg.subtle",
            borderColor: "border",
            maxHeight: "0",
            overflow: "hidden",
            transition: "all 0.4s ease",
            // D2: animation is driven by the data-visible attribute set on the element.
            '&[data-visible="true"]': {
                maxHeight: "500px",
                borderWidth: "1px",
                padding: 2,
            },
        },
        primaryActions: {
            display: "flex",
            alignItems: "flex-start",
            gap: "2",
        },
        secondaryActions: {
            display: "flex",
            alignItems: "flex-end",
            gap: "2",
        },
    },
    defaultVariants: {
        size: "md",
    },
    variants: {
        size: {
            sm: {
                rowWrapper: {padding: "0", gap: "2", paddingTop: 1, paddingBottom: 1},
                rowHeader: {
                    paddingTop: 2,
                    paddingBottom: 2,
                    gap: "2",
                },
                footer: {padding: "0"},
            },
            md: {
                rowWrapper: {padding: "2", gap: "0", paddingTop: "0", paddingBottom: "0"},
                rowContent: {paddingTop: 2, paddingBottom: 2},
                rowHeader: {
                    paddingTop: 2,
                    paddingBottom: 2,
                    gap: "3",
                },
                footer: {padding: "0"},
            },
            lg: {
                rowWrapper: {padding: "0", gap: "3", paddingTop: "3", paddingBottom: "3"},
                rowHeader: {
                    paddingTop: 2,
                    paddingBottom: 2,
                    gap: "3",
                },
                footer: {
                    paddingTop: 2,
                    paddingBottom: 2,
                },
            },
        },
    },
});
