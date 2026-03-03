import type { Table } from "@tanstack/react-table"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="mt-2 flex items-center justify-between px-2">
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getFilteredSelectedRowModel().rows.length}
        {" "}
        of
        {" "}
        {table.getFilteredRowModel().rows.length}
        {" "}
        row(s) selected.
      </div>
    </div>
  )
}
