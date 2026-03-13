import { Injectable, OnDestroy, signal, computed } from '@angular/core';

// ─── Breakpoints — match these to your CSS media queries ─────────────────────
const BREAKPOINTS = {
  mobile:  { max: 767 },
  tablet:  { min: 768, max: 1024 },
  desktop: { min: 1025 },
};

export type DeviceType  = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';

@Injectable({ providedIn: 'root' })
export class DeviceService implements OnDestroy {

  // ─── Core signals ───────────────────────────────────────────────────────────
  readonly type        = signal<DeviceType>(this.getType());
  readonly orientation = signal<Orientation>(this.getOrientation());

  // ─── Computed signals (derived automatically, no extra subscriptions) ───────
  readonly isMobile    = computed(() => this.type() === 'mobile');
  readonly isTablet    = computed(() => this.type() === 'tablet');
  readonly isDesktop   = computed(() => this.type() === 'desktop');
  readonly isPortrait  = computed(() => this.orientation() === 'portrait');
  readonly isLandscape = computed(() => this.orientation() === 'landscape');

  readonly deviceInfo  = computed(() => ({
    type:        this.type(),
    orientation: this.orientation(),
    width:       window.innerWidth,
    height:      window.innerHeight,
    isMobile:    this.isMobile(),
    isTablet:    this.isTablet(),
    isDesktop:   this.isDesktop(),
    isPortrait:  this.isPortrait(),
    isLandscape: this.isLandscape(),
  }));

  // ─── Native event listeners (no RxJS needed) ───────────────────────────────
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly onResize = () => {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => this.update(), 100); // debounce 100ms
  };

  constructor() {
    window.addEventListener('resize', this.onResize, { passive: true });
    screen.orientation?.addEventListener('change', this.onResize);
  }

  private update(): void {
    this.type.set(this.getType());
    this.orientation.set(this.getOrientation());
  }

  private getType(): DeviceType {
    const w = window.innerWidth;
    if (w <= BREAKPOINTS.mobile.max) return 'mobile';
    if (w <= BREAKPOINTS.tablet.max) return 'tablet';
    return 'desktop';
  }

  private getOrientation(): Orientation {
    if (screen.orientation?.type) {
      return screen.orientation.type.startsWith('portrait') ? 'portrait' : 'landscape';
    }
    return window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape';
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    screen.orientation?.removeEventListener('change', this.onResize);
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
  }
}