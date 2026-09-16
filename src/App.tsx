import { useEffect, useState } from "react"
import { CardEditor } from "./components/CardEditor"
import { DeckList } from "./components/DeckList"
import { Sidebar } from "./components/Sidebar"
import { StudySession } from "./components/StudySession"
import { ThemeIcon } from "./components/ThemeIcon"
import { loadDecks, pickDirectory, saveDeck, verifyPermission, type DeckFile } from "./lib/fsAccess"
import { clearDirectoryHandle, loadDirectoryHandle, saveDirectoryHandle } from "./lib/idbHandle"
import { rate } from "./lib/srs"
import { getTheme, setTheme } from "./lib/theme"
import { getTextSize, nextTextSize, setTextSize, textSizeLabel } from "./lib/textSize"
import type { Card, Rating } from "./types/deck"

type Mode = "list" | "study" | "add-card" | "edit-card"

function App() {
  const [theme, setThemeState] = useState(getTheme)
  const [textSize, setTextSizeState] = useState(getTextSize)
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [deckFiles, setDeckFiles] = useState<DeckFile[]>([])
  const [selectedDeckIndex, setSelectedDeckIndex] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>("list")
  const [editingCard, setEditingCard] = useState<Card | undefined>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDirectoryHandle().then(async (handle) => {
      if (!handle) return
      if (await verifyPermission(handle)) {
        setDirHandle(handle)
        setDeckFiles(await loadDecks(handle))
      }
    })
  }, [])

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    setThemeState(next)
  }

  function cycleTextSize() {
    const next = nextTextSize(textSize)
    setTextSize(next)
    setTextSizeState(next)
  }

  async function openFolder() {
    setError(null)
    try {
      const handle = await pickDirectory()
      await saveDirectoryHandle(handle)
      setDirHandle(handle)
      setDeckFiles(await loadDecks(handle))
      setSelectedDeckIndex(null)
      setMode("list")
    } catch {
      // user cancelled the picker
    }
  }

  async function persistDeckAt(index: number, updater: (deck: DeckFile["deck"]) => DeckFile["deck"]) {
    const target = deckFiles[index]
    const updatedDeck = updater(target.deck)
    await saveDeck(target.fileHandle, updatedDeck)
    setDeckFiles((prev) => prev.map((df, i) => (i === index ? { ...df, deck: updatedDeck } : df)))
  }

  function handleRate(cardId: string, rating: Rating) {
    if (selectedDeckIndex === null) return
    persistDeckAt(selectedDeckIndex, (deck) => ({
      ...deck,
      cards: deck.cards.map((c) => (c.id === cardId ? { ...c, srs: rate(c.srs, rating) } : c)),
    }))
  }

  function handleSaveCard(card: Card) {
    if (selectedDeckIndex === null) return
    persistDeckAt(selectedDeckIndex, (deck) => {
      const exists = deck.cards.some((c) => c.id === card.id)
      return { ...deck, cards: exists ? deck.cards.map((c) => (c.id === card.id ? card : c)) : [...deck.cards, card] }
    })
    setMode("list")
    setEditingCard(undefined)
  }

  if (!dirHandle) {
    return (
      <div className="welcome">
        <div className="header-controls theme-toggle-floating">
          <button
            type="button"
            className="theme-toggle"
            onClick={cycleTextSize}
            title={`Text size: ${textSizeLabel(textSize)}`}
            aria-label="Change text size"
          >
            Aa
          </button>
          <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <ThemeIcon theme={theme} />
          </button>
        </div>
        <div className="brand-mark brand-mark-lg">n</div>
        <h1>nnote</h1>
        <p>Active recall flashcards backed by JSON files on disk.</p>
        <button type="button" className="btn-primary" onClick={openFolder}>
          Open deck folder
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    )
  }

  const selectedDeck = selectedDeckIndex !== null ? deckFiles[selectedDeckIndex].deck : null

  return (
    <div className="app-shell">
      <Sidebar
        deckFiles={deckFiles}
        selectedDeckIndex={selectedDeckIndex}
        theme={theme}
        onToggleTheme={toggleTheme}
        textSize={textSize}
        onCycleTextSize={cycleTextSize}
        onSelectDeck={(i) => {
          setSelectedDeckIndex(i)
          setMode("list")
        }}
        onOpenFolder={() => {
          clearDirectoryHandle()
          setDirHandle(null)
          setDeckFiles([])
          setSelectedDeckIndex(null)
        }}
      />
      <main className="main-content">
        {!selectedDeck && <p className="placeholder">Select a deck to get started.</p>}
        {selectedDeck && mode === "list" && (
          <DeckList
            deck={selectedDeck}
            onStudy={() => setMode("study")}
            onAddCard={() => {
              setEditingCard(undefined)
              setMode("add-card")
            }}
            onEditCard={(card) => {
              setEditingCard(card)
              setMode("edit-card")
            }}
          />
        )}
        {selectedDeck && mode === "study" && (
          <StudySession deck={selectedDeck} onRate={handleRate} onExit={() => setMode("list")} />
        )}
        {(mode === "add-card" || mode === "edit-card") && (
          <CardEditor
            card={editingCard}
            onSave={handleSaveCard}
            onCancel={() => {
              setMode("list")
              setEditingCard(undefined)
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
