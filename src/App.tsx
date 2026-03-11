import type { DirEntry } from "@tauri-apps/plugin-fs"
import type { FileEntry, StatusValue } from "@/components/columns"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { copyFile, lstat, readDir, rename } from "@tauri-apps/plugin-fs"
import { ArrowUpIcon, BadgeCheck, BadgeMinus, BadgeQuestionMark, BadgeX, BookmarkIcon, BrushCleaning, CheckCircle2Icon, Clock, Files, FileSpreadsheet, Folders, InfoIcon, Play } from "lucide-react"
import { Fragment, useEffect, useState } from "react"
import { toast } from "sonner"
import { columns } from "@/components/columns"
import { DataTable } from "@/components/data-table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import { SelectLabel } from "./components/ui/select"
import { Switch } from "./components/ui/switch"
import "./App"

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

const NameRegex = /[^\\/]+$/

const TargetRegex = /_([\u4E00-\u9FA5]+)_.*\.(\w+)$/

function App() {
  const [files, setFiles] = useState<FileEntry[]>([])

  const [fileSetState, setFileSetState] = useState<Set<string>>(() => new Set())

  const readTreeDir = async (path: string, isTree?: boolean): Promise<FileEntry[]> => {
    const entries: FileEntry[] = []

    const dirEntires = await readDir(path)

    for (const entry of dirEntires) {
      const id = crypto.randomUUID()

      const targetMatch = entry.name.match(TargetRegex)
      const target = targetMatch ? `${targetMatch[1]}.${targetMatch[2]}` : entry.name
      const match = !!targetMatch

      if (entry.isDirectory) {
        const children = await readTreeDir(`${path}/${entry.name}`, true)
        entries.push({
          id,
          ...entry,
          parent: path,
          status: match ? "not started" : "unknown",
          full: `${path}/${entry.name}`,
          target,
          match,
          children,
        })
      }
      else {
        entries.push({
          id,
          ...entry,
          parent: path,
          status: match ? "not started" : "unknown",
          full: `${path}/${entry.name}`,
          target,
          match,
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

  const handleFile = async (path: string) => {
    try {
      const entry = await lstat(path)

      const name = path.match(NameRegex)
      const parent = path.replace(/[\\/][^\\/]+$/, "")

      const targetMatch = path.match(TargetRegex)
      const target = targetMatch ? `${targetMatch[1]}.${targetMatch[2]}` : name ? name[0] : ""
      const match = !!targetMatch

      setFiles((prevFiles) => {
        setFileSetState((prevSet) => {
          const newSet = new Set(prevSet)
          newSet.add(path)
          // Return the new state for fileSetState
          return newSet
        })

        // Check if the file is already in the list
        if (fileSetState.has(path)) {
          return prevFiles
        }

        return [...prevFiles, {
          id: crypto.randomUUID(),
          name: name ? name[0] : "",
          status: "not started",
          full: path,
          parent,
          isDirectory: entry.isDirectory,
          isFile: entry.isFile,
          isSymlink: entry.isSymlink,
          target,
          match,
        }]
      })
    }
    catch (error) {
      console.error("Error reading file entry:", error)
    }
  }

  async function openFileDialog(directory = false) {
    try {
      const selected = await open({
        multiple: true,
        directory,
      })

      if (Array.isArray(selected)) {
        // console.log("Selected files:", selected)
        if (!directory) {
          asyncPool(1, selected.map(path => handleFile(path)))
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

  const [loading, setLoading] = useState(false)

  const updateFileStatus = (fileId: string, status: StatusValue) => {
    setFiles((prevFiles) => {
      return prevFiles.map(file =>
        file.id === fileId ? { ...file, status } : file,
      )
    })
  }

  const renameFile = async (file: FileEntry) => {
    if (!file.match || file.status !== "not started") {
      return
    }

    try {
      // 开始处理
      updateFileStatus(file.id, "processing")

      // 执行重命名
      await rename(file.full, `${file.parent}/${file.target}`)

      // 成功
      updateFileStatus(file.id, "success")
    }
    catch (error) {
      // 失败
      console.error(`重命名失败: ${file.full}`, error)
      updateFileStatus(file.id, "failed")
    }
  }

  const handleRename = async () => {
    setLoading(true)

    // 获取匹配的文件列表
    const filesToProcess = files.filter(f => f.match && f.status === "not started")

    // 逐个处理文件
    for (const file of filesToProcess) {
      await renameFile(file)
    }

    setFiles((finalFiles) => {
      const successCount = finalFiles.filter(f => f.match && f.status === "success").length
      const failedCount = finalFiles.filter(f => f.match && f.status === "failed").length

      if (failedCount > 0) {
        toast.info(`完成：成功 ${successCount} 个，失败 ${failedCount} 个`, {
          description: "你可以点击文件名查看它，或者点击右键菜单进行相关操作",
          position: "top-center",
        })
      }
      else {
        toast.success(`全部完成：成功重命名 ${successCount} 个文件`, {
          description: "你可以点击文件名查看它，或者点击右键菜单进行相关操作",
          position: "top-center",
        })
      }
      return finalFiles
    })

    setLoading(false)
  }

  return (
    <>
      <div className="flex flex-col gap-2" style={{ height: "calc(100vh - 2rem)" }}>
        <div className="container mx-auto w-full h-full flex-1 transition-[width,max-width] duration-300 ease-in-out">
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

          <Toaster />

          <DataTable
            columns={columns}
            data={files}
            children={(
              <Fragment>
                <div className="flex gap-2" id="greet-form">
                  <Button variant="outline" disabled={loading} onClick={() => openFileDialog()}>
                    <Files className="hidden md:inline" />
                    选择文件
                  </Button>
                  <Button variant="outline" disabled={loading} onClick={() => openFileDialog(true)}>
                    <Folders className="hidden md:inline" />
                    选择文件夹
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiles([])
                      setFileSetState(new Set())
                    }}
                    disabled={loading}
                  >
                    <BrushCleaning className="hidden md:inline" />
                    清除选择
                  </Button>

                  <Button disabled={loading || !files.length} onClick={() => handleRename()}>
                    {!loading ? (<Play size={16} />) : (<Spinner />)}
                    开始运行（
                    {files.filter(file => file.match).length}
                    {" "}
                    个文件）
                  </Button>
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
