import { Component, inject, signal } from '@angular/core';
import { FilterService } from '../../core/services/filter.service';
import { NotificationService } from '../../core/services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="settings-page">
      <h1 class="page-title">Settings</h1>

      <!-- Notifications -->
      <section class="settings-card" aria-labelledby="notif-heading">
        <h2 class="section-title" id="notif-heading">
          <svg aria-hidden="true" class="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Notifications
        </h2>
        <p class="section-desc">Get browser alerts when earthquakes above your magnitude threshold occur near your location.</p>

        @if (notificationService.permissionState() === 'unavailable') {
          <div class="status-banner status-error" role="alert">
            Your browser does not support the Notifications API.
          </div>
        } @else if (notificationService.permissionState() === 'denied') {
          <div class="status-banner status-error" role="alert">
            Notifications are blocked. Please allow notifications for this site in your browser settings.
          </div>
        } @else {
          <div class="toggle-option">
            <span id="notif-toggle-label">Enable earthquake alerts</span>
            <button
              class="toggle"
              role="switch"
              [attr.aria-checked]="notificationService.enabled()"
              aria-labelledby="notif-toggle-label"
              [class.active]="notificationService.enabled()"
              (click)="notificationService.toggleEnabled(!notificationService.enabled())">
              <div class="toggle-thumb"></div>
            </button>
          </div>

          @if (notificationService.enabled()) {
            <div class="notification-settings">
              <div class="status-banner" role="status" [class.status-active]="notificationService.hasLocation()" [class.status-warning]="notificationService.locationError()">
                <span class="status-dot" aria-hidden="true" [class.active]="notificationService.hasLocation()"></span>
                {{ notificationService.statusText() }}
              </div>

              @if (notificationService.hasLocation()) {
                <p class="location-info">
                  Location: {{ notificationService.userLat()!.toFixed(2) }}, {{ notificationService.userLng()!.toFixed(2) }}
                </p>
              }

              <div class="notification-control">
                <label for="notif-mag-threshold" class="control-label">Minimum magnitude</label>
                <div class="range-control">
                  <input
                    id="notif-mag-threshold"
                    type="range"
                    [min]="1"
                    [max]="8"
                    [step]="0.5"
                    aria-label="Notification minimum magnitude threshold"
                    [ngModel]="notificationService.magnitudeThreshold()"
                    (ngModelChange)="notificationService.setMagnitudeThreshold($event)" />
                  <div class="range-labels" aria-hidden="true">
                    <span>1.0</span>
                    <span class="range-current">M{{ notificationService.magnitudeThreshold().toFixed(1) }}+</span>
                    <span>8.0</span>
                  </div>
                </div>
              </div>

              <div class="notification-control">
                <label for="notif-radius" class="control-label">Alert radius</label>
                <div class="range-control">
                  <input
                    id="notif-radius"
                    type="range"
                    [min]="50"
                    [max]="2000"
                    [step]="50"
                    aria-label="Notification alert radius in kilometers"
                    [ngModel]="notificationService.radiusKm()"
                    (ngModelChange)="notificationService.setRadiusKm($event)" />
                  <div class="range-labels" aria-hidden="true">
                    <span>50 km</span>
                    <span class="range-current">{{ notificationService.radiusKm() }} km</span>
                    <span>2000 km</span>
                  </div>
                </div>
              </div>

              @if (notificationService.lastCheckTime(); as lastCheck) {
                <p class="last-check">
                  Last checked: {{ formatTime(lastCheck) }}
                  @if (notificationService.nearbyCount() > 0) {
                    &mdash; {{ notificationService.nearbyCount() }} nearby quake{{ notificationService.nearbyCount() === 1 ? '' : 's' }}
                  }
                </p>
              }
            </div>
          }
        }
      </section>

      <!-- Feed Selection -->
      <section class="settings-card" aria-labelledby="feed-heading">
        <h2 class="section-title" id="feed-heading">Feed Selection</h2>
        <p class="section-desc">Choose the time window for earthquake data.</p>
        <fieldset class="feed-options">
          <legend class="sr-only">Time range for earthquake data</legend>
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
        </fieldset>
      </section>

      <!-- Magnitude Filter -->
      <section class="settings-card" aria-labelledby="mag-heading">
        <h2 class="section-title" id="mag-heading">Magnitude Filter</h2>
        <p class="section-desc">Filter earthquakes by minimum magnitude.</p>
        <div class="range-control">
          <input
            type="range"
            [min]="0"
            [max]="9"
            [step]="0.5"
            aria-label="Minimum magnitude filter"
            [ngModel]="filterService.minMagnitude()"
            (ngModelChange)="filterService.setMagnitudeRange($event, filterService.maxMagnitude())" />
          <div class="range-labels" aria-hidden="true">
            <span>0</span>
            <span class="range-current">{{ filterService.minMagnitude().toFixed(1) }}+</span>
            <span>9</span>
          </div>
        </div>
      </section>

      <!-- Auto-Refresh -->
      <section class="settings-card" aria-labelledby="refresh-heading">
        <h2 class="section-title" id="refresh-heading">Auto-Refresh</h2>
        <p class="section-desc">Automatically refresh earthquake data periodically.</p>
        <div class="toggle-option">
          <span id="refresh-toggle-label">Enable auto-refresh</span>
          <button
            class="toggle"
            role="switch"
            [attr.aria-checked]="autoRefresh()"
            aria-labelledby="refresh-toggle-label"
            [class.active]="autoRefresh()"
            (click)="autoRefresh.set(!autoRefresh())">
            <div class="toggle-thumb"></div>
          </button>
        </div>
        <p class="coming-soon">Coming soon</p>
      </section>
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
      display: flex;
      align-items: center;
      gap: var(--space-sm);
    }

    .section-icon {
      color: var(--accent);
      flex-shrink: 0;
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

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    fieldset {
      border: none;
      padding: 0;
      margin: 0;
    }

    .toggle {
      width: 48px;
      height: 28px;
      background: var(--bg-raised);
      border: 1px solid var(--border);
      border-radius: 14px;
      position: relative;
      transition: all 0.2s;
      cursor: pointer;
      min-height: 44px;
      min-width: 44px;
      display: flex;
      align-items: center;
      padding: 0 2px;
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
      transition: transform 0.2s;
      flex-shrink: 0;
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

    /* Notification-specific styles */
    .notification-settings {
      margin-top: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .notification-control {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .control-label {
      font-size: var(--fs-sm);
      font-weight: 500;
      color: var(--text-secondary);
    }

    .status-banner {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
      font-size: var(--fs-sm);
      background: var(--bg-raised);
      border: 1px solid var(--border);
    }

    .status-banner.status-active {
      border-color: var(--success);
      background: rgba(107, 203, 119, 0.08);
      color: var(--success);
    }

    .status-banner.status-warning {
      border-color: var(--warning);
      background: rgba(255, 217, 61, 0.08);
      color: var(--warning);
    }

    .status-banner.status-error {
      border-color: var(--danger);
      background: rgba(255, 107, 107, 0.08);
      color: var(--danger);
      margin-bottom: var(--space-sm);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-tertiary);
      flex-shrink: 0;
    }

    .status-dot.active {
      background: var(--success);
      box-shadow: 0 0 6px rgba(107, 203, 119, 0.5);
    }

    .location-info {
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
      font-family: var(--font-mono);
    }

    .last-check {
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
      padding-top: var(--space-sm);
      border-top: 1px solid var(--border);
    }
  `],
})
export class SettingsComponent {
  readonly filterService = inject(FilterService);
  readonly notificationService = inject(NotificationService);
  readonly autoRefresh = signal(false);

  readonly feedOptions = [
    { value: 'hour' as const, label: 'Past Hour', desc: 'Events from the last 60 minutes' },
    { value: 'day' as const, label: 'Past Day', desc: 'Events from the last 24 hours' },
    { value: 'week' as const, label: 'Past Week', desc: 'Events from the last 7 days' },
    { value: 'month' as const, label: 'Past Month', desc: 'Events from the last 30 days' },
  ];

  formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
}
