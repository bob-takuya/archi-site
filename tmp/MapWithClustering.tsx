import React, { useEffect, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Box, Chip, Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import '../styles/map.css';

// Fix Leaflet icon defaults
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Enhanced marker interface to match ArchitecturePage data
export interface EnhancedMapMarker {
  id: string | number;
  position: [number, number]; // [latitude, longitude]
  title: string;
  architect?: string;
  year?: number;
  category?: string;
  tags?: string;
  address?: string;
}

// Map component props
interface MapWithClusteringProps {
  markers?: EnhancedMapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (markerId: string | number) => void;
}

/**
 * Enhanced Map Component with Clustering Support
 * Designed by ARCHITECT_MAP_001, Implemented by DEVELOPER_MAP_001
 */
const MapWithClustering: React.FC<MapWithClusteringProps> = ({ 
  markers = [], 
  center,
  zoom = 6, 
  height = '600px',
  onMarkerClick
}) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Calculate optimal center and bounds if not provided
  const calculatedBounds = useMemo(() => {
    if (markers.length === 0) return null;
    
    const lats = markers.map(m => m.position[0]);
    const lngs = markers.map(m => m.position[1]);
    
    const bounds = L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
    
    return bounds;
  }, [markers]);
  
  const mapRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && !mapInstance) {
      try {
        setIsLoading(true);
        
        // Initialize map
        const map = L.map(node, {
          preferCanvas: true, // Better performance
          zoomControl: true,
          attributionControl: true
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 3
        }).addTo(map);
        
        // Create marker cluster group with custom options
        const markerClusterGroup = (L as any).markerClusterGroup({
          maxClusterRadius: 80,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: true,
          zoomToBoundsOnClick: true,
          chunkedLoading: true, // Performance optimization
          removeOutsideVisibleBounds: true, // Performance optimization
          animate: true,
          animateAddingMarkers: false, // Better performance with large datasets
          // Custom cluster icon
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            let size = 'small';
            let className = 'marker-cluster-small';
            
            if (count > 10) {
              size = 'medium';
              className = 'marker-cluster-medium';
            }
            if (count > 50) {
              size = 'large';
              className = 'marker-cluster-large';
            }
            
            return L.divIcon({
              html: `<div><span>${count}</span></div>`,
              className: `marker-cluster ${className}`,
              iconSize: L.point(40, 40)
            });
          }
        });
        
        // Add markers to cluster group
        markers.forEach((marker) => {
          const leafletMarker = L.marker(marker.position);
          
          // Create enhanced popup content
          const popupContent = `
            <div style="min-width: 250px; max-width: 300px;">
              <h3 style="margin: 0 0 12px 0; font-size: 1.2rem; font-weight: 600; color: #333;">
                ${marker.title}
              </h3>
              
              ${marker.architect ? `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #666; margin-right: 8px;">👤</span>
                  <span style="font-size: 0.95rem; color: #555;">${marker.architect}</span>
                </div>
              ` : ''}
              
              ${marker.year ? `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #666; margin-right: 8px;">📅</span>
                  <span style="font-size: 0.95rem; color: #555;">${marker.year}年</span>
                </div>
              ` : ''}
              
              ${marker.category ? `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span style="color: #666; margin-right: 8px;">🏛️</span>
                  <span style="font-size: 0.95rem; color: #555;">${marker.category}</span>
                </div>
              ` : ''}
              
              ${marker.tags ? `
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="color: #f57c00; margin-right: 8px;">🏆</span>
                  <span style="
                    display: inline-block;
                    padding: 2px 8px;
                    background-color: #fff3e0;
                    border: 1px solid #ffb74d;
                    border-radius: 16px;
                    font-size: 0.85rem;
                    color: #e65100;
                  ">${marker.tags}</span>
                </div>
              ` : ''}
              
              ${marker.address ? `
                <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                  <span style="color: #666; margin-right: 8px;">📍</span>
                  <span style="font-size: 0.85rem; color: #666; line-height: 1.4;">
                    ${marker.address}
                  </span>
                </div>
              ` : ''}
              
              <a 
                href="/architecture/${marker.id}"
                onclick="event.preventDefault(); window.location.hash = '#/architecture/${marker.id}';"
                style="
                  display: inline-block;
                  width: 100%;
                  padding: 8px 16px;
                  background-color: #1976d2;
                  color: white;
                  text-decoration: none;
                  border-radius: 4px;
                  font-size: 0.9rem;
                  text-align: center;
                  cursor: pointer;
                  transition: background-color 0.2s;
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
            className: 'custom-popup'
          });
          
          // Handle click event
          if (onMarkerClick) {
            leafletMarker.on('click', () => {
              onMarkerClick(marker.id);
            });
          }
          
          markerClusterGroup.addLayer(leafletMarker);
        });
        
        // Add cluster group to map
        map.addLayer(markerClusterGroup);
        
        // Set view based on markers or provided center
        if (center) {
          map.setView(center, zoom);
        } else if (calculatedBounds) {
          map.fitBounds(calculatedBounds, { padding: [50, 50] });
        } else {
          // Default to Japan center
          map.setView([35.6762, 139.6503], 6);
        }
        
        setMapInstance(map);
        setIsLoading(false);
        
        // Handle resize
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
        
      } catch (error) {
        console.error('Map initialization error:', error);
        setIsLoading(false);
      }
    }
  }, [markers, center, zoom, calculatedBounds, mapInstance, onMarkerClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [mapInstance]);
  
  // Update view when markers change
  useEffect(() => {
    if (mapInstance && calculatedBounds && !center) {
      mapInstance.fitBounds(calculatedBounds, { padding: [50, 50] });
    }
  }, [mapInstance, calculatedBounds, center]);

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      {isLoading && (
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
            zIndex: 1000
          }}
        >
          <Typography>地図を読み込み中...</Typography>
        </Box>
      )}
      <div 
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
        className="leaflet-container enhanced-map"
      />
      {markers.length === 0 && !isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: 3,
            borderRadius: 2,
            boxShadow: 1
          }}
        >
          <Typography variant="h6" color="text.secondary">
            表示する建築物がありません
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MapWithClustering;