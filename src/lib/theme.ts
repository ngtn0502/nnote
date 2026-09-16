export type Theme = "light" | "dark"

const KEY = "nnote-theme"

export function getTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"
}

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem(KEY, theme)
}
