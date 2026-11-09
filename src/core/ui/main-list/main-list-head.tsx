"use client";
import {forwardRef} from "react";
import {Text} from "../text";
import {HStack} from "styled-system/jsx";
import {mainListSlotClassNames} from "./main-list-context";
import type {MainListHeaderConfig} from "./main-list.types";
import {css} from "styled-system/css";
import {getHeaderCellStyle} from "./main-list-column-utils";

export interface RowHeaderProps {
    headers?: MainListHeaderConfig[];
    selectMode?: boolean;
    selectOpen?: boolean;
}

export const RowHeader = forwardRef<HTMLDivElement, RowHeaderProps>(function RowHeader(
    {headers = [], selectMode = false, selectOpen = false, ...props},
    ref
) {
    return (
        <HStack
            ref={ref}
            className={`${mainListSlotClassNames.rowHeader()} ${css({fontSize: "xs"})}`}
            style={
                {
                    color: "var(--colors-fg-subtle)",
                    backgroundColor: "var(--colors-bg-subtle)",
                } as React.CSSProperties
            }
            data-select-mode={selectMode}
            data-select-open={selectOpen}
            {...props}>
            <div
                className={mainListSlotClassNames.rowSelect()}
                style={{
                    width: "var(--main-list-select-width, 0px)",
                    maxWidth: "var(--main-list-select-width, 0px)",
                    overflow: "hidden",
                }}
            />
            {headers.map((header: MainListHeaderConfig) => (
                <div key={header.key} className={mainListSlotClassNames.rowCell()} style={getHeaderCellStyle(header)}>
                    <Text color="fg.muted">{header.label}</Text>
                </div>
            ))}
            <div className={mainListSlotClassNames.rowButton()} />
        </HStack>
    );
});
RowHeader.displayName = "MainList.RowHeader";
