import { useEffect, useRef } from 'react'
import { Button, Avatar, AvatarFallback } from '@blinkdotnew/ui'
import { Phone, PhoneOff, Video, Mic } from 'lucide-react'
import { useCall } from '@/context/CallContext'

export function CallOverlay() {
  const { incomingCall, activeCall, localStream, remoteStream, acceptCall, declineCall, endCall } = useCall()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream
  }, [localStream])
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream
    if (remoteAudioRef.current && remoteStream) remoteAudioRef.current.srcObject = remoteStream
  }, [remoteStream])

  if (incomingCall && !activeCall) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center px-4">
        <div className="bg-background rounded-xl p-8 w-full max-w-sm text-center shadow-2xl border border-border">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Incoming {incomingCall.callType} call
          </p>
          <Avatar className="h-16 w-16 mx-auto mb-4">
            <AvatarFallback className="bg-accent/20 text-accent text-xl">
              {incomingCall.callType === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-3 justify-center mt-2">
            <Button
              onClick={declineCall}
              className="rounded-full h-12 w-12 p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
            <Button
              onClick={acceptCall}
              className="rounded-full h-12 w-12 p-0 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Phone className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (activeCall) {
    return (
      <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col items-center justify-center text-white px-4">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50 mb-4">
          {activeCall.status === 'ringing' ? 'Calling…' : `${activeCall.callType} call in progress`}
        </p>

        {activeCall.callType === 'video' ? (
          <div className="relative w-full max-w-lg aspect-video bg-neutral-800 rounded-xl overflow-hidden mb-8">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute bottom-3 right-3 w-28 rounded-lg border-2 border-white/80" />
          </div>
        ) : (
          <>
            <audio ref={remoteAudioRef} autoPlay />
            <div className="w-24 h-24 rounded-full bg-accent/20 mb-8 flex items-center justify-center">
              <Mic className="h-8 w-8 text-accent" />
            </div>
          </>
        )}

        <Button
          onClick={endCall}
          className="rounded-full h-14 w-14 p-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return null
}
