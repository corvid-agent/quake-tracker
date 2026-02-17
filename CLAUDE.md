# quake-tracker

Real-time earthquake tracker powered by USGS Earthquake API. Interactive map, filtering, and seismic analytics. Angular 21 standalone app deployed to GitHub Pages.

## API

- USGS Earthquake: https://earthquake.usgs.gov/fdsnws/event/1/
- Real-time feeds: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/
- No auth required, CORS enabled, GeoJSON format

## Verification

npx ng build --base-href /quake-tracker/
npx ng test --no-watch

## Stack

- Angular 21 (standalone components, signals, new control flow)
- Leaflet.js for interactive maps
- TypeScript strict mode
- CSS custom properties for design tokens
- Mobile-first responsive design
