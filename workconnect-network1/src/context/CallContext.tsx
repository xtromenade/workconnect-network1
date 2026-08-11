import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { getSocket } from '@/lib/socket'

export type CallType = 'audio' | 'video'

interface IncomingCall {
  callId: string
  conversationId: string
  callerId: string
  callType: CallType
}

interface ActiveCall {
  callId: string
  conversationId: string
  peerId: string
  callType: CallType
  status: 'ringing' | 'ongoing'
}

interface CallContextValue {
  incomingCall: IncomingCall | null
  activeCall: ActiveCall | null
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  startCall: (conversationId: string, calleeId: string, callType?: CallType) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => void
  endCall: () => void
}

const CallContext = createContext<CallContextValue | null>(null)

// Public STUN server, fine for direct connections in dev/demo. For production behind
// strict NATs/firewalls, add a TURN server too:
// iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'turn:your-turn-host', username, credential }]
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

export function CallProvider({ children }: { children: ReactNode }) {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const cleanup = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setActiveCall(null)
    setIncomingCall(null)
  }, [])

  const createPeerConnection = useCallback((targetUserId: string, callId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    const socket = getSocket()

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit('call:signal', { callId, targetUserId, signal: { type: 'ice-candidate', data: e.candidate } })
      }
    }
    pc.ontrack = (e) => setRemoteStream(e.streams[0])
    pcRef.current = pc
    return pc
  }, [])

  const startCall = useCallback(async (conversationId: string, calleeId: string, callType: CallType = 'audio') => {
    const socket = getSocket()
    if (!socket) return

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' })
    localStreamRef.current = stream
    setLocalStream(stream)

    socket.emit('call:invite', { conversationId, calleeId, callType })

    const handleRinging = async ({ callId }: { callId: string }) => {
      setActiveCall({ callId, conversationId, peerId: calleeId, callType, status: 'ringing' })
      const pc = createPeerConnection(calleeId, callId)
      stream.getTracks().forEach((t) => pc.addTrack(t, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('call:signal', { callId, targetUserId: calleeId, signal: { type: 'offer', data: offer } })
    }
    socket.once('call:ringing', handleRinging)
  }, [createPeerConnection])

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return
    const socket = getSocket()
    if (!socket) return
    const { callId, conversationId, callerId, callType } = incomingCall

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' })
    localStreamRef.current = stream
    setLocalStream(stream)

    const pc = createPeerConnection(callerId, callId)
    stream.getTracks().forEach((t) => pc.addTrack(t, stream))

    setActiveCall({ callId, conversationId, peerId: callerId, callType, status: 'ongoing' })
    setIncomingCall(null)
    socket.emit('call:accept', { callId })
  }, [incomingCall, createPeerConnection])

  const declineCall = useCallback(() => {
    if (!incomingCall) return
    getSocket()?.emit('call:decline', { callId: incomingCall.callId })
    setIncomingCall(null)
  }, [incomingCall])

  const endCall = useCallback(() => {
    if (activeCall) getSocket()?.emit('call:end', { callId: activeCall.callId })
    cleanup()
  }, [activeCall, cleanup])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const onIncoming = (payload: IncomingCall) => setIncomingCall(payload)

    const onSignal = async ({ callId, signal }: { callId: string; signal: { type: string; data: unknown } }) => {
      const pc = pcRef.current
      if (!pc) return
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        const targetUserId = incomingCall?.callerId || activeCall?.peerId
        if (targetUserId) {
          socket.emit('call:signal', { callId, targetUserId, signal: { type: 'answer', data: answer } })
        }
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data as RTCSessionDescriptionInit))
      } else if (signal.type === 'ice-candidate') {
        try { await pc.addIceCandidate(new RTCIceCandidate(signal.data as RTCIceCandidateInit)) } catch { /* ignore */ }
      }
    }

    const onAccepted = ({ callId }: { callId: string }) => {
      setActiveCall((prev) => (prev && prev.callId === callId ? { ...prev, status: 'ongoing' } : prev))
    }
    const onDeclined = () => cleanup()
    const onEnded = () => cleanup()
    const onError = (e: { error: string }) => alert(e.error)

    socket.on('call:incoming', onIncoming)
    socket.on('call:signal', onSignal)
    socket.on('call:accepted', onAccepted)
    socket.on('call:declined', onDeclined)
    socket.on('call:ended', onEnded)
    socket.on('call:error', onError)

    return () => {
      socket.off('call:incoming', onIncoming)
      socket.off('call:signal', onSignal)
      socket.off('call:accepted', onAccepted)
      socket.off('call:declined', onDeclined)
      socket.off('call:ended', onEnded)
      socket.off('call:error', onError)
    }
  }, [cleanup, incomingCall, activeCall])

  return (
    <CallContext.Provider value={{ incomingCall, activeCall, localStream, remoteStream, startCall, acceptCall, declineCall, endCall }}>
      {children}
    </CallContext.Provider>
  )
}

export function useCall() {
  const ctx = useContext(CallContext)
  if (!ctx) throw new Error('useCall must be used within CallProvider')
  return ctx
}
