const NameRegex = /[^\\/]+$/

const ParentRegex = /[\\/][^\\/]+$/

const TargetRegex = /_([\u4E00-\u9FA5]+)_.*\.(\w+)$/

export function getFileName(path: string) {
  return path.match(NameRegex)?.[0] || ""
}

export function getTarget(path: string) {
  return path.match(TargetRegex)?.[1] || ""
}

export function matchInfo(path: string) {
  const name = getFileName(path)
  const parent = path.replace(ParentRegex, "")

  return { name, parent }
}

const fileCountMap = new Map<string, number>()

export function matchPath(path: string, parent?: string) {
  const targetMatch = path.match(TargetRegex)

  // If the path does not match the target pattern, return the original file name
  // and avoid mutating the fileCountMap.
  if (!targetMatch) {
    return { match: false, target: getFileName(path) }
  }

  const [, fileName, fileExt] = targetMatch

  let target = `${fileName}.${fileExt}`

  const full = `${parent}/${target}`

  if (fileCountMap.has(full)) {
    fileCountMap.set(full, fileCountMap.get(full)! + 1)
  }
  else {
    fileCountMap.set(full, 1)
  }

  target = `${fileName}_${fileCountMap.get(full)}.${fileExt}`

  return { match: true, target }
}

export function resetFileCount() {
  fileCountMap.clear()
}
