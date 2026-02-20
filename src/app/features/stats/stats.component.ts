import { Component, computed } from '@angular/core';
import { QuakeService } from '../../core/services/quake.service';
import { FilterService } from '../../core/services/filter.service';
import { Earthquake } from '../../core/models/earthquake.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  template: `
    <div class="stats-page">
      <h1 class="page-title">Seismic Analytics</h1>

      @if (quakeService.loading()) {
        <app-loading-spinner />
      } @else {
        <div class="stats-grid">
          <section class="stat-section" aria-label="Magnitude distribution">
            <h2 class="section-title">Magnitude Distribution</h2>
            <div class="bar-chart" role="img" aria-label="Bar chart showing earthquake counts by magnitude range">
              @for (range of magRanges(); track range.label) {
                <div class="bar-row">
                  <span class="bar-label" id="mag-label-{{ range.label }}">{{ range.label }}</span>
                  <div class="bar-track" role="meter"
                       [attr.aria-valuenow]="range.count"
                       [attr.aria-valuemin]="0"
                       [attr.aria-labelledby]="'mag-label-' + range.label">
                    <div
                      class="bar-fill"
                      [style.width.%]="range.percent"
                      [style.background]="range.color">
                    </div>
                  </div>
                  <span class="bar-count">{{ range.count }}</span>
                </div>
              }
            </div>
          </section>

          <section class="stat-section" aria-label="Summary statistics">
            <h2 class="section-title">Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-value">{{ totalCount() }}</span>
                <span class="summary-label">Total Events</span>
              </div>
              <div class="summary-item">
                <span class="summary-value">{{ avgDepth().toFixed(1) }} km</span>
                <span class="summary-label">Average Depth</span>
              </div>
              <div class="summary-item">
                <span class="summary-value">{{ avgMag().toFixed(2) }}</span>
                <span class="summary-label">Average Magnitude</span>
              </div>
              <div class="summary-item">
                <span class="summary-value">{{ tsunamiCount() }}</span>
                <span class="summary-label">Tsunami Warnings</span>
              </div>
            </div>
          </section>

          <section class="stat-section" aria-label="24-hour timeline">
            <h2 class="section-title">Last 24 Hours Timeline</h2>
            <div class="timeline" role="img" aria-label="Bar chart showing earthquake frequency over the last 24 hours">
              @for (hour of hourlyTimeline(); track hour.hour) {
                <div class="timeline-bar"
                     [attr.aria-label]="hour.hour + ':00, ' + hour.count + ' events'"
                     [title]="hour.hour + ':00 — ' + hour.count + ' events'">
                  <div
                    class="timeline-fill"
                    [style.height.%]="hour.percent">
                  </div>
                  @if (hour.hour % 6 === 0) {
                    <span class="timeline-label">{{ hour.hour }}h</span>
                  }
                </div>
              }
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .stats-page {
      max-width: 900px;
      margin: 0 auto;
    }

    .page-title {
      font-size: var(--fs-2xl);
      font-weight: 700;
      margin-bottom: var(--space-xl);
    }

    .stats-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
    }

    .stat-section {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
    }

    .section-title {
      font-size: var(--fs-lg);
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: var(--space-lg);
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .bar-row {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .bar-label {
      width: 60px;
      font-size: var(--fs-sm);
      color: var(--text-secondary);
      font-family: var(--font-mono);
    }

    .bar-track {
      flex: 1;
      height: 28px;
      background: var(--bg-raised);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: var(--radius-sm);
      transition: width 0.5s ease;
      min-width: 2px;
    }

    .bar-count {
      width: 48px;
      text-align: right;
      font-family: var(--font-mono);
      font-size: var(--fs-sm);
      color: var(--text-primary);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: var(--space-md);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--space-md);
      background: var(--bg-raised);
      border-radius: var(--radius-md);
    }

    .summary-value {
      font-family: var(--font-mono);
      font-size: var(--fs-xl);
      font-weight: 700;
      color: var(--accent);
    }

    .summary-label {
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .timeline {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 120px;
      padding-top: var(--space-md);
    }

    .timeline-bar {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      position: relative;
    }

    .timeline-fill {
      width: 100%;
      background: var(--accent);
      border-radius: 2px 2px 0 0;
      min-height: 2px;
      transition: height 0.3s ease;
    }

    .timeline-label {
      position: absolute;
      bottom: -20px;
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
    }
  `],
})
export class StatsComponent {
  constructor(
    public quakeService: QuakeService,
    private filterService: FilterService,
  ) {
    if (this.quakeService.earthquakes().length === 0) {
      this.quakeService.loadFeed(this.quakeService.feedUrl());
    }
  }

  readonly totalCount = computed(() => this.quakeService.earthquakes().length);

  readonly avgDepth = computed(() => {
    const quakes = this.quakeService.earthquakes();
    if (quakes.length === 0) return 0;
    return quakes.reduce((sum, q) => sum + q.depth, 0) / quakes.length;
  });

  readonly avgMag = computed(() => {
    const quakes = this.quakeService.earthquakes();
    if (quakes.length === 0) return 0;
    return quakes.reduce((sum, q) => sum + q.magnitude, 0) / quakes.length;
  });

  readonly tsunamiCount = computed(() =>
    this.quakeService.earthquakes().filter(q => q.tsunamiFlag).length
  );

  readonly magRanges = computed(() => {
    const quakes = this.quakeService.earthquakes();
    const ranges = [
      { label: '0-2', min: 0, max: 2, color: 'var(--mag-1)', count: 0, percent: 0 },
      { label: '2-4', min: 2, max: 4, color: 'var(--mag-3)', count: 0, percent: 0 },
      { label: '4-6', min: 4, max: 6, color: 'var(--mag-5)', count: 0, percent: 0 },
      { label: '6+', min: 6, max: Infinity, color: 'var(--mag-9)', count: 0, percent: 0 },
    ];

    for (const q of quakes) {
      for (const r of ranges) {
        if (q.magnitude >= r.min && q.magnitude < r.max) {
          r.count++;
          break;
        }
      }
    }

    const maxCount = Math.max(...ranges.map(r => r.count), 1);
    for (const r of ranges) {
      r.percent = (r.count / maxCount) * 100;
    }

    return ranges;
  });

  readonly hourlyTimeline = computed(() => {
    const quakes = this.quakeService.earthquakes();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const hours: { hour: number; count: number; percent: number }[] = [];

    for (let i = 0; i < 24; i++) {
      const hourStart = now - (24 - i) * 60 * 60 * 1000;
      const hourEnd = hourStart + 60 * 60 * 1000;
      const count = quakes.filter(q => q.time >= hourStart && q.time < hourEnd).length;
      hours.push({ hour: i, count, percent: 0 });
    }

    const maxCount = Math.max(...hours.map(h => h.count), 1);
    for (const h of hours) {
      h.percent = (h.count / maxCount) * 100;
    }

    return hours;
  });
}
