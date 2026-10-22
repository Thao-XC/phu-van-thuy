import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createProceduralTextures, ShrineTextureLibrary } from './proceduralTextures';
import { soundService } from '../services/soundService';
import { createKitMaterials } from './kit/materials';
import { Architecture } from './kit/architecture';
import { Nature } from './kit/nature';
import { VietKit } from './kit/vietnam';
import { phuVanThuy } from './world/phuVanThuy';
import type { GroundFn, LayoutCtx, LayoutResult, ParticleKind, SecretDef, Etiquette, SpotDef } from './world/types';
import type { EncounterDef, EncounterEvent, EncounterRuntime, StoryCard, EncounterApi } from './encounters/types';

export type TimeOfDay = 'day' | 'twilight' | 'night';

export interface SceneCallbacks {
  onNearSpot?: (spotId: string | null, spotName: string | null, spotType: string | null) => void;
  /** encounter start / captions / end (with the legend card) */
  onEncounter?: (e: EncounterEvent) => void;
  /** luck change with the custom behind it; `key` identifies the rule */
  onLuck?: (delta: number, reason: string, key: string) => void;
  /** a secret was found */
  onSecret?: (id: string, card: StoryCard, luck: number) => void;
  /** short line of on-screen text (hints) */
  onCaption?: (text: string, seconds?: number) => void;
  /** may the visitor enter this realm yet? true, or a caption explaining why not */
  canEnter?: (id: string) => true | string;
}

const POCKET_Y = -600;

