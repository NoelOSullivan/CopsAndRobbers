import {
  Component,
  OnDestroy,
  AfterViewInit,
  viewChild,
  signal,
  ElementRef,
  inject,
  effect,
} from '@angular/core';
import { CharacterComponent, AnimationName } from '../reusable/character/character.component';
import gsap from 'gsap';

@Component({
  selector: 'app-background',
  standalone: true,
  imports: [CharacterComponent],
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']

})
export class BackgroundComponent implements AfterViewInit, OnDestroy {

  // ── View queries (signals) ─────────────────────────────────────────────────
  // svgPath points to the <path #svgPath> element in the parent/host template
  svgPath = viewChild.required<ElementRef<SVGPathElement>>('svgPath');
  private cop = viewChild.required<ElementRef<HTMLDivElement>>('cop');
  private background = viewChild.required<ElementRef<HTMLDivElement>>('background');

  // ── Writable signals passed to the character ──────────────────────────────
  copUrl = signal<string>('assets/images/characters/cop-def.glb');
  copRotation = signal<number>(0);
  copScale = signal<number>(1);
  copAnimation = signal<AnimationName>('idle');

  // ── GSAP tween proxy ──────────────────────────────────────────────────────
  private currentPercent = 0;
  private tween?: gsap.core.Tween;

  constructor() {
    effect(() => {
      const path = this.svgPath()?.nativeElement;
      const char = this.cop()?.nativeElement;

      // console.log("bbb", path.getBoundingClientRect());

      if (path && char) {
        // this.initScaleFromPath(path);

        this.tween = gsap.to(char, {
          paused: true,
          motionPath: {
            path: path,
            align: path,
            autoRotate: false,
            alignOrigin: [0.5, 0.5],
          }
        });
        this.seekToPercent(0); // start at 0%
      }
    });
  }

  ngAfterViewInit(): void {
    // Snap to start of path on init
    // this.seekToPercent(0);
    setTimeout(() => {
      console.log("Starting animation");
      // this.tweenToPercent(100, 10); // animate to 100% over time
    }, 1000);
  }

  // ─── Public AFPI ───────────────────────────────────────────────────────────

  /** Instantly place the character at a position on the path (0–100) */
  seekToPercent(percent: number): void {
    this.tween?.kill();
    this.currentPercent = percent;
    
    this.applyPathPosition(percent);
  }

  /** Tween the character to a target position on the path (0–100) */
  tweenToPercent(targetPercent: number, duration = 2): void {
    this.tween?.kill();
    this.copAnimation.set('run');
 
    this.tween = gsap.to(this, {
      currentPercent: targetPercent,
      duration,
      ease: 'power1.inOut',
      onUpdate: () => this.applyPathPosition(this.currentPercent),
      onComplete: () => this.copAnimation.set('idle'),
    });
  }

  /** Call at end of journey to show result */
  finish(result: 'happy' | 'sad'): void {
    this.tween?.kill();
    this.copAnimation.set(result);
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private applyPathPosition(percent: number): void {
    const path = this.svgPath().nativeElement;
    const length = path.getTotalLength();
    const t = Math.max(0, Math.min(100, percent)) / 100;

    const point = path.getPointAtLength(t * length);
    console.log("point", point);

    // Compute tangent by sampling a small step ahead
    const epsilon = Math.min(1, length * 0.001);
    const pointAhead = path.getPointAtLength(Math.min(t * length + epsilon, length));
    const angle = Math.atan2(pointAhead.y - point.y, pointAhead.x - point.x);

    const pathObjectX = path.getBoundingClientRect().x;
    const pathObjectY = path.getBoundingClientRect().y;
    console.log(path.getBoundingClientRect());

    // Move the container div
    console.log(`Moving to (${point.x}, ${point.y}) with angle ${angle}`);
    // console.log(this.background().nativeElement.getBoundingClientRect());
    this.cop().nativeElement.style.transform = `translate(${point.x}px, ${point.y}px)`;

    // Feed rotation into the character (negate so it faces forward)
    // this.copRotation.set(-angle);
  }

  

  ngOnDestroy(): void {
    this.tween?.kill();
  }
}

// import {
//   Component,
//   OnDestroy,
//   AfterViewInit,
//   viewChild,
//   signal,
//   ElementRef,
//   inject,
// } from '@angular/core';
// import { CharacterComponent, AnimationName } from '../reusable/character/character.component';
// import gsap from 'gsap';

// gsap.registerPlugin(MotionPathPlugin);

// @Component({
//   selector: 'app-background',
//   standalone: true,
//   imports: [CharacterComponent],
//   templateUrl: './background.component.html',
//   styleUrl: './background.component.scss'
// })

// export class BackgroundComponent {

//   // ── View queries (signals) ─────────────────────────────────────────────────
//   private svgPath = viewChild.required<ElementRef<SVGPathElement>>('svgPath');
//   private cop = viewChild.required<ElementRef<HTMLDivElement>>('cop');

//   // ── SVG path string — replace with yours ──────────────────────────────────
//   // svgPathD = 'M 100 500 C 200 100, 600 100, 700 500';

//   // ── Writable signals passed to the character ──────────────────────────────
//   characterRotation = signal<number>(0);
//   characterScale = signal<number>(1);
//   characterAnimation = signal<AnimationName>('idle');

//   // ── GSAP tween proxy ──────────────────────────────────────────────────────
//   private proxy = { percent: 0 };
//   private tween?: gsap.core.Tween;

//   ngAfterViewInit(): void {
//     // Snap to start of path on init
//     this.seekToPercent(0);
//   }

//   // ─── Public API ───────────────────────────────────────────────────────────

//   /** Instantly place the character at a position on the path (0–100) */
//   seekToPercent(percent: number): void {
//     this.proxy.percent = percent;
//     this.applyPathPosition(percent);
//   }

//   /** Tween the character to a target position on the path (0–100) */
//   tweenToPercent(targetPercent: number, duration = 2): void {
//     this.tween?.kill();
//     this.characterAnimation.set('run');

//     this.tween = gsap.to(this.proxy, {
//       percent: targetPercent,
//       duration,
//       ease: 'power1.inOut',
//       onUpdate: () => this.applyPathPosition(this.proxy.percent),
//       onComplete: () => this.characterAnimation.set('idle'),
//     });
//   }

//   /** Call at end of journey to show result */
//   finish(result: 'happy' | 'sad'): void {
//     this.tween?.kill();
//     this.characterAnimation.set(result);
//   }

//   // ─── Internal ─────────────────────────────────────────────────────────────

//   private applyPathPosition(percent: number): void {
//     const path = this.svgPath().nativeElement;
//     const length = path.getTotalLength();
//     const t = Math.max(0, Math.min(100, percent)) / 100;

//     const point = path.getPointAtLength(t * length);

//     // Compute tangent by sampling a small step ahead
//     const epsilon = Math.min(1, length * 0.001);
//     const pointAhead = path.getPointAtLength(Math.min(t * length + epsilon, length));
//     const angle = Math.atan2(pointAhead.y - point.y, pointAhead.x - point.x);

//     // Move the cop div
//     this.cop().nativeElement.style.transform = `translate(${point.x}px, ${point.y}px)`;

//     // Feed rotation into the character (negate so it faces forward)
//     this.characterRotation.set(-angle);
//   }

//   ngOnDestroy(): void {
//     this.tween?.kill();
//   }

//   // tween: gsap.core.Tween | null = null;

//   // animPath = viewChild<ElementRef<SVGPathElement>>('animPath');
//   // cop = viewChild<ElementRef<HTMLDivElement>>('cop');

//   // copScale = signal<number>(0);
//   // copRotation = signal<number>(0);
//   // currentPercent = signal<number>(0);

//   // pathMinY = 0;
//   // pathMaxY = 0;

//   // constructor() {
//   //   effect(() => {
//   //     const path = this.animPath()?.nativeElement;
//   //     const char = this.cop()?.nativeElement;

//   //     if (path && char) {
//   //       this.initScaleFromPath(path);

//   //       this.tween = gsap.to(char, {
//   //         paused: true,
//   //         motionPath: {
//   //           path: path,
//   //           align: path,
//   //           autoRotate: false,
//   //           alignOrigin: [0.5, 1],
//   //         }
//   //       });
//   //       this.moveToPercent(0); // start at 0%
//   //     }
//   //   });
//   // }

//   // ngAfterViewInit() {
//   //   setTimeout(() => {
//   //     console.log("Starting animation");
//   //     this.moveToPercent(100); // animate to 100% over time
//   //   }, 1000);
//   // }

//   // initScaleFromPath(path: SVGPathElement) {
//   //   const total = path.getTotalLength();
//   //   let minY = Infinity;
//   //   let maxY = -Infinity;

//   //   for (let i = 0; i <= 200; i++) {
//   //     const point = path.getPointAtLength((i / 200) * total);
//   //     if (point.y < minY) minY = point.y;
//   //     if (point.y > maxY) maxY = point.y;
//   //   }

//   //   this.pathMinY = minY;
//   //   this.pathMaxY = maxY;
//   // }

//   // getScaleAtPercent(percent: number): number {
//   //   const path = this.animPath()?.nativeElement!;
//   //   const total = path.getTotalLength();
//   //   const point = path.getPointAtLength((percent / 100) * total);
//   //   return gsap.utils.mapRange(this.pathMinY, this.pathMaxY, 0.3, 1.0, point.y);
//   // }

//   // getRotationAtPercent(percent: number): number {
//   //   const path = this.animPath()?.nativeElement!;
//   //   const total = path.getTotalLength();
//   //   const t = percent / 100;
//   //   const p1 = path.getPointAtLength(t * total);
//   //   const p2 = path.getPointAtLength((t + 0.001) * total);
//   //   return Math.atan2(p2.y - p1.y, p2.x - p1.x);
//   // }

//   // moveToPercent(percent: number) {
//   //   const from = this.currentPercent() / 100;
//   //   const to = percent / 100;
//   //   const duration = Math.abs(to - from) * 20; // adjust multiplier for speed
//   //   let elapsed = 0;

//   //   const ticker = (time: number, delta: number) => {
//   //     console.log("Ticker:", time, delta);
//   //     elapsed += delta / 1000;
//   //     const t = Math.min(elapsed / duration, 1);
//   //     const progress = from + (to - from) * t;

//   //     this.tween!.progress(progress);
//   //     this.copScale.set(this.getScaleAtPercent(progress * 100));
//   //     this.copRotation.set(this.getRotationAtPercent(progress * 100));

//   //     if (t >= 1) {
//   //       gsap.ticker.remove(ticker);
//   //       this.currentPercent.set(percent);
//   //     }
//   //   };

//   //   gsap.ticker.add(ticker);
//   // }
// }