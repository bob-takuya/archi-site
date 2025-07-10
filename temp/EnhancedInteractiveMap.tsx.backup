import React, { useEffect, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Chip, 
  Switch, 
  FormControlLabel,
  Slider,
  IconButton,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  LayersOutlined,
  FilterAlt,
  Analytics,
  Download,
  Fullscreen,
  ZoomIn,
  ZoomOut,
  MyLocation
} from '@mui/icons-material';
import '../styles/map.css';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Enhanced marker data with analytics
interface EnhancedMapMarker {
  id: string | number;
  name: string;
  architect?: string;
  location: string;
  latitude: number;
  longitude: number;
  year?: number;
  category?: string;
  prefecture?: string;
  imageUrl?: string;
  description?: string;
  visits?: number;
  popularity?: number;
  rating?: number;
}

// Map analytics data
interface MapAnalytics {
  totalMarkers: number;
  visibleMarkers: number;
  clusteredMarkers: number;
  yearRange: [number, number];
  prefectures: string[];
  categories: string[];
  averagePopularity: number;
  density: number;
}

// Component props
interface EnhancedInteractiveMapProps {
  markers?: EnhancedMapMarker[];
  center: L.LatLngExpression;
  zoom?: number;
  height?: string;
  singleMarker?: EnhancedMapMarker;
  onMarkerClick?: (marker: EnhancedMapMarker) => void;
  onBoundsChange?: (bounds: L.LatLngBounds, analytics: MapAnalytics) => void;
  enableClustering?: boolean;
  enableHeatmap?: boolean;
  enableAnalytics?: boolean;
  filterOptions?: {
    yearRange?: [number, number];
    categories?: string[];
    prefectures?: string[];
    popularityThreshold?: number;
  };
}

// Custom marker icons by category
const createCustomIcon = (category: string, popularity: number = 0) => {
  const colors = {
    residential: '#4CAF50',
    commercial: '#2196F3', 
    cultural: '#FF9800',
    educational: '#9C27B0',
    religious: '#795548',
    industrial: '#607D8B',
    default: '#F44336'
  };
  
  const color = colors[category as keyof typeof colors] || colors.default;
  const size = Math.max(20, Math.min(40, 20 + (popularity * 20)));
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(10, size * 0.3)}px;
      ">
        ${category ? category.charAt(0).toUpperCase() : 'A'}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

/**
 * Enhanced Interactive Map Component with Clustering and Analytics
 */
