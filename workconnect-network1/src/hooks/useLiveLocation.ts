import { useEffect, useRef, useState } from 'react'

interface LatLng {
  lat: number
  lng: number
}

/**
 * Watches the browser's live location and (optionally) reports it up via onUpdate,
 * e.g. to push over the socket for real-time tracking.
 */
export function useLiveLocation({
  enabled,
  onUpdate,
  intervalMs = 4000,
}: {
  enabled: boolean
  onUpdate?: (coords: LatLng) => void
  intervalMs?: number
}) {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [error, setError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastSentRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported on this device/browser.')
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setPosition({ lat: latitude, lng: longitude })
        setError(null)

        const now = Date.now()
        if (onUpdate && now - lastSentRef.current > intervalMs) {
          lastSentRef.current = now
          onUpdate({ lat: latitude, lng: longitude })
        }
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [enabled, onUpdate, intervalMs])

  return { position, error }
}

/** One-off "where am I right now" for search/setup, not continuous tracking. */
export function getCurrentPositionOnce(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}
