import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-magnitude-badge',
  standalone: true,
  template: `
    <span class="mag-badge" [style.background]="getColor()" [attr.aria-label]="'Magnitude ' + formatMag()" role="img">
      {{ formatMag() }}
    </span>
  `,
  styles: [`
    .mag-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      font-family: var(--font-mono);
      font-size: var(--fs-base);
      font-weight: 700;
      color: #0f1117;
      flex-shrink: 0;
    }
  `],
})
export class MagnitudeBadgeComponent {
  @Input() magnitude: number = 0;

  formatMag(): string {
    return this.magnitude.toFixed(1);
  }

  getColor(): string {
    const m = this.magnitude;
    if (m < 2) return 'var(--mag-1)';
    if (m < 4) return 'var(--mag-3)';
    if (m < 5) return 'var(--mag-5)';
    if (m < 7) return 'var(--mag-7)';
    return 'var(--mag-9)';
  }
}
