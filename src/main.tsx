import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './core/theme/theme.css'
import { initializeTheme } from './core/theme/theme-loader'
import App from './App'

// Default color scheme (orange accent + neutral gray) is applied at runtime
// by the dynamic theme loader — it is NOT hard-coded in static CSS. The
// loader fetches the matching color-scheme CSS and sets data-* attributes.
await initializeTheme({ accent: 'orange', gray: 'neutral' })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
