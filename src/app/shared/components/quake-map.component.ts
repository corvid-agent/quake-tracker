import {
  Component,
  input,
  effect,
  ElementRef,
  viewChild,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';
import * as L from 'leaflet';
import { Earthquake } from '../../core/models/earthquake.model';

const PLATE_BOUNDARIES_URL =
  'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';

function magColor(mag: number): string {
  if (mag < 2) return '#4ecdc4';
  if (mag < 4) return '#6bcb77';
  if (mag < 5) return '#ffd93d';
  if (mag < 7) return '#ff9f43';
  return '#ff6b6b';
}

function magRadius(mag: number): number {
  return Math.max(4, mag * 3);
}

@Component({
  selector: 'app-quake-map',
  standalone: true,
  template: `
    <div class="map-wrapper">
      <div #mapEl class="map-container" role="img" aria-label="Earthquake map"></div>
      <div class="map-legend">
        <button class="legend-toggle" (click)="showPlates.set(!showPlates())"
          [class.active]="showPlates()" aria-label="Toggle tectonic plate boundaries">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z"/>
          </svg>
          Plates
        </button>
      </div>
    </div>
  `,
  styles: [`
    .map-wrapper {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .map-container {
      height: 400px;
      width: 100%;
      background: var(--bg-surface);
    }
    .map-legend {
      position: absolute;
      top: var(--space-sm);
      right: var(--space-sm);
      z-index: 1000;
    }
    .legend-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-sm) var(--space-md);
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: var(--fs-xs);
      cursor: pointer;
      min-height: 36px;
      transition: all 0.2s;
    }
    .legend-toggle:hover {
      border-color: var(--accent);
    }
    .legend-toggle.active {
      background: rgba(255, 159, 67, 0.15);
      border-color: #ff9f43;
      color: #ff9f43;
    }
  `],
})
export class QuakeMapComponent implements AfterViewInit, OnDestroy {
  readonly quakes = input<Earthquake[]>([]);
  readonly showPlates = signal(true);

  readonly mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');

  private map: L.Map | null = null;
  private markerLayer: L.LayerGroup | null = null;
  private plateLayer: L.GeoJSON | null = null;
  private plateData: GeoJSON.GeoJsonObject | null = null;

  ngAfterViewInit(): void {
    this.initMap();
    this.loadPlateData();

    effect(() => {
      const quakes = this.quakes();
      this.updateMarkers(quakes);
    });

    effect(() => {
      const show = this.showPlates();
      this.togglePlates(show);
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map(this.mapEl().nativeElement, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
  }

  private updateMarkers(quakes: Earthquake[]): void {
    if (!this.map || !this.markerLayer) return;
    this.markerLayer.clearLayers();

    for (const quake of quakes) {
      const lat = quake.coordinates[1];
      const lng = quake.coordinates[0];
      const color = magColor(quake.magnitude);
      const radius = magRadius(quake.magnitude);

      const marker = L.circleMarker([lat, lng], {
        radius,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.5,
      });

      marker.bindPopup(
        `<strong>M${quake.magnitude.toFixed(1)}</strong><br>` +
        `${quake.place}<br>` +
        `Depth: ${quake.depth.toFixed(1)} km<br>` +
        `<a href="/quake/${quake.id}">Details</a>`,
      );

      marker.addTo(this.markerLayer);
    }
  }

  private async loadPlateData(): Promise<void> {
    try {
      const response = await fetch(PLATE_BOUNDARIES_URL);
      this.plateData = await response.json();
      if (this.showPlates()) {
        this.togglePlates(true);
      }
    } catch {
      // Plate data is optional — map works without it
    }
  }

  private togglePlates(show: boolean): void {
    if (!this.map) return;

    if (!show) {
      if (this.plateLayer) {
        this.map.removeLayer(this.plateLayer);
      }
      return;
    }

    if (!this.plateData) return;

    if (this.plateLayer) {
      this.plateLayer.addTo(this.map);
      return;
    }

    this.plateLayer = L.geoJSON(this.plateData as GeoJSON.GeoJsonObject, {
      style: () => ({
        color: '#ff9f43',
        weight: 1.5,
        opacity: 0.6,
        dashArray: '4 4',
      }),
    }).addTo(this.map);
  }
}
