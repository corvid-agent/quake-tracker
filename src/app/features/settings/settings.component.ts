import { Component, signal } from '@angular/core';
import { FilterService } from '../../core/services/filter.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="settings-page">
      <h1 class="page-title">Settings</h1>

      <div class="settings-card">
        <h2 class="section-title">Feed Selection</h2>
        <p class="section-desc">Choose the time window for earthquake data.</p>
        <div class="feed-options">
          @for (option of feedOptions; track option.value) {
            <label class="radio-option" [class.active]="filterService.timeRange() === option.value">
              <input
                type="radio"
                name="feed"
                [value]="option.value"
                [checked]="filterService.timeRange() === option.value"
                (change)="filterService.setTimeRange(option.value)" />
              <div class="radio-content">
                <span class="radio-label">{{ option.label }}</span>
                <span class="radio-desc">{{ option.desc }}</span>
              </div>
            </label>
          }
        </div>
      </div>

      <div class="settings-card">
        <h2 class="section-title">Magnitude Filter</h2>
        <p class="section-desc">Filter earthquakes by minimum magnitude.</p>
        <div class="range-control">
          <input
            type="range"
            [min]="0"
            [max]="9"
            [step]="0.5"
            [ngModel]="filterService.minMagnitude()"
            (ngModelChange)="filterService.setMagnitudeRange($event, filterService.maxMagnitude())" />
          <div class="range-labels">
            <span>0</span>
            <span class="range-current">{{ filterService.minMagnitude().toFixed(1) }}+</span>
            <span>9</span>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h2 class="section-title">Auto-Refresh</h2>
        <p class="section-desc">Automatically refresh earthquake data periodically.</p>
        <label class="toggle-option">
          <span>Enable auto-refresh</span>
          <div class="toggle" [class.active]="autoRefresh()" (click)="autoRefresh.set(!autoRefresh())">
            <div class="toggle-thumb"></div>
          </div>
        </label>
        <p class="coming-soon">Coming soon</p>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 600px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
    }

    .page-title {
      font-size: var(--fs-2xl);
      font-weight: 700;
    }

    .settings-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-xl);
    }

    .section-title {
      font-size: var(--fs-lg);
      font-weight: 600;
      margin-bottom: var(--space-xs);
    }

    .section-desc {
      color: var(--text-tertiary);
      font-size: var(--fs-sm);
      margin-bottom: var(--space-lg);
    }

    .feed-options {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md);
      background: var(--bg-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;
    }

    .radio-option.active {
      border-color: var(--accent);
      background: rgba(78, 205, 196, 0.05);
    }

    .radio-option input {
      accent-color: var(--accent);
    }

    .radio-content {
      display: flex;
      flex-direction: column;
    }

    .radio-label {
      font-weight: 500;
      font-size: var(--fs-base);
    }

    .radio-desc {
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
    }

    .range-control {
      padding: var(--space-md) 0;
    }

    .range-control input[type="range"] {
      width: 100%;
      accent-color: var(--accent);
    }

    .range-labels {
      display: flex;
      justify-content: space-between;
      margin-top: var(--space-sm);
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
    }

    .range-current {
      font-family: var(--font-mono);
      color: var(--accent);
      font-weight: 700;
    }

    .toggle-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
    }

    .toggle {
      width: 48px;
      height: 26px;
      background: var(--bg-raised);
      border: 1px solid var(--border);
      border-radius: 13px;
      position: relative;
      transition: all 0.2s;
    }

    .toggle.active {
      background: var(--accent);
      border-color: var(--accent);
    }

    .toggle-thumb {
      width: 20px;
      height: 20px;
      background: var(--text-primary);
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
    }

    .toggle.active .toggle-thumb {
      transform: translateX(22px);
    }

    .coming-soon {
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
      font-style: italic;
      margin-top: var(--space-sm);
    }
  `],
})
export class SettingsComponent {
  readonly autoRefresh = signal(false);

  readonly feedOptions = [
    { value: 'hour' as const, label: 'Past Hour', desc: 'Events from the last 60 minutes' },
    { value: 'day' as const, label: 'Past Day', desc: 'Events from the last 24 hours' },
    { value: 'week' as const, label: 'Past Week', desc: 'Events from the last 7 days' },
    { value: 'month' as const, label: 'Past Month', desc: 'Events from the last 30 days' },
  ];

  constructor(public filterService: FilterService) {}
}
