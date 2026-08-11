interface LiveMapProps {
  lat: number | null | undefined
  lng: number | null | undefined
  label?: string
  zoomDelta?: number
}

export function LiveMap({ lat, lng, label, zoomDelta = 0.01 }: LiveMapProps) {
  if (lat == null || lng == null) {
    return (
      <div className="w-full h-48 rounded-lg border border-border bg-secondary/30 flex items-center justify-center text-muted-foreground text-sm">
        waiting for location…
      </div>
    )
  }

  const bbox = `${lng - zoomDelta}%2C${lat - zoomDelta}%2C${lng + zoomDelta}%2C${lat + zoomDelta}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`

  return (
    <div className="rounded-lg overflow-hidden border border-border relative">
      <iframe title={label || 'Live location'} src={src} className="w-full h-48 border-0" loading="lazy" />
      <div className="absolute top-2 left-2 bg-neutral-900/90 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {label || 'Live'}
      </div>
    </div>
  )
}