export class TempleScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private pmremGenerator: THREE.PMREMGenerator;

  private timeOfDay: TimeOfDay = 'twilight';
  private textures: ShrineTextureLibrary;
  private callbacks: SceneCallbacks;

  // Lighting
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private ambientFill: THREE.AmbientLight;

  // Interactive Scene Objects
  private dynamicLights: THREE.PointLight[] = [];
  private waterPlane: THREE.Mesh | null = null;
  private petalParticles: THREE.Points | null = null;
  private smokeParticles: THREE.Points | null = null;
  private animatedBells: THREE.Mesh[] = [];

  // Per-shrine layout state
  private ground: GroundFn = () => 0;
  private walkable: ((x: number, z: number) => boolean) | null = null;
  private bounds = { x0: -28, x1: 28, z0: -24, z1: 38 };
  private spots: SpotDef[] = [];
  private bellObj: THREE.Object3D | null = null;
  private lockedCool = 0;
  private orbit = { x: 0, z: -4, r: 28, y: 7 };
  private smokeOrigin = new THREE.Vector3(0, 2.2, 4);
  private fogMul = 1;
  private particleKind: ParticleKind = 'leaves';
  private waterBaseY = 0.4;
  private nature: Nature | null = null;
  private sunOffset = new THREE.Vector3(30, 45, 25);

  // Secret worlds, secrets and manners
  private kitForEncounters: { arch: Architecture; nat: Nature; m: ReturnType<typeof createKitMaterials>; vk: VietKit } | null = null;
  private encounterDefs: EncounterDef[] = [];
  private enc: {
    def: EncounterDef;
    rt: EncounterRuntime | null;
    root: THREE.Group | null;
    t: number;
    ending: boolean;
    saved: { ground: GroundFn; walkable: ((x: number, z: number) => boolean) | null; bounds: { x0: number; x1: number; z0: number; z1: number } };
  } | null = null;
  private encCooldown = 0;
  private secrets: SecretDef[] = [];
  private secretsFound = new Set<string>();
  private secretHinted = new Set<string>();
  private secretLinger: Record<string, number> = {};
  private blindwalk: { def: SecretDef; t: number } | null = null;
  private etiquette: Etiquette = {};
  private nightObjects: THREE.Object3D[] = [];
  private onTime: ((t: TimeOfDay) => void) | null = null;
  private manners = { runT: 0, runCount: 0, runCool: 0, forbidCool: 0, forbidCount: 0, bowedAtGate: false, gateHinted: false, lastBow: -99, threshT: 0, threshCount: 0, threshCool: 0 };
  private elapsed = 0;
  private bowAnim = 0;
  private shakeT = 0;
  private shakeAmt = 0;
  private bubbles: THREE.Points | null = null;
  // full-screen fade quad attached to the camera
  private fadeMesh!: THREE.Mesh;
  private fade: { from: number; to: number; dur: number; t: number; then?: () => void } | null = null;

  // Player & Navigation
  public playerPosition = new THREE.Vector3(0, 1.7, 30);
  public playerRotationY = 0; // forward is -Z, i.e. toward the main hall
  public playerPitch = 0; // Look up/down

  // Camera Target
  private cameraTargetPos = new THREE.Vector3();
  private cameraTargetLook = new THREE.Vector3();
  public isCinematicMode = false;
  private cinematicTime = 0;
  public isAutoCycleTime = false;
  private autoCycleTimer = 0;

  // Input states
  public keysPressed: Record<string, boolean> = {};
  public joystickVector = { x: 0, y: 0 };
  public isDragging = false;
  public previousPointerPos = { x: 0, y: 0 };

  private isRunning = false;
  private bobT = 0;
  private lastTime = 0;
  private animFrameId: number | null = null;

  // Pre-allocated math objects to avoid GC in render loop (Three.js skill mandate)
  private readonly _vec3 = new THREE.Vector3();
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();

  constructor(container: HTMLElement, callbacks: SceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Create Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xd6e5eb, 0.015);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 1200);
    this.camera.position.set(0, 2.2, 34);
    this.fadeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false })
    );
    this.fadeMesh.position.z = -0.3;
    this.fadeMesh.renderOrder = 9999;
    this.fadeMesh.frustumCulled = false;
    this.camera.add(this.fadeMesh);
    this.scene.add(this.camera);

    // 3. Renderer with Three.js studio color pipeline
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 4. Mandatory Studio Environment Reflection (RoomEnvironment)
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 5. Lighting Setup
    this.hemiLight = new THREE.HemisphereLight(0xfff6ea, 0x829ca8, 0.7);
    this.scene.add(this.hemiLight);

    this.ambientFill = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(this.ambientFill);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    this.sunLight.position.set(30, 45, 25);
    this.sunLight.castShadow = !isHeadless;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 160;
    const d = 45;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // 6. Textures & Builder
    this.textures = createProceduralTextures();

    // 7. Build Environment & Architecture
    this.buildWorld();
    if (import.meta.env.DEV) (window as unknown as { __scene: TempleScene }).__scene = this;

    // 8. Event Listeners
    this.bindEvents();

    // Start loop
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  /**
   * Constructs the authentic 3D environment for the selected shrine
   */
  private buildWorld() {
    const layout = phuVanThuy;
    const m = createKitMaterials(this.textures);
    const arch = new Architecture(m);
    const nat = new Nature(m);
    const vk = new VietKit(arch, m);
    this.nature = nat;
    this.kitForEncounters = { arch, nat, m, vk };
    const self = this;
    const ctx: LayoutCtx = {
      scene: this.scene,
      arch,
      nat,
      m,
      vk,
      get ground() {
        return self.ground;
      },
      setGround: (fn) => (this.ground = fn),
      add: (o, x = 0, z = 0, rotY = 0, y = 0) => {
        o.position.set(x, this.ground(x, z) + y, z);
        o.rotation.y = rotY;
        o.traverse((c) => {
          const mesh = c as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        this.scene.add(o);
        return o;
      },
      terrain: (color, size = 360, seg = 150) => {
        const geo = new THREE.PlaneGeometry(size, size, seg, seg);
        geo.rotateX(-Math.PI / 2);
        const p = geo.attributes.position;
        const cols = new Float32Array(p.count * 3);
        const base = new THREE.Color(color);
        const tmp = new THREE.Color();
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i), z = p.getZ(i);
          p.setY(i, this.ground(x, z) - 0.02);
          const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
          const n = (h - Math.floor(h) - 0.5) * 0.07;
          tmp.copy(base).offsetHSL(0, 0, n);
          cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
      },
      water: (y, w, d, x = 0, z = 0, color) => {
        const mat = m.water.clone();
        if (color !== undefined) mat.color.set(color);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
      },
      path: (pts, w, kind, lift = 0.05) => {
        const pos: number[] = [];
        const uv: number[] = [];
        const idx: number[] = [];
        let dist = 0;
        const samples: [number, number][] = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
          const L = Math.hypot(bx - ax, bz - az);
          const n = Math.max(1, Math.ceil(L / 1.0));
          for (let k = 0; k < n; k++) samples.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
        }
        samples.push(pts[pts.length - 1]);
        samples.forEach(([x, z], i) => {
          const [px, pz] = samples[Math.max(0, i - 1)], [nx, nz] = samples[Math.min(samples.length - 1, i + 1)];
          let dx = nx - px, dz = nz - pz;
          const l = Math.hypot(dx, dz) || 1;
          dx /= l; dz /= l;
          const ox = -dz * (w / 2), oz = dx * (w / 2);
          if (i > 0) dist += Math.hypot(x - samples[i - 1][0], z - samples[i - 1][1]);
          pos.push(x + ox, this.ground(x + ox, z + oz) + lift, z + oz, x - ox, this.ground(x - ox, z - oz) + lift, z - oz);
          uv.push(0, dist / w, 1, dist / w);
          if (i > 0) {
            const a = (i - 1) * 2;
            idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
          }
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        const mat =
          kind === 'gravel' ? m.gravel : kind === 'paving' ? m.paving : kind === 'wood' ? m.wood.darkWood
          : new THREE.MeshStandardMaterial({ color: 0x8a7558, roughness: 1 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        return mesh;
      },
    };
    const res: LayoutResult = layout(ctx);
    this.applyLayout(res);
  }

  /** Apply what a layout returned: spawn, bounds, spot anchors, ambience */
  private applyLayout(res: LayoutResult) {
    this.encounterDefs = res.encounters ?? [];
    this.secrets = res.secrets ?? [];
    this.etiquette = res.etiquette ?? {};
    this.nightObjects = res.nightObjects ?? [];
    this.onTime = res.onTime ?? null;
    this.walkable = res.walkable ?? null;
    this.bounds = res.bounds;
    this.fogMul = res.fog ?? 1;
    this.particleKind = res.particles ?? 'none';
    if (res.orbit) this.orbit = { y: 9, ...res.orbit };
    if (res.smoke) {
      this.smokeOrigin.set(res.smoke[0], res.smoke[1], res.smoke[2]);
      this.createIncenseSmoke(res.smoke[0], res.smoke[1], res.smoke[2]);
    }
    if (res.bobbingWater) {
      this.waterPlane = res.bobbingWater;
      this.waterBaseY = res.bobbingWater.position.y;
    }
    this.spots = res.spots;
    this.bellObj = this.scene.getObjectByName('bell') ?? null;
    this.createParticles(this.particleKind);
    this.playerPosition.set(res.spawn.x, 1.7 + this.ground(res.spawn.x, res.spawn.z), res.spawn.z);
    this.playerRotationY = res.spawn.rotY;
    this.setTimeOfDay('twilight');
  }

  private createParticles(kind: ParticleKind) {
    if (kind === 'none') return;
    const look: Record<Exclude<ParticleKind, 'none'>, { color: number; size: number; count: number; fall: number }> = {
      leaves: { color: 0xb8a24a, size: 0.16, count: 110, fall: 0.6 },
      petals: { color: 0xf2a6bc, size: 0.26, count: 260, fall: 0.45 },
      fireflies: { color: 0xd9ff8a, size: 0.16, count: 140, fall: 0.05 },
    };
    const cfg = look[kind];
    const petalCount = cfg.count;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(petalCount * 3);
    const velocities = new Float32Array(petalCount * 3);

    for (let i = 0; i < petalCount; i++) {
      positions[i * 3] = this.playerPosition.x + (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = this.playerPosition.y + Math.random() * 18 - 1;
      positions[i * 3 + 2] = this.playerPosition.z + (Math.random() - 0.5) * 60;

      velocities[i * 3] = Math.sin(i) * 0.4 + 0.2; // drift x
      velocities[i * 3 + 1] = -(cfg.fall * (0.8 + Math.random() * 0.8)); // fall y
      velocities[i * 3 + 2] = Math.cos(i) * 0.3; // drift z
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const mat = new THREE.PointsMaterial({
      color: cfg.color,
      size: cfg.size,
      transparent: true,
      opacity: 0.85,
    });

    this.petalParticles = new THREE.Points(geom, mat);
    this.scene.add(this.petalParticles);
  }

  /**
   * Billowing Incense Smoke Particles for Jokoro
   */
  private createIncenseSmoke(x: number, y: number, z: number) {
    const smokeCount = 120;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(smokeCount * 3);

    for (let i = 0; i < smokeCount; i++) {
      positions[i * 3] = x + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = y + Math.random() * 2.8;
      positions[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xdddddf,
      size: 0.35,
      transparent: true,
      opacity: 0.45,
    });

    this.smokeParticles = new THREE.Points(geom, mat);
    this.scene.add(this.smokeParticles);
  }

  /**
   * Time of Day Lighting Transitions
   */
  public setTimeOfDay(time: TimeOfDay) {
    this.timeOfDay = time;
    this.nightObjects.forEach((o) => (o.visible = time === 'night'));
    this.onTime?.(time);
    if (this.enc && this.enc.rt) return; // keep the secret world's own light until you return

    if (time === 'day') {
      this.scene.background = new THREE.Color(0xbfe0f0);
      (this.scene.fog as THREE.FogExp2).color.set(0xbfe0f0);
      (this.scene.fog as THREE.FogExp2).density = 0.012 * this.fogMul;

      this.sunLight.color.set(0xfffaed);
      this.sunLight.intensity = 2.0;
      this.sunOffset.set(30, 45, 25);

      this.hemiLight.color.set(0xfff6ea);
      this.hemiLight.groundColor.set(0x829ca8);
      this.hemiLight.intensity = 0.7;

      this.ambientFill.intensity = 0.25;

      // Dim stone lanterns
      this.dynamicLights.forEach((l) => (l.intensity = 0.3));
    } else if (time === 'twilight') {
      this.scene.background = new THREE.Color(0xe8b089);
      (this.scene.fog as THREE.FogExp2).color.set(0xe3b494);
      (this.scene.fog as THREE.FogExp2).density = 0.016 * this.fogMul;

      this.sunLight.color.set(0xff7733);
      this.sunLight.intensity = 1.4;
      this.sunOffset.set(45, 16, 20);

      this.hemiLight.color.set(0xffaa77);
      this.hemiLight.groundColor.set(0x553344);
      this.hemiLight.intensity = 0.55;

      this.ambientFill.intensity = 0.15;

      // Warm glowing lanterns
      this.dynamicLights.forEach((l) => (l.intensity = 1.5));
    } else {
      // Night (Yozora)
      this.scene.background = new THREE.Color(0x0c1220);
      (this.scene.fog as THREE.FogExp2).color.set(0x0c1220);
      (this.scene.fog as THREE.FogExp2).density = 0.018 * this.fogMul;

      this.sunLight.color.set(0x6688cc); // Moon light
      this.sunLight.intensity = 0.45;
      this.sunOffset.set(-25, 40, -15);

      this.hemiLight.color.set(0x223355);
      this.hemiLight.groundColor.set(0x080c14);
      this.hemiLight.intensity = 0.3;

      this.ambientFill.intensity = 0.08;

      // Brilliant warm glowing lanterns in the dark
      this.dynamicLights.forEach((l) => (l.intensity = 2.4));
    }
  }

  /**
   * Teleport smoothly to one of the key spots (Torii, Temizuya, Haiden, Ema, etc.)
   */
  public teleportToSpot(spotId: string) {
    if (this.enc) this.abortEncounter();
    this.blindwalk = null;
    const spot = this.spots.find((s) => s.id === spotId);
    if (!spot) return;
    this.playerPosition.set(spot.at[0], 1.7 + this.ground(spot.at[0], spot.at[1]), spot.at[1]);
    const dx = spot.look[0] - spot.at[0];
    const dz = spot.look[1] - spot.at[1];
    this.playerRotationY = Math.atan2(dx, dz) + Math.PI;
    this.playerPitch = 0;
  }

  /** Strike the great bell in the bell tower: it swings, and the sound carries */
  public ringBell() {
    soundService.playGreatBell();
    const bell = this.bellObj;
    if (!bell) return;
    let t = 0;
    const id = setInterval(() => {
      t += 0.05;
      bell.rotation.z = Math.sin(t * 6) * 0.12 * Math.max(0, 1 - t / 3);
      if (t >= 3) {
        clearInterval(id);
        bell.rotation.z = 0;
      }
    }, 30);
  }

  /** Enter a realm or ceremony directly (from the bell, the altar…) */
  public enterRealm(id: string) {
    const def = this.encounterDefs.find((e) => e.id === id);
    if (def && !this.enc) this.startEncounter(def);
  }

  public get spotList() {
    return this.spots;
  }

  public get inRealm() {
    return !!this.enc;
  }

  /**
   * Input binding
   */
  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onWindowResize);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    document.addEventListener('pointerlockchange', this.lockListener);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = true;
    if (e.code === 'KeyB' && !e.repeat) this.bow();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = false;
  };

  /* ---------------- PC controls ---------------- */
  /** mouse-look settings, changed from the settings panel */
  public look = { sensitivity: 1, invertY: false, pointerLock: true };
  /** called when pointer lock starts or ends, so the UI can show the crosshair */
  public onPointerLockChange: ((locked: boolean) => void) | null = null;
  private lockListener = () => this.onPointerLockChange?.(document.pointerLockElement === this.renderer.domElement);

  public get pointerLocked() {
    return document.pointerLockElement === this.renderer.domElement;
  }
  public releasePointer() {
    if (this.pointerLocked) document.exitPointerLock?.();
  }

  private turn(dx: number, dy: number, scale: number) {
    const k = scale * this.look.sensitivity;
    this.playerRotationY -= dx * k;
    this.playerPitch -= dy * k * (this.look.invertY ? -1 : 1);
    this.playerPitch = Math.max(-Math.PI / 2.4, Math.min(Math.PI / 2.4, this.playerPitch));
  }

  private onPointerDown = (e: PointerEvent) => {
    // PC: a click on the view captures the mouse for free looking (Esc releases it)
    if (e.pointerType === 'mouse' && this.look.pointerLock && !this.pointerLocked && e.button === 0) {
      try {
        const r = this.renderer.domElement.requestPointerLock?.() as unknown as Promise<void> | undefined;
        r?.catch?.(() => {});
      } catch {
        /* not allowed here: fall back to dragging */
      }
    }
    this.isDragging = true;
    this.previousPointerPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.pointerLocked) {
      this.turn(e.movementX, e.movementY, 0.0022);
      return;
    }
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.previousPointerPos.x;
    const deltaY = e.clientY - this.previousPointerPos.y;
    this.previousPointerPos = { x: e.clientX, y: e.clientY };
    this.turn(deltaX, deltaY, 0.0035);
  };

  /** graphics quality: high has shadows and a sharper image */
  public setQuality(q: 'high' | 'low') {
    const headless = navigator.webdriver;
    this.renderer.shadowMap.enabled = q === 'high' && !headless;
    this.sunLight.castShadow = q === 'high' && !headless;
    this.renderer.setPixelRatio(headless ? 1 : q === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (m) (Array.isArray(m) ? m : [m]).forEach((mm) => (mm.needsUpdate = true));
    });
    this.onWindowResize();
  }
  public setFov(fov: number) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  /* ---------------- floating lanterns (thả đèn hoa đăng) ---------------- */
  private lanterns: { g: THREE.Group; vx: number; vz: number; light?: THREE.PointLight; t0: number }[] = [];
  /** Set a lotus lantern on the river; it drifts away with the current */
  public floatLantern(color: number) {
    const g = new THREE.Group();
    const petal = new THREE.MeshStandardMaterial({ color, roughness: 0.6, emissive: color, emissiveIntensity: 0.25, side: THREE.DoubleSide });
    for (let ring = 0; ring < 2; ring++)
      for (let k = 0; k < 8; k++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), petal);
        const a = (k / 8) * Math.PI * 2 + ring * 0.4;
        const r = ring ? 0.13 : 0.22;
        p.scale.set(0.55, 1.25, 0.3);
        p.position.set(Math.cos(a) * r, 0.12 + ring * 0.06, Math.sin(a) * r);
        p.lookAt(Math.cos(a) * 2, 1.4, Math.sin(a) * 2);
        g.add(p);
      }
    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), new THREE.MeshStandardMaterial({ color: 0x4f8a3e, side: THREE.DoubleSide }));
    leaf.rotation.x = -Math.PI / 2;
    g.add(leaf);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xfff2d0 }));
    candle.position.y = 0.12;
    g.add(candle);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 6), new THREE.MeshBasicMaterial({ color: 0xffc35a }));
    flame.position.y = 0.23;
    g.add(flame);
    g.position.set((Math.random() - 0.5) * 2, -0.3, 67);
    this.scene.add(g);
    let light: THREE.PointLight | undefined;
    if (this.lanterns.filter((l) => l.light).length < 5) {
      light = new THREE.PointLight(0xffb45a, 3, 7, 2);
      light.position.y = 0.4;
      g.add(light);
    }
    this.lanterns.push({ g, vx: (Math.random() - 0.5) * 0.25, vz: 0.35 + Math.random() * 0.2, light, t0: this.elapsed });
    if (this.lanterns.length > 24) {
      const old = this.lanterns.shift()!;
      this.scene.remove(old.g);
    }
  }
  private updateLanterns(dt: number) {
    for (const l of this.lanterns) {
      const age = this.elapsed - l.t0;
      l.g.position.x += (l.vx + Math.sin(age * 0.4) * 0.08) * dt;
      l.g.position.z += l.vz * dt;
      l.g.position.y = -0.3 + Math.sin(age * 1.6) * 0.025;
      l.g.rotation.y += dt * 0.15;
    }
  }

  private onPointerUp = () => {
    this.isDragging = false;
  };

  private onWindowResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Render tick
   */
  private animate = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.elapsed += delta;
    this.updateFade(delta);
    this.updatePlayerMovement(delta);
    this.updateEncounter(delta);
    this.updateManners(delta);
    this.updateParticles(delta);
    this.updateLanterns(delta);
    if (this.nature) {
      const t = now / 1000;
      this.nature.animated.forEach((a) => a.update(t));
    }
    // keep the shadow-casting sun centred on the visitor, so big sites still get shadows
    this.sunLight.target.position.copy(this.playerPosition);
    this.sunLight.position.copy(this.playerPosition).add(this.sunOffset);
    this.updateLightingCycle(delta);
    this.checkNearbySpots();

    this.renderer.render(this.scene, this.camera);
    this.animFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Update Player Movement & Camera Position
   */
  private updatePlayerMovement(delta: number) {
    if (this.isCinematicMode && !this.enc) {
      // Cinematic auto-tour orbit
      this.cinematicTime += delta * 0.25;
      const o = this.orbit;
      const cx = o.x + Math.sin(this.cinematicTime) * o.r;
      const cz = o.z + Math.cos(this.cinematicTime) * o.r;
      const gy = this.ground(o.x, o.z);
      const cy = gy + o.y + Math.sin(this.cinematicTime * 2) * 2.5;

      this.camera.position.set(cx, cy, cz);
      this.camera.lookAt(o.x, gy + 3, o.z);
      return;
    }

    const prevX = this.playerPosition.x;
    const prevZ = this.playerPosition.z;

    // Direction vectors
    const running = !!(this.keysPressed['ShiftLeft'] || this.keysPressed['ShiftRight']);
    const frozen = !!this.fade || (this.enc !== null && (this.enc.ending || !this.enc.rt));
    const swim = this.enc?.rt?.underwater ? 0.65 : 1;
    const moveSpeed = frozen ? 0 : (running ? 9.0 : 4.5) * swim * delta;

    this._forward.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerRotationY);
    this._right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerRotationY);

    let moved = false;

    // Keyboard controls (WASD & Arrows)
    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) {
      this.playerPosition.addScaledVector(this._forward, moveSpeed);
      moved = true;
    }
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) {
      this.playerPosition.addScaledVector(this._forward, -moveSpeed);
      moved = true;
    }
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) {
      this.playerPosition.addScaledVector(this._right, -moveSpeed);
      moved = true;
    }
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) {
      this.playerPosition.addScaledVector(this._right, moveSpeed);
      moved = true;
    }

    // Touch joystick
    if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
      this.playerPosition.addScaledVector(this._forward, -this.joystickVector.y * moveSpeed);
      this.playerPosition.addScaledVector(this._right, this.joystickVector.x * moveSpeed);
      moved = true;
    }

    // Play footstep sound periodically
    if (moved && Math.random() < 0.08 && !this.enc?.rt?.underwater) {
      soundService.playFootstep();
    }
    this.manners.runT = moved && running ? this.manners.runT + delta : 0;

    // Stepping somewhere special: a secret world, or somewhere you shouldn't go
    if (moved && !this.enc) {
      const px = this.playerPosition.x, pz = this.playerPosition.z;
      const hit = this.encCooldown <= 0 ? this.encounterDefs.find((e) => e.zone(px, pz)) : undefined;
      const ok = hit ? this.callbacks.canEnter?.(hit.id) ?? true : true;
      if (hit && ok !== true) {
        this.playerPosition.x = prevX;
        this.playerPosition.z = prevZ;
        if (this.lockedCool <= 0) {
          this.lockedCool = 6;
          this.callbacks.onCaption?.(ok, 5);
        }
      } else if (hit) {
        this.playerPosition.x = prevX;
        this.playerPosition.z = prevZ;
        this.startEncounter(hit);
      } else {
        const bad = this.etiquette.forbidden?.find((f) => f.test(px, pz));
        if (bad) {
          this.playerPosition.x = prevX;
          this.playerPosition.z = prevZ;
          if (this.manners.forbidCool <= 0) {
            this.manners.forbidCool = 6;
            this.callbacks.onCaption?.(bad.reason, 4);
            if (this.manners.forbidCount < 3) {
              this.manners.forbidCount++;
              this.callbacks.onLuck?.(-(bad.penalty ?? 3), bad.reason, 'forbidden');
            }
          }
        }
      }
    }

    // Constrain player within the site, and off water / out of ponds
    const b = this.bounds;
    this.playerPosition.x = Math.max(b.x0, Math.min(b.x1, this.playerPosition.x));
    this.playerPosition.z = Math.max(b.z0, Math.min(b.z1, this.playerPosition.z));
    if (this.walkable && !this.walkable(this.playerPosition.x, this.playerPosition.z)) {
      // try sliding along one axis before giving up
      if (this.walkable(this.playerPosition.x, prevZ)) this.playerPosition.z = prevZ;
      else if (this.walkable(prevX, this.playerPosition.z)) this.playerPosition.x = prevX;
      else {
        this.playerPosition.x = prevX;
        this.playerPosition.z = prevZ;
      }
    }
    // follow the ground (stairs, slopes, bridges) with a little smoothing
    const targetY = 1.7 + this.ground(this.playerPosition.x, this.playerPosition.z);
    this.playerPosition.y += (targetY - this.playerPosition.y) * Math.min(1, delta * 12);

    // Smooth camera update
    this.camera.position.copy(this.playerPosition);
    // a gentle head bob while walking
    this.bobT = moved ? this.bobT + delta * (running ? 13 : 9) : this.bobT * 0.9;
    if (moved) this.camera.position.y += Math.sin(this.bobT) * 0.035;
    if (this.enc?.rt?.underwater) this.camera.position.y += Math.sin(this.elapsed * 1.6) * 0.18;
    if (this.shakeT > 0) {
      this.shakeT -= delta;
      this.camera.position.x += (Math.random() - 0.5) * this.shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeAmt;
    }
    let pitch = this.playerPitch;
    if (this.bowAnim > 0) {
      this.bowAnim = Math.max(0, this.bowAnim - delta);
      pitch -= Math.sin(((1.6 - this.bowAnim) / 1.6) * Math.PI) * 0.75;
    }

    // Look target
    this._forward.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    this._forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerRotationY);

    this.cameraTargetLook.copy(this.playerPosition).add(this._forward);
    this.camera.lookAt(this.cameraTargetLook);
  }

  /**
   * Update dynamic particles (petals & smoke)
   */
  private updateParticles(delta: number) {
    // Sakura petals drifting
    if (this.petalParticles) {
      const posAttr = this.petalParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const velAttr = this.petalParticles.geometry.getAttribute('velocity') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const velocities = velAttr.array as Float32Array;

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * delta;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta;

        // Reset if hit ground or out of bounds
        if (positions[i * 3 + 1] < this.playerPosition.y - 2) {
          positions[i * 3 + 1] = this.playerPosition.y + 14 + Math.random() * 4;
          positions[i * 3] = this.playerPosition.x + (Math.random() - 0.5) * 50;
          positions[i * 3 + 2] = this.playerPosition.z + (Math.random() - 0.5) * 50;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Incense smoke rising
    if (this.smokeParticles) {
      const posAttr = this.smokeParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += delta * 0.9;
        positions[i * 3] += Math.sin(positions[i * 3 + 1] * 4 + i) * delta * 0.15;

        if (positions[i * 3 + 1] > this.smokeOrigin.y + 3.3) {
          positions[i * 3 + 1] = this.smokeOrigin.y;
          positions[i * 3] = this.smokeOrigin.x + (Math.random() - 0.5) * 0.4;
          positions[i * 3 + 2] = this.smokeOrigin.z + (Math.random() - 0.5) * 0.4;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Water ripple effect for Itsukushima
    if (this.waterPlane) {
      this.waterPlane.position.y = this.waterBaseY + Math.sin(performance.now() * 0.0018) * 0.04;
    }
  }

  /**
   * Dynamic Day / Sunset / Night Lighting Cycle
   */
  private updateLightingCycle(delta: number) {
    if (!this.isAutoCycleTime || this.enc) return;
    this.autoCycleTimer += delta * 0.07;
    const phase = (Math.sin(this.autoCycleTimer) + 1) / 2; // 0 to 1

    if (phase > 0.65) {
      if (this.timeOfDay !== 'day') this.setTimeOfDay('day');
    } else if (phase > 0.3) {
      if (this.timeOfDay !== 'twilight') this.setTimeOfDay('twilight');
    } else {
      if (this.timeOfDay !== 'night') this.setTimeOfDay('night');
    }
  }

  /**
   * Check proximity to sacred interactive spots
   */
  private checkNearbySpots() {
    if (this.enc) {
      this.callbacks.onNearSpot?.(null, null, null);
      return;
    }
    let nearestSpot: { id: string; name: string; type: string } | null = null;
    let minDist = 4.8; // Interaction trigger radius

    for (const spot of this.spots) {
      if (spot.type === 'view') continue;
      const dist = Math.hypot(this.playerPosition.x - spot.at[0], this.playerPosition.z - spot.at[1]);
      if (dist < (spot.r ?? minDist) && dist < minDist + 2) {
        minDist = dist;
        nearestSpot = { id: spot.id, name: spot.name, type: spot.type };
      }
    }

    if (this.callbacks.onNearSpot) {
      if (nearestSpot) {
        this.callbacks.onNearSpot(nearestSpot.id, nearestSpot.name, nearestSpot.type);
      } else {
        this.callbacks.onNearSpot(null, null, null);
      }
    }
  }

  /* ================================================================== */
  /* Fades                                                               */
  /* ================================================================== */
  private fadeTo(color: number, to: number, dur: number, then?: () => void) {
    const mat = this.fadeMesh.material as THREE.MeshBasicMaterial;
    mat.color.set(color);
    this.fade = { from: mat.opacity, to, dur: Math.max(0.01, dur), t: 0, then };
  }
  private updateFade(dt: number) {
    if (!this.fade) return;
    const f = this.fade;
    f.t += dt;
    const k = Math.min(1, f.t / f.dur);
    (this.fadeMesh.material as THREE.MeshBasicMaterial).opacity = f.from + (f.to - f.from) * k;
    if (k >= 1) {
      this.fade = null;
      f.then?.();
    }
  }

  /* ================================================================== */
  /* Secret worlds                                                       */
  /* ================================================================== */
  private startEncounter(def: EncounterDef) {
    if (!this.kitForEncounters) return;
    this.isCinematicMode = false;
    this.blindwalk = null;
    this.enc = {
      def,
      rt: null,
      root: null,
      t: 0,
      ending: false,
      saved: { ground: this.ground, walkable: this.walkable, bounds: this.bounds },
    };
    this.callbacks.onEncounter?.({ type: 'start', id: def.id, title: def.title });
    this.fadeTo(def.diveColor, 1, 0.7, () => {
      if (!this.enc) return;
      const root = new THREE.Group();
      root.position.y = POCKET_Y;
      this.scene.add(root);
      const rt = def.build({ root, ...this.kitForEncounters! });
      root.traverse((c) => {
        const mesh = c as THREE.Mesh;
        if (mesh.isMesh) mesh.receiveShadow = true;
      });
      this.enc.rt = rt;
      this.enc.root = root;
      this.ground = (x, z) => POCKET_Y + rt.ground(x, z);
      this.walkable = rt.walkable ?? null;
      this.bounds = rt.bounds;
      // the secret world's own light and air
      this.scene.background = new THREE.Color(rt.env.bg);
      const fog = this.scene.fog as THREE.FogExp2;
      fog.color.set(rt.env.fog);
      fog.density = rt.env.density;
      this.sunLight.intensity = rt.env.sun;
      this.sunLight.color.set(rt.env.sunColor ?? 0xffffff);
      this.hemiLight.intensity = rt.env.hemi;
      this.hemiLight.color.set(rt.env.fog);
      this.hemiLight.groundColor.set(rt.env.bg);
      this.ambientFill.intensity = rt.env.ambient;
      if (this.petalParticles) this.petalParticles.visible = false;
      if (rt.underwater) this.createBubbles();
      this.playerPosition.set(rt.enter.x, POCKET_Y + rt.ground(rt.enter.x, rt.enter.z) + 1.7, rt.enter.z);
      this.playerRotationY = rt.enter.rotY;
      this.playerPitch = 0;
      this.fadeTo(def.diveColor, 0, 1.0);
    });
  }

  private encounterApi(): EncounterApi {
    return {
      caption: (text, seconds) => this.callbacks.onEncounter?.({ type: 'caption', id: this.enc?.def.id ?? '', text, seconds }),
      flash: (color, peak = 0.85, seconds = 0.5) => {
        if (this.enc?.ending) return;
        this.fadeTo(color, peak, seconds * 0.3, () => {
          if (!this.enc?.ending) this.fadeTo(color, 0, seconds * 0.7);
        });
      },
      shake: (amount, seconds = 0.6) => {
        this.shakeAmt = amount;
        this.shakeT = seconds;
      },
      setEnv: (env) => {
        if (!this.enc?.rt) return;
        const e = { ...this.enc.rt.env, ...env };
        this.enc.rt.env = e;
        this.scene.background = new THREE.Color(e.bg);
        const fog = this.scene.fog as THREE.FogExp2;
        fog.color.set(e.fog);
        fog.density = e.density;
        this.sunLight.intensity = e.sun;
        this.sunLight.color.set(e.sunColor ?? 0xffffff);
        this.hemiLight.intensity = e.hemi;
        this.ambientFill.intensity = e.ambient;
      },
      end: (color, seconds = 1.4) => {
        if (!this.enc || this.enc.ending) return;
        this.enc.ending = true;
        this.fadeTo(color, 1, seconds, () => this.finishEncounter(color));
      },
    };
  }

  private updateEncounter(dt: number) {
    this.encCooldown = Math.max(0, this.encCooldown - dt);
    this.lockedCool = Math.max(0, this.lockedCool - dt);
    if (!this.enc || !this.enc.rt || this.enc.ending) return;
    this.enc.t += dt;
    this.enc.rt.update(
      this.enc.t,
      dt,
      { x: this.playerPosition.x, y: this.playerPosition.y - POCKET_Y, z: this.playerPosition.z, rotY: this.playerRotationY },
      this.encounterApi()
    );
    if (this.bubbles) {
      const pos = this.bubbles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const a = pos.array as Float32Array;
      for (let i = 0; i < a.length; i += 3) {
        a[i + 1] += dt * (0.8 + (i % 7) * 0.12);
        a[i] += Math.sin(this.elapsed * 2 + i) * dt * 0.1;
        if (a[i + 1] > this.playerPosition.y + 6) {
          a[i] = this.playerPosition.x + (Math.random() - 0.5) * 16;
          a[i + 1] = this.playerPosition.y - 2;
          a[i + 2] = this.playerPosition.z + (Math.random() - 0.5) * 16;
        }
      }
      pos.needsUpdate = true;
    }
  }

  private createBubbles() {
    const n = 160;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = this.playerPosition.x + (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = this.playerPosition.y + (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = this.playerPosition.z + (Math.random() - 0.5) * 16;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.bubbles = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdff6ff, size: 0.12, transparent: true, opacity: 0.7 }));
    this.scene.add(this.bubbles);
  }

  /** leave the secret world and put everything back */
  private restoreFromEncounter() {
    if (!this.enc) return;
    const { saved, root } = this.enc;
    if (root) {
      this.scene.remove(root);
      root.traverse((c) => {
        const mesh = c as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
        }
      });
    }
    if (this.bubbles) {
      this.scene.remove(this.bubbles);
      this.bubbles.geometry.dispose();
      this.bubbles = null;
    }
    this.ground = saved.ground;
    this.walkable = saved.walkable;
    this.bounds = saved.bounds;
    if (this.petalParticles) this.petalParticles.visible = true;
    this.enc = null;
    this.setTimeOfDay(this.timeOfDay);
  }

  private finishEncounter(color: number) {
    if (!this.enc) return;
    const def = this.enc.def;
    this.restoreFromEncounter();
    this.playerPosition.set(def.exit.x, 1.7 + this.ground(def.exit.x, def.exit.z), def.exit.z);
    this.playerRotationY = def.exit.rotY;
    this.playerPitch = 0;
    this.encCooldown = 4;
    this.fadeTo(color, 0, 1.2, () => this.callbacks.onEncounter?.({ type: 'end', id: def.id, card: def.card }));
  }

  /** Back / Esc during a hidden world: surface at the exit without finishing the legend */
  public leaveLegend() {
    if (!this.enc) return false;
    const def = this.enc.def;
    this.abortEncounter();
    this.playerPosition.set(def.exit.x, 1.7 + this.ground(def.exit.x, def.exit.z), def.exit.z);
    this.playerRotationY = def.exit.rotY;
    this.playerPitch = 0;
    this.encCooldown = 4;
    this.callbacks.onEncounter?.({ type: 'end', id: def.id });
    return true;
  }

  /** used when teleporting away mid-encounter */
  private abortEncounter() {
    this.fade = null;
    (this.fadeMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    this.restoreFromEncounter();
    this.encCooldown = 2;
  }

  /* ================================================================== */
  /* Bowing, secrets and manners                                         */
  /* ================================================================== */
  /** Bow (B key / Bow button). Greets the kami at the gate, and some secrets answer a bow. */
  public bow() {
    if (this.bowAnim > 0 || this.enc) return;
    this.bowAnim = 1.6;
    this.manners.lastBow = this.elapsed;
    const px = this.playerPosition.x, pz = this.playerPosition.z;
    const s = this.secrets.find((d) => d.trigger === 'bow' && Math.hypot(px - d.at[0], pz - d.at[1]) < (d.r ?? 3));
    if (s) {
      setTimeout(() => this.foundSecret(s), 900);
      return;
    }
    const gate = this.spots.find((sp) => sp.type === 'gate');
    if (gate && Math.hypot(px - gate.at[0], pz - gate.at[1]) < 8 && !this.manners.bowedAtGate) {
      this.manners.bowedAtGate = true;
      this.callbacks.onLuck?.(1, 'Vái at the tam quan before entering', 'bow-gate');
    }
  }

  private foundSecret(d: SecretDef) {
    if (this.secretsFound.has(d.id)) return;
    this.secretsFound.add(d.id);
    d.onFound?.();
    soundService.playBellChime();
    this.callbacks.onSecret?.(d.id, d.card, d.luck);
  }

  private updateManners(dt: number) {
    const M = this.manners;
    M.runCool = Math.max(0, M.runCool - dt);
    M.forbidCool = Math.max(0, M.forbidCool - dt);
    M.threshCool = Math.max(0, M.threshCool - dt);
    if (this.enc || this.isCinematicMode) return;
    const px = this.playerPosition.x, pz = this.playerPosition.z;

    // running in the courtyard or the halls
    if (this.etiquette.calm?.(px, pz) && M.runT > 1.5 && M.runCool <= 0) {
      M.runCool = 20;
      if (M.runCount < 2) {
        M.runCount++;
        this.callbacks.onLuck?.(-1, 'Walk calmly and quietly inside the temple grounds', 'run');
      }
    }

    // standing on a threshold (ngưỡng cửa): step over it, never on it
    const onThresh = this.etiquette.thresholds?.some((t) => t.test(px, pz));
    M.threshT = onThresh ? M.threshT + dt : 0;
    if (M.threshT > 1.2 && M.threshCool <= 0) {
      M.threshCool = 15;
      M.threshT = 0;
      if (M.threshCount < 2) {
        M.threshCount++;
        this.callbacks.onLuck?.(-1, 'Step over the threshold, never stand on it', 'threshold');
      }
    }

    // a gentle hint to vái at the gate
    const gate = this.spots.find((sp) => sp.type === 'gate');
    if (gate && !M.bowedAtGate && !M.gateHinted && Math.hypot(px - gate.at[0], pz - gate.at[1]) < 5) {
      M.gateHinted = true;
      this.callbacks.onCaption?.('Hands together, bow your head: vái before entering (press B or tap Vái)', 5);
    }

    // secrets
    for (const d of this.secrets) {
      if (this.secretsFound.has(d.id)) continue;
      const dist = Math.hypot(px - d.at[0], pz - d.at[1]);
      const r = d.r ?? 3;
      if (d.hint && dist < r * 2.2 && !this.secretHinted.has(d.id)) {
        this.secretHinted.add(d.id);
        this.callbacks.onCaption?.(d.hint, 5);
      }
      if (dist > r) {
        this.secretLinger[d.id] = 0;
        continue;
      }
      if (d.trigger === 'enter') this.foundSecret(d);
      else if (d.trigger === 'night' && this.timeOfDay === 'night') this.foundSecret(d);
      else if (d.trigger === 'linger') {
        this.secretLinger[d.id] = (this.secretLinger[d.id] ?? 0) + dt;
        if (this.secretLinger[d.id] > (d.seconds ?? 4)) this.foundSecret(d);
      } else if (d.trigger === 'blindwalk' && !this.blindwalk) {
        this.blindwalk = { def: d, t: 0 };
        this.fadeTo(0x000000, 0.94, 0.8);
        this.callbacks.onCaption?.('Eyes closed… walk to the other stone', 6);
      }
    }
    if (this.blindwalk) {
      const b = this.blindwalk;
      b.t += dt;
      const to = b.def.to!;
      if (Math.hypot(px - to[0], pz - to[1]) < 1.6) {
        this.blindwalk = null;
        this.fadeTo(0x000000, 0, 0.8);
        this.foundSecret(b.def);
      } else if (b.t > 25 || Math.hypot(px - b.def.at[0], pz - b.def.at[1]) > Math.hypot(to[0] - b.def.at[0], to[1] - b.def.at[1]) + 6) {
        this.blindwalk = null;
        this.fadeTo(0x000000, 0, 0.6);
        this.callbacks.onCaption?.('You open your eyes — not quite. Try again from the first stone.', 5);
      }
    }
  }

  /**
   * Cleanup
   */
  public dispose() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onWindowResize);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointerlockchange', this.lockListener);
    this.releasePointer();

    this.pmremGenerator.dispose();
    this.renderer.dispose();
    if (dom.parentElement) {
      dom.parentElement.removeChild(dom);
    }
  }
}
