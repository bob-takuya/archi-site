import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Box, Paper, Typography, Button, Chip, IconButton, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloseIcon from '@mui/icons-material/Close';
import '../styles/map.css';

// Fix Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Enhanced marker data type
export interface MapMarker {
  id: string | number;
  position: [number, number];
  title: string;
  architect?: string;
  year?: number;
  category?: string;
  tags?: string;
  address?: string;
  markerType?: 'default' | 'award' | 'featured';
  color?: string;
}

// Map filters
export interface MapFilters {
  categories?: string[];
  yearRange?: [number, number];
  awards?: string[];
  architects?: string[];
}

// Enhanced Map component props
interface EnhancedMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  showClusters?: boolean;
  filters?: MapFilters;
  onBoundsChange?: (bounds: L.LatLngBounds, zoom: number) => void;
  loading?: boolean;
}

// Custom marker icons based on type
const createCustomIcon = (markerType?: string, hasAward?: boolean) => {
  const iconOptions: L.DivIconOptions = {
    className: 'custom-map-marker',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -35],
  };

  if (hasAward) {
    iconOptions.html = `
      <div class="marker-pin award">
        <span class="marker-icon">🏆</span>
      </div>
    `;
  } else if (markerType === 'featured') {
    iconOptions.html = `
      <div class="marker-pin featured">
        <span class="marker-icon">⭐</span>
      </div>
    `;
  } else {
    iconOptions.html = `
      <div class="marker-pin default">
        <span class="marker-icon">📍</span>
      </div>
    `;
  }

  return L.divIcon(iconOptions);
};

// Performance optimization: Debounce function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Enhanced Map Component with clustering, filtering, and performance optimizations
 */
