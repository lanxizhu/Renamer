import type { Payment, StatusValue } from "@/components/columns"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { ArrowUpIcon, BadgeCheck, BadgeMinus, BadgeQuestionMark, BadgeX, CheckCircle2Icon, Clock } from "lucide-react"
import { useState } from "react"
import { columns } from "@/components/columns"
import { DataTable } from "@/components/data-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import "./App.css"

export const payments: Payment[] = Array.from({ length: 15 }, (_, i) => ({
  id: "489e1d42",
  amount: 125,
  match: [true, false][Math.floor(Math.random() * 2)],
  status: ["pending", "processing", "success", "failed", "not started", "unknown"][Math.floor(Math.random() * 6)] as StatusValue,
  email: "example@gmail.com",
}))

function DemoPage() {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={payments} />
    </div>
  )
}

function App() {
  const [message, setMessage] = useState<string>("")

  const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null)

  async function greet() {
    console.log("Invoking Rust function with message:", message)
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    const res = await invoke("greet", {
      name: message,
    })

    openFileDialog()
    setStatus({ type: "success", message: `Received response from Rust function: ${res}` })
  }

  async function openFileDialog(directory = false) {
    try {
      const selected = await open({
        multiple: true,
        directory,
      })

      if (Array.isArray(selected)) {
        console.log("Selected files:", selected)
      }
      else if (selected) {
        console.log("Selected file:", selected)
      }
      else {
        console.log("No file selected")
      }
    }
    catch (error) {
      console.error("Error opening file dialog:", error)
    }
  }

  return (
    <>
      <div className="flex min-h-svh flex-col items-center justify-center gap-4">
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          Renamer
        </h1>
        <h2></h2>

        <DemoPage />
        <div className="flex gap-4" id="greet-form">
          <Input id="greet-input" placeholder="Enter a name..." value={message} onChange={e => setMessage(e.target.value)} />
          <Button variant="outline" onClick={greet}>Greet</Button>

          <Button variant="outline" onClick={() => openFileDialog()}>Select File</Button>
          <Button variant="outline" onClick={() => openFileDialog(true)}>Select Directory</Button>
          <Button variant="outline" size="icon" aria-label="Submit">
            <ArrowUpIcon />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Spinner />
            In progress
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
            <BadgeCheck />
            Success
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
            <BadgeX />
            Failed
          </Badge>

          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Clock />
            Pending
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300">
            <BadgeMinus />
            Not started
          </Badge>
          <Badge variant="outline" className="bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">

            <BadgeQuestionMark />

            Unknown
          </Badge>

        </div>

        <div className="status">
          {status && (
            <Alert>
              <CheckCircle2Icon color="green" />
              <AlertTitle>Operation Status</AlertTitle>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Payment successful</AlertTitle>
          <AlertDescription>
            Your payment of $29.99 has been processed. A receipt has been sent to
            your email address.
          </AlertDescription>
        </Alert>
      </div>
    </>
  )
}

export default App
