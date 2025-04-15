import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/map.css';
import L from 'leaflet';

// Fix for default marker icons in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapComponent = ({ markers = [], center, zoom = 13, height = '400px', singleMarker = null }) => {
  const mapCenter = center || (markers.length > 0 
    ? [markers[0].latitude, markers[0].longitude] 
    : (singleMarker ? [singleMarker.latitude, singleMarker.longitude] : [35.6762, 139.6503])); // Tokyo as default

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {singleMarker && (
          <Marker position={[singleMarker.latitude, singleMarker.longitude]}>
            <Popup>
              <strong>{singleMarker.name}</strong><br />
              {singleMarker.location}
            </Popup>
          </Marker>
        )}
        
        {markers.map((marker, index) => (
          <Marker 
            key={marker.id || index} 
            position={[marker.latitude, marker.longitude]}
          >
            <Popup>
              <strong>{marker.name}</strong><br />
              {marker.location}<br />
              {marker.architectName && <span>建築家: {marker.architectName}</span>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent; 