import { useEffect, useRef } from 'react'

// Focus management for the side drawers (VolcanoPanel, CountryPanel), which are
// non-modal: the map stays usable behind them.
//  - On open, focus moves into the drawer so the next Tab lands on its content.
//  - Escape closes it.
//  - On close, focus returns to whatever had it before (e.g. the search box).
// Attach the returned ref to the drawer element and give it tabIndex={-1}.
export function useDrawerFocus(onClose) {
  const ref = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const previous = document.activeElement
    ref.current?.focus({ preventScroll: true })

    const onKeyDown = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      // Escape inside the search box belongs to its own dropdown.
      if (e.target instanceof Element && e.target.closest('.search-wrap')) return
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previous && previous !== document.body && document.contains(previous)) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [])

  return ref
}
