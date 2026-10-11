import { useEffect, useRef } from 'react'
import { useModalFocus } from './useModalFocus'

// Focus management for dialogs that close on Escape: focus moves in on open,
// Escape closes, and focus goes back to whatever opened it.
//  - { trap: true } (default): true modal (WelcomeModal) -- Tab cycles inside it.
//    Give it aria-modal="true".
//  - { trap: false }: non-modal side panels (VolcanoPanel, CountryPanel,
//    PlateModal) -- the map stays usable behind them, so Tab can leave at the
//    end; Escape and the close button are the way back.
// Attach the returned ref to the dialog element, with tabIndex={-1},
// role="dialog" and aria-labelledby.
export function useDrawerFocus(onClose, { trap = true } = {}) {
  const ref = useModalFocus({ trap })
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      // Escape inside the search box belongs to its own dropdown.
      if (e.target instanceof Element && e.target.closest('.search-wrap')) return
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return ref
}
