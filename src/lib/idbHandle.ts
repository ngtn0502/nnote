import { del, get, set } from "idb-keyval"

const KEY = "nnote-directory-handle"

export function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  return set(KEY, handle)
}

export function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  return get(KEY)
}

export function clearDirectoryHandle(): Promise<void> {
  return del(KEY)
}
