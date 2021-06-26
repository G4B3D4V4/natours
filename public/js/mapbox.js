export const displayMap = locations => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiZ2FiZWRhdmEiLCJhIjoiY2s1dWptZW14MDJwdDNubjNnZHpnY3c0cSJ9.KJjh93xWqgXd5-cHnXtDXQ';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/gabedava/ckpv01e1f1ofg17lonzr5q06y',
        scrollZoom: false
        // center: [-118.014849, 34.101354],
        // zoom: 4
    });
    
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(loc => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';
    
        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
    
        // Add popup
        new mapboxgl.Popup({
            offset: 30
        }).setLngLat(loc.coordinates).setHTML(`<p>${loc.day}: ${loc.description}</p>`).addTo(map)
        
        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    });
    
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    })
}
