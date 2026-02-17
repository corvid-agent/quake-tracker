import { Injectable, signal, computed } from '@angular/core';
import { QuakeService } from './quake.service';
import { Earthquake } from '../models/earthquake.model';

@Injectable({ providedIn: 'root' })
export class FilterService {
  readonly minMagnitude = signal<number>(0);
  readonly maxMagnitude = signal<number>(10);
  readonly timeRange = signal<'hour' | 'day' | 'week' | 'month'>('day');

  readonly filtered = computed<Earthquake[]>(() => {
    const quakes = this.quakeService.earthquakes();
    const min = this.minMagnitude();
    const max = this.maxMagnitude();

    return quakes.filter(
      (q) => q.magnitude >= min && q.magnitude <= max
    );
  });

  constructor(private quakeService: QuakeService) {}

  setTimeRange(range: 'hour' | 'day' | 'week' | 'month'): void {
    this.timeRange.set(range);
    const feedMap: Record<string, string> = {
      hour: 'all_hour',
      day: 'all_day',
      week: 'all_week',
      month: 'all_month',
    };
    this.quakeService.loadFeed(feedMap[range]);
  }

  setMagnitudeRange(min: number, max: number): void {
    this.minMagnitude.set(min);
    this.maxMagnitude.set(max);
  }
}
