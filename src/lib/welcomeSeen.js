// Whether the welcome dialog has already been shown in this browser.
// If storage isn't available (private window, blocked site data) it just
// shows every time, which is the safe fallback.
const SEEN_KEY = 'volcano-explorer:welcome-seen'
export const hasSeenWelcome = () => { try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return false } }
export const markWelcomeSeen = () => { try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ } }
