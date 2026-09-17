import { useEffect, useState } from "react"
import { CardEditor } from "./components/CardEditor"
import { DeckList } from "./components/DeckList"
import { Sidebar } from "./components/Sidebar"
import { StudySession } from "./components/StudySession"
import { ThemeIcon } from "./components/ThemeIcon"
import { loadDecks, loadSampleDecks, pickDirectory, saveDeck, verifyPermission, type DeckFile } from "./lib/fsAccess"
import { clearDirectoryHandle, loadDirectoryHandle, saveDirectoryHandle } from "./lib/idbHandle"
import { fetchSheetDeck, sheetSyncConfigured, upsertCardInSheet } from "./lib/sheetSync"
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  async function loadSamples() {
    setError(null)
    const files = loadSampleDecks()
    if (sheetSyncConfigured) {
      try {
        files.push({ fileHandle: null, source: "sheet", deck: await fetchSheetDeck() })
      } catch {
        setError("Failed to load the English deck from Google Sheets.")
      }
    }
    setDeckFiles(files)
    setSelectedDeckIndex(null)
    setMode("list")
  }

  async function persistDeckAt(
    index: number,
    updater: (deck: DeckFile["deck"]) => DeckFile["deck"],
    changedCard: Card,
  ) {
    const target = deckFiles[index]
    const updatedDeck = updater(target.deck)
    if (target.source === "sheet") {
      await upsertCardInSheet(changedCard)
    } else {
      await saveDeck(target.fileHandle, updatedDeck)
    }
    setDeckFiles((prev) => prev.map((df, i) => (i === index ? { ...df, deck: updatedDeck } : df)))
  }

  function handleRate(cardId: string, rating: Rating) {
    if (selectedDeckIndex === null) return
    const existing = deckFiles[selectedDeckIndex].deck.cards.find((c) => c.id === cardId)
    if (!existing) return
    const updatedCard = { ...existing, srs: rate(existing.srs, rating) }
    persistDeckAt(
      selectedDeckIndex,
      (deck) => ({ ...deck, cards: deck.cards.map((c) => (c.id === cardId ? updatedCard : c)) }),
      updatedCard,
    )
  }

  function handleSaveCard(card: Card) {
    if (selectedDeckIndex === null) return
    persistDeckAt(
      selectedDeckIndex,
      (deck) => {
        const exists = deck.cards.some((c) => c.id === card.id)
        return { ...deck, cards: exists ? deck.cards.map((c) => (c.id === card.id ? card : c)) : [...deck.cards, card] }
      },
      card,
    )
    setMode("list")
    setEditingCard(undefined)
  }

  if (!dirHandle && deckFiles.length === 0) {
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
        <p>Spaced-repetition flashcards that live in your files, not someone's cloud.</p>
        <div className="welcome-actions">
          <button type="button" className="option-card" onClick={openFolder}>
            <span className="option-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
              </svg>
            </span>
            <span className="option-title">Open deck folder</span>
            <span className="option-desc">Load and save decks from a folder on your disk</span>
          </button>
          <button type="button" className="option-card" onClick={loadSamples}>
            <span className="option-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
              </svg>
            </span>
            <span className="option-title">Try sample decks</span>
            <span className="option-desc">Jump in instantly, no setup required</span>
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    )
  }

  const selectedDeck = selectedDeckIndex !== null ? deckFiles[selectedDeckIndex].deck : null

  return (
    <div className="app-shell">
      <button
        type="button"
        className="theme-toggle mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open deck menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        deckFiles={deckFiles}
        selectedDeckIndex={selectedDeckIndex}
        theme={theme}
        onToggleTheme={toggleTheme}
        textSize={textSize}
        onCycleTextSize={cycleTextSize}
        open={sidebarOpen}
        onSelectDeck={(i) => {
          setSelectedDeckIndex(i)
          setMode("list")
          setSidebarOpen(false)
        }}
        onOpenFolder={() => {
          clearDirectoryHandle()
          setDirHandle(null)
          setDeckFiles([])
          setSelectedDeckIndex(null)
          setSidebarOpen(false)
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
