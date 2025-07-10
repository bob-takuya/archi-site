import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Box, CircularProgress, Typography } from '@mui/material';
import { LocationOn, EmojiEvents, CalendarToday, Architecture } from '@mui/icons-material';
import '../styles/map.css';

// Leaflet iconのデフォルト設定を修正
// @ts-ignore - Leafletのアイコン設定はTypeScriptの型定義と完全に一致しないため
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// 建築物マーカーのデータ型定義
interface ArchitectureMarker {
  id: string | number;
  position: [number, number];
  title: string;
  architect?: string;
  year?: number;
  category?: string;
  tags?: string;
  address?: string;
}

// MapWithClusteringコンポーネントのprops定義
interface MapWithClusteringProps {
  markers: ArchitectureMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

/**
 * 建築物地図コンポーネント（クラスタリング機能付き）
 * 建築作品ページ用に最適化されたマップビュー
 */
const MapWithClustering: React.FC<MapWithClusteringProps> = ({ 
  markers, 
  center = [35.6762, 139.6503], // 東京をデフォルト中心に
  zoom = 6,
  height = '600px'
}) => {
  const navigate = useNavigate();
  const [map, setMap] = useState<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [clusterGroup, setClusterGroup] = useState<L.MarkerClusterGroup | null>(null);

  // 地図の初期化
  useEffect(() => {
    // 地図コンテナの存在確認
    const container = document.getElementById('map-with-clustering');
    if (!container) return;

    // 既存の地図インスタンスをクリーンアップ
    if (map) {
      map.remove();
    }

    // 新しい地図インスタンスを作成
    const newMap = L.map('map-with-clustering', {
      center: center,
      zoom: zoom,
      scrollWheelZoom: true,
      zoomControl: true
    });

    // タイルレイヤーを追加（OpenStreetMap）
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(newMap);

    // マーカークラスターグループを作成
    const newClusterGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      animate: true,
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
      maxClusterRadius: 80,
      iconCreateFunction: function(cluster: any) {
        const count = cluster.getChildCount();
        let size = 'small';
        let className = 'marker-cluster-small';
        
        if (count > 100) {
          size = 'large';
          className = 'marker-cluster-large';
        } else if (count > 50) {
          size = 'medium';
          className = 'marker-cluster-medium';
        }

        return new (L as any).DivIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster ${className}`,
          iconSize: new (L as any).Point(40, 40)
        });
      }
    });

    newMap.addLayer(newClusterGroup);
    
    setMap(newMap);
    setClusterGroup(newClusterGroup);
    setLoading(false);

    // クリーンアップ
    return () => {
      newMap.remove();
    };
  }, []); // 初回マウント時のみ実行

  // マーカーの更新
  useEffect(() => {
    if (!map || !clusterGroup || !markers || markers.length === 0) return;

    // 既存のマーカーをクリア
    clusterGroup.clearLayers();

    // 新しいマーカーを追加
    const validMarkers = markers.filter(marker => 
      marker.position && 
      marker.position[0] && 
      marker.position[1] &&
      !isNaN(marker.position[0]) && 
      !isNaN(marker.position[1])
    );

    const leafletMarkers = validMarkers.map(markerData => {
      const { position, title, architect, year, category, tags, address, id } = markerData;
      
      // カスタムアイコン（賞を受賞している建築物用）
      const hasAward = tags && tags.includes('賞');
      const icon = hasAward ? new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      }) : new L.Icon.Default();

      const marker = L.marker(position, { icon });
      
      // ポップアップコンテンツ
      const popupContent = `
        <div style="min-width: 250px; max-width: 300px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">
            ${title}
          </h3>
          ${architect ? `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="color: #666; margin-right: 8px;">建築家:</span>
              <span>${architect}</span>
            </div>
          ` : ''}
          ${year ? `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="color: #666; margin-right: 8px;">竣工年:</span>
              <span>${year}年</span>
            </div>
          ` : ''}
          ${category ? `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="color: #666; margin-right: 8px;">カテゴリ:</span>
              <span>${category}</span>
            </div>
          ` : ''}
          ${tags ? `
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="color: #666; margin-right: 8px;">タグ:</span>
              <span style="color: #ff6b00; font-weight: bold;">${tags}</span>
            </div>
          ` : ''}
          ${address ? `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #666; margin-right: 8px;">住所:</span>
              <span style="font-size: 12px;">${address}</span>
            </div>
          ` : ''}
          <div style="text-align: center; margin-top: 12px;">
            <button onclick="window.location.hash='/architecture/${id}'" 
              style="background: #1976d2; color: white; border: none; padding: 8px 16px; 
                     border-radius: 4px; cursor: pointer; font-size: 14px;">
              詳細を見る
            </button>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        maxWidth: 300,
        minWidth: 250,
        className: 'architecture-popup'
      });

      // クリックイベント
      marker.on('click', function() {
        // ポップアップが自動的に開く
      });

      return marker;
    });

    // マーカーをクラスターグループに追加
    clusterGroup.addLayers(leafletMarkers);

    // マーカーが存在する場合、地図の範囲を調整
    if (validMarkers.length > 0) {
      setTimeout(() => {
        const bounds = clusterGroup.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { 
            padding: [50, 50],
            maxZoom: 15
          });
        }
      }, 100);
    }
  }, [markers, map, clusterGroup, navigate]);

  // 中心位置とズームの更新
  useEffect(() => {
    if (!map) return;
    
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <CircularProgress />
          <Typography>地図を読み込み中...</Typography>
        </Box>
      )}
      <div 
        id="map-with-clustering" 
        style={{ 
          height: '100%', 
          width: '100%',
          borderRadius: '4px',
          overflow: 'hidden'
        }} 
      />
      {markers.length === 0 && !loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: 3,
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          <LocationOn sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            表示する建築物がありません
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            フィルターを調整するか、検索条件を変更してください
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MapWithClustering;