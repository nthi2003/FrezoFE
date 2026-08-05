// GeoFenceMapPreview — OSM/Leaflet plan view for Admin GPS check-in fence
// Marker = office lat/lng; Circle = allowedRadiusMeters. No API key.

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MapPin } from 'lucide-react'
import { EmptyState } from '@frezo/ui'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const officeIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const CIRCLE_STYLE: L.PathOptions = {
  color: '#15803d',
  fillColor: '#22c55e',
  fillOpacity: 0.18,
  weight: 2,
}

export interface GeoFenceMapPreviewProps {
  latitude: number
  longitude: number
  radiusMeters: number
  className?: string
}

function isValidLatLng(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  // NumberInput clears → 0; treat 0/0 as "chưa nhập" for office config
  if (lat === 0 && lng === 0) return false
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

export function GeoFenceMapPreview({
  latitude,
  longitude,
  radiusMeters,
  className,
}: GeoFenceMapPreviewProps) {
  const valid = isValidLatLng(latitude, longitude)
  const radius = Number.isFinite(radiusMeters) && radiusMeters > 0 ? radiusMeters : 0

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  // Create / destroy map when validity flips
  useEffect(() => {
    if (!valid || !containerRef.current) return

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([latitude, longitude], 16)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    markerRef.current = L.marker([latitude, longitude], { icon: officeIcon }).addTo(map)
    if (radius > 0) {
      circleRef.current = L.circle([latitude, longitude], {
        radius,
        ...CIRCLE_STYLE,
      }).addTo(map)
    }

    mapRef.current = map
    // invalidate after layout (card may animate / flex)
    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
    // Intentionally mount once per valid session; live updates handled below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid])

  // Live sync marker + circle + viewport
  useEffect(() => {
    const map = mapRef.current
    if (!valid || !map) return

    const center = L.latLng(latitude, longitude)
    markerRef.current?.setLatLng(center)

    if (radius > 0) {
      if (circleRef.current) {
        circleRef.current.setLatLng(center)
        circleRef.current.setRadius(radius)
      } else {
        circleRef.current = L.circle(center, { radius, ...CIRCLE_STYLE }).addTo(map)
      }
    } else if (circleRef.current) {
      map.removeLayer(circleRef.current)
      circleRef.current = null
    }

    const span = Math.max(radius > 0 ? radius * 2.4 : 200, 80)
    map.fitBounds(center.toBounds(span), { padding: [28, 28], maxZoom: 18 })
    map.invalidateSize()
  }, [valid, latitude, longitude, radius])

  if (!valid) {
    return (
      <div
        className={`rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 ${className ?? ''}`}
      >
        <EmptyState
          icon={MapPin}
          title="Nhập tọa độ để xem bản đồ"
          description="Điền vĩ độ và kinh độ văn phòng — bản đồ sẽ hiện tâm và bán kính chấm công."
          className="py-10"
        />
      </div>
    )
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 ${className ?? ''}`}
    >
      <div
        ref={containerRef}
        className="relative z-0 h-64 w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:font-sans"
      />
      <div className="flex items-center justify-between gap-2 border-t border-neutral-100 px-3 py-2 text-[11px] text-neutral-500 tabular-nums">
        <span>
          Tâm {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </span>
        <span>r = {radius || 0}m · OpenStreetMap</span>
      </div>
    </div>
  )
}
