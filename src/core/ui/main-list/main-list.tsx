"use client";
import {useCallback, useMemo, useState, useEffect, useRef} from "react";
import {type ComponentProps} from "react";
import {Edit2, ChevronLeft, ChevronRight} from "lucide-react";
import {Icon} from "../icon";
import {Root as Pagination, PrevTrigger, NextTrigger, Items} from "../pagination";
import {Root, Rows, Footer, mainListCssVars} from "./main-list-context";
import {Stack} from "styled-system/jsx";
import {RowSelect} from "./main-list-row-select";
import {RowButton} from "./main-list-row-button";
import {RowWrapper} from "./main-list-row-wrapper";
import {RowContent} from "./main-list-row-content";
import {Cell} from "./main-list-cell";
import {RowToolbar} from "./main-list-row-toolbar";
import {RowHeader} from "./main-list-head";
import {Toolbar, MassManage, MassManageButton, PrimaryActions, SecondaryActions} from "./main-list-toolbar";
import type {MainListRootProps, MainListFooterProps} from "./main-list.types";
import {useMainListSelection} from "./use-main-list-selection";

export type RootProps = ComponentProps<typeof Root>;

/** Stable empty selection set (avoids re-creating a new Set each render). */
const EMPTY_SELECTION: ReadonlySet<string> = new Set<string>();

