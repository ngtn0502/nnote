import type { Card, Deck } from "../types/deck"

// Backed by an Apps Script Web App bound to the Google Sheet (see setup docs
// given alongside this feature) — no Google Cloud project or OAuth needed.
const WEBAPP_URL = import.meta.env.VITE_SHEET_WEBAPP_URL as string | undefined
const SECRET = import.meta.env.VITE_SHEET_SECRET as string | undefined

const DECK_META = { version: 1, deckName: "PTE Academic - Nhan's Review Deck", topic: "PTE Academic" }

export const sheetSyncConfigured = Boolean(WEBAPP_URL && SECRET)

async function post(body: unknown): Promise<{ ok?: true; error?: string; cards?: Card[]; count?: number }> {
  const res = await fetch(WEBAPP_URL!, {
    method: "POST",
    // text/plain avoids a CORS preflight; Apps Script still reads it as JSON below.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function fetchSheetDeck(): Promise<Deck> {
  const url = `${WEBAPP_URL}?secret=${encodeURIComponent(SECRET!)}&action=read`
  const res = await fetch(url)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return { ...DECK_META, cards: data.cards as Card[] }
}

export function seedSheet(cards: Card[]) {
  return post({ secret: SECRET, action: "seed", cards })
}

export function upsertCardInSheet(card: Card) {
  return post({ secret: SECRET, action: "upsert", card })
}
