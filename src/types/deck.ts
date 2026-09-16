export type CardType = "basic"

export interface SrsState {
  due: string // ISO date
  interval: number // days
  ease: number
  reps: number
  lapses: number
}

export interface Card {
  id: string
  type: CardType
  front: string
  back: string
  tags: string[]
  srs: SrsState
}

export interface Deck {
  version: number
  deckName: string
  topic: string
  cards: Card[]
}

export type Rating = "again" | "hard" | "good" | "easy"
