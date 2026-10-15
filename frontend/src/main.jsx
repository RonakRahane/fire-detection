import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { consoleViewFromUrl } from './utils/helpers'
import './theme.css'

const ConsoleApp = lazy(() => import('./App.jsx'))
const LandingPage = lazy(() => import('./landing/LandingPage.jsx'))

const isConsole = Boolean(consoleViewFromUrl())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={null}>
      {isConsole ? <ConsoleApp /> : <LandingPage />}
    </Suspense>
  </StrictMode>,
)