const EnhancedInteractiveMap: React.FC<EnhancedInteractiveMapProps> = ({
  markers = [],
  center,
  zoom = 10,
  height = '600px',
  singleMarker,
  onMarkerClick,
  onBoundsChange,
  enableClustering = true,
  enableHeatmap = false,
  enableAnalytics = true,
  filterOptions = {}
}) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [markerClusterGroup, setMarkerClusterGroup] = useState<L.MarkerClusterGroup | null>(null);
  const [analytics, setAnalytics] = useState<MapAnalytics | null>(null);
  const [layerMenuAnchor, setLayerMenuAnchor] = useState<null | HTMLElement>(null);
  const [clusteringEnabled, setClusteringEnabled] = useState(enableClustering);
  const [heatmapEnabled, setHeatmapEnabled] = useState(enableHeatmap);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [visibleMarkers, setVisibleMarkers] = useState<EnhancedMapMarker[]>([]);

  // Calculate analytics
  const calculateAnalytics = useCallback((bounds: L.LatLngBounds, filteredMarkers: EnhancedMapMarker[]): MapAnalytics => {
    const visibleMarkers = filteredMarkers.filter(marker => 
      bounds.contains([marker.latitude, marker.longitude])
    );
    
    const years = filteredMarkers.filter(m => m.year).map(m => m.year!);
    const yearRange: [number, number] = years.length > 0 
      ? [Math.min(...years), Math.max(...years)]
      : [2000, new Date().getFullYear()];
    
    const prefectures = [...new Set(filteredMarkers.map(m => m.prefecture).filter(Boolean))];
    const categories = [...new Set(filteredMarkers.map(m => m.category).filter(Boolean))];
    
    const popularity = filteredMarkers.map(m => m.popularity || 0);
    const averagePopularity = popularity.length > 0 
      ? popularity.reduce((a, b) => a + b, 0) / popularity.length 
      : 0;
    
    const area = bounds.getNorthEast().distanceTo(bounds.getSouthWest()) / 1000; // km²
    const density = visibleMarkers.length / Math.max(area, 1);
    
    return {
      totalMarkers: filteredMarkers.length,
      visibleMarkers: visibleMarkers.length,
      clusteredMarkers: clusteringEnabled ? visibleMarkers.length : 0,
      yearRange,
      prefectures,
      categories,
      averagePopularity,
      density
    };
  }, [clusteringEnabled]);

  // Filter markers based on options
  const filteredMarkers = React.useMemo(() => {
    return markers.filter(marker => {
      if (filterOptions.yearRange && marker.year) {
        const [minYear, maxYear] = filterOptions.yearRange;
        if (marker.year < minYear || marker.year > maxYear) return false;
      }
      
      if (filterOptions.categories && filterOptions.categories.length > 0 && marker.category) {
        if (!filterOptions.categories.includes(marker.category)) return false;
      }
      
      if (filterOptions.prefectures && filterOptions.prefectures.length > 0 && marker.prefecture) {
        if (!filterOptions.prefectures.includes(marker.prefecture)) return false;
      }
      
      if (filterOptions.popularityThreshold && marker.popularity) {
        if (marker.popularity < filterOptions.popularityThreshold) return false;
      }
      
      return true;
    });
  }, [markers, filterOptions]);

  // Create enhanced popup content
  const createPopupContent = (marker: EnhancedMapMarker) => {
    return `
      <div style="min-width: 250px; max-width: 300px;">
        ${marker.imageUrl ? `
          <img src="${marker.imageUrl}" alt="${marker.name}" 
               style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
        ` : ''}
        <h3 style="margin: 0 0 8px 0; font-size: 1.2rem; font-weight: bold; color: #1976d2;">
          ${marker.name}
        </h3>
        ${marker.architect ? `
          <p style="margin: 0 0 4px 0; font-size: 0.9rem; color: #666; font-style: italic;">
            設計: ${marker.architect}
          </p>
        ` : ''}
        <p style="margin: 0 0 8px 0; font-size: 0.9rem; color: #666;">
          📍 ${marker.location}
        </p>
        ${marker.year ? `
          <p style="margin: 0 0 8px 0; font-size: 0.9rem; color: #666;">
            📅 ${marker.year}年
          </p>
        ` : ''}
        ${marker.category ? `
          <span style="
            display: inline-block;
            padding: 4px 8px;
            background-color: #e3f2fd;
            color: #1976d2;
            border-radius: 12px;
            font-size: 0.8rem;
            margin-bottom: 8px;
          ">
            ${marker.category}
          </span>
        ` : ''}
        ${marker.description ? `
          <p style="margin: 8px 0; font-size: 0.85rem; color: #555; line-height: 1.4;">
            ${marker.description.length > 100 ? marker.description.substring(0, 100) + '...' : marker.description}
          </p>
        ` : ''}
        ${marker.popularity ? `
          <div style="margin: 8px 0; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.8rem; color: #666;">人気度:</span>
            <div style="flex: 1; height: 6px; background-color: #e0e0e0; border-radius: 3px; overflow: hidden;">
              <div style="width: ${marker.popularity * 100}%; height: 100%; background-color: #4caf50;"></div>
            </div>
            <span style="font-size: 0.8rem; color: #666;">${Math.round(marker.popularity * 100)}%</span>
          </div>
        ` : ''}
        <button 
          onclick="window.dispatchEvent(new CustomEvent('marker-click', { detail: ${JSON.stringify(marker)} }))"
          style="
            width: 100%;
            padding: 8px 16px;
            margin-top: 12px;
            background-color: #1976d2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.2s;
          "
          onmouseover="this.style.backgroundColor='#1565c0'"
          onmouseout="this.style.backgroundColor='#1976d2'"
        >
          詳細を見る
        </button>
      </div>
    `;
  };

  // Initialize map
  const mapRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && !mapInstance) {
      try {
        const initialCenter = singleMarker && singleMarker.latitude && singleMarker.longitude 
          ? [singleMarker.latitude, singleMarker.longitude] as L.LatLngExpression
          : center;
        
        const map = L.map(node, {
          center: initialCenter,
          zoom,
          zoomControl: false, // We'll add custom controls
          attributionControl: true
        });
        
        // Add tile layers
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        });
        
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19
        });
        
        osmLayer.addTo(map);
        
        // Add layer control
        const baseLayers = {
          "標準地図": osmLayer,
          "衛星画像": satelliteLayer
        };
        L.control.layers(baseLayers).addTo(map);
        
        // Create marker cluster group
        const clusterGroup = L.markerClusterGroup({
          maxClusterRadius: 50,
          disableClusteringAtZoom: 15,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: true,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            const size = count < 10 ? 30 : count < 100 ? 40 : 50;
            return L.divIcon({
              html: `<div style="
                background: linear-gradient(135deg, #1976d2, #1565c0);
                color: white;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: ${Math.max(12, size * 0.3)}px;
                width: ${size}px;
                height: ${size}px;
              ">${count}</div>`,
              className: 'marker-cluster-custom',
              iconSize: L.point(size, size, true)
            });
          }
        });
        
        // Handle bounds change
        map.on('moveend zoomend', () => {
          const bounds = map.getBounds();
          const analytics = calculateAnalytics(bounds, filteredMarkers);
          setAnalytics(analytics);
          
          if (onBoundsChange) {
            onBoundsChange(bounds, analytics);
          }
        });
        
        setMapInstance(map);
        setMarkerClusterGroup(clusterGroup);
        
        // Listen for marker clicks
        window.addEventListener('marker-click', (event: any) => {
          if (onMarkerClick) {
            onMarkerClick(event.detail);
          }
        });
        
      } catch (error) {
        console.error('Map initialization error:', error);
      }
    }
  }, [center, zoom, singleMarker, onBoundsChange, onMarkerClick, calculateAnalytics, filteredMarkers, mapInstance]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstance || !markerClusterGroup) return;
    
    // Clear existing markers
    markerClusterGroup.clearLayers();
    
    // Add filtered markers
    filteredMarkers.forEach((marker) => {
      if (marker.latitude && marker.longitude) {
        const leafletMarker = L.marker(
          [marker.latitude, marker.longitude],
          { 
            icon: createCustomIcon(marker.category || 'default', marker.popularity || 0) 
          }
        );
        
        leafletMarker.bindPopup(createPopupContent(marker), {
          maxWidth: 300,
          minWidth: 250
        });
        
        if (clusteringEnabled) {
          markerClusterGroup.addLayer(leafletMarker);
        } else {
          leafletMarker.addTo(mapInstance);
        }
      }
    });
    
    // Add cluster group to map if clustering is enabled
    if (clusteringEnabled && !mapInstance.hasLayer(markerClusterGroup)) {
      mapInstance.addLayer(markerClusterGroup);
    } else if (!clusteringEnabled && mapInstance.hasLayer(markerClusterGroup)) {
      mapInstance.removeLayer(markerClusterGroup);
    }
    
    // Add single marker if provided
    if (singleMarker && singleMarker.latitude && singleMarker.longitude) {
      const singleLeafletMarker = L.marker([singleMarker.latitude, singleMarker.longitude], {
        icon: createCustomIcon(singleMarker.category || 'default', singleMarker.popularity || 1)
      });
      singleLeafletMarker.bindPopup(createPopupContent(singleMarker));
      singleLeafletMarker.addTo(mapInstance);
    }
    
    setVisibleMarkers(filteredMarkers);
    
  }, [mapInstance, markerClusterGroup, filteredMarkers, singleMarker, clusteringEnabled]);

  // Toggle clustering
  const toggleClustering = () => {
    setClusteringEnabled(!clusteringEnabled);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (mapRef.current?.requestFullscreen) {
        mapRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Zoom controls
  const zoomIn = () => mapInstance?.zoomIn();
  const zoomOut = () => mapInstance?.zoomOut();
  const goToUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        mapInstance?.setView([position.coords.latitude, position.coords.longitude], 15);
      });
    }
  };

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      {/* Map Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {/* Zoom Controls */}
        <Paper elevation={2} sx={{ p: 0.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <IconButton size="small" onClick={zoomIn}>
              <ZoomIn />
            </IconButton>
            <IconButton size="small" onClick={zoomOut}>
              <ZoomOut />
            </IconButton>
            <IconButton size="small" onClick={goToUserLocation}>
              <MyLocation />
            </IconButton>
          </Box>
        </Paper>

        {/* Map Controls */}
        <Paper elevation={2} sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 200 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={clusteringEnabled}
                  onChange={toggleClustering}
                  size="small"
                />
              }
              label="クラスタリング"
              sx={{ margin: 0 }}
            />
            
            <Button
              size="small"
              startIcon={<Fullscreen />}
              onClick={toggleFullscreen}
              variant="outlined"
            >
              {isFullscreen ? '元に戻す' : 'フルスクリーン'}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Analytics Panel */}
      {enableAnalytics && analytics && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            zIndex: 1000,
            p: 2,
            minWidth: 250,
            backgroundColor: 'rgba(255, 255, 255, 0.95)'
          }}
        >
          <Typography variant="h6" gutterBottom>
            マップ統計
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">総建築物数:</Typography>
              <Chip label={analytics.totalMarkers} size="small" color="primary" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">表示中:</Typography>
              <Chip label={analytics.visibleMarkers} size="small" color="secondary" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">年代:</Typography>
              <Typography variant="body2">
                {analytics.yearRange[0]} - {analytics.yearRange[1]}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">都道府県数:</Typography>
              <Chip label={analytics.prefectures.length} size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">カテゴリ数:</Typography>
              <Chip label={analytics.categories.length} size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">密度:</Typography>
              <Typography variant="body2">
                {analytics.density.toFixed(1)}/km²
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Map Container */}
      <div
        ref={mapRefCallback}
        style={{ 
          height: '100%', 
          width: '100%', 
          borderRadius: '8px',
          overflow: 'hidden'
        }}
        className="leaflet-container"
      />
    </Box>
  );
};

export default EnhancedInteractiveMap;