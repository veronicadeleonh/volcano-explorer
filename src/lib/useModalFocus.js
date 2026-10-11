import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Focus management for true modals (the page behind is blocked):
//  - On open, focus moves to the dialog itself, so a screen reader announces its title.
//  - Tab / Shift+Tab cycle inside it and can't escape to the page behind
//    (skipped with { trap: false }, for non-modal panels).
//  - On close, focus goes back to whatever opened it.
// Attach the ref to the dialog element, with tabIndex={-1}, role="dialog",
// aria-modal="true" and aria-labelledby. Closing on Escape stays in the component.
export function useModalFocus({ trap = true } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement
    dialog?.focus({ preventScroll: true })

    const onKeyDown = (e) => {
      if (!trap || e.key !== 'Tab' || !dialog || !dialog.isConnected) return
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter(el => el.getClientRects().length > 0)
      if (!items.length) { e.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === dialog)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
      else if (!dialog.contains(active)) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previous && previous !== document.body && document.contains(previous)) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [trap])

  return ref
}
