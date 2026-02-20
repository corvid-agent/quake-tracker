import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, catchError, of } from 'rxjs';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';

interface PeriodStats {
  count: number;
  avgMagnitude: number;
  maxMagnitude: number;
  avgDepth: number;
  mag0_2: number;
  mag2_4: number;
  mag4_6: number;
  mag6plus: number;
}

const FEED_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/';

@Component({
  selector: 'app-comparison',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingSpinnerComponent],
  template: `
    <div class="comp-page">
      <h1 class="page-title">Historical Comparison</h1>
      <p class="page-sub">Current seismic activity compared to the 30-day baseline</p>

      @if (loading()) {
        <app-loading-spinner />
      } @else {
        <div class="comp-grid">
          <!-- Delta cards -->
          <div class="delta-row" role="region" aria-label="Comparison metrics">
            <div class="delta-card">
              <span class="delta-label">Event Frequency</span>
              <span class="delta-value" [class]="freqDeltaClass()">
                {{ freqDelta() > 0 ? '+' : '' }}{{ freqDelta().toFixed(0) }}%
              </span>
              <span class="delta-sub">{{ currentStats()?.count ?? 0 }} today vs {{ avgDailyFromMonth().toFixed(0) }}/day avg</span>
            </div>
            <div class="delta-card">
              <span class="delta-label">Avg Magnitude</span>
              <span class="delta-value" [class]="magDeltaClass()">
                {{ magDelta() > 0 ? '+' : '' }}{{ magDelta().toFixed(2) }}
              </span>
              <span class="delta-sub">{{ currentStats()?.avgMagnitude?.toFixed(2) ?? '—' }} vs {{ monthStats()?.avgMagnitude?.toFixed(2) ?? '—' }} baseline</span>
            </div>
            <div class="delta-card">
              <span class="delta-label">Max Magnitude</span>
              <span class="delta-value mono">{{ currentStats()?.maxMagnitude?.toFixed(1) ?? '—' }}</span>
              <span class="delta-sub">Month max: {{ monthStats()?.maxMagnitude?.toFixed(1) ?? '—' }}</span>
            </div>
            <div class="delta-card">
              <span class="delta-label">Avg Depth</span>
              <span class="delta-value mono">{{ currentStats()?.avgDepth?.toFixed(1) ?? '—' }} km</span>
              <span class="delta-sub">Baseline: {{ monthStats()?.avgDepth?.toFixed(1) ?? '—' }} km</span>
            </div>
          </div>

          <!-- Magnitude distribution comparison -->
          <section class="stat-section" aria-label="Magnitude distribution comparison">
            <h2 class="section-title">Magnitude Distribution — Today vs 30-Day Average</h2>
            <div class="dist-chart" role="img" aria-label="Chart comparing today's magnitude distribution to the 30-day average">
              @for (range of distComparison(); track range.label) {
                <div class="dist-row">
                  <span class="dist-label">{{ range.label }}</span>
                  <div class="dist-bars">
                    <div class="dist-bar-pair">
                      <div class="dist-bar current" [style.width.%]="range.currentPct" [style.background]="range.color"></div>
                      <span class="dist-count">{{ range.current }}</span>
                    </div>
                    <div class="dist-bar-pair">
                      <div class="dist-bar baseline" [style.width.%]="range.baselinePct" [style.background]="range.color" style="opacity:0.35"></div>
                      <span class="dist-count dim">{{ range.baseline.toFixed(1) }}/day</span>
                    </div>
                  </div>
                </div>
              }
            </div>
            <div class="dist-legend" aria-hidden="true">
              <span class="legend-item"><span class="legend-dot current-dot"></span> Today</span>
              <span class="legend-item"><span class="legend-dot baseline-dot"></span> 30-day avg/day</span>
            </div>
          </section>

          <!-- Activity level indicator -->
          <section class="stat-section" aria-label="Seismic activity level">
            <h2 class="section-title">Activity Level</h2>
            <div class="activity-meter" role="meter"
                 [attr.aria-valuenow]="activityPct()"
                 aria-valuemin="0"
                 aria-valuemax="100"
                 [attr.aria-label]="'Seismic activity level: ' + activityClass()">
              <div class="meter-track">
                <div class="meter-fill" [style.width.%]="activityPct()" [class]="activityClass()"></div>
              </div>
              <div class="meter-labels" aria-hidden="true">
                <span>Quiet</span>
                <span>Normal</span>
                <span>Elevated</span>
                <span>High</span>
              </div>
            </div>
            <p class="activity-text" aria-live="polite">{{ activityText() }}</p>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .comp-page { max-width: 900px; margin: 0 auto; }
    .page-title { font-size: var(--fs-2xl); font-weight: 700; margin-bottom: var(--space-xs); }
    .page-sub { color: var(--text-secondary); font-size: var(--fs-sm); margin-bottom: var(--space-xl); }
    .comp-grid { display: flex; flex-direction: column; gap: var(--space-xl); }
    .delta-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--space-md);
    }
    .delta-card {
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-lg);
      display: flex; flex-direction: column; gap: 4px;
    }
    .delta-label { font-size: var(--fs-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
    .delta-value { font-family: var(--font-mono); font-size: var(--fs-xl); font-weight: 700; }
    .delta-value.up { color: var(--danger); }
    .delta-value.down { color: var(--success); }
    .delta-value.neutral { color: var(--text-secondary); }
    .delta-value.mono { color: var(--accent); }
    .delta-sub { font-size: var(--fs-xs); color: var(--text-tertiary); }
    .stat-section {
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-xl);
    }
    .section-title { font-size: var(--fs-lg); font-weight: 600; color: var(--text-secondary); margin-bottom: var(--space-lg); }
    .dist-chart { display: flex; flex-direction: column; gap: var(--space-lg); }
    .dist-row { display: flex; align-items: center; gap: var(--space-md); }
    .dist-label { width: 50px; font-size: var(--fs-sm); color: var(--text-secondary); font-family: var(--font-mono); }
    .dist-bars { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .dist-bar-pair { display: flex; align-items: center; gap: var(--space-sm); }
    .dist-bar { height: 18px; border-radius: var(--radius-sm); min-width: 2px; transition: width 0.5s; }
    .dist-count { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--text-primary); min-width: 48px; }
    .dist-count.dim { color: var(--text-tertiary); }
    .dist-legend { display: flex; gap: var(--space-lg); margin-top: var(--space-md); }
    .legend-item { display: flex; align-items: center; gap: var(--space-xs); font-size: var(--fs-xs); color: var(--text-secondary); }
    .legend-dot { width: 12px; height: 12px; border-radius: 2px; }
    .current-dot { background: var(--accent); }
    .baseline-dot { background: var(--accent); opacity: 0.35; }
    .activity-meter { margin-bottom: var(--space-md); }
    .meter-track { height: 12px; background: var(--bg-raised); border-radius: 6px; overflow: hidden; }
    .meter-fill { height: 100%; border-radius: 6px; transition: width 0.5s; }
    .meter-fill.low { background: var(--success); }
    .meter-fill.normal { background: var(--accent); }
    .meter-fill.elevated { background: var(--warning); }
    .meter-fill.high { background: var(--danger); }
    .meter-labels { display: flex; justify-content: space-between; margin-top: var(--space-xs); font-size: var(--fs-xs); color: var(--text-tertiary); }
    .activity-text { font-size: var(--fs-sm); color: var(--text-secondary); line-height: 1.5; }
    @media (max-width: 768px) {
      .delta-row { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class ComparisonComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly loading = signal(true);
  readonly currentStats = signal<PeriodStats | null>(null);
  readonly monthStats = signal<PeriodStats | null>(null);

  readonly avgDailyFromMonth = computed(() => {
    const m = this.monthStats();
    return m ? m.count / 30 : 0;
  });

  readonly freqDelta = computed(() => {
    const avg = this.avgDailyFromMonth();
    const cur = this.currentStats()?.count ?? 0;
    return avg > 0 ? ((cur - avg) / avg) * 100 : 0;
  });

  readonly magDelta = computed(() => {
    const cur = this.currentStats()?.avgMagnitude ?? 0;
    const base = this.monthStats()?.avgMagnitude ?? 0;
    return cur - base;
  });

  readonly freqDeltaClass = computed(() => {
    const d = this.freqDelta();
    if (d > 20) return 'up';
    if (d < -20) return 'down';
    return 'neutral';
  });

  readonly magDeltaClass = computed(() => {
    const d = this.magDelta();
    if (d > 0.3) return 'up';
    if (d < -0.3) return 'down';
    return 'neutral';
  });

  readonly distComparison = computed(() => {
    const cur = this.currentStats();
    const mo = this.monthStats();
    if (!cur || !mo) return [];
    const ranges = [
      { label: '0-2', current: cur.mag0_2, baseline: mo.mag0_2 / 30, color: 'var(--mag-1)' },
      { label: '2-4', current: cur.mag2_4, baseline: mo.mag2_4 / 30, color: 'var(--mag-3)' },
      { label: '4-6', current: cur.mag4_6, baseline: mo.mag4_6 / 30, color: 'var(--mag-5)' },
      { label: '6+', current: cur.mag6plus, baseline: mo.mag6plus / 30, color: 'var(--mag-9)' },
    ];
    const maxVal = Math.max(...ranges.map(r => Math.max(r.current, r.baseline)), 1);
    return ranges.map(r => ({
      ...r,
      currentPct: (r.current / maxVal) * 100,
      baselinePct: (r.baseline / maxVal) * 100,
    }));
  });

  readonly activityPct = computed(() => {
    const d = this.freqDelta();
    return Math.min(100, Math.max(5, 50 + d / 2));
  });

  readonly activityClass = computed(() => {
    const p = this.activityPct();
    if (p < 30) return 'low';
    if (p < 55) return 'normal';
    if (p < 75) return 'elevated';
    return 'high';
  });

  readonly activityText = computed(() => {
    const c = this.activityClass();
    const d = Math.abs(this.freqDelta()).toFixed(0);
    if (c === 'low') return `Seismic activity is below the 30-day average by ${d}%. A relatively quiet period.`;
    if (c === 'normal') return 'Seismic activity is within normal range compared to the 30-day baseline.';
    if (c === 'elevated') return `Activity is elevated — ${d}% above the 30-day daily average. Worth monitoring.`;
    return `Significantly higher activity detected — ${d}% above baseline. Multiple events in progress.`;
  });

  ngOnInit(): void {
    forkJoin({
      day: this.http.get<any>(`${FEED_BASE}all_day.geojson`).pipe(catchError(() => of({ features: [] }))),
      month: this.http.get<any>(`${FEED_BASE}all_month.geojson`).pipe(catchError(() => of({ features: [] }))),
    }).subscribe(({ day, month }) => {
      this.currentStats.set(this.computeStats(day.features || []));
      this.monthStats.set(this.computeStats(month.features || []));
      this.loading.set(false);
    });
  }

  private computeStats(features: any[]): PeriodStats {
    const mags = features.map(f => f.properties?.mag ?? 0);
    const depths = features.map(f => f.geometry?.coordinates?.[2] ?? 0);
    const count = features.length;
    return {
      count,
      avgMagnitude: count > 0 ? mags.reduce((a, b) => a + b, 0) / count : 0,
      maxMagnitude: count > 0 ? Math.max(...mags) : 0,
      avgDepth: count > 0 ? depths.reduce((a, b) => a + b, 0) / count : 0,
      mag0_2: mags.filter(m => m >= 0 && m < 2).length,
      mag2_4: mags.filter(m => m >= 2 && m < 4).length,
      mag4_6: mags.filter(m => m >= 4 && m < 6).length,
      mag6plus: mags.filter(m => m >= 6).length,
    };
  }
}
