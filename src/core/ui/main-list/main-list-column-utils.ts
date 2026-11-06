"use client";
import type {MainListHeaderConfig} from "./main-list.types";

/**
 * Shared column style utilities for MainList.
 * Ensures header cells and row cells receive identical layout settings.
 */

/** Style object for a single column */
export interface ColumnStyle {
    width?: string;
    minWidth?: string | number;
    maxWidth?: string;
    flex?: string;
    textAlign?: "left" | "center" | "right";
    padding?: string;
    overflow?: "hidden";
    textOverflow?: "ellipsis";
    whiteSpace?: "nowrap";
}

/**
 * Generate column styles from headers config.
 * Used by both RowHeader (for header cells) and RowContent (for row cells).
 */
export function getColumnStyles(headers: MainListHeaderConfig[]): ColumnStyle[] {
    return headers.map((header) => {
        const isFlexWidth = header.width === "1fr";
        return {
            width: header.width,
            minWidth: isFlexWidth ? 0 : header.width,
            maxWidth: isFlexWidth ? undefined : header.width,
            flex: isFlexWidth ? "1 1 0%" : `0 0 ${header.width}`,
            textAlign: header.align ?? "left",
            alignItems: header.align ?? "left",
            padding: "3",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
        };
    });
}

/**
 * Generate inline styles for a header cell.
 * Includes additional header-specific styles.
 */
export function getHeaderCellStyle(header: MainListHeaderConfig): React.CSSProperties {
    const isFlexWidth = header.width === "1fr";
    return {
        padding: "3",
        textAlign: header.align ?? "left",
        flex: isFlexWidth ? "1 1 0%" : `0 0 ${header.width}`,
        minWidth: isFlexWidth ? undefined : header.width,
        maxWidth: isFlexWidth ? undefined : header.width,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    };
}

/**
 * Generate props for a row Cell component from header config.
 * Used by RowContent to automatically style Cell children.
 */
export function getCellPropsFromHeader(header: MainListHeaderConfig): {
    width?: string;
    align?: "left" | "center" | "right";
    flex?: string;
    minWidth?: string | number;
} {
    const isFlexWidth = header.width === "1fr";
    return {
        width: header.width,
        align: header.align ?? "left",
        flex: isFlexWidth ? "1 1 0%" : undefined,
        minWidth: isFlexWidth ? 0 : undefined,
    };
}
