// src/hooks/useSocket.ts
import { useContext } from 'react'
import { SocketContext } from '../contexts/SocketProvider'
import { Socket } from 'socket.io-client'

export const useSocket = (): Socket => {
  const socket = useContext(SocketContext)
  if (!socket) {
    throw new Error('Socket not initialized yet. Ensure the component is within SocketProvider.')
  }
  return socket
}