export function RootComponent<T>({
    items,
    getKey,
    renderRow,
    renderRowToolbar,
    onRowClick,
    headers = [],
    pagination,
    toolbar,
    selection,
    massManage,
    virtualized,
    ...props
}: MainListRootProps<T> & ComponentProps<"div">) {
    // D3: Root is the controlled owner of selection. There is no internal
    // `selectedKeys` state — the consumer's `selection.selectedKeys` is the
    // single source of truth (fixes split-brain, findings #3).
    const {selectedKeys, selectMode, selectionEnabled} = useMainListSelection({
        selection,
        items,
        getKey,
    });

    // Track which row's toolbar is open (by item key)
    const [openToolbarKey, setOpenToolbarKey] = useState<string | null>(null);

    // Virtualization state
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const rowsRef = useRef<HTMLDivElement>(null);

    // Virtualization config
    const rowHeight = virtualized?.rowHeight ?? 52;
    const overscan = virtualized?.overscan ?? 5;
    const isVirtualized = virtualized?.enabled ?? false;

    // Calculate visible range for virtualization
    const visibleRange = useMemo(() => {
        if (!isVirtualized || !containerHeight) {
            return {startIndex: 0, endIndex: items.length};
        }
        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
        const endIndex = Math.min(items.length, Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan);
        return {startIndex, endIndex};
    }, [isVirtualized, containerHeight, scrollTop, rowHeight, overscan, items.length]);

    // Single document-level listeners for all rows (Task 9)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openToolbarKey) {
                // Check if click is outside any row with open toolbar
                const target = event.target as Node;
                const rows = document.querySelectorAll('[data-toolbar-open="true"]');
                let clickedInsideOpenRow = false;
                rows.forEach((row) => {
                    if (row.contains(target)) {
                        clickedInsideOpenRow = true;
                    }
                });
                if (!clickedInsideOpenRow) {
                    setOpenToolbarKey(null);
                }
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && openToolbarKey) {
                event.stopPropagation();
                setOpenToolbarKey(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [openToolbarKey]);

    // Sync selection from props
    const handleSelectionChange = useCallback(
        (keys: Set<string>) => {
            selection?.onSelectionChange?.(keys);
        },
        [selection]
    );

    // Select all visible (current page)
    const handleSelectVisible = useCallback(() => {
        const visibleKeys = items.map(getKey);
        const newKeys = new Set([...selectedKeys, ...visibleKeys]);
        handleSelectionChange(newKeys);
        selection?.onSelectVisible?.(visibleKeys);
    }, [items, getKey, selectedKeys, handleSelectionChange, selection]);

    // Select all filtered (all matching search/filter, decision #28). Falls back
    // to the current page when the consumer doesn't supply `allFilteredKeys`.
    const handleSelectAll = useCallback(() => {
        const allKeys = selection?.allFilteredKeys ?? items.map(getKey);
        const newKeys = new Set([...selectedKeys, ...allKeys]);
        handleSelectionChange(newKeys);
        selection?.onSelectAll?.(allKeys);
    }, [items, getKey, selectedKeys, handleSelectionChange, selection]);

    // Deselect all
    const handleDeselectAll = useCallback(() => {
        handleSelectionChange(new Set());
    }, [handleSelectionChange]);

    // Delete selected. A rejection from the consumer means the flow was
    // cancelled (e.g. the confirm dialog was dismissed) or failed — keep the
    // current selection rather than surfacing an unhandled rejection.
    const handleDeleteSelected = useCallback(async () => {
        if (massManage?.onDeleteSelected && selectedKeys.size > 0) {
            try {
                await massManage.onDeleteSelected(Array.from(selectedKeys));
                handleSelectionChange(new Set());
            } catch {
                // Intentionally ignored: selection is preserved on cancel/failure.
            }
        }
    }, [massManage, selectedKeys, handleSelectionChange]);

    // Close mass manage
    const handleMassManageClose = useCallback(() => {
        handleSelectionChange(new Set());
        massManage?.onClose?.();
    }, [handleSelectionChange, massManage]);

    // Render rows
    const rows = useMemo(() => {
        return items.map((item, index) => {
            const key = getKey(item);
            const isSelected = selectedKeys.has(key);
            const isToolbarOpen = openToolbarKey === key;
            return (
                <RowWrapper
                    key={key}
                    item={item}
                    index={index}
                    selected={isSelected}
                    selectMode={selectMode}
                    onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                    onSelect={
                        selectionEnabled
                            ? () => {
                                  const newKeys = new Set(selectedKeys);
                                  newKeys.add(key);
                                  handleSelectionChange(newKeys);
                              }
                            : undefined
                    }
                    select={
                        <RowSelect
                            checked={isSelected}
                            onChange={(checked: boolean) => {
                                const newKeys = new Set(selectedKeys);
                                if (checked) newKeys.add(key);
                                else newKeys.delete(key);
                                handleSelectionChange(newKeys);
                            }}
                        />
                    }
                    button={
                        <RowButton
                            icon={
                                <Icon size="sm">
                                    <Edit2 />
                                </Icon>
                            }
                            label="Manage"
                        />
                    }
                    toolbar={renderRowToolbar?.(item, index, headers)}
                    open={isToolbarOpen}
                    onClose={() => setOpenToolbarKey(null)}
                    onOpen={() => setOpenToolbarKey(key)}>
                    {renderRow(item, index, headers)}
                </RowWrapper>
            );
        });
    }, [
        items,
        getKey,
        selectedKeys,
        selectMode,
        selectionEnabled,
        handleSelectionChange,
        renderRow,
        renderRowToolbar,
        onRowClick,
        headers,
        openToolbarKey,
    ]);

    // Mass manage component
    const massManageComponent = useMemo(() => {
        if (!massManage) return null;
        const visibleKeys = items.map(getKey);
        const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selectedKeys.has(k));
        // "Select All" must be evaluated against every key matching the search
        // (decision #28), not just the current page — fall back to the page when
        // the consumer doesn't supply `allFilteredKeys`.
        const filteredKeys = selection?.allFilteredKeys ?? visibleKeys;
        const allFilteredSelected = filteredKeys.length > 0 && filteredKeys.every((k) => selectedKeys.has(k));

        return (
            <MassManage
                selectedCount={selectedKeys.size}
                allVisibleSelected={allVisibleSelected}
                allFilteredSelected={allFilteredSelected}
                onSelectVisible={handleSelectVisible}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onDeleteSelected={handleDeleteSelected}
                onClose={handleMassManageClose}
                deleting={massManage.deleting}
            />
        );
    }, [
        massManage,
        selection?.allFilteredKeys,
        items,
        getKey,
        selectedKeys,
        handleSelectVisible,
        handleSelectAll,
        handleDeselectAll,
        handleDeleteSelected,
        handleMassManageClose,
    ]);

    // Toolbar component
    const toolbarComponent = useMemo(() => {
        if (!toolbar) return null;
        return (
            <Toolbar
                primaryActions={toolbar.primaryActions}
                massManage={massManageComponent}
                secondaryActions={toolbar.secondaryActions}
            />
        );
    }, [toolbar, massManageComponent]);

    const totalHeight = items.length * rowHeight;
    const offsetY = visibleRange.startIndex * rowHeight;

    // Render rows - virtualized or normal
    const renderedRows = isVirtualized ? (
        <>
            <div style={{height: totalHeight, position: "relative"}}>
                <div
                    ref={rowsRef}
                    style={{
                        transform: `translateY(${offsetY}px)`,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                    }}
                    onScroll={(e) => {
                        setScrollTop(e.currentTarget.scrollTop);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContainerHeight(rect.height);
                    }}>
                    {items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, relativeIndex) => {
                        const index = visibleRange.startIndex + relativeIndex;
                        const key = getKey(item);
                        const isSelected = selectedKeys.has(key);
                        const isToolbarOpen = openToolbarKey === key;
                        return (
                            <RowWrapper
                                key={key}
                                item={item}
                                index={index}
                                selected={isSelected}
                                selectMode={selectMode}
                                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                                onSelect={
                                    selectionEnabled
                                        ? () => {
                                              const newKeys = new Set(selectedKeys);
                                              newKeys.add(key);
                                              handleSelectionChange(newKeys);
                                          }
                                        : undefined
                                }
                                select={
                                    <RowSelect
                                        checked={isSelected}
                                        onChange={(checked: boolean) => {
                                            const newKeys = new Set(selectedKeys);
                                            if (checked) newKeys.add(key);
                                            else newKeys.delete(key);
                                            handleSelectionChange(newKeys);
                                        }}
                                    />
                                }
                                button={
                                    <RowButton
                                        icon={
                                            <Icon size="sm">
                                                <Edit2 />
                                            </Icon>
                                        }
                                        label="Manage"
                                    />
                                }
                                toolbar={renderRowToolbar?.(item, index, headers)}
                                open={isToolbarOpen}
                                onClose={() => setOpenToolbarKey(null)}
                                onOpen={() => setOpenToolbarKey(key)}>
                                {renderRow(item, index, headers)}
                            </RowWrapper>
                        );
                    })}
                </div>
            </div>
        </>
    ) : (
        <Rows>{rows}</Rows>
    );

    return (
        <Root ref={props.ref} className={mainListCssVars} {...props}>
            {toolbarComponent}
            {headers.length > 0 && (
                <RowHeader headers={headers} selectMode={selectMode} selectOpen={selectedKeys.size > 0} />
            )}
            {renderedRows}
            {pagination && (
                <FooterComponent
                    currentPage={pagination.page}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onPageChange={pagination.onPageChange}
                />
            )}
        </Root>
    );
}

