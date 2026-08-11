import { io, type Socket } from 'socket.io-client'
import { API_BASE } from './apiClient'

let socket: Socket | null = null

export function connectSocket(token: string): Socket {
  if (socket && socket.connected) return socket
  socket = io(API_BASE, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
