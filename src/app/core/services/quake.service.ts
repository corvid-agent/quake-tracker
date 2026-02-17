import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Earthquake, QuakeFeed, featureToEarthquake } from '../models/earthquake.model';

const FEED_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/';

const FEED_MAP: Record<string, string> = {
  all_hour: 'all_hour.geojson',
  all_day: 'all_day.geojson',
  all_week: 'all_week.geojson',
  all_month: 'all_month.geojson',
  significant_month: 'significant_month.geojson',
};

const DETAIL_BASE = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

@Injectable({ providedIn: 'root' })
export class QuakeService {
  readonly feedUrl = signal<string>('all_day');
  readonly earthquakes = signal<Earthquake[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly metadata = signal<{ generated: number; count: number; title: string } | null>(null);

  constructor(private http: HttpClient) {}

  loadFeed(feed: string): void {
    const file = FEED_MAP[feed];
    if (!file) {
      this.error.set(`Unknown feed: ${feed}`);
      return;
    }

    this.feedUrl.set(feed);
    this.loading.set(true);
    this.error.set(null);

    this.http.get<QuakeFeed>(`${FEED_BASE}${file}`).subscribe({
      next: (data) => {
        this.earthquakes.set(data.features.map(featureToEarthquake));
        this.metadata.set(data.metadata);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to fetch earthquakes');
        this.loading.set(false);
      },
    });
  }

  getDetail(eventId: string) {
    return this.http.get<QuakeFeed>(`${DETAIL_BASE}?eventid=${encodeURIComponent(eventId)}&format=geojson`);
  }
}
