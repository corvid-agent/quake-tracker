import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuakeService } from '../../core/services/quake.service';
import { Earthquake, featureToEarthquake } from '../../core/models/earthquake.model';
import { MagnitudeBadgeComponent } from '../../shared/components/magnitude-badge.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [MagnitudeBadgeComponent, RelativeTimePipe, LoadingSpinnerComponent, DatePipe],
  template: `
    <div class="detail-page">
      <button class="back-btn" (click)="goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Back
      </button>

      @if (loading()) {
        <app-loading-spinner />
      } @else if (error()) {
        <div class="error-card">
          <p>{{ error() }}</p>
        </div>
      } @else if (quake()) {
        <div class="detail-card">
          <div class="detail-header">
            <app-magnitude-badge [magnitude]="quake()!.magnitude" />
            <div class="header-info">
              <h1 class="detail-title">M {{ quake()!.magnitude.toFixed(1) }} Earthquake</h1>
              <p class="detail-place">{{ quake()!.place }}</p>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Time</span>
              <span class="detail-value">{{ quake()!.time | date:'medium' }}</span>
              <span class="detail-sub">{{ quake()!.time | relativeTime }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Depth</span>
              <span class="detail-value">{{ quake()!.depth.toFixed(1) }} km</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type</span>
              <span class="detail-value">{{ quake()!.type }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Coordinates</span>
              <span class="detail-value mono">
                {{ quake()!.coordinates[1].toFixed(4) }}, {{ quake()!.coordinates[0].toFixed(4) }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tsunami Warning</span>
              <span class="detail-value" [class.tsunami]="quake()!.tsunamiFlag">
                {{ quake()!.tsunamiFlag ? 'Yes' : 'No' }}
              </span>
            </div>
            @if (quake()!.felt !== null) {
              <div class="detail-item">
                <span class="detail-label">Felt Reports</span>
                <span class="detail-value">{{ quake()!.felt }}</span>
              </div>
            }
            @if (quake()!.alert) {
              <div class="detail-item">
                <span class="detail-label">Alert Level</span>
                <span class="detail-value alert-{{ quake()!.alert }}">{{ quake()!.alert }}</span>
              </div>
            }
          </div>

          <a class="usgs-link" [href]="quake()!.url" target="_blank" rel="noopener noreferrer">
            View on USGS
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page {
      max-width: 700px;
      margin: 0 auto;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      background: none;
      border: none;
      color: var(--accent);
      font-size: var(--fs-base);
      cursor: pointer;
      margin-bottom: var(--space-lg);
      padding: var(--space-sm) 0;
    }

    .back-btn:hover {
      color: var(--accent-hover);
    }

    .detail-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
      padding-bottom: var(--space-lg);
      border-bottom: 1px solid var(--border);
    }

    .detail-title {
      font-size: var(--fs-2xl);
      font-weight: 700;
    }

    .detail-place {
      color: var(--text-secondary);
      font-size: var(--fs-base);
      margin-top: var(--space-xs);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .detail-label {
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-value {
      font-size: var(--fs-md);
      font-weight: 500;
    }

    .detail-value.mono {
      font-family: var(--font-mono);
      font-size: var(--fs-sm);
    }

    .detail-value.tsunami {
      color: var(--danger);
      font-weight: 700;
    }

    .detail-sub {
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
    }

    .usgs-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-xs);
      padding: var(--space-sm) var(--space-md);
      background: rgba(78, 205, 196, 0.1);
      border: 1px solid var(--accent);
      border-radius: var(--radius-sm);
      color: var(--accent);
      font-size: var(--fs-sm);
      font-weight: 500;
      transition: all 0.2s;
    }

    .usgs-link:hover {
      background: rgba(78, 205, 196, 0.2);
    }

    .error-card {
      background: var(--bg-surface);
      border: 1px solid var(--danger);
      border-radius: var(--radius-md);
      padding: var(--space-xl);
      text-align: center;
      color: var(--danger);
    }
  `],
})
export class DetailComponent implements OnInit {
  readonly quake = signal<Earthquake | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quakeService: QuakeService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('No earthquake ID provided');
      this.loading.set(false);
      return;
    }

    this.quakeService.getDetail(id).subscribe({
      next: (data) => {
        if (data.features && data.features.length > 0) {
          this.quake.set(featureToEarthquake(data.features[0]));
        } else {
          this.error.set('Earthquake not found');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Failed to load earthquake details');
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
