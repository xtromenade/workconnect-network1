import { useCallback, useState } from 'react'
import { Button, Card, CardContent } from '@blinkdotnew/ui'
import { Radio, RadioTower } from 'lucide-react'
import { useLiveLocation } from '@/hooks/useLiveLocation'
import { getSocket } from '@/lib/socket'
import { LiveMap } from '@/components/LiveMap'

export function GoLiveCard() {
  const [online, setOnline] = useState(false)

  const pushLocation = useCallback((coords: { lat: number; lng: number }) => {
    getSocket()?.emit('location:update', coords)
  }, [])

  const { position, error } = useLiveLocation({ enabled: online, onUpdate: pushLocation })

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {online ? <RadioTower className="h-4 w-4 text-emerald-500" /> : <Radio className="h-4 w-4 text-muted-foreground" />}
            <h3 className="font-semibold text-sm">{online ? 'Sharing live location' : 'Go online'}</h3>
          </div>
          <Button
            size="sm"
            variant={online ? 'secondary' : 'default'}
            className={online ? '' : 'bg-accent text-accent-foreground hover:bg-accent/90'}
            onClick={() => setOnline((v) => !v)}
          >
            {online ? 'Stop sharing' : 'Go live'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {online
            ? 'Customers you\u2019re chatting with can see your live location.'
            : 'Turn this on so customers can track you en route to a job.'}
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {online && <LiveMap lat={position?.lat} lng={position?.lng} label="You" />}
      </CardContent>
    </Card>
  )
}
