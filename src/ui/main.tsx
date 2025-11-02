import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Limits from './Limits/Limits.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Limits />
  </StrictMode>,
)
