"use client";

import {useCallback, useMemo} from "react";

/** Stable empty selection set (avoids re-creating a new Set each render). */
const EMPTY_SELECTION: ReadonlySet<string> = new Set<string>;

/**
 * Custom hook for Main-List selection logic.
 * Extracts selection state and callbacks from MainList.RootComponent.
 * 
 * @param selection - The selection prop from the parent (optional, controlled)
 * @param items - The data items (needed for handleSelectVisible/handleSelectAll)
 * @param getKey - Function to get the key from an item
 * 
 * @returns Object with selection state and callback functions
 */
export function useMainListSelection<T>({
    selection,
    items,
    getKey,
}: {
    selection?: { selectedKeys: Set<string>; onSelectionChange?: (keys: Set<string>) => void; onSelectVisible?: (keys: Set<string>) => void; onSelectAll?: (keys: Set<string>) => void; onDeselectAll?: () => void; allFilteredKeys?: Set<string> } | undefined;
    items: T[];
    getKey: (item: T) => string;
}) {
    // Derive selection from props or use empty set
    const selectedKeys = useMemo(() => selection?.selectedKeys ?? EMPTY_SELECTION, [selection?.selectedKeys]);
    const selectMode = useMemo(() => selectedKeys.size > 0, [selectedKeys]);
    const selectionEnabled = useMemo(() => selection !== undefined, [selection]);

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

    // Select all filtered (all matching search/filter, falls back to current page)
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

    return {
        selectedKeys,
        selectMode,
        selectionEnabled,
        handleSelectionChange,
        handleSelectVisible,
        handleSelectAll,
        handleDeselectAll,
    };
}