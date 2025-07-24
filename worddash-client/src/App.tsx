import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import GamePage from './pages/GamePage'
import RoomLobby from './pages/RoomLobby'
import ResultsPage from './pages/ResultsPage'
import { SocketProvider } from './contexts/SocketProvider'

function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<RoomLobby />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/results/:roomId" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </SocketProvider>
  )
}

export default App
