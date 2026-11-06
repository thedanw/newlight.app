"use client";
import {useState} from "react";
import {Eye, Trash2} from "lucide-react";
import type {ReactNode} from "react";
import {Box} from "styled-system/jsx";
import {AbsoluteCenter, Button, Group, Icon, MainList, Span, Text} from "@/core/ui";

/* ---------------------------------------------------------------------------
   Layout demos — AbsoluteCenter, Group, MainList, Span.
--------------------------------------------------------------------------- */

const MAIN_LIST_ITEMS = [
    {id: "1", name: "Alpha", status: "Active", count: 12},
    {id: "2", name: "Beta", status: "Draft", count: 3},
    {id: "3", name: "Gamma", status: "Active", count: 7},
];

function MainListDemo() {
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    const handleSelectAll = () => {
        setSelectedKeys(new Set(MAIN_LIST_ITEMS.map((item) => item.id)));
    };

    const handleSelectVisible = () => {
        setSelectedKeys(new Set(MAIN_LIST_ITEMS.map((item) => item.id)));
    };

    return (
        <MainList.Root
            items={MAIN_LIST_ITEMS}
            getKey={(item) => item.id}
            renderRow={(item) => (
                <MainList.RowContent
                    headers={[
                        {key: "name", label: "Name", width: "1fr"},
                        {key: "status", label: "Status", width: "120px"},
                        {key: "count", label: "Count", width: "120px"},
                    ]}>
                    <MainList.Cell>
                        <Text textStyle="sm" fontWeight="medium" truncate>
                            {item.name}
                        </Text>
                    </MainList.Cell>
                    <MainList.Cell>{item.status}</MainList.Cell>
                    <MainList.Cell>{item.count}</MainList.Cell>
                </MainList.RowContent>
            )}
            renderRowToolbar={(_item) => (
                <>
                    <Button variant="plain" size="sm" onClick={() => {}}>
                        <Icon size="sm">
                            <Eye />
                        </Icon>
                        View
                    </Button>
                    <Button variant="plain" size="sm" colorPalette="red" onClick={() => {}}>
                        <Icon size="sm">
                            <Trash2 />
                        </Icon>
                        Delete
                    </Button>
                </>
            )}
            headers={[
                {key: "name", label: "Name", width: "1fr"},
                {key: "status", label: "Status", width: "120px"},
                {key: "count", label: "Count", width: "120px"},
            ]}
            toolbar={{
                primaryActions: (
                    <MainList.PrimaryActions>
                        <MainList.MassManageButton onClick={handleSelectAll} />
                    </MainList.PrimaryActions>
                ),
            }}
            selection={{
                selectedKeys,
                onSelectionChange: setSelectedKeys,
                onSelectAll: handleSelectAll,
                onSelectVisible: handleSelectVisible,
                allFilteredKeys: MAIN_LIST_ITEMS.map((item) => item.id),
            }}
            massManage={{
                visible: selectedKeys.size > 0,
                onClose: () => setSelectedKeys(new Set()),
                onDeleteSelected: async () => {},
                selectedCount: selectedKeys.size,
            }}
        />
    );
}

export const layoutDemos: Record<string, ReactNode> = {
    AbsoluteCenter: (
        <Box position="relative" h="24" borderWidth="1px" borderColor="border" borderRadius="l2">
            <AbsoluteCenter>
                <Text textStyle="sm">Centered</Text>
            </AbsoluteCenter>
        </Box>
    ),
    Group: (
        <Group>
            <Button size="sm" variant="outline">
                Left
            </Button>
            <Button size="sm" variant="outline">
                Center
            </Button>
            <Button size="sm" variant="outline">
                Right
            </Button>
        </Group>
    ),
    MainList: <MainListDemo />,
    Span: (
        <Text textStyle="sm">
            Rendered with a{" "}
            <Span fontWeight="semibold" color="colorPalette.solid.fg">
                styled span
            </Span>{" "}
            inline.
        </Text>
    ),
};
