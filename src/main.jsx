window.global = window;
window.process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: (cb) => setTimeout(cb, 0),
  listeners: () => [],
  on: () => {},
  removeListener: () => {}
};
window.util = {
  inspect: () => '',
  inherits: () => {}
};

// Polyfill Buffer for simple-peer
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
