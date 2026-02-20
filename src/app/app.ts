import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="top-bar" aria-label="Site header">
      <a routerLink="/" class="logo" aria-label="QuakeTracker home">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 12h3l3-9 4 18 4-18 3 9h3"/>
        </svg>
        <span>quake-tracker</span>
      </a>
      <nav class="desktop-nav" aria-label="Main navigation">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
        <a routerLink="/stats" routerLinkActive="active">Stats</a>
        <a routerLink="/compare" routerLinkActive="active">Compare</a>
        <a routerLink="/settings" routerLinkActive="active" class="settings-link">
          Settings
          @if (notificationService.enabled()) {
            <span class="notif-indicator" aria-label="Notifications active"></span>
          }
        </a>
      </nav>
    </header>

    <main id="main-content" class="content" aria-label="Page content">
      <router-outlet />
    </main>

    <nav class="bottom-nav" aria-label="Mobile navigation">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 12h3l3-9 4 18 4-18 3 9h3"/>
        </svg>
        <span>Dashboard</span>
      </a>
      <a routerLink="/stats" routerLinkActive="active" class="nav-item">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="12" width="4" height="8"/><rect x="10" y="8" width="4" height="12"/><rect x="17" y="4" width="4" height="16"/>
        </svg>
        <span>Stats</span>
      </a>
      <a routerLink="/compare" routerLinkActive="active" class="nav-item">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 20V10M12 20V4M6 20v-6"/>
        </svg>
        <span>Compare</span>
      </a>
      <a routerLink="/settings" routerLinkActive="active" class="nav-item">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.73 12.73l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <span>Settings</span>
        @if (notificationService.enabled()) {
          <span class="notif-indicator-mobile" aria-label="Notifications active"></span>
        }
      </a>
    </nav>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-md) var(--space-lg);
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      color: var(--accent);
      font-weight: 700;
      font-size: var(--fs-lg);
      text-decoration: none;
      min-height: 44px;
    }

    .desktop-nav {
      display: flex;
      gap: var(--space-lg);
    }

    .desktop-nav a {
      color: var(--text-secondary);
      font-size: var(--fs-sm);
      font-weight: 500;
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-sm);
      transition: all 0.2s;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
    }

    .desktop-nav a:hover {
      color: var(--text-primary);
    }

    .desktop-nav a.active {
      color: var(--accent);
      background: rgba(78, 205, 196, 0.1);
    }

    .settings-link {
      position: relative;
    }

    .notif-indicator {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 6px rgba(107, 203, 119, 0.6);
      margin-left: 2px;
      vertical-align: top;
    }

    .notif-indicator-mobile {
      position: absolute;
      top: 2px;
      right: -4px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 6px rgba(107, 203, 119, 0.6);
    }

    .content {
      flex: 1;
      padding: var(--space-lg);
      padding-bottom: 80px;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }

    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-surface);
      border-top: 1px solid var(--border);
      padding: var(--space-sm) 0;
      z-index: 100;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      color: var(--text-tertiary);
      font-size: var(--fs-xs);
      text-decoration: none;
      transition: color 0.2s;
      position: relative;
      min-height: 44px;
      min-width: 44px;
      justify-content: center;
      padding: var(--space-xs) var(--space-sm);
    }

    .nav-item.active {
      color: var(--accent);
    }

    @media (max-width: 768px) {
      .desktop-nav { display: none; }
      .bottom-nav {
        display: flex;
        justify-content: space-around;
      }
      .content {
        padding: var(--space-md);
        padding-bottom: 80px;
      }
    }
  `],
})
export class App {
  readonly notificationService = inject(NotificationService);
}
