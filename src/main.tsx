import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Ask the browser not to evict the workout history under storage pressure.
// Granted silently for installed or frequently used apps; a refusal is fine.
navigator.storage?.persist?.().catch(() => {})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
