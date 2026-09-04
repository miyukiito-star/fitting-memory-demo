import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import liff from '@line/liff'
import App from './App'
import './styles.css'

const liffId = import.meta.env.VITE_LIFF_ID as string | undefined

async function start() {
  if (liffId) {
    try { await liff.init({ liffId }) }
    catch (error) { console.warn('LIFF initialization failed; continuing in web mode.', error) }
  }
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
}

void start()
