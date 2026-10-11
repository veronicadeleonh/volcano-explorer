import { Suspense, lazy } from 'react'
import App from './App.jsx'

// /styleguide is a dev-facing page; keep it out of the main bundle.
const Styleguide = lazy(() => import('./styleguide/Styleguide.jsx'))

export default function Root() {
  const isStyleguide = window.location.pathname.replace(/\/+$/, '') === '/styleguide'
  if (!isStyleguide) return <App />
  return (
    <Suspense fallback={null}>
      <Styleguide />
    </Suspense>
  )
}
