import { describe, expect, it } from "vitest"
import { createSrsState, isDue, rate } from "./srs"

const now = new Date("2026-01-01T00:00:00.000Z")

describe("srs.rate", () => {
  it("again resets reps, shortens interval, lowers ease, and is due tomorrow", () => {
    const srs = { due: now.toISOString(), interval: 10, ease: 2.5, reps: 3, lapses: 0 }
    const next = rate(srs, "again", now)
    expect(next.reps).toBe(0)
    expect(next.lapses).toBe(1)
    expect(next.ease).toBeCloseTo(2.3)
    expect(next.interval).toBe(1)
    expect(new Date(next.due).getUTCDate()).toBe(2)
  })

  it("good grows interval by ease after the first successful rep", () => {
    const first = rate(createSrsState(now), "good", now)
    expect(first.interval).toBe(1)
    const second = rate(first, "good", now)
    expect(second.interval).toBe(Math.round(first.interval * first.ease))
  })

  it("hard grows slower than good and lowers ease", () => {
    const good = rate(rate(createSrsState(now), "good", now), "good", now)
    const hard = rate(rate(createSrsState(now), "good", now), "hard", now)
    expect(hard.interval).toBeLessThan(good.interval)
    expect(hard.ease).toBeLessThan(2.5)
  })

  it("easy grows fastest and raises ease", () => {
    const easy = rate(createSrsState(now), "easy", now)
    expect(easy.interval).toBe(4)
    expect(easy.ease).toBeCloseTo(2.65)
  })
})

describe("isDue", () => {
  it("is due when the due date has passed", () => {
    expect(isDue({ due: "2025-01-01T00:00:00.000Z", interval: 0, ease: 2.5, reps: 0, lapses: 0 }, now)).toBe(true)
  })

  it("is not due when the due date is in the future", () => {
    expect(isDue({ due: "2027-01-01T00:00:00.000Z", interval: 0, ease: 2.5, reps: 0, lapses: 0 }, now)).toBe(false)
  })
})
