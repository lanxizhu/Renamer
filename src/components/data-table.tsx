import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { X } from "lucide-react"

import { Fragment, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./ui/input-group"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  children: React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  children,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    [],
  )
  const [columnVisibility, setColumnVisibility]
    = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const [expanded, setExpanded] = useState({})

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    getSubRows: row => row.children,
    getRowCanExpand: row => row.children?.length,
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),

    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,

    state: {
      expanded,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-2 py-4">
        <InputGroup className="max-w-xs bg-background dark:bg-input/30">
          <InputGroupInput
            placeholder="按名称筛选文件"
            value={(table.getColumn("target")?.getFilterValue() as string) ?? ""}
            onChange={event =>
              table.getColumn("target")?.setFilterValue(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Copy"
              title="Copy"
              size="icon-xs"
              onClick={() => {
                table.getColumn("target")?.setFilterValue("")
              }}
            >
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        {children && <>{children}</>}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto hidden">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter(
                column => column.getCanHide(),
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={value =>
                      column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-full ">
        <div>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow className="bg-background hover:bg-background sticky top-0 z-10" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="bg-background dark:bg-input/30">
              {table.getRowModel().rows?.length
                ? (
                    table.getRowModel().rows.map(row => (
                      <Fragment key={row.id}>
                        <TableRow
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                        {row.getIsExpanded() && (
                          <Fragment>
                            <TableRow className="bg-muted">
                              {row.subRows.map(cell => (
                                <TableCell key={cell.id}>
                                  {/* {flexRender(cell.column.columnDef.cell, cell.getContext())} */}
                                </TableCell>
                              ))}
                            </TableRow>
                          </Fragment>
                        )}
                      </Fragment>
                    ))
                  )
                : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-48 text-center">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
            </TableBody>
          </Table>
        </div>
      </div>

      {data.length > 0 && (
        <DataTablePagination table={table} />
      )}
    </div>
  )
}
