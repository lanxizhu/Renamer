import type { DirEntry } from "@tauri-apps/plugin-fs"
import type { FileEntry, Payment, StatusValue } from "@/components/columns"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { lstat, readDir } from "@tauri-apps/plugin-fs"
import { ArrowUpIcon, BadgeCheck, BadgeMinus, BadgeQuestionMark, BadgeX, CheckCircle2Icon, Clock, InfoIcon } from "lucide-react"
import { Fragment, useState } from "react"
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
  children: i % 3 === 0
    ? [
        {
          id: "child-1",
          amount: 50,
          match: true,
          status: "success",
          email: "",
        },
      ]
    : undefined,
}))

function DemoPage() {
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={payments} />
    </div>
  )
}

async function asyncPool(limit: number, tasks: Promise<void>[]) {
  const results = [] // 存储所有任务的结果
  const executing = new Set() // 存储当前正在执行的任务

  for (const task of tasks) {
    // 将 task 包装成 Promise 并开始执行
    const p = Promise.resolve().then(() => typeof task === "function" && task())
    results.push(p)
    executing.add(p)

    // 任务执行完成后，从正在执行的集合中移除
    const clean = () => executing.delete(p)
    p.then(clean).catch(clean)

    // 如果当前执行中的任务数达到了限制，就等待其中任何一个完成
    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }

  return Promise.all(results)
}

function App() {
  const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null)

  const [files, setFiles] = useState<FileEntry[]>([])

  const [fileSetState, setFileSetState] = useState<Set<string>>(() => new Set())

  // const selectedFiles = Array.from(event.target.files || []).map(file => file.name)
  // setFiles(selectedFiles)

  const readTreeDir = async (path: string, isTree?: boolean): Promise<FileEntry[]> => {
    const entries: FileEntry[] = []

    const dirEntires = await readDir(path)

    for (const entry of dirEntires) {
      const id = crypto.randomUUID()

      if (entry.isDirectory) {
        const children = await readTreeDir(`${path}/${entry.name}`, true)
        entries.push({
          id,
          ...entry,
          parent: path,
          status: "not started",
          full: `${path}/${entry.name}`,
          children,
        })
      }
      else {
        entries.push({
          id,
          ...entry,
          parent: path,
          status: "not started",
          full: `${path}/${entry.name}`,
        })
      }
    }

    const flatEntries = (entries: FileEntry[]): FileEntry[] => {
      return entries.flatMap((entry) => {
        if (entry.children) {
          return [entry, ...flatEntries(entry.children)]
        }
        return [entry]
      })
    }

    if (!isTree) {
      return flatEntries(entries).filter(entry => entry.isFile)
    }

    return entries
  }

  const handleDir = async (path: string) => {
    try {
      const entries = await readTreeDir(path)

      setFiles((prevFiles) => {
        setFileSetState((prevSet) => {
          const newSet = new Set(prevSet)

          entries.forEach(entry => newSet.add(entry.full))
          // Return the new state for fileSetState
          return newSet
        })

        // Filter and add only unique entries
        const uniqueEntries = entries.filter(entry => !fileSetState.has(entry.full))

        return [...prevFiles, ...uniqueEntries]
      })
    }
    catch (error) {
      console.error("Error reading directory tree:", error)
    }
  }

  async function openFileDialog(directory = false) {
    try {
      const selected = await open({
        multiple: true,
        directory,
      })

      if (Array.isArray(selected)) {
        console.log("Selected files:", selected)

        if (!directory) {
          // setFiles(selected)

          lstat(selected[0]).then((entry) => {
            console.log("File entry:", entry)

            // setFiles([{
            //   id: crypto.randomUUID(),
            //   name: entry.name,
            // }])
          }).catch((err) => {
            console.error("Error reading file entry:", err)
          })
        }
        else {
          // const tasks = selected.map(path => handleDir(path))
          asyncPool(1, selected.map(path => handleDir(path)))
        }
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
      <div className="flex flex-col gap-2" style={{ height: "calc(100vh - 2rem)" }}>
        <div className="container mx-auto w-full h-full flex-1">
          <div className="pb-4">
            <h1 className="inline scroll-m-20 text-4xl font-extrabold tracking-tight text-balance mb-2">
              Renamer
            </h1>
            <h3 className="inline ml-2 scroll-m-20 text-2xl font-semibold tracking-tight">
              批量重命名工具
            </h3>
          </div>

          <Alert className="">
            <InfoIcon />
            <AlertTitle>New feature available</AlertTitle>
            <AlertDescription>
              还支持多选文件和文件夹以及拖动选中呢～记得试试哦～
            </AlertDescription>
          </Alert>

          <DataTable
            columns={columns}
            data={files}
            children={(
              <Fragment>
                <div className="flex gap-2" id="greet-form">
                  <Button variant="outline" onClick={() => openFileDialog()}>Select File</Button>
                  <Button variant="outline" onClick={() => openFileDialog(true)}>Select Directory</Button>
                </div>
              </Fragment>
            )}
          />
        </div>
      </div>
    </>
  )
}

export default App
