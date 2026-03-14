import {
  Component,
  OnDestroy,
  input,
  effect,
  viewChild,
  ElementRef,
  NgZone,
  inject,
  afterNextRender,
} from '@angular/core';
import { NgClass } from '@angular/common';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type AnimationName = 'idle' | 'run' | 'breathe' | 'happy' | 'sad';

@Component({
  selector: 'app-character',
  imports: [NgClass],
  standalone: true,
  templateUrl: './character.component.html',
  styleUrls: ['./character.component.scss'],
})
export class CharacterComponent implements OnDestroy {

  modelUrl = input.required<string>();
  rotation = input<number>(0);
  scale = input<number>(1);
  animation = input<AnimationName>('idle');

  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private ngZone = inject(NgZone);
  private hostEl = inject(ElementRef);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private mixer!: THREE.AnimationMixer;
  private clock = new THREE.Clock();
  private animationMap = new Map<AnimationName, THREE.AnimationAction>();
  private currentAction?: THREE.AnimationAction;
  private character?: THREE.Object3D;
  private frameId?: number;
  private resizeObserver!: ResizeObserver;
  protected ready = false;

  constructor() {
    afterNextRender(() => {
      this.initScene(this.canvas().nativeElement);
      this.loadModel();
      this.startLoop();
      // this.observeResize();
    });

    effect(() => {
      this.rotation();
      if (this.character) this.character.rotation.y = this.rotation();
    });

    effect(() => {
      this.scale()
      if (this.character) this.character.scale.setScalar(this.scale());
    });

    effect(() => {
      this.playAnimation(this.animation());
    });
  }

  private initScene(canvasEl: HTMLCanvasElement): void {
    const { width, height } = canvasEl.getBoundingClientRect();
    const w = width;
    const h = height;

    this.renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    // Position camera so hte feet are near the bottom of the holder (which is anchored to the path)
    this.camera.position.set(0, 1.6, 5);
    this.camera.lookAt(0, 1, -1);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(3, 6, 4);
    dirLight.castShadow = true;
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-3, 2, -2);

    this.scene.add(ambient, dirLight, fill);
  }

  private loadModel(): void {
    new GLTFLoader().load(
      this.modelUrl(),
      (gltf) => {
        this.character = gltf.scene;
        const box = new THREE.Box3().setFromObject(this.character);
        // Position character so feet are at bottom with a coef to prevent clipping feet when scaling
        this.character.position.y = box.min.y + 0.02;
        this.character.rotation.y = this.rotation();
        this.character.scale.setScalar(this.scale());

        // this.character.traverse((node) => {
        //   if ((node as THREE.Mesh).isMesh) {
        //     node.castShadow = true;
        //     node.receiveShadow = true;
        //   }
        // });

        this.scene.add(this.character);

        this.mixer = new THREE.AnimationMixer(this.character);
        gltf.animations.forEach((clip) => {
          this.animationMap.set(clip.name as AnimationName, this.mixer.clipAction(clip));
        });

        const idleAction = this.animationMap.get('idle');
        if (idleAction) {
          idleAction.play();
          this.mixer.update(idleAction.getClip().duration);
          idleAction.stop();
        }

        this.playAnimation(this.animation());

        requestAnimationFrame(() => requestAnimationFrame(() => {
          this.ready = true;
        }));
      },
      undefined,
      (err) => console.error('CharacterComponent: model load failed', err)
    );
  }

  playAnimation(name: AnimationName, fadeDuration = 0.4): void {
    const next = this.animationMap.get(name);
    if (!next || next === this.currentAction) return;
    this.currentAction?.fadeOut(fadeDuration);
    next.reset().fadeIn(fadeDuration).play();
    this.currentAction = next;
  }

  private startLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.frameId = requestAnimationFrame(loop);
        this.mixer?.update(this.clock.getDelta());
        this.renderer.render(this.scene, this.camera);
      };
      loop();
    });
  }

  private observeResize(): void {
    this.resizeObserver = new ResizeObserver(() => {
      const { width, height } = this.hostEl.nativeElement.getBoundingClientRect();
      if (!width || !height) return;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
    this.resizeObserver.observe(this.hostEl.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.renderer?.dispose();
  }
}