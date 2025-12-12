import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SocketProvider } from './context/SocketContext'
import './index.css' // เราจะสร้างไฟล์นี้

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SocketProvider>
      <App />
    </SocketProvider>
  </React.StrictMode>,
)