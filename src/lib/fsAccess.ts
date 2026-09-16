import type { Deck } from "../types/deck"

export interface DeckFile {
  fileHandle: FileSystemFileHandle | null // null for bundled sample decks; edits stay in-memory only
  deck: Deck
}

const sampleModules = import.meta.glob("../../sample-decks/*.json", { eager: true }) as Record<
  string,
  { default: Deck }
>

export function loadSampleDecks(): DeckFile[] {
  return Object.values(sampleModules)
    .filter((mod) => Array.isArray(mod.default.cards))
    .map((mod) => ({ fileHandle: null, deck: mod.default }))
}

export function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  return window.showDirectoryPicker({ mode: "readwrite" })
}

export async function verifyPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts: FileSystemHandlePermissionDescriptor = { mode: "readwrite" }
  if ((await handle.queryPermission(opts)) === "granted") return true
  return (await handle.requestPermission(opts)) === "granted"
}

export async function loadDecks(dirHandle: FileSystemDirectoryHandle): Promise<DeckFile[]> {
  const decks: DeckFile[] = []
  for await (const entry of dirHandle.values()) {
    if (entry.kind !== "file" || !entry.name.endsWith(".json")) continue
    const fileHandle = entry as FileSystemFileHandle
    const file = await fileHandle.getFile()
    try {
      const deck = JSON.parse(await file.text()) as Deck
      if (!Array.isArray(deck.cards)) continue
      decks.push({ fileHandle, deck })
    } catch {
      continue // not a deck file
    }
  }
  return decks
}

export async function saveDeck(fileHandle: FileSystemFileHandle | null, deck: Deck): Promise<void> {
  if (!fileHandle) return
  const writable = await fileHandle.createWritable()
  await writable.write(JSON.stringify(deck, null, 2))
  await writable.close()
}
