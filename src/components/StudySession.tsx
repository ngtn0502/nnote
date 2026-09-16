import { useEffect, useState } from "react"
import type { Deck, Rating } from "../types/deck"
import { isDue } from "../lib/srs"
import { Flashcard } from "./Flashcard"

interface Props {
  deck: Deck
  onRate: (cardId: string, rating: Rating) => void
  onExit: () => void
}

const RATINGS: { key: Rating; label: string; shortcut: string }[] = [
  { key: "again", label: "Again", shortcut: "1" },
  { key: "hard", label: "Hard", shortcut: "2" },
  { key: "good", label: "Good", shortcut: "3" },
  { key: "easy", label: "Easy", shortcut: "4" },
]

export function StudySession({ deck, onRate, onExit }: Props) {
  // Snapshot the due queue once on entry — re-deriving it on every deck update
  // (which happens after each rating write) would drop cards mid-session.
  const [dueCards] = useState(() =>
    [...deck.cards].filter((c) => isDue(c.srs)).sort((a, b) => a.srs.due.localeCompare(b.srs.due)),
  )
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const current = dueCards[index]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return
      if (e.code === "Space" && !revealed) {
        e.preventDefault()
        setRevealed(true)
        return
      }
      if (!revealed) return
      const rating = RATINGS.find((r) => r.shortcut === e.key)
      if (rating) handleRate(rating.key)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  function handleRate(rating: Rating) {
    if (!current) return
    onRate(current.id, rating)
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  if (!current) {
    return (
      <div className="study-session study-done">
        <p>Nothing due right now. Nicely done.</p>
        <button type="button" className="btn-primary" onClick={onExit}>
          Back to deck
        </button>
      </div>
    )
  }

  return (
    <div className="study-session">
      <div className="study-progress">
        <span>
          {index + 1} / {dueCards.length}
        </span>
        <button type="button" className="btn-ghost" onClick={onExit}>
          Exit
        </button>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${(index / dueCards.length) * 100}%` }} />
      </div>
      <Flashcard card={current} revealed={revealed} onFlip={() => setRevealed(true)} />
      {revealed && (
        <div className="rating-row">
          {RATINGS.map((r) => (
            <button key={r.key} type="button" className={`btn-rate btn-rate-${r.key}`} onClick={() => handleRate(r.key)}>
              {r.label}
              <span className="shortcut">{r.shortcut}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
