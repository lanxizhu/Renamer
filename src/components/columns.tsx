import type { ColumnDef } from "@tanstack/react-table"
import type { ComponentType, SVGProps } from "react"

import { BadgeCheck, BadgeMinus, BadgeQuestionMark, BadgeX, Clock, MoreHorizontal } from "lucide-react"

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
}

const STATUS_CONFIG: Record<StatusValue, StatusConfig> = {
  "success": {
    icon: BadgeCheck,
    text: "Success",
    color: "green",
  },
  "processing": {
    icon: Spinner,
    text: "In progress",
    color: "blue",
  },
  "pending": {
    icon: Clock,
    text: "Pending",
    color: "amber",
  },
  "failed": {
    icon: BadgeX,
    text: "Failed",
    color: "red",
  },
  "not started": {
    icon: BadgeMinus,
    text: "Not started",
    color: "gray",
  },
  "unknown": {
    icon: BadgeQuestionMark,
    text: "Unknown",
    color: "slate",
  },
}

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export interface Payment {
  id: string
  amount: number
  status: StatusValue
  email: string
  match: boolean
}

export const columns: ColumnDef<Payment>[] = [
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

  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Status"
      />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as StatusValue
      const badge = STATUS_CONFIG[status]

      const Icon = STATUS_CONFIG[status].icon

      return (
        <div className="w-full ">
          <Badge variant="outline" className={`bg-${badge.color}-50 text-${badge.color}-700 dark:bg-${badge.color}-950 dark:text-${badge.color}-300`} color={badge.color}>
            <Icon />
            {badge.text}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (<DataTableColumnHeader column={column} title="Email" />
      )
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original

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
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                Copy payment ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