RootComponent.displayName = "MainList.Root";

// Add sub-components to Root
Object.assign(RootComponent, {
    RowWrapper,
    RowHeader,
    Toolbar,
    Footer: FooterComponent,
    Rows,
});

Object.assign(Toolbar, {
    PrimaryActions,
    SecondaryActions,
    MassManage,
});

Object.assign(RowWrapper, {
    Select: RowSelect,
    Button: RowButton,
    Toolbar: RowToolbar,
    Content: RowContent,
    Cell: Cell,
});

// Footer component
export type FooterProps = ComponentProps<typeof FooterComponent>;

export function FooterComponent({
    currentPage,
    pageSize,
    total,
    onPageChange,
    ...props
}: MainListFooterProps & ComponentProps<"div">) {
    return (
        <Footer {...props}>
            <Stack className="main-list__footer-text" fontSize="sm" color="fg.muted">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total}
            </Stack>
            <Pagination
                count={total}
                pageSize={pageSize}
                page={currentPage as any}
                onPageChange={(details) => onPageChange(details.page)}>
                <PrevTrigger>
                    <Icon size="sm">
                        <ChevronLeft />
                    </Icon>
                </PrevTrigger>
                <Items render={(page) => <button type="button">{page.value}</button>} />
                <NextTrigger>
                    <Icon size="sm">
                        <ChevronRight />
                    </Icon>
                </NextTrigger>
            </Pagination>
        </Footer>
    );
}

FooterComponent.displayName = "MainList.Footer";
RootComponent.Footer = FooterComponent;

// Rows container (for direct use if needed)
export type RowsProps = ComponentProps<typeof Rows>;

export function RowsComponent({children, ...props}: ComponentProps<"div">) {
    return <Rows {...props}>{children}</Rows>;
}

RowsComponent.displayName = "MainList.Rows";
RootComponent.Rows = RowsComponent;

// Export MainList namespace for proper sub-component access
export const MainList = {
    Root: RootComponent,
    RowWrapper,
    RowHeader,
    Toolbar,
    Footer: FooterComponent,
    Rows: RowsComponent,
    RowSelect,
    RowButton,
    RowToolbar,
    RowContent,
    Cell,
    PrimaryActions,
    SecondaryActions,
    MassManage,
    MassManageButton,
} as const;