const EnhancedMap: React.FC<EnhancedMapProps> = ({
  markers = [],
  center,
  zoom = 6,
  height = '600px',
  onMarkerClick,
  showClusters = true,
  filters,
  onBoundsChange,
  loading = false,
}) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [visibleMarkers, setVisibleMarkers] = useState<MapMarker[]>([]);
  const markersLayerRef = useRef<L.MarkerClusterGroup | L.LayerGroup | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Calculate map center based on markers if not provided
  const calculatedCenter = useMemo(() => {
    if (center) return center;
    
    if (markers.length === 0) {
      return [35.6762, 139.6503] as [number, number]; // Tokyo center
    }

    const bounds = L.latLngBounds(markers.map(m => m.position));
    const centerPoint = bounds.getCenter();
    return [centerPoint.lat, centerPoint.lng] as [number, number];
  }, [center, markers]);

  // Filter markers based on filters
  const filteredMarkers = useMemo(() => {
    if (!filters) return markers;

    return markers.filter(marker => {
      // Filter by categories
      if (filters.categories?.length && marker.category) {
        if (!filters.categories.includes(marker.category)) return false;
      }

      // Filter by year range
      if (filters.yearRange && marker.year) {
        const [minYear, maxYear] = filters.yearRange;
        if (marker.year < minYear || marker.year > maxYear) return false;
      }

      // Filter by awards
      if (filters.awards?.length && marker.tags) {
        const hasMatchingAward = filters.awards.some(award =>
          marker.tags?.toLowerCase().includes(award.toLowerCase())
        );
        if (!hasMatchingAward) return false;
      }

      // Filter by architects
      if (filters.architects?.length && marker.architect) {
        if (!filters.architects.includes(marker.architect)) return false;
      }

      return true;
    });
  }, [markers, filters]);

  // Debounced bounds change handler
  const debouncedBoundsChange = useMemo(
    () =>
      debounce((bounds: L.LatLngBounds, zoom: number) => {
        if (onBoundsChange) {
          onBoundsChange(bounds, zoom);
        }
      }, 300),
    [onBoundsChange]
  );

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstance) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: calculatedCenter,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Add tile layer with better performance
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        updateWhenIdle: true,
        updateWhenZooming: false,
      }).addTo(map);

      // Add zoom control to top right
      map.zoomControl.setPosition('topright');

      // Set up event handlers
      map.on('moveend', () => {
        const bounds = map.getBounds();
        const currentZoom = map.getZoom();
        debouncedBoundsChange(bounds, currentZoom);
      });

      setMapInstance(map);
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, [calculatedCenter, zoom, debouncedBoundsChange, mapInstance]);

  // Update markers on the map
  const updateMarkers = useCallback(() => {
    if (!mapInstance) return;

    // Clear existing markers
    if (markersLayerRef.current) {
      mapInstance.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }

    // Create markers layer (with or without clustering)
    const markersLayer = showClusters
      ? L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
          chunkedLoading: true,
          spiderfyOnMaxZoom: true,
          removeOutsideVisibleBounds: true,
          animate: true,
          animateAddingMarkers: false, // Better performance
        })
      : L.layerGroup();

    // Track visible markers
    const visible: MapMarker[] = [];

    // Add markers to layer
    filteredMarkers.forEach((markerData) => {
      const hasAward = markerData.tags && markerData.tags.trim().length > 0;
      const icon = createCustomIcon(markerData.markerType, hasAward);
      
      const leafletMarker = L.marker(markerData.position, { icon });

      // Create popup content
      const popupContent = `
        <div style="min-width: 280px; padding: 8px;">
          <h3 style="margin: 0 0 12px 0; font-size: 1.1rem; font-weight: 600;">
            ${markerData.title}
          </h3>
          ${markerData.architect ? `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #666; margin-right: 8px;">👤</span>
              <span style="font-size: 0.9rem;">${markerData.architect}</span>
            </div>
          ` : ''}
          ${markerData.year ? `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #666; margin-right: 8px;">📅</span>
              <span style="font-size: 0.9rem;">${markerData.year}年</span>
            </div>
          ` : ''}
          ${markerData.address ? `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #666; margin-right: 8px;">📍</span>
              <span style="font-size: 0.9rem;">${markerData.address}</span>
            </div>
          ` : ''}
          ${markerData.category ? `
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #666; margin-right: 8px;">🏛️</span>
              <span style="font-size: 0.9rem;">${markerData.category}</span>
            </div>
          ` : ''}
          ${markerData.tags ? `
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <span style="color: #FFB800; margin-right: 8px;">🏆</span>
              <span style="font-size: 0.9rem; color: #FFB800;">${markerData.tags}</span>
            </div>
          ` : ''}
          <a 
            href="#/architecture/${markerData.id}"
            style="
              display: inline-block;
              padding: 8px 16px;
              background-color: #1976d2;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-size: 0.875rem;
              text-align: center;
            "
            onmouseover="this.style.backgroundColor='#1565c0'"
            onmouseout="this.style.backgroundColor='#1976d2'"
          >
            詳細を見る
          </a>
        </div>
      `;

      leafletMarker.bindPopup(popupContent, {
        maxWidth: 300,
        minWidth: 280,
        closeButton: true,
        autoClose: false,
        className: 'custom-popup',
      });

      // Handle marker click
      leafletMarker.on('click', () => {
        setSelectedMarker(markerData);
        if (onMarkerClick) {
          onMarkerClick(markerData);
        }
      });

      markersLayer.addLayer(leafletMarker);
      visible.push(markerData);
    });

    // Add layer to map
    markersLayer.addTo(mapInstance);
    markersLayerRef.current = markersLayer;
    setVisibleMarkers(visible);

    // Fit bounds if we have markers
    if (filteredMarkers.length > 0) {
      const bounds = L.latLngBounds(filteredMarkers.map(m => m.position));
      const padding: L.PaddingOptions = { padding: [50, 50] };
      
      // Ensure we don't zoom in too much
      mapInstance.fitBounds(bounds, {
        ...padding,
        maxZoom: 15,
      });
    }
  }, [mapInstance, filteredMarkers, showClusters, onMarkerClick]);

  // Initialize map on mount
  useEffect(() => {
    initializeMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null);
      }
    };
  }, []); // Only run once on mount

  // Update markers when data changes
  useEffect(() => {
    if (mapInstance) {
      updateMarkers();
    }
  }, [mapInstance, updateMarkers]);

  // Loading overlay
  const LoadingOverlay = () => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 1000,
      }}
    >
      <CircularProgress />
    </Box>
  );

  // Stats overlay
  const StatsOverlay = () => (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        padding: 2,
        zIndex: 1000,
        maxWidth: 200,
      }}
      elevation={3}
    >
      <Typography variant="body2" color="text.secondary">
        表示中: {visibleMarkers.length.toLocaleString()}件
      </Typography>
      {visibleMarkers.length < filteredMarkers.length && (
        <Typography variant="caption" color="text.secondary">
          (全{filteredMarkers.length.toLocaleString()}件中)
        </Typography>
      )}
    </Paper>
  );

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      <div
        ref={mapContainerRef}
        style={{ height: '100%', width: '100%' }}
        className="leaflet-container enhanced-map"
      />
      {loading && <LoadingOverlay />}
      <StatsOverlay />
    </Box>
  );
};

export default EnhancedMap;