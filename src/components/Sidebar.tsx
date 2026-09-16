import type { DeckFile } from "../lib/fsAccess"
import { isDue } from "../lib/srs"
import { textSizeLabel, type TextSize } from "../lib/textSize"
import { ThemeIcon } from "./ThemeIcon"

interface Props {
  deckFiles: DeckFile[]
  selectedDeckIndex: number | null
  theme: "light" | "dark"
  onToggleTheme: () => void
  textSize: TextSize
  onCycleTextSize: () => void
  onSelectDeck: (index: number) => void
  onOpenFolder: () => void
  open: boolean
}

export function Sidebar({
  deckFiles,
  selectedDeckIndex,
  theme,
  onToggleTheme,
  textSize,
  onCycleTextSize,
  onSelectDeck,
  onOpenFolder,
  open,
}: Props) {
  const topics = new Map<string, number[]>()
  deckFiles.forEach((df, i) => {
    const topic = df.deck.topic || "Untitled"
    if (!topics.has(topic)) topics.set(topic, [])
    topics.get(topic)!.push(i)
  })

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-mark">n</div>
          <span className="sidebar-title">nnote</span>
        </div>
        <div className="header-controls">
          <button
            type="button"
            className="theme-toggle"
            onClick={onCycleTextSize}
            title={`Text size: ${textSizeLabel(textSize)}`}
            aria-label="Change text size"
          >
            Aa
          </button>
          <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle theme">
            <ThemeIcon theme={theme} />
          </button>
        </div>
      </div>
      <div className="topic-groups">
        {[...topics.entries()].map(([topic, indices]) => (
          <div key={topic} className="topic-group">
            <div className="topic-label">{topic}</div>
            {indices.map((i) => {
              const deck = deckFiles[i].deck
              const dueCount = deck.cards.filter((c) => isDue(c.srs)).length
              return (
                <button
                  key={i}
                  type="button"
                  className={`deck-item ${i === selectedDeckIndex ? "active" : ""}`}
                  onClick={() => onSelectDeck(i)}
                >
                  <span>{deck.deckName}</span>
                  {dueCount > 0 && <span className="due-badge">{dueCount}</span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      <button type="button" className="btn-ghost sidebar-footer-btn" onClick={onOpenFolder}>
        Change folder
      </button>
    </aside>
  )
}
