import React, { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
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
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  position?: [number, number];
  title?: string;
  architect?: string;
  year?: number;
  category?: string;
  tags?: string;
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
 * マーカークラスタリング機能付き
 */
const Map: React.FC<MapProps> = ({ 
  markers = [], 
  center, 
  zoom = 13, 
  height = '500px',
  singleMarker
}) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [markerClusterGroup, setMarkerClusterGroup] = useState<any | null>(null);
  
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
        
        // マーカークラスターグループの作成
        const markerCluster = L.markerClusterGroup({
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          chunkedLoading: true,
          chunkProgress: (processed, total, elapsed) => {
            if (processed === total) {
              console.log(`All ${total} markers loaded in ${elapsed}ms`);
            }
          }
        });
        
        // 単一マーカーの追加
        if (singleMarker) {
          const lat = singleMarker.latitude || (singleMarker.position && singleMarker.position[0]);
          const lng = singleMarker.longitude || (singleMarker.position && singleMarker.position[1]);
          const title = singleMarker.name || singleMarker.title;
          
          if (lat && lng) {
            const marker = L.marker([lat, lng]);
            marker.bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; font-weight: bold;">
                  ${title}
                </h3>
                ${singleMarker.architect ? `
                  <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                    <strong>建築家:</strong> ${singleMarker.architect}
                  </p>
                ` : ''}
                ${singleMarker.year ? `
                  <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                    <strong>竣工年:</strong> ${singleMarker.year}年
                  </p>
                ` : ''}
                ${singleMarker.location ? `
                  <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #666;">
                    ${singleMarker.location}
                  </p>
                ` : ''}
                <a 
                  href="/architecture/${singleMarker.id}"
                  style="
                    display: inline-block;
                    padding: 6px 12px;
                    background-color: #1976d2;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 0.875rem;
                  "
                  onclick="window.location.href='/architecture/${singleMarker.id}'; return false;"
                >
                  詳細を見る
                </a>
              </div>
            `);
            markerCluster.addLayer(marker);
          }
        }
        
        // 複数マーカーの追加
        markers.forEach((marker) => {
          const lat = marker.latitude || (marker.position && marker.position[0]);
          const lng = marker.longitude || (marker.position && marker.position[1]);
          const title = marker.name || marker.title;
          
          if (lat && lng) {
            const leafletMarker = L.marker([lat, lng]);
            leafletMarker.bindPopup(`
              <div style="min-width: 250px;">
                <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; font-weight: bold;">
                  ${title || '建築作品'}
                </h3>
                ${marker.architect ? `
                  <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                    <strong>建築家:</strong> ${marker.architect}
                  </p>
                ` : ''}
                ${marker.year ? `
                  <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                    <strong>竣工年:</strong> ${marker.year}年
                  </p>
                ` : ''}
                ${marker.category ? `
                  <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                    <strong>カテゴリ:</strong> ${marker.category}
                  </p>
                ` : ''}
                ${marker.tags ? `
                  <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                    <strong>受賞:</strong> <span style="color: #ff6f00;">${marker.tags}</span>
                  </p>
                ` : ''}
                ${marker.location ? `
                  <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #666;">
                    <strong>所在地:</strong> ${marker.location}
                  </p>
                ` : ''}
                <a 
                  href="/architecture/${marker.id}"
                  style="
                    display: inline-block;
                    padding: 6px 12px;
                    background-color: #1976d2;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 0.875rem;
                  "
                  onclick="window.location.href='/architecture/${marker.id}'; return false;"
                >
                  詳細を見る
                </a>
              </div>
            `);
            markerCluster.addLayer(leafletMarker);
          }
        });
        
        // Auto-fit bounds if we have markers
        if (markers.length > 0 && !singleMarker) {
          const validMarkers = markers.filter(m => {
            const lat = m.latitude || (m.position && m.position[0]);
            const lng = m.longitude || (m.position && m.position[1]);
            return lat && lng;
          });
          
          if (validMarkers.length > 0) {
            const bounds = L.latLngBounds(validMarkers.map(m => {
              const lat = m.latitude || (m.position && m.position[0]);
              const lng = m.longitude || (m.position && m.position[1]);
              return [lat!, lng!] as L.LatLngTuple;
            }));
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
        
        // クラスターグループを地図に追加
        map.addLayer(markerCluster);
        
        setMarkerClusterGroup(markerCluster);
        
        setMapInstance(map);
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    }
  }, [center, zoom, singleMarker, mapInstance]);
  
  // マーカーの更新処理
  useEffect(() => {
    if (mapInstance && markerClusterGroup && markers.length > 0) {
      // 既存のマーカーをクリア
      markerClusterGroup.clearLayers();
      
      // 新しいマーカーを追加
      markers.forEach((marker) => {
        const lat = marker.latitude || (marker.position && marker.position[0]);
        const lng = marker.longitude || (marker.position && marker.position[1]);
        const title = marker.name || marker.title;
        
        if (lat && lng) {
          const leafletMarker = L.marker([lat, lng]);
          leafletMarker.bindPopup(`
            <div style="min-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-size: 1.1rem; font-weight: bold;">
                ${title || '建築作品'}
              </h3>
              ${marker.architect ? `
                <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                  <strong>建築家:</strong> ${marker.architect}
                </p>
              ` : ''}
              ${marker.year ? `
                <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                  <strong>竣工年:</strong> ${marker.year}年
                </p>
              ` : ''}
              ${marker.category ? `
                <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                  <strong>カテゴリ:</strong> ${marker.category}
                </p>
              ` : ''}
              ${marker.tags ? `
                <p style="margin: 0 0 4px 0; font-size: 0.9rem;">
                  <strong>受賞:</strong> <span style="color: #ff6f00;">${marker.tags}</span>
                </p>
              ` : ''}
              ${marker.location ? `
                <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #666;">
                  <strong>所在地:</strong> ${marker.location}
                </p>
              ` : ''}
              <a 
                href="/architecture/${marker.id}"
                style="
                  display: inline-block;
                  padding: 6px 12px;
                  background-color: #1976d2;
                  color: white;
                  text-decoration: none;
                  border-radius: 4px;
                  font-size: 0.875rem;
                "
                onclick="window.location.href='/architecture/${marker.id}'; return false;"
              >
                詳細を見る
              </a>
            </div>
          `);
          markerClusterGroup.addLayer(leafletMarker);
        }
      });
      
      // Auto-fit bounds
      const validMarkers = markers.filter(m => {
        const lat = m.latitude || (m.position && m.position[0]);
        const lng = m.longitude || (m.position && m.position[1]);
        return lat && lng;
      });
      
      if (validMarkers.length > 0) {
        const bounds = L.latLngBounds(validMarkers.map(m => {
          const lat = m.latitude || (m.position && m.position[0]);
          const lng = m.longitude || (m.position && m.position[1]);
          return [lat!, lng!] as L.LatLngTuple;
        }));
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [markers, mapInstance, markerClusterGroup]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (markerClusterGroup && mapInstance) {
        mapInstance.removeLayer(markerClusterGroup);
      }
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [mapInstance, markerClusterGroup]);

  return (
    <div 
      ref={mapRef}
      style={{ height, width: '100%', marginBottom: '20px' }}
      className="leaflet-container"
    />
  );
};

export default Map;