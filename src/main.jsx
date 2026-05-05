import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeLanguageProvider } from './context/ThemeLanguageContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeLanguageProvider>
      <App />
    </ThemeLanguageProvider>
  </StrictMode>,
)
