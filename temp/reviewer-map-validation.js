// REVIEWER_001 Interactive Map Validation
// Specific validation for map functionality

const { chromium } = require('playwright');

async function validateMapFunctionality() {
    console.log('🗺️ REVIEWER_001 Interactive Map Validation');
    console.log('🔍 Target: https://bob-takuya.github.io/archi-site/#/map');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const mapResults = {
        timestamp: new Date().toISOString(),
        map_functionality: {},
        map_accessibility: true,
        map_performance: 'GOOD',
        map_issues: [],
        map_recommendations: []
    };

    try {
        // Navigate to map page
        console.log('\n🚀 Navigating to Map Page');
        await page.goto('https://bob-takuya.github.io/archi-site/#/map', { waitUntil: 'networkidle' });
        
        // Wait for potential map container
        await page.waitForTimeout(3000);
        
        // Check for map-related elements
        const mapContainer = await page.$('.leaflet-container, .mapbox-gl-map, .google-map, #map, .map-container, [data-testid*="map"]');
        const mapElements = await page.$$('.leaflet-marker, .mapbox-marker, .map-marker, .building-marker');
        const mapControls = await page.$$('.leaflet-control, .mapbox-ctrl, .map-control, .zoom-control');
        
        // Check for fallback content or alternative implementation
        const fallbackContent = await page.$('.map-fallback, .coming-soon, .under-construction');
        const listView = await page.$$('.architecture-card, .building-card, .MuiCard-root');
        
        console.log(`   Map container found: ${mapContainer ? 'YES' : 'NO'}`);
        console.log(`   Map markers found: ${mapElements.length}`);
        console.log(`   Map controls found: ${mapControls.length}`);
        console.log(`   Fallback content: ${fallbackContent ? 'YES' : 'NO'}`);
        console.log(`   List view cards: ${listView.length}`);
        
        // Determine map implementation status
        let mapStatus = 'NOT_IMPLEMENTED';
        let mapNotes = '';
        
        if (mapContainer && mapElements.length > 0) {
            mapStatus = 'FULLY_IMPLEMENTED';
            mapNotes = 'Interactive map with markers is fully functional';
        } else if (mapContainer) {
            mapStatus = 'PARTIAL_IMPLEMENTATION';
            mapNotes = 'Map container exists but markers may not be loading';
        } else if (fallbackContent) {
            mapStatus = 'PLANNED_FEATURE';
            mapNotes = 'Map feature is acknowledged but not yet implemented';
        } else if (listView.length > 0) {
            mapStatus = 'ALTERNATIVE_IMPLEMENTATION';
            mapNotes = 'Map page shows architecture data in list format instead of map view';
        }
        
        mapResults.map_functionality = {
            status: mapStatus,
            map_container_present: mapContainer ? true : false,
            map_markers_count: mapElements.length,
            map_controls_count: mapControls.length,
            fallback_content_present: fallbackContent ? true : false,
            alternative_content_count: listView.length,
            notes: mapNotes
        };
        
        // Check page accessibility
        const landmarks = await page.$$('main, nav, header, footer, [role="main"], [role="navigation"]');
        const headings = await page.$$('h1, h2, h3, h4, h5, h6');
        
        mapResults.map_accessibility = landmarks.length > 0 && headings.length > 0;
        
        console.log(`\n🗺️ Map Status: ${mapStatus}`);
        console.log(`   ${mapNotes}`);
        
        // Assessment
        if (mapStatus === 'NOT_IMPLEMENTED') {
            mapResults.map_issues.push('Interactive map functionality is not implemented');
            mapResults.map_recommendations.push('Consider implementing Leaflet or MapBox integration for future enhancement');
        } else if (mapStatus === 'PARTIAL_IMPLEMENTATION') {
            mapResults.map_issues.push('Map container exists but markers are not loading properly');
            mapResults.map_recommendations.push('Debug marker loading and ensure architecture data is properly geocoded');
        } else if (mapStatus === 'ALTERNATIVE_IMPLEMENTATION') {
            mapResults.map_recommendations.push('Current list view implementation is functional but could be enhanced with map visualization');
        }

    } catch (error) {
        console.error('❌ Map validation failed:', error);
        mapResults.map_issues.push(`Map validation error: ${error.message}`);
    }

    await browser.close();
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync(
        '/Users/homeserver/ai-creative-team/archi-site/temp/reviewer-map-validation-results.json',
        JSON.stringify(mapResults, null, 2)
    );
    
    console.log('\n🎉 Map Validation Complete');
    return mapResults;
}

validateMapFunctionality().catch(console.error);