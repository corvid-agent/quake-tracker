import { Injectable, signal, computed, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Earthquake, QuakeFeed, featureToEarthquake } from '../models/earthquake.model';

export interface NotificationPreferences {
  enabled: boolean;
  magnitudeThreshold: number;
  radiusKm: number;
}

const STORAGE_KEY = 'quake-notification-prefs';
const NOTIFIED_KEY = 'quake-notified-ids';
const FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson';
const POLL_INTERVAL_MS = 60_000;
const MAX_NOTIFIED_IDS = 500;

function loadPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
        magnitudeThreshold: typeof parsed.magnitudeThreshold === 'number' ? parsed.magnitudeThreshold : 4.0,
        radiusKm: typeof parsed.radiusKm === 'number' ? parsed.radiusKm : 500,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { enabled: false, magnitudeThreshold: 4.0, radiusKm: 500 };
}

function savePreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

function loadNotifiedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // ignore
  }
  return new Set();
}

function saveNotifiedIds(ids: Set<string>): void {
  try {
    // Keep only the most recent IDs to avoid unbounded growth
    const arr = [...ids];
    const trimmed = arr.length > MAX_NOTIFIED_IDS ? arr.slice(arr.length - MAX_NOTIFIED_IDS) : arr;
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

/**
 * Haversine formula: calculates great-circle distance between two points in km.
 */
function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);

  // Reactive state
  readonly enabled = signal<boolean>(false);
  readonly magnitudeThreshold = signal<number>(4.0);
  readonly radiusKm = signal<number>(500);
  readonly permissionState = signal<NotificationPermission | 'unavailable'>('default');
  readonly userLat = signal<number | null>(null);
  readonly userLng = signal<number | null>(null);
  readonly locationError = signal<string | null>(null);
  readonly lastCheckTime = signal<number | null>(null);
  readonly nearbyCount = signal<number>(0);

  readonly hasLocation = computed(() => this.userLat() !== null && this.userLng() !== null);

  readonly statusText = computed(() => {
    if (!this.isNotificationApiAvailable()) {
      return 'Browser does not support notifications';
    }
    if (this.permissionState() === 'denied') {
      return 'Notifications blocked by browser';
    }
    if (!this.enabled()) {
      return 'Disabled';
    }
    if (this.locationError()) {
      return `Location error: ${this.locationError()}`;
    }
    if (!this.hasLocation()) {
      return 'Acquiring location...';
    }
    return 'Active — monitoring nearby quakes';
  });

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private notifiedIds: Set<string>;

  constructor() {
    // Load persisted state
    const prefs = loadPreferences();
    this.enabled.set(prefs.enabled);
    this.magnitudeThreshold.set(prefs.magnitudeThreshold);
    this.radiusKm.set(prefs.radiusKm);
    this.notifiedIds = loadNotifiedIds();

    // Check browser support
    if (this.isNotificationApiAvailable()) {
      this.permissionState.set(Notification.permission);
    } else {
      this.permissionState.set('unavailable');
    }

    // If notifications were previously enabled, resume monitoring
    if (prefs.enabled && this.permissionState() === 'granted') {
      this.acquireLocation();
      this.startPolling();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  isNotificationApiAvailable(): boolean {
    return typeof Notification !== 'undefined';
  }

  async toggleEnabled(value: boolean): Promise<void> {
    if (value) {
      await this.enable();
    } else {
      this.disable();
    }
  }

  async enable(): Promise<void> {
    if (!this.isNotificationApiAvailable()) {
      return;
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      this.permissionState.set(result);
      if (result !== 'granted') {
        return;
      }
    } else if (Notification.permission === 'denied') {
      this.permissionState.set('denied');
      return;
    }

    this.enabled.set(true);
    this.persistPreferences();
    this.acquireLocation();
    this.startPolling();
  }

  disable(): void {
    this.enabled.set(false);
    this.persistPreferences();
    this.stopPolling();
  }

  setMagnitudeThreshold(value: number): void {
    this.magnitudeThreshold.set(value);
    this.persistPreferences();
  }

  setRadiusKm(value: number): void {
    this.radiusKm.set(value);
    this.persistPreferences();
  }

  private persistPreferences(): void {
    savePreferences({
      enabled: this.enabled(),
      magnitudeThreshold: this.magnitudeThreshold(),
      radiusKm: this.radiusKm(),
    });
  }

  private acquireLocation(): void {
    if (!navigator.geolocation) {
      this.locationError.set('Geolocation not supported');
      return;
    }

    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.userLat.set(position.coords.latitude);
        this.userLng.set(position.coords.longitude);
        this.locationError.set(null);
        // Run an immediate check after getting location
        this.checkForNearbyQuakes();
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError.set('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError.set('Location unavailable');
            break;
          case error.TIMEOUT:
            this.locationError.set('Location request timed out');
            break;
          default:
            this.locationError.set('Could not get location');
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.enabled() && this.hasLocation()) {
        this.checkForNearbyQuakes();
      }
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private checkForNearbyQuakes(): void {
    const lat = this.userLat();
    const lng = this.userLng();
    if (lat === null || lng === null) return;

    this.http.get<QuakeFeed>(FEED_URL).subscribe({
      next: (data) => {
        this.lastCheckTime.set(Date.now());
        const quakes = data.features.map(featureToEarthquake);
        const threshold = this.magnitudeThreshold();
        const radius = this.radiusKm();
        let nearbyCount = 0;

        for (const quake of quakes) {
          if (quake.magnitude < threshold) continue;

          // coordinates are [lng, lat, depth]
          const quakeLat = quake.coordinates[1];
          const quakeLng = quake.coordinates[0];
          const distance = haversineDistanceKm(lat, lng, quakeLat, quakeLng);

          if (distance > radius) continue;

          nearbyCount++;

          if (this.notifiedIds.has(quake.id)) continue;

          // New nearby quake above threshold -- send notification
          this.notifiedIds.add(quake.id);
          this.sendNotification(quake, distance);
        }

        this.nearbyCount.set(nearbyCount);
        saveNotifiedIds(this.notifiedIds);
      },
      error: () => {
        // Silently ignore poll errors; will retry next interval
      },
    });
  }

  private sendNotification(quake: Earthquake, distanceKm: number): void {
    if (!this.isNotificationApiAvailable()) return;
    if (Notification.permission !== 'granted') return;

    const distanceStr = distanceKm < 1
      ? `${(distanceKm * 1000).toFixed(0)} m`
      : `${distanceKm.toFixed(0)} km`;

    const title = `Earthquake M${quake.magnitude.toFixed(1)}`;
    const body = `${quake.place}\nDistance: ${distanceStr} away\nDepth: ${quake.depth.toFixed(1)} km`;

    try {
      const notification = new Notification(title, {
        body,
        tag: quake.id,
        icon: 'data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%234ecdc4" stroke-width="2"><path d="M2 12h3l3-9 4 18 4-18 3 9h3"/></svg>',
        ),
        requireInteraction: quake.magnitude >= 6,
      });

      notification.onclick = () => {
        window.focus();
        window.location.hash = '';
        window.location.href = `/quake/${quake.id}`;
        notification.close();
      };
    } catch {
      // Some browsers restrict Notification constructor usage
    }
  }
}
