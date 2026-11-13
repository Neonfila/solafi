import { useEffect, useState } from 'react'

// Light or dark, in one place. The site starts light (index.html); a small
// script there applies a saved choice before the first paint so the page
// never flashes the wrong mode. Everything that shows or changes the mode
// (the menu switch, the preview's colour review) goes through here.
const KEY = 'solafi-mode'
const EVENT = 'solafi-mode'

export function getMode() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function setMode(mode) {
  const root = document.documentElement
  root.dataset.theme = mode
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    // private browsing: the choice just won't be remembered
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--ink').trim())
  window.dispatchEvent(new CustomEvent(EVENT, { detail: mode }))
}

export function useMode() {
  const [mode, set] = useState(getMode)
  useEffect(() => {
    const on = (e) => set(e.detail)
    window.addEventListener(EVENT, on)
    return () => window.removeEventListener(EVENT, on)
  }, [])
  return mode
}
