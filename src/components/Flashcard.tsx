import ReactMarkdown from "react-markdown"
import type { Card } from "../types/deck"

interface Props {
  card: Card
  revealed: boolean
  onFlip: () => void
}

export function Flashcard({ card, revealed, onFlip }: Props) {
  return (
    <div className="flashcard" onClick={onFlip}>
      <div className={`flashcard-inner ${revealed ? "is-flipped" : ""}`}>
        <div className="flashcard-face flashcard-front">
          <ReactMarkdown>{card.front}</ReactMarkdown>
          <p className="flashcard-hint">Click or press Space to reveal</p>
        </div>
        <div className="flashcard-face flashcard-back">
          <ReactMarkdown>{card.back}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
