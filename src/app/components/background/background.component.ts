import { Component, ElementRef, effect, viewChild, signal, NgZone, DebugElement } from '@angular/core';
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
  readonly robber = viewChild.required<ElementRef>('robber');
  // gsap takes an object for progress
  private gsapProgressCop = { value: 0 };
  private gsapProgressRobber = { value: 0 };

  // These will be used to compute scaling based on the Y position along the path
  private pathYMin = 0;
  private pathYMax = 0;

  // Character info
  protected copUrl = signal<string>('assets/images/characters/cop-def.glb');
  protected copRotation = signal<number>(0);
  protected copScale = signal<number>(0.0);
  protected copAnimation = signal<AnimationName>('idle');

  protected robberUrl = signal<string>('assets/images/characters/robber-def.glb');
  protected robberRotation = signal<number>(0);
  protected robberScale = signal<number>(0.0);
  protected robberAnimation = signal<AnimationName>('idle');

  // Timeline is a superset of gsap tween allowing us to control the progress manually
  private timelineCop!: gsap.core.Timeline;
  private timelineRobber!: gsap.core.Timeline;

  constructor(private ngZone: NgZone) {
    effect(() => {
      this.timelineCop = this.createTimeline(this.cop().nativeElement);
      this.timelineRobber = this.createTimeline(this.robber().nativeElement);
      this.computePathYBounds();
      this.moveToPercent('cop', 0.00001);
      this.moveToPercent('robber', 0.00001);
      this.startTestSequence();
    }, { allowSignalWrites: true });
  }

  private createTimeline(element: HTMLElement): gsap.core.Timeline {
    const tl = gsap.timeline({ paused: true });
    tl.to(element, {
      motionPath: {
        path: this.svgPath().nativeElement,
        align: this.svgPath().nativeElement,
        alignOrigin: [0.5, 1],
        autoRotate: false,
      },
      ease: 'none',
    });
    return tl;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.moveToPercent("cop", 0.75);
      this.copAnimation.set('run');
    }, 4000);
    setTimeout(() => {
      this.moveToPercent("robber", 0.75);
      this.robberAnimation.set('run');
    }, 5000);
  }

  moveToPercent(character: 'cop' | 'robber', percent: number) {
    const clamped = Math.min(1, Math.max(0, percent));
    const isCop = character === 'cop';

    const gsapProgress = isCop ? this.gsapProgressCop : this.gsapProgressRobber;
    const timeline = isCop ? this.timelineCop : this.timelineRobber;
    const scale = isCop ? this.copScale : this.robberScale;
    const rotation = isCop ? this.copRotation : this.robberRotation;

    const distance = Math.abs(clamped - gsapProgress.value);
    const duration = distance === 0 ? 0.0001 : distance * 10;

    gsap.to(gsapProgress, {
      value: clamped,
      duration,
      ease: 'linear',
      onUpdate: () => {
        this.ngZone.run(() => {
          timeline.progress(gsapProgress.value);
          scale.set(0.2 + this.getScaleAtProgress(gsapProgress.value) * 2 );
          rotation.set(this.getRotationAtProgress(gsapProgress.value));
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

  getRotationAtProgress(progress: number): number {
    const rawPath = MotionPathPlugin.getRawPath(this.svgPath().nativeElement);
    MotionPathPlugin.cacheRawPathMeasurements(rawPath);
    const epsilon = 0.02;
    const a = MotionPathPlugin.getPositionOnPath(rawPath, Math.max(0, progress - epsilon));
    const b = MotionPathPlugin.getPositionOnPath(rawPath, Math.min(1, progress + epsilon));
    return Math.atan2(-(b.y - a.y), b.x - a.x) + Math.PI / 2;
  }

  // ------------------------------------------------------------------------------------------------

  startTestSequence() {
    console.log('Starting test sequence...');
  }

}