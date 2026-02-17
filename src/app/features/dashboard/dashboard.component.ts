import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QuakeService } from '../../core/services/quake.service';
import { FilterService } from '../../core/services/filter.service';
import { MagnitudeBadgeComponent } from '../../shared/components/magnitude-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MagnitudeBadgeComponent, RelativeTimePipe, LoadingSpinnerComponent, FormsModule],
  template: `
    <div class="dashboard">
      <div class="controls">
        <div class="feed-selector">
          @for (option of timeOptions; track option.value) {
            <button
              class="feed-btn"
              [class.active]="filterService.timeRange() === option.value"
              (click)="filterService.setTimeRange(option.value)">
              {{ option.label }}
            </button>
          }
        </div>
        <div class="mag-filter">
          <label>Min Mag:</label>
          <input
            type="range"
            [min]="0"
            [max]="10"
            [step]="0.5"
            [ngModel]="filterService.minMagnitude()"
            (ngModelChange)="filterService.setMagnitudeRange($event, filterService.maxMagnitude())" />
          <span class="mag-value">{{ filterService.minMagnitude().toFixed(1) }}</span>
        </div>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <span class="stat-value">{{ filteredQuakes().length }}</span>
          <span class="stat-label">Total Quakes</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" [style.color]="maxMagColor()">{{ maxMag().toFixed(1) }}</span>
          <span class="stat-label">Max Magnitude</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ avgDepth().toFixed(1) }} km</span>
          <span class="stat-label">Avg Depth</span>
        </div>
      </div>

      @if (quakeService.loading()) {
        <app-loading-spinner />
      } @else if (quakeService.error()) {
        <div class="error-card">
          <span class="error-icon">!</span>
          <p>{{ quakeService.error() }}</p>
          <button class="retry-btn" (click)="quakeService.loadFeed(quakeService.feedUrl())">Retry</button>
        </div>
      } @else {
        <div class="quake-list">
          <h2 class="section-title">Recent Earthquakes</h2>
          @for (quake of filteredQuakes(); track quake.id) {
            <div class="quake-item" (click)="goToDetail(quake.id)">
              <app-magnitude-badge [magnitude]="quake.magnitude" />
              <div class="quake-info">
                <span class="quake-place">{{ quake.place }}</span>
                <div class="quake-meta">
                  <span class="quake-time">{{ quake.time | relativeTime }}</span>
                  <span class="quake-depth">{{ quake.depth.toFixed(1) }} km deep</span>
                  @if (quake.tsunamiFlag) {
                    <span class="tsunami-flag">TSUNAMI</span>
                  }
                </div>
              </div>
              <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          } @empty {
            <div class="empty-state">
              <p>No earthquakes match your filters.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-md);
      align-items: center;
    }

    .feed-selector {
      display: flex;
      gap: var(--space-xs);
      background: var(--bg-surface);
      padding: var(--space-xs);
      border-radius: var(--radius-md);
    }

    .feed-btn {
      padding: var(--space-sm) var(--space-md);
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: var(--fs-sm);
      font-weight: 500;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.2s;
    }

    .feed-btn:hover {
      color: var(--text-primary);
    }

    .feed-btn.active {
      background: var(--accent);
      color: var(--bg-primary);
    }

    .mag-filter {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      color: var(--text-secondary);
      font-size: var(--fs-sm);
    }

    .mag-filter input[type="range"] {
      width: 120px;
      accent-color: var(--accent);
    }

    .mag-value {
      font-family: var(--font-mono);
      color: var(--accent);
      min-width: 32px;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--space-md);
    }

    .stat-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .stat-value {
      font-family: var(--font-mono);
      font-size: var(--fs-2xl);
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .section-title {
      font-size: var(--fs-lg);
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: var(--space-sm);
    }

    .quake-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .quake-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: var(--space-md);
      cursor: pointer;
      transition: all 0.2s;
    }

    .quake-item:hover {
      border-color: var(--accent);
      background: var(--bg-raised);
    }

    .quake-info {
      flex: 1;
      min-width: 0;
    }

    .quake-place {
      display: block;
      font-size: var(--fs-base);
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .quake-meta {
      display: flex;
      gap: var(--space-md);
      margin-top: var(--space-xs);
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
    }

    .tsunami-flag {
      color: var(--danger);
      font-weight: 700;
      font-size: var(--fs-xs);
    }

    .chevron {
      color: var(--text-tertiary);
      flex-shrink: 0;
    }

    .error-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-md);
      background: var(--bg-surface);
      border: 1px solid var(--danger);
      border-radius: var(--radius-md);
      padding: var(--space-xl);
      text-align: center;
    }

    .error-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 107, 107, 0.15);
      color: var(--danger);
      font-weight: 700;
      font-size: var(--fs-xl);
    }

    .retry-btn {
      padding: var(--space-sm) var(--space-lg);
      background: var(--accent);
      color: var(--bg-primary);
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-2xl);
      color: var(--text-tertiary);
    }

    @media (max-width: 768px) {
      .controls {
        flex-direction: column;
        align-items: stretch;
      }
      .feed-selector {
        overflow-x: auto;
      }
    }
  `],
})
export class DashboardComponent implements OnInit {
  readonly quakeService = inject(QuakeService);
  readonly filterService = inject(FilterService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (this.quakeService.earthquakes().length === 0) {
      this.quakeService.loadFeed('all_day');
    }
  }

  readonly timeOptions = [
    { value: 'hour' as const, label: 'Hour' },
    { value: 'day' as const, label: 'Day' },
    { value: 'week' as const, label: 'Week' },
    { value: 'month' as const, label: 'Month' },
  ];

  readonly filteredQuakes = this.filterService.filtered;

  readonly maxMag = computed(() => {
    const quakes = this.filteredQuakes();
    if (quakes.length === 0) return 0;
    return Math.max(...quakes.map(q => q.magnitude));
  });

  readonly avgDepth = computed(() => {
    const quakes = this.filteredQuakes();
    if (quakes.length === 0) return 0;
    return quakes.reduce((sum, q) => sum + q.depth, 0) / quakes.length;
  });

  readonly maxMagColor = computed(() => {
    const m = this.maxMag();
    if (m < 2) return 'var(--mag-1)';
    if (m < 4) return 'var(--mag-3)';
    if (m < 5) return 'var(--mag-5)';
    if (m < 7) return 'var(--mag-7)';
    return 'var(--mag-9)';
  });

  goToDetail(id: string): void {
    this.router.navigate(['/quake', id]);
  }
}
