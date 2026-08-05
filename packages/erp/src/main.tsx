import React from 'react'
import ReactDOM from 'react-dom/client'
import './fonts'
import './index.css'
import { AppProviders } from './app/providers'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders />
  </React.StrictMode>
)

// Gỡ boot splash trong index.html sau khi React đã vẽ khung đầu tiên
const bootSplash = document.getElementById('frz-boot')
if (bootSplash) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      bootSplash.classList.add('frz-boot-hide')
      setTimeout(() => bootSplash.remove(), 400)
    }),
  )
}
