import type { Rating, SrsState } from "../types/deck"

export function createSrsState(now: Date = new Date()): SrsState {
  return { due: now.toISOString(), interval: 0, ease: 2.5, reps: 0, lapses: 0 }
}

export function isDue(srs: SrsState, now: Date = new Date()): boolean {
  return new Date(srs.due).getTime() <= now.getTime()
}

// Simplified Anki-style SM-2: ease/interval per card, four ratings.
export function rate(srs: SrsState, rating: Rating, now: Date = new Date()): SrsState {
  let { interval, ease, reps, lapses } = srs

  if (rating === "again") {
    reps = 0
    lapses += 1
    ease = Math.max(1.3, ease - 0.2)
    interval = 1
  } else {
    reps += 1
    if (rating === "hard") {
      ease = Math.max(1.3, ease - 0.15)
      interval = reps === 1 ? 1 : Math.max(1, Math.round(interval * 1.2))
    } else if (rating === "good") {
      interval = reps === 1 ? 1 : Math.round(interval * ease)
    } else {
      ease = ease + 0.15
      interval = reps === 1 ? 4 : Math.round(interval * ease * 1.3)
    }
  }

  const due = new Date(now)
  due.setDate(due.getDate() + interval)

  return { interval, ease, reps, lapses, due: due.toISOString() }
}
