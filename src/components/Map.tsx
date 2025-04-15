import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import '../styles/map.css';

// Leaflet iconのデフォルト設定を修正
// @ts-ignore - Leafletのアイコン設定はTypeScriptの型定義と完全に一致しないため
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// マーカーのデータ型定義
interface MapMarker {
  id: string | number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
}

// Mapコンポーネントのprops定義
interface MapProps {
  markers?: MapMarker[];
  center: L.LatLngExpression;
  zoom?: number;
  height?: string;
  singleMarker?: MapMarker;
}

/**
 * 地図コンポーネント
 * マーカーの配列を受け取り、地図上に表示する
 */
const Map: React.FC<MapProps> = ({ 
  markers = [], 
  center, 
  zoom = 13, 
  height = '500px',
  singleMarker
}) => {
  const [mapCenter, setMapCenter] = useState<L.LatLngExpression>(center);
  
  // マーカーが1つの場合はそのマーカーを中心にする
  useEffect(() => {
    if (singleMarker && singleMarker.latitude && singleMarker.longitude) {
      setMapCenter([singleMarker.latitude, singleMarker.longitude]);
    } else if (center) {
      setMapCenter(center);
    }
  }, [singleMarker, center]);

  return (
    <div style={{ height, width: '100%', marginBottom: '20px' }}>
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* 複数マーカーの表示 */}
        {markers.map((marker, index) => (
          marker.latitude && marker.longitude ? (
            <Marker 
              key={`marker-${marker.id || index}`} 
              position={[marker.latitude, marker.longitude]}
            >
              <Popup>
                <Typography variant="h6">{marker.name}</Typography>
                <Typography variant="body2">{marker.location}</Typography>
                <Button 
                  component={Link} 
                  to={`/architecture/${marker.id}`} 
                  size="small" 
                  variant="outlined" 
                  sx={{ mt: 1 }}
                >
                  詳細を見る
                </Button>
              </Popup>
            </Marker>
          ) : null
        ))}
        
        {/* 単一マーカーの表示 */}
        {singleMarker && singleMarker.latitude && singleMarker.longitude && (
          <Marker 
            position={[singleMarker.latitude, singleMarker.longitude]}
          >
            <Popup>
              <Typography variant="h6">{singleMarker.name}</Typography>
              <Typography variant="body2">{singleMarker.location}</Typography>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default Map; 