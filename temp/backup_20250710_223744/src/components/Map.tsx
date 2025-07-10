import React, { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
 * 地図コンポーネント（Leaflet Direct API使用版）
 * React Leafletの代わりに直接Leaflet APIを使用してコンテキストエラーを回避
 */
const Map: React.FC<MapProps> = ({ 
  markers = [], 
  center, 
  zoom = 13, 
  height = '500px',
  singleMarker
}) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  
  const mapRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && !mapInstance) {
      try {
        // 地図の初期化
        const initialCenter = singleMarker && singleMarker.latitude && singleMarker.longitude 
          ? [singleMarker.latitude, singleMarker.longitude] as L.LatLngExpression
          : center;
        
        const map = L.map(node).setView(initialCenter, zoom);
        
        // タイルレイヤーの追加
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // 単一マーカーの追加
        if (singleMarker && singleMarker.latitude && singleMarker.longitude) {
          const marker = L.marker([singleMarker.latitude, singleMarker.longitude]).addTo(map);
          marker.bindPopup(`
            <div>
              <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; font-weight: bold;">
                ${singleMarker.name}
              </h3>
              <p style="margin: 0; font-size: 0.9rem; color: #666;">
                ${singleMarker.location}
              </p>
            </div>
          `);
        }
        
        // 複数マーカーの追加
        markers.forEach((marker) => {
          if (marker.latitude && marker.longitude) {
            const leafletMarker = L.marker([marker.latitude, marker.longitude]).addTo(map);
            leafletMarker.bindPopup(`
              <div>
                <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; font-weight: bold;">
                  ${marker.name}
                </h3>
                <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #666;">
                  ${marker.location}
                </p>
                <a 
                  href="#/architecture/${marker.id}"
                  style="
                    display: inline-block;
                    padding: 6px 12px;
                    background-color: #1976d2;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 0.875rem;
                  "
                >
                  詳細を見る
                </a>
              </div>
            `);
          }
        });
        
        setMapInstance(map);
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    }
  }, [markers, center, zoom, singleMarker, mapInstance]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [mapInstance]);

  return (
    <div 
      ref={mapRef}
      style={{ height, width: '100%', marginBottom: '20px' }}
      className="leaflet-container"
    />
  );
};

export default Map;