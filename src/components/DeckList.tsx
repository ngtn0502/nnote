import type { Card, Deck } from "../types/deck"
import { isDue } from "../lib/srs"

interface Props {
  deck: Deck
  onStudy: () => void
  onAddCard: () => void
  onEditCard: (card: Card) => void
}

export function DeckList({ deck, onStudy, onAddCard, onEditCard }: Props) {
  const dueCount = deck.cards.filter((c) => isDue(c.srs)).length

  return (
    <div className="deck-view">
      <div className="deck-view-header">
        <h1>{deck.deckName}</h1>
        <div className="deck-view-actions">
          <button type="button" className="btn-ghost" onClick={onAddCard}>
            Add card
          </button>
          <button type="button" className="btn-primary" onClick={onStudy} disabled={dueCount === 0}>
            Study ({dueCount} due)
          </button>
        </div>
      </div>
      <ul className="card-list">
        {deck.cards.map((card) => (
          <li key={card.id} className="card-list-item" onClick={() => onEditCard(card)}>
            <span className="card-list-front">{card.front}</span>
            {isDue(card.srs) ? (
              <span className="due-badge">due</span>
            ) : (
              <span className="card-list-due">next {new Date(card.srs.due).toLocaleDateString()}</span>
            )}
          </li>
        ))}
        {deck.cards.length === 0 && <li className="card-list-empty">No cards yet. Add one to get started.</li>}
      </ul>
    </div>
  )
}
