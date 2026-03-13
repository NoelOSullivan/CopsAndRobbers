import { Component, ElementRef, effect, viewChild, signal, NgZone } from '@angular/core';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { CharacterComponent } from '../reusable/character/character.component';

gsap.registerPlugin(MotionPathPlugin);

type AnimationName = 'idle' | 'run' | 'breathe' | 'happy' | 'sad';

@Component({
  selector: 'app-background',
  standalone: true,
  imports: [CharacterComponent],
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})

export class BackgroundComponent {

  readonly svgPath = viewChild.required<ElementRef>('svgPath');
  readonly cop = viewChild.required<ElementRef>('cop');

  // gsap takes an object for progress
  private gsapProgressCop = { value: 0 };

  // These will be used to compute scaling based on the Y position along the path
  private pathYMin = 0;
  private pathYMax = 0;

  // Character info
  protected copUrl = signal<string>('assets/images/characters/cop-def.glb');
  protected copRotation = signal<number>(0);
  protected copScale = signal<number>(0.2);
  protected copAnimation = signal<AnimationName>('idle');

  // superset of gsap tween allowing us to control the timeline progress manually
  private timeline!: gsap.core.Timeline;

  constructor(private ngZone: NgZone) {
    effect(() => {
      this.timeline = gsap.timeline({ paused: true });
      this.timeline.to(this.cop().nativeElement, {
        motionPath: {
          path: this.svgPath().nativeElement,
          align: this.svgPath().nativeElement,
          // Origin of character holder set to bottom. This anchors the character's feet to the path
          alignOrigin: [0.5, 1],
          autoRotate: false,
        },
        ease: 'none',
        duration: 1,
      });
      this.gsapProgressCop.value = 0;
      this.timeline.progress(this.gsapProgressCop.value);
      this.computePathYBounds();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.moveToPercent(0.75);
      this.copAnimation.set('run');
    }, 1000);
  }

  moveToPercent(percent: number) {
    const clamped = Math.min(1, Math.max(0, percent));
    const distance = Math.abs(clamped - this.gsapProgressCop.value);
    const duration = distance * 30;
    gsap.to(this.gsapProgressCop, {
      value: clamped,
      duration,
      ease: 'linear',
      onUpdate: () => {
        this.ngZone.run(() => {
          this.timeline.progress(this.gsapProgressCop.value);
          this.applyScale(this.getScaleAtProgress(this.gsapProgressCop.value));
          this.applyRotation(this.getRotationAtProgress(this.gsapProgressCop.value));
        });
      }
    });
  }

  private computePathYBounds() {
    const rawPath = MotionPathPlugin.getRawPath(this.svgPath().nativeElement);
    MotionPathPlugin.cacheRawPathMeasurements(rawPath);

    const samples = 200;
    const yValues = Array.from({ length: samples }, (_, i) => {
      const point = MotionPathPlugin.getPositionOnPath(rawPath, i / (samples - 1));
      return point.y;
    });

    this.pathYMin = Math.min(...yValues);
    this.pathYMax = Math.max(...yValues);
  }

  getScaleAtProgress(progress: number): number {
    const rawPath = MotionPathPlugin.getRawPath(this.svgPath().nativeElement);
    MotionPathPlugin.cacheRawPathMeasurements(rawPath);
    const point = MotionPathPlugin.getPositionOnPath(rawPath, progress);
    const range = this.pathYMax - this.pathYMin;
    return (point.y - this.pathYMin) / range;
  }

  private applyScale(coef: number) {
    const scale = 0.2 + coef * 2;
    this.copScale.set(scale);
  }

  getRotationAtProgress(progress: number): number {
    const rawPath = MotionPathPlugin.getRawPath(this.svgPath().nativeElement);
    MotionPathPlugin.cacheRawPathMeasurements(rawPath);
    const epsilon = 0.02;
    const a = MotionPathPlugin.getPositionOnPath(rawPath, Math.max(0, progress - epsilon));
    const b = MotionPathPlugin.getPositionOnPath(rawPath, Math.min(1, progress + epsilon));
    return Math.atan2(-(b.y - a.y), b.x - a.x) + Math.PI / 2;
  }

  private applyRotation(angle: number) {
    this.copRotation.set(angle);
  }

}