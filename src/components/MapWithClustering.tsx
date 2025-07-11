import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  IconButton, 
  Fab, 
  useTheme, 
  useMediaQuery,
  Tooltip,
  Zoom
} from '@mui/material';
import { 
  LocationOn, 
  EmojiEvents, 
  CalendarToday, 
  Architecture,
  MyLocation,
  ZoomIn,
  ZoomOut,
  Fullscreen,
  Layers,
  Close
} from '@mui/icons-material';
import { useGestureNavigation } from '../hooks/useGestureNavigation';
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
  enableMobileControls?: boolean;
  enableGestures?: boolean;
  enableFullscreen?: boolean;
  onMarkerClick?: (marker: ArchitectureMarker) => void;
  showLocationButton?: boolean;
}

/**
 * 建築物地図コンポーネント（クラスタリング機能付き）
 * 建築作品ページ用に最適化されたマップビュー
 */
const MapWithClustering: React.FC<MapWithClusteringProps> = ({ 
  markers, 
  center = [35.6762, 139.6503], // 東京をデフォルト中心に
  zoom = 6,
  height = '600px',
  enableMobileControls = true,
  enableGestures = true,
  enableFullscreen = true,
  onMarkerClick,
  showLocationButton = true
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [map, setMap] = useState<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [clusterGroup, setClusterGroup] = useState<L.MarkerClusterGroup | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showControls, setShowControls] = useState(!isMobile);

  // Gesture navigation for mobile
  const { gestureRef } = useGestureNavigation({
    onPinchStart: (scale) => {
      if (map && enableGestures) {
        map.dragging.disable();
      }
    },
    onPinchMove: (scale) => {
      if (map && enableGestures) {
        const newZoom = Math.max(2, Math.min(18, currentZoom + (scale - 1) * 2));
        setCurrentZoom(newZoom);
        map.setZoom(newZoom);
      }
    },
    onPinchEnd: (scale) => {
      if (map && enableGestures) {
        map.dragging.enable();
      }
    },
    onDoubleTap: (x, y) => {
      if (map && enableGestures) {
        const containerPoint = [x, y];
        const latLng = map.containerPointToLatLng(containerPoint as any);
        map.setView(latLng, Math.min(currentZoom + 2, 18));
      }
    },
    onLongPress: (x, y) => {
      if (isMobile) {
        setShowControls(!showControls);
      }
    }
  });

  // Get user location
  const getUserLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          if (map) {
            map.setView([latitude, longitude], 15);
          }
        },
        (error) => {
          console.warn("Failed to get user location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      );
    }
  }, [map]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (map) {
      const newZoom = Math.min(currentZoom + 1, 18);
      setCurrentZoom(newZoom);
      map.setZoom(newZoom);
    }
  }, [map, currentZoom]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      const newZoom = Math.max(currentZoom - 1, 2);
      setCurrentZoom(newZoom);
      map.setZoom(newZoom);
    }
  }, [map, currentZoom]);

  // Fullscreen toggle
  const handleFullscreenToggle = useCallback(() => {
    const mapContainer = document.getElementById('map-with-clustering');
    if (!mapContainer) return;

    if (!isFullscreen) {
      if (mapContainer.requestFullscreen) {
        mapContainer.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // 地図の初期化
  useEffect(() => {
    // 地図コンテナの存在確認
    const container = document.getElementById('map-with-clustering');
    if (!container) return;

    // 既存の地図インスタンスをクリーンアップ
    if (map) {
      map.remove();
    }

    // 新しい地図インスタンスを作成（モバイル最適化）
    const newMap = L.map('map-with-clustering', {
      center: center,
      zoom: zoom,
      scrollWheelZoom: !isMobile, // Disable scroll wheel zoom on mobile
      zoomControl: !enableMobileControls, // Use custom controls on mobile
      touchZoom: enableGestures,
      doubleClickZoom: enableGestures,
      boxZoom: false, // Disable box zoom on mobile
      keyboard: false, // Disable keyboard navigation on mobile
      dragging: true,
      tap: isMobile,
      tapTolerance: 20, // Increase tap tolerance for touch devices
      zoomSnap: 0.5, // Smoother zooming
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 100,
      maxZoom: 18,
      minZoom: 2
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
    
    // Add zoom event listener
    newMap.on('zoomend', () => {
      setCurrentZoom(newMap.getZoom());
    });

    // Add mobile-specific event listeners
    if (isMobile) {
      newMap.on('movestart', () => {
        setShowControls(false);
      });
      
      newMap.on('moveend', () => {
        setTimeout(() => setShowControls(false), 2000);
      });
    }
    
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
      
      // モバイル最適化されたポップアップコンテンツ
      const isMobilePopup = window.innerWidth < 768;
      const popupContent = `
        <div style="min-width: ${isMobilePopup ? '200px' : '250px'}; max-width: ${isMobilePopup ? '250px' : '300px'}; 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <h3 style="margin: 0 0 12px 0; font-size: ${isMobilePopup ? '14px' : '16px'}; font-weight: bold; line-height: 1.3;">
            ${title}
          </h3>
          ${architect ? `
            <div style="display: flex; align-items: center; margin-bottom: 6px; font-size: ${isMobilePopup ? '12px' : '13px'};">
              <span style="color: #666; margin-right: 8px; min-width: 50px;">建築家:</span>
              <span style="font-weight: 500;">${architect}</span>
            </div>
          ` : ''}
          ${year ? `
            <div style="display: flex; align-items: center; margin-bottom: 6px; font-size: ${isMobilePopup ? '12px' : '13px'};">
              <span style="color: #666; margin-right: 8px; min-width: 50px;">竣工年:</span>
              <span>${year}年</span>
            </div>
          ` : ''}
          ${category ? `
            <div style="display: flex; align-items: center; margin-bottom: 6px; font-size: ${isMobilePopup ? '12px' : '13px'};">
              <span style="color: #666; margin-right: 8px; min-width: 50px;">カテゴリ:</span>
              <span>${category}</span>
            </div>
          ` : ''}
          ${tags ? `
            <div style="display: flex; align-items: center; margin-bottom: 6px; font-size: ${isMobilePopup ? '12px' : '13px'};">
              <span style="color: #666; margin-right: 8px; min-width: 50px;">タグ:</span>
              <span style="color: #ff6b00; font-weight: bold;">${tags}</span>
            </div>
          ` : ''}
          ${address ? `
            <div style="display: flex; align-items: flex-start; margin-bottom: 12px; font-size: ${isMobilePopup ? '11px' : '12px'};">
              <span style="color: #666; margin-right: 8px; min-width: 50px; margin-top: 2px;">住所:</span>
              <span style="line-height: 1.3;">${address}</span>
            </div>
          ` : ''}
          <div style="text-align: center; margin-top: 16px;">
            <button onclick="window.location.hash='/architecture/${id}'" 
              style="background: #1976d2; color: white; border: none; 
                     padding: ${isMobilePopup ? '12px 20px' : '10px 18px'}; 
                     border-radius: 6px; cursor: pointer; 
                     font-size: ${isMobilePopup ? '14px' : '13px'}; 
                     font-weight: 500; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                     min-height: 44px; min-width: ${isMobilePopup ? '120px' : '100px'};">
              詳細を見る
            </button>
          </div>
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        maxWidth: isMobilePopup ? 280 : 320,
        minWidth: isMobilePopup ? 200 : 250,
        className: 'architecture-popup',
        closeButton: true,
        autoClose: true,
        keepInView: true,
        offset: [0, -10]
      });

      // クリックイベント
      marker.on('click', function() {
        // Custom click handler
        if (onMarkerClick) {
          onMarkerClick(markerData);
        }
        // Show controls on mobile when marker is clicked
        if (isMobile) {
          setShowControls(true);
          setTimeout(() => setShowControls(false), 3000);
        }
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
        ref={gestureRef}
        style={{ 
          height: '100%', 
          width: '100%',
          borderRadius: '4px',
          overflow: 'hidden'
        }} 
      />

      {/* Mobile Touch Controls */}
      {enableMobileControls && isMobile && (
        <Zoom in={showControls || loading}>
          <Box
            sx={{
              position: 'absolute',
              top: theme.spacing(2),
              right: theme.spacing(2),
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              zIndex: 1000,
            }}
          >
            {/* Zoom In */}
            <Tooltip title="ズームイン" placement="left">
              <Fab
                size="small"
                color="primary"
                onClick={handleZoomIn}
                disabled={currentZoom >= 18}
                sx={{
                  minHeight: '48px',
                  minWidth: '48px',
                  boxShadow: theme.shadows[6],
                }}
              >
                <ZoomIn />
              </Fab>
            </Tooltip>

            {/* Zoom Out */}
            <Tooltip title="ズームアウト" placement="left">
              <Fab
                size="small"
                color="primary"
                onClick={handleZoomOut}
                disabled={currentZoom <= 2}
                sx={{
                  minHeight: '48px',
                  minWidth: '48px',
                  boxShadow: theme.shadows[6],
                }}
              >
                <ZoomOut />
              </Fab>
            </Tooltip>

            {/* My Location */}
            {showLocationButton && (
              <Tooltip title="現在地" placement="left">
                <Fab
                  size="small"
                  color="secondary"
                  onClick={getUserLocation}
                  sx={{
                    minHeight: '48px',
                    minWidth: '48px',
                    boxShadow: theme.shadows[6],
                  }}
                >
                  <MyLocation />
                </Fab>
              </Tooltip>
            )}

            {/* Fullscreen */}
            {enableFullscreen && (
              <Tooltip title={isFullscreen ? "全画面終了" : "全画面表示"} placement="left">
                <Fab
                  size="small"
                  color="default"
                  onClick={handleFullscreenToggle}
                  sx={{
                    minHeight: '48px',
                    minWidth: '48px',
                    boxShadow: theme.shadows[6],
                  }}
                >
                  {isFullscreen ? <Close /> : <Fullscreen />}
                </Fab>
              </Tooltip>
            )}
          </Box>
        </Zoom>
      )}

      {/* Desktop Controls */}
      {enableMobileControls && !isMobile && (
        <Box
          sx={{
            position: 'absolute',
            bottom: theme.spacing(2),
            right: theme.spacing(2),
            display: 'flex',
            gap: 1,
            zIndex: 1000,
          }}
        >
          {showLocationButton && (
            <Tooltip title="現在地">
              <IconButton
                color="primary"
                onClick={getUserLocation}
                sx={{
                  backgroundColor: 'background.paper',
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    backgroundColor: 'background.paper',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                <MyLocation />
              </IconButton>
            </Tooltip>
          )}

          {enableFullscreen && (
            <Tooltip title={isFullscreen ? "全画面終了" : "全画面表示"}>
              <IconButton
                color="default"
                onClick={handleFullscreenToggle}
                sx={{
                  backgroundColor: 'background.paper',
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    backgroundColor: 'background.paper',
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                {isFullscreen ? <Close /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Mobile Instructions */}
      {isMobile && !loading && showControls && (
        <Zoom in={showControls}>
          <Box
            sx={{
              position: 'absolute',
              bottom: theme.spacing(2),
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: theme.spacing(1, 2),
              borderRadius: 2,
              zIndex: 1000,
              fontSize: '12px',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" color="inherit">
              長押しでコントロール表示 • ピンチでズーム • ダブルタップで拡大
            </Typography>
          </Box>
        </Zoom>
      )}

      {/* User Location Marker */}
      {userLocation && map && (
        <Box
          sx={{
            position: 'absolute',
            bottom: theme.spacing(1),
            left: theme.spacing(1),
            backgroundColor: 'primary.main',
            color: 'white',
            padding: theme.spacing(0.5, 1),
            borderRadius: 1,
            fontSize: '12px',
            zIndex: 1000,
          }}
        >
          現在地表示中
        </Box>
      )}

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