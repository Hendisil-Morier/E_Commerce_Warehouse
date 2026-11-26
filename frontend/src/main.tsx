import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/ui-components.css'
import './styles/storefront.css'
import './styles/customer-portal.css'
import './styles/enterprise-console.css'
import './styles/wms.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
