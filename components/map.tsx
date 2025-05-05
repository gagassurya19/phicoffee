import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix for default marker icon
const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface MapProps {
  onLocationSelect: (location: [number, number]) => void
  selectedLocation: [number, number] | null
  initialPosition?: [number, number]
}

function MapController({ onLocationSelect, position }: { onLocationSelect: (location: [number, number]) => void, position: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(position)
  }, [map, position])

  useEffect(() => {
    const updateLocation = () => {
      const center = map.getCenter()
      onLocationSelect([center.lat, center.lng])
    }

    map.on('moveend', updateLocation)
    return () => {
      map.off('moveend', updateLocation)
    }
  }, [map, onLocationSelect])

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none">
      <div className="w-8 h-8">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#667538"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
      </div>
    </div>
  )
}

export default function Map({ onLocationSelect, selectedLocation, initialPosition }: MapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    if (initialPosition) {
      setPosition(initialPosition)
    } else if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }

      const successCallback = (position: GeolocationPosition) => {
        const newPosition: [number, number] = [position.coords.latitude, position.coords.longitude]
        setPosition(newPosition)
        onLocationSelect(newPosition)
      }

      const errorCallback = (error: GeolocationPositionError) => {
        console.error('Error getting location:', {
          code: error.code,
          message: error.message
        })
        
        // Fallback to Telyu coordinates
        const fallbackPosition: [number, number] = [-6.972885456743498, 107.63199610430928]
        setPosition(fallbackPosition)
        onLocationSelect(fallbackPosition)
      }

      try {
        navigator.geolocation.getCurrentPosition(
          successCallback,
          errorCallback,
          options
        )
      } catch (error) {
        console.error('Geolocation error:', error)
        // Fallback to Telyu coordinates
        const fallbackPosition: [number, number] = [-6.972885456743498, 107.63199610430928]
        setPosition(fallbackPosition)
        onLocationSelect(fallbackPosition)
      }
    } else {
      // Fallback to Telyu if geolocation is not supported
      const fallbackPosition: [number, number] = [-6.972885456743498, 107.63199610430928]
      setPosition(fallbackPosition)
      onLocationSelect(fallbackPosition)
    }
  }, [isClient, initialPosition])

  if (!isClient || !position) {
    return null
  }

  return (
    <div className="relative h-full w-full" style={{ zIndex: 0 }}>
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController onLocationSelect={onLocationSelect} position={position} />
      </MapContainer>
    </div>
  )
} 