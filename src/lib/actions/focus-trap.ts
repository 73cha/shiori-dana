import type { Action } from 'svelte/action'

const trap = (event: KeyboardEvent) => {
  const dialog = document.querySelector('dialog[open]')

  if (!dialog) {
    return
  }

  const focusable = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )

  if (focusable.length === 0) {
    return
  }

  const isFocusableElement = (element: Element) => {
    return element instanceof HTMLElement && 'focus' in element
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.key !== 'Tab') {
    return
  }

  // MEMO:
  // shift + tab
  if (event.shiftKey) {
    if (document.activeElement === first && isFocusableElement(last)) {
      event.preventDefault()
      last.focus()
    }
  } else {
    if (document.activeElement === last && isFocusableElement(first)) {
      event.preventDefault()
      first.focus()
    }
  }
}

export const focusTrap: Action<HTMLElement> = (node) => {
  node.addEventListener('keydown', trap)

  return {
    destroy() {
      node.removeEventListener('keydown', trap)
    },
  }
}
