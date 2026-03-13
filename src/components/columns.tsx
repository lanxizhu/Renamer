import type { ColumnDef } from "@tanstack/react-table"
import type { DirEntry } from "@tauri-apps/plugin-fs"

import type { ComponentType, SVGProps } from "react"

import { open } from "@tauri-apps/plugin-dialog"
import { openPath } from "@tauri-apps/plugin-opener"
import { BadgeCheck, BadgeMinus, BadgeQuestionMark, BadgeX, BookmarkIcon, ChevronDown, ChevronRight, Clock, MoreHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "./data-table-column-header"
import { Badge } from "./ui/badge"
import { Spinner } from "./ui/spinner"

export type StatusValue = "pending" | "processing" | "success" | "failed" | "not started" | "unknown"

interface StatusConfig {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  text: string
  color: string
  className: string
}

const STATUS_CONFIG: Record<StatusValue, StatusConfig> = {
  "success": {
    icon: BadgeCheck,
    text: "成功",
    color: "green",
    className: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  "processing": {
    icon: Spinner,
    text: "进行中",
    color: "blue",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  "pending": {
    icon: Clock,
    text: "待处理",
    color: "amber",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  "failed": {
    icon: BadgeX,
    text: "失败",
    color: "red",
    className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
  "not started": {
    icon: BadgeMinus,
    text: "未开始",
    color: "gray",
    className: "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
  },
  "unknown": {
    icon: BadgeQuestionMark,
    text: "未知",
    color: "slate",
    className: "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300",
  },
}

export interface FileEntry extends DirEntry {
  id: string
  parent: string
  full: string
  status: StatusValue
  target: string
  match: boolean
  target_full?: string
  children?: FileEntry[]
}

export const columns: ColumnDef<FileEntry>[] = [
  {
    header: " ",
    cell: ({ row }) => {
      return row.getCanExpand()
        ? (
            <Button
              variant="ghost"
              onClick={row.getToggleExpandedHandler()}
            >
              {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
            </Button>
          )
        : ""
    },
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
          || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => {
      return (
        row.original?.match
          ? (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={value => row.toggleSelected(!!value)}
                aria-label="Select row"
              />
            )
          : (
              <Checkbox
                disabled
                aria-label="Select row"
              />

            ))
    },
  },
  // {
  //   id: "id",
  //   accessorKey: "id",
  //   header: "ID",
  //   cell: ({ row }) => {
  //     return <span>{row.getValue("id")}</span>
  //   },
  // },
  {
    id: "target",
    accessorKey: "target",
    header: "文件名称",
    cell: ({ row }) => {
      const match = row.original?.match

      const parent = row.original.parent
      return (
        <div className="flex flex-col">
          <span className="text-sm">
            {match ? row.getValue("target") : ""}
          </span>

          <span className={`text-sm ${match ? "text-muted-foreground line-through" : ""}`}>
            {row.getValue("name")}
          </span>

          <span className="text-xs text-muted-foreground truncate" title={parent}>
            {parent}
          </span>
        </div>
      )
    },
  },
  {
    id: "name",
    accessorKey: "name",
    header: "",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col hidden">
          <span className="text-sm text-muted-foreground line-through">
            {row.getValue("name")}
          </span>
        </div>
      )
    },
  },

  {
    accessorKey: "status",
    // header: ({ column }) => (
    //   <DataTableColumnHeader
    //     column={column}
    //     title="Status"
    //   />
    // ),
    header: ({ columns: _columns }) => (
      <div className="flex items-center gap-2">
        <span>状态</span>
      </div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as StatusValue
      const badge = STATUS_CONFIG[status]

      const Icon = STATUS_CONFIG[status].icon
      return (
        <div className="w-full ">
          <Badge variant="outline" className={badge.className} color={badge.color}>
            <Icon data-icon="inline-start" />
            {badge.text}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const fileEntry = row.original

      const openInExplorer = async (path: string) => {
        try {
          const res = await openPath(path)
          console.log("Open in explorer result:", res)
        }
        catch (error) {
          console.error("Error opening file dialog:", error)
        }
      }
      return (
        <div className="w-full text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(fileEntry.full)}
              >
                复制文件路径
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openInExplorer(fileEntry.full)}
              >
                打开文件
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openInExplorer(fileEntry.parent)}
              >
                打开文件位置
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View file details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
