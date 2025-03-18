import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Building } from '@/types/building';
import Link from 'next/link';
import { Icon } from 'leaflet';

// Fix for default marker icon in Leaflet with Next.js
const customIcon = new Icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapComponentProps {
  buildings: Building[];
}

const MapComponent = ({ buildings }: MapComponentProps) => {
  // Default center of Japan
  const defaultCenter = { lat: 35.6895, lng: 139.6917 }; // Tokyo
  const defaultZoom = 6;

  // Fix for Leaflet marker icon in SSR
  useEffect(() => {
    // This is needed to fix the marker icon issue with webpack
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: '/marker-icon-2x.png',
      iconUrl: '/marker-icon.png',
      shadowUrl: '/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      scrollWheelZoom={true}
      style={{ height: '70vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {buildings.map((building) => (
        <Marker
          key={building.id}
          position={[building.latitude, building.longitude]}
          icon={customIcon}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-bold text-lg">{building.name}</h3>
              <p className="text-sm">
                <span className="font-medium">建築家:</span> {building.architect}
              </p>
              <p className="text-sm">
                <span className="font-medium">建築年:</span> {building.year}
              </p>
              <p className="text-sm mb-2">
                <span className="font-medium">場所:</span> {building.prefecture}
                {building.city}
              </p>
              <Link
                href={`/buildings/${building.id}`}
                className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 mt-2"
              >
                詳細を見る
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
