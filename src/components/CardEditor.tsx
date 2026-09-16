import { useState } from "react"
import type { Card } from "../types/deck"
import { createSrsState } from "../lib/srs"

interface Props {
  card?: Card
  onSave: (card: Card) => void
  onCancel: () => void
}

export function CardEditor({ card, onSave, onCancel }: Props) {
  const [front, setFront] = useState(card?.front ?? "")
  const [back, setBack] = useState(card?.back ?? "")
  const [tags, setTags] = useState(card?.tags.join(", ") ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return
    onSave({
      id: card?.id ?? crypto.randomUUID(),
      type: "basic",
      front,
      back,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      srs: card?.srs ?? createSrsState(),
    })
  }

  return (
    <form className="card-editor" onSubmit={handleSubmit}>
      <label>
        Front
        <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={3} autoFocus />
      </label>
      <label>
        Back
        <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={3} />
      </label>
      <label>
        Tags (comma-separated)
        <input value={tags} onChange={(e) => setTags(e.target.value)} />
      </label>
      <div className="card-editor-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save
        </button>
      </div>
    </form>
  )
}
