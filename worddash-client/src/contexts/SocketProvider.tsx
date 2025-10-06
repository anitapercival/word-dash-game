import React, { createContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const SocketContext = createContext<Socket | null>(null)

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL

    if (!backendUrl) {
      console.error('VITE_API_URL is not set! Socket.IO cannot connect.')
      return
    }

    // Initialize Socket.IO with explicit transports for better AWS Amplify compatibility
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,  // Optional: retries if connection fails
      timeout: 20000,           // Optional: 20s timeout
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      newSocket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}
