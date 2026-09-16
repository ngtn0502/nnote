export type TextSize = "sm" | "md" | "lg"

const KEY = "nnote-text-size"
const ORDER: TextSize[] = ["sm", "md", "lg"]
const LABEL: Record<TextSize, string> = { sm: "Small", md: "Medium", lg: "Large" }

export function getTextSize(): TextSize {
  const attr = document.documentElement.getAttribute("data-text-size")
  return attr === "sm" || attr === "lg" ? attr : "md"
}

export function setTextSize(size: TextSize) {
  document.documentElement.setAttribute("data-text-size", size)
  localStorage.setItem(KEY, size)
}

export function nextTextSize(current: TextSize): TextSize {
  return ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
}

export function textSizeLabel(size: TextSize): string {
  return LABEL[size]
}
