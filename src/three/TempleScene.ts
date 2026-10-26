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
import { Firefly, Visitors, Arrival, Ceremony, Residents, type GiaLook } from './living';
import { Possession, type PossessEvent } from './possession';
import { PuppetShow, type PuppetEvent } from './puppets';
import { WeatherFx, SKY_LOOK } from './weatherFx';
import type { Season, Sky } from '../services/weather';
import { HallAtmosphere } from './atmosphere';
import { Hands, Rite, BowRite, IncenseRite, XamRite, type RiteHost } from './fpv';
import { WORLD } from './world/phuVanThuy';
import { buildFestivalDecor, heldStar, type FestivalDecor } from './festivalDecor';
import type { Decor } from '../services/lunar';

export type TimeOfDay = 'day' | 'twilight' | 'night';

/** eye height of a 170 cm visitor: the eyes sit about 10 cm below the top of the head */
const EYE = 1.6;

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
  /** the first frame has been drawn */
  onReady?: () => void;
  /** looking up into a Mother's face at night: 0 (nothing) .. 1 (deep trance) */
  onGaze?: (level: number) => void;
  /** the trance peaked: a vision */
  onVision?: () => void;
  /** a first-person rite: what to do next (null when it ends) */
  onRiteHint?: (text: string | null) => void;
  onRiteDone?: (r: { kind: string; n?: number }) => void;
  /** inside the medium: phases, lines that surface, prompts; and the first warning touch */
  onPossess?: (e: PossessEvent | { type: 'touch' }) => void;
  /** the water-puppet show: acts, Tễu's lines, the end */
  onPuppet?: (e: PuppetEvent) => void;
  /** a floating place marker was clicked */
  onSpotClick?: (spotId: string) => void;
  /** PC: the place marker under the crosshair changed */
  onAim?: (spotId: string | null) => void;
  /** the boat has reached the landing */
  onArrivalEnd?: () => void;
  /** the firefly reached the place it was showing */
  onGuideArrive?: () => void;
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
  public playerPosition = new THREE.Vector3(0, EYE, 30);
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
  private readySent = false;
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
    this.buildMarkers();
    if (!this.hands) this.hands = new Hands(this.camera);
    this.firefly = new Firefly(this.ground);
    this.firefly.onArrive = () => this.callbacks.onGuideArrive?.();
    this.firefly.attach(this.scene, this.playerPosition.clone().add(new THREE.Vector3(-1, 0, -1)));
    this.visitors = new Visitors(this.scene, this.ground);
    // a busier temple: every regular visitor comes every day, and the residents go about their work
    this.visitors.setCrowd(true);
    this.residents = new Residents(this.scene, this.ground, this.ground(0, -7));
    // the boat you came on waits at the landing, to take you home whenever you like
    this.arrival?.dispose();
    this.arrival = new Arrival(this.scene);
    this.arrival.moorNow();
    this.hall = new HallAtmosphere(this.scene, this.ground, {
      hallZ: WORLD.HALL.z,
      hallD: WORLD.HALL.d,
      frontZ: WORLD.HALL_FRONT,
      floorY: WORLD.FLOOR_Y,
      altarZ: WORLD.HALL.z - WORLD.HALL.d / 2 + 2.4,
    });
    this.hall.setMode(this.timeOfDay);
    this.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.receiveShadow = true;
    });
    this.bellObj = this.scene.getObjectByName('bell') ?? null;
    this.createParticles(this.particleKind);
    this.playerPosition.set(res.spawn.x, EYE + this.ground(res.spawn.x, res.spawn.z), res.spawn.z);
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
    this.hall?.setMode(time);
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
      // the physical temple falls asleep: black beyond the doors
      this.scene.background = new THREE.Color(0x030306);
      (this.scene.fog as THREE.FogExp2).color.set(0x030306);
      (this.scene.fog as THREE.FogExp2).density = 0.032 * this.fogMul;

      this.sunLight.color.set(0x5a6a9a); // a thin moon
      this.sunLight.intensity = 0.16;
      this.sunOffset.set(-25, 40, -15);

      this.hemiLight.color.set(0x1a1a2a);
      this.hemiLight.groundColor.set(0x050505);
      this.hemiLight.intensity = 0.1;

      this.ambientFill.intensity = 0.03;

      // only a few lanterns still burn outside
      this.dynamicLights.forEach((l) => (l.intensity = 0.9));
    }
    this.applyWeatherLook();
  }

  /* ---------------- weather and seasons (synced with the real sky) ---------------- */
  private _weather: WeatherFx | null = null;
  private get weather() {
    return (this._weather ??= new WeatherFx(this.scene));
  }
  private hemiBase = 0;
  /** set the sky over the temple and the season in its trees */
  public setWeather(sky: Sky, wind: number, season: Season) {
    const seasonChanged = season !== this.weather.season || !this.petalParticles;
    this.weather.set(sky, wind, season);
    if (seasonChanged && !this.enc) {
      // what drifts through the air: peach petals in spring, gold leaves in autumn
      if (this.petalParticles) {
        this.scene.remove(this.petalParticles);
        this.petalParticles = null;
      }
      this.particleKind = season === 'xuan' ? 'petals' : season === 'thu' ? 'leaves' : season === 'ha' ? 'none' : 'none';
      this.createParticles(this.particleKind);
    }
    soundService.setRain(sky === 'storm' ? 1 : sky === 'rain' ? 0.75 : sky === 'drizzle' ? 0.3 : 0);
    this.setTimeOfDay(this.timeOfDay);
  }
  private applyWeatherLook() {
    if (this.enc) return;
    const L = SKY_LOOK[this.weather.sky];
    const grey = new THREE.Color(this.timeOfDay === 'night' ? 0x0a0c10 : this.timeOfDay === 'twilight' ? 0x8a8288 : 0xa9b3b8);
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.lerp(grey, L.grey);
    fog.density *= L.fog * (this.weather.season === 'dong' ? 1.3 : 1);
    if (this.scene.background instanceof THREE.Color) this.scene.background.lerp(grey, L.grey);
    this.sunLight.intensity *= L.sun;
    if (this.timeOfDay === 'day') this.sunLight.color.set(this.weather.light);
    this.hemiLight.intensity *= 0.75 + 0.25 * L.sun;
    this.hemiBase = this.hemiLight.intensity;
  }
  public get weatherSky() {
    return this.weather.sky;
  }

  /**
   * Teleport smoothly to one of the key spots (Torii, Temizuya, Haiden, Ema, etc.)
   */
  public teleportToSpot(spotId: string) {
    if (this.enc) this.abortEncounter();
    this.blindwalk = null;
    const spot = this.spots.find((s) => s.id === spotId);
    if (!spot) return;
    this.playerPosition.set(spot.at[0], EYE + this.ground(spot.at[0], spot.at[1]), spot.at[1]);
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

  /** false while a panel is open: the visitor stands still and keys belong to the panel */
  private _input = true;
  public set inputEnabled(v: boolean) {
    this._input = v;
    if (!v) this.keysPressed = {};
  }
  public get inputEnabled() {
    return this._input;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // typing in a text box (the keeper's chat, a petition) never moves or acts in the world
    const tgt = e.target as HTMLElement | null;
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.tagName === 'SELECT' || tgt.isContentEditable)) return;
    if (this.puppets) {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        this.puppets.clap();
      } else if (e.code === 'KeyS' && !e.repeat) this.puppets.skip();
      return;
    }
    if (this.possession) {
      if (e.code === 'Escape') this.possession.skip();
      else if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        e.preventDefault();
        this.possession.press(true);
      }
      return;
    }
    if (this.rite && !this.rite.finished) {
      if (e.repeat) return;
      if (e.code === 'Space' || (e.code === 'Enter' && !(this.rite instanceof IncenseRite))) {
        e.preventDefault();
        this.rite.press(true);
      } else this.rite.key(e.key);
      return;
    }
    if (this.arriving && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      this.skipArrival();
      return;
    }
    if (!this._input) return;
    if (e.code.startsWith('Arrow')) e.preventDefault();
    this.keysPressed[e.code] = true;
    if (e.code === 'KeyB' && !e.repeat) this.bow();
    if (e.code === 'KeyR' && !e.repeat && this.aboutFace <= 0) this.aboutFace = Math.PI;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = false;
    if (this.possession && (e.code === 'Space' || e.code === 'Enter')) this.possession.press(false);
    if (this.rite && (e.code === 'Space' || e.code === 'Enter')) this.rite.press(false);
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
    if (this.rite) return;
    const k = scale * this.look.sensitivity;
    this.playerRotationY -= dx * k;
    this.playerPitch -= dy * k * (this.look.invertY ? -1 : 1);
    this.playerPitch = Math.max(-Math.PI / 2.4, Math.min(Math.PI / 2.4, this.playerPitch));
  }

  private _raycaster = new THREE.Raycaster();
  private _ndc = new THREE.Vector2();
  private _downAt = { x: 0, y: 0, t: 0 };
  /** which floating place marker is at this screen point (or the crosshair when the mouse is captured) */
  private pickMarker(clientX?: number, clientY?: number): string | null {
    if (this.enc) return null;
    const vis = this.markers.filter((m) => m.g.visible);
    if (!vis.length) return null;
    if (clientX === undefined || clientY === undefined) this._ndc.set(0, 0);
    else {
      const r = this.renderer.domElement.getBoundingClientRect();
      this._ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    }
    this._raycaster.setFromCamera(this._ndc, this.camera);
    const hits = this._raycaster.intersectObjects(vis.map((m) => m.g), true);
    if (!hits.length) return null;
    const m = vis.find((x) => x.g === hits[0].object.parent);
    return m?.spot.id ?? null;
  }
  private aimed: string | null = null;
  private aimT = 0;
  private updateAim(dt: number) {
    this.aimT += dt;
    if (this.aimT < 0.12) return;
    this.aimT = 0;
    const id = this.pointerLocked ? this.pickMarker() : null;
    if (id !== this.aimed) {
      this.aimed = id;
      this.callbacks.onAim?.(id);
    }
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.puppets) {
      this.puppets.clap();
      return;
    }
    if (this.possession) {
      this.possession.press(true);
      this.isDragging = true;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };
      return;
    }
    // touching the medium during a hầu đồng
    if (e.button === 0 && this.touchMedium(this.pointerLocked ? undefined : e.clientX, this.pointerLocked ? undefined : e.clientY)) return;
    if (this.rite && !this.rite.finished) {
      this.rite.press(true);
      this.isDragging = true;
      this.previousPointerPos = { x: e.clientX, y: e.clientY };
      return;
    }
    this._downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    // clicking a floating place marker goes there instead of capturing the mouse
    if (!this.pointerLocked && e.button === 0) {
      const id = this.pickMarker(e.clientX, e.clientY);
      if (id) {
        this.callbacks.onSpotClick?.(id);
        return;
      }
    }
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
    if (this.possession) {
      if (this.pointerLocked) this.possession.look(e.movementX, e.movementY);
      else if (this.isDragging) {
        this.possession.look(e.clientX - this.previousPointerPos.x, e.clientY - this.previousPointerPos.y);
        this.previousPointerPos = { x: e.clientX, y: e.clientY };
      }
      return;
    }
    if (this.rite && this.isDragging) this.rite.drag(e.movementX || e.clientX - this.previousPointerPos.x);
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

  private onPointerUp = (e: PointerEvent) => {
    this.isDragging = false;
    if (this.possession) {
      this.possession.press(false);
      return;
    }
    if (this.rite) {
      this.rite.press(false);
      return;
    }
    // mouse captured: a click picks whatever marker is under the crosshair
    if (this.pointerLocked && e.button === 0 && performance.now() - this._downAt.t < 350) {
      const id = this.pickMarker();
      if (id) this.callbacks.onSpotClick?.(id);
    }
  };

  /** a short dip to black, then arrive at the place */
  public travelToSpot(spotId: string, then?: () => void) {
    this.fadeTo(0x000000, 1, 0.25, () => {
      this.teleportToSpot(spotId);
      this.fadeTo(0x000000, 0, 0.35);
      then?.();
    });
  }

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
    this.updateShimmer();
    this.updateMarkers();
    this.updateLiving(delta);
    if (this.nature) {
      const t = now / 1000;
      this.nature.animated.forEach((a) => a.update(t));
    }
    // keep the shadow-casting sun centred on the visitor, so big sites still get shadows
    this.sunLight.target.position.copy(this.playerPosition);
    this.sunLight.position.copy(this.playerPosition).add(this.sunOffset);
    this.updateLightingCycle(delta);
    // rain stops under the hall roof and in the hidden worlds
    const sheltered = !!this.enc || this.ground(this.playerPosition.x, this.playerPosition.z) > 0.9;
    if (this.weather.update(delta, this.camera.position, sheltered)) {
      window.setTimeout(() => soundService.playThunder(), 400 + Math.random() * 1600);
    }
    if (this.hemiBase) this.hemiLight.intensity = this.hemiBase + this.weather.flash * 2.2;
    this.checkNearbySpots();
    this.updateAim(delta);

    this.renderer.render(this.scene, this.camera);
    if (!this.readySent) {
      this.readySent = true;
      this.callbacks.onReady?.();
    }
    this.animFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Update Player Movement & Camera Position
   */
  private updatePlayerMovement(delta: number) {
    if (this.departing && this.arrival) {
      // into the boat, sit, and away down the river as the light goes
      const d = this.departing;
      d.t += delta;
      const seat = this.arrival.seatWorld();
      if (d.t < 1.6) {
        const k = THREE.MathUtils.smoothstep(d.t, 0, 1.6);
        this.camera.position.lerpVectors(d.from, seat, k);
        if (d.t > 0.5 && !d.sat) {
          d.sat = true;
          soundService.playFootstep();
        }
      } else {
        this.arrival.depart(delta, Math.min(1, (d.t - 1.6) / 4));
        this.camera.position.copy(this.arrival.seatWorld());
        if (d.t > 3.2 && !d.faded) {
          d.faded = true;
          soundService.playPaddle();
          this.fadeTo(0x000000, 1, 2.2, () => {
            const gone = d.onGone;
            this.departing = null;
            gone();
          });
        }
      }
      // look back at the temple as you go
      const look = new THREE.Vector3(0, 4, 40);
      this.camera.lookAt(look);
      return;
    }
    if (this.puppets && this.puppetSeat) {
      // on the bank of the pond, watching the stage
      const w = this.puppetSeat;
      w.t = Math.min(1, w.t + delta * 0.7);
      const e = w.t * w.t * (3 - 2 * w.t);
      this.camera.position.lerpVectors(w.from, w.to, e);
      this._proj.lerpVectors(w.fromLook, w.look, e);
      this.camera.lookAt(this._proj);
      this.puppets.update(delta);
      return;
    }
    if (this.possession) {
      if (!this.possession.update(delta, this.elapsed)) this.wake();
      this.setRes(this.possession ? this.possession.res : 1);
      if (this.possession) {
        this.renderer.toneMappingExposure = this.possession.exposure;
        const f = this.scene.fog as THREE.FogExp2;
        f.color.copy(this.possession.fog.color);
        f.density = this.possession.fog.density;
      }
      return;
    }
    if (this.watching) {
      // seated at the side of the mat, eyes on the medium
      const w = this.watching;
      w.t = Math.min(1, w.t + delta * 0.6);
      const gy = this.ground(0.9, -7.4);
      const seat = new THREE.Vector3(0.9 + Math.sin(this.elapsed * 0.3) * 0.06, gy + 1.15, -7.4);
      this.camera.position.lerpVectors(w.from, seat, w.t * w.t * (3 - 2 * w.t));
      this.camera.lookAt(0, gy + 1.2, -11);
      return;
    }
    if (this.arrival && !this.arrival.done) {
      // seated in the boat, hands resting on your knees; you may glance around with the mouse
      this.arrival.update(delta, this.camera, this.playerRotationY, this.playerPitch);
      this.hands?.pose(this.arrival.stepping ? 'hidden' : 'veil');
      if (this.arrival.done) this.finishArrival();
      return;
    }
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
    const frozen = !!this.fade || !!this.rite || (this.enc !== null && (this.enc.ending || !this.enc.rt));
    const swim = this.enc?.rt?.underwater ? 0.65 : 1;
    // a calm temple walk (about 2 m/s), Shift for a brisk one; easing in and out, never jumpy
    const topSpeed = frozen ? 0 : (running ? 3.6 : 2.0) * swim;

    this._forward.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerRotationY);
    this._right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerRotationY);

    // Keyboard (WASD & arrows) and the touch joystick, combined so diagonals are no faster
    let fwd = 0, side = 0;
    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) fwd += 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) fwd -= 1;
    if (this.keysPressed['KeyA']) side -= 1;
    if (this.keysPressed['KeyD']) side += 1;
    fwd -= this.joystickVector.y;
    side += this.joystickVector.x;
    const mag = Math.hypot(fwd, side);
    if (mag > 1) {
      fwd /= mag;
      side /= mag;
    }
    // ← → turn on the spot (keyboard-only visitors), A D step sideways
    const turnRate = (running ? 3.0 : 2.3) * delta * (frozen ? 0 : 1);
    if (this.keysPressed['ArrowLeft']) this.playerRotationY += turnRate;
    if (this.keysPressed['ArrowRight']) this.playerRotationY -= turnRate;
    // R: turn right around, in one smooth half-circle
    if (this.aboutFace > 0 && !frozen) {
      const step = Math.min(this.aboutFace, delta * 4.2);
      this.playerRotationY += step;
      this.aboutFace -= step;
    }
    if (this.keysPressed['PageUp']) this.playerPitch = Math.min(Math.PI / 2.4, this.playerPitch + delta);
    if (this.keysPressed['PageDown']) this.playerPitch = Math.max(-Math.PI / 2.4, this.playerPitch - delta);

    const want = this._want.set(0, 0, 0).addScaledVector(this._forward, fwd * topSpeed).addScaledVector(this._right, side * topSpeed);
    const ease = 1 - Math.exp(-delta * (want.lengthSq() > 0 ? 7 : 10));
    this._vel.lerp(want, ease);
    if (frozen) this._vel.set(0, 0, 0);
    if (this._vel.lengthSq() < 1e-4) this._vel.set(0, 0, 0);
    this.playerPosition.addScaledVector(this._vel, delta);
    const moved = this._vel.lengthSq() > 0.04;

    // Play footstep sound periodically
    if (moved && Math.random() < 0.05 * (this._vel.length() / 2) && !this.enc?.rt?.underwater) {
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
    // walls and water take the momentum out of whichever way you were pushing
    if (delta > 0) {
      if (this.playerPosition.x === prevX) this._vel.x = 0;
      if (this.playerPosition.z === prevZ) this._vel.z = 0;
    }
    // follow the ground (stairs, slopes, bridges) with a little smoothing
    const targetY = EYE + this.ground(this.playerPosition.x, this.playerPosition.z);
    this.playerPosition.y += (targetY - this.playerPosition.y) * Math.min(1, delta * 12);

    // Smooth camera update
    this.camera.position.copy(this.playerPosition);
    // a gentle head bob while walking
    this.bobT = moved ? this.bobT + delta * (running ? 10 : 7.5) : this.bobT * 0.9;
    if (moved) this.camera.position.y += Math.sin(this.bobT) * 0.022 * Math.min(1, this._vel.length() / 2);
    if (this.enc?.rt?.underwater) this.camera.position.y += Math.sin(this.elapsed * 1.6) * 0.18;
    if (this.shakeT > 0) {
      this.shakeT -= delta;
      this.camera.position.x += (Math.random() - 0.5) * this.shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeAmt;
    }
    let pitch = this.playerPitch;
    if (this.bowAnim > 0) {
      this.bowAnim = Math.max(0, this.bowAnim - delta);
      pitch -= Math.sin(((this.bowDur - this.bowAnim) / this.bowDur) * Math.PI) * 0.75;
      this.camera.position.y -= Math.sin(((this.bowDur - this.bowAnim) / this.bowDur) * Math.PI) * 0.12;
    }
    // kneeling lowers the eye
    this.kneelCur += (this.kneelTarget - this.kneelCur) * Math.min(1, delta * 4);
    this.camera.position.y -= this.kneelCur;

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
      this.playerPosition.set(rt.enter.x, POCKET_Y + rt.ground(rt.enter.x, rt.enter.z) + EYE, rt.enter.z);
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
    this.playerPosition.set(def.exit.x, EYE + this.ground(def.exit.x, def.exit.z), def.exit.z);
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
    this.playerPosition.set(def.exit.x, EYE + this.ground(def.exit.x, def.exit.z), def.exit.z);
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
    if (this.bowAnim > 0 || this.enc || this.rite) return;
    this.startRite('bow');
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

  /* ---------------- first-person hands and rites ---------------- */
  private hands: Hands | null = null;
  private rite: Rite | null = null;
  private bowDur = 1.6;
  private kneelCur = 0;
  private kneelTarget = 0;
  private faceTarget: THREE.Vector3 | null = null;
  private planted: { g: THREE.Group; t: number }[] = [];
  private riteHost(): RiteHost {
    return {
      hands: this.hands!,
      bow: (sec = 1.6) => {
        this.bowDur = sec;
        this.bowAnim = sec;
      },
      face: (x, y, z) => (this.faceTarget = new THREE.Vector3(x, y, z)),
      kneel: (a) => (this.kneelTarget = a),
      plantIncense: (n) => this.plantIncense(n),
      sound: {
        mo: () => soundService.playMo(),
        chime: () => soundService.playBellChime(),
        rattle: () => soundService.playOmikujiShake(),
        burn: () => soundService.playPaperBurn(),
        clack: () => soundService.playCoinToss(),
      },
    };
  }
  /** begin a rite done with your own hands */
  public startRite(kind: 'bow' | 'pray' | 'incense' | 'xam', draw?: () => { n: number; verse: [string, string]; color: string }) {
    if (!this.hands || this.enc) return;
    this.rite?.cancel();
    this.releasePointer();
    const ev = {
      hint: (t: string | null) => this.callbacks.onRiteHint?.(t),
      done: (r: { kind: string; n?: number }) => this.callbacks.onRiteDone?.(r),
    };
    const host = this.riteHost();
    if (kind === 'bow') this.rite = new BowRite(host, ev, 1);
    else if (kind === 'pray') this.rite = new BowRite(host, ev, 3, 'Hands together before the Mothers. Three slow bows…');
    else if (kind === 'incense') this.rite = new IncenseRite(host, ev, new THREE.Vector3(0, this.ground(0, 14) + 1.5, 14));
    else if (kind === 'xam' && draw) this.rite = new XamRite(host, ev, new THREE.Vector3(8.8, this.ground(8.8, -9) + 0.9, -9), draw);
  }
  public cancelRite() {
    this.rite?.cancel();
    this.rite = null;
    this.faceTarget = null;
  }
  public get inRite() {
    return !!this.rite;
  }
  private plantIncense(n: number) {
    const g = new THREE.Group();
    const base = new THREE.Vector3(0, this.ground(0, 14) + 1.58, 14); // the ash in the bowl
    const stem = new THREE.MeshStandardMaterial({ color: 0xa8402e });
    const tip = new THREE.MeshBasicMaterial({ color: 0xff7a2a });
    for (let i = 0; i < n; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.45, 5), stem);
      const x = (i - (n - 1) / 2) * 0.05 + (Math.random() - 0.5) * 0.06;
      s.position.set(base.x + x, base.y + 0.22, base.z + (Math.random() - 0.5) * 0.08);
      s.rotation.z = (Math.random() - 0.5) * 0.12;
      g.add(s);
      const tp = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), tip);
      tp.position.set(s.position.x, base.y + 0.45, s.position.z);
      g.add(tp);
    }
    this.scene.add(g);
    this.planted.push({ g, t: 0 });
  }
  /* ---------------- conversations: speech bubbles over heads ---------------- */
  private talkTarget: THREE.Vector3 | null = null;
  private _proj = new THREE.Vector3();
  /** turn gently to face someone while talking (null to stop) */
  private talkObj: { o: THREE.Object3D; base: number } | null = null;
  private talkStep: THREE.Vector3 | null = null;
  private turning = new Set<THREE.Object3D>();
  public talkTo(name: string | null, headY = 1.45) {
    const o = name ? this.scene.getObjectByName(name) : null;
    // whoever you were talking to goes back to what they were doing
    if (this.talkObj && this.talkObj.o !== o) {
      this.talkObj.o.userData.turnTo = this.talkObj.base;
      this.turning.add(this.talkObj.o);
      this.talkObj = null;
    }
    if (!o) {
      this.talkTarget = null;
      return;
    }
    if (!this.talkObj) this.talkObj = { o, base: o.rotation.y };
    // step in to a comfortable talking distance, about an arm and a half away
    const op = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
    const away = new THREE.Vector3(this.playerPosition.x - op.x, 0, this.playerPosition.z - op.z);
    if (away.length() > 1.6) {
      away.setLength(1.35).add(op);
      if (!this.walkable || this.walkable(away.x, away.z)) this.talkStep = away;
    }
    o.userData.turnTo = o.rotation.y;
    this.turning.add(o);
    o.updateMatrixWorld(true);
    this.talkTarget = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).add(new THREE.Vector3(0, headY, 0));
  }
  /** where a named figure's head (plus some height) is on screen, in CSS pixels */
  public project(name: string, y = 1.8): { x: number; y: number; on: boolean } | null {
    const o = this.scene.getObjectByName(name);
    if (!o) return null;
    let shown = true;
    for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) shown = false;
    o.updateMatrixWorld(true);
    this._proj.setFromMatrixPosition(o.matrixWorld);
    this._proj.y += y;
    const behind = this._proj.clone().sub(this.camera.position).dot(this.camera.getWorldDirection(new THREE.Vector3())) < 0;
    this._proj.project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((this._proj.x + 1) / 2) * r.width, y: r.top + ((1 - this._proj.y) / 2) * r.height, on: shown && !behind && Math.abs(this._proj.x) < 1.05 && Math.abs(this._proj.y) < 1.05 };
  }

  private updateRite(dt: number) {
    this.hands?.update(dt);
    // a speaker turns to face you while you talk, and back afterwards
    this.turning.forEach((o) => {
      let want = o.userData.turnTo as number;
      if (this.talkObj?.o === o) want = Math.atan2(this.camera.position.x - o.position.x, this.camera.position.z - o.position.z);
      let d = want - o.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      o.rotation.y += d * Math.min(1, dt * 3);
      // and they look you in the eye: the head tilts up or down to meet yours
      const j = (o.userData as { j?: { head: THREE.Object3D } }).j;
      if (j) {
        let want = 0;
        if (this.talkObj?.o === o) {
          j.head.updateMatrixWorld(true);
          const hp = new THREE.Vector3().setFromMatrixPosition(j.head.matrixWorld);
          const dist = Math.hypot(this.camera.position.x - hp.x, this.camera.position.z - hp.z);
          want = -Math.max(-0.35, Math.min(0.5, Math.atan2(this.camera.position.y - hp.y - 0.1, dist)));
        }
        j.head.rotation.x += (want - j.head.rotation.x) * Math.min(1, dt * 4);
      }
      if (this.talkObj?.o !== o && Math.abs(d) < 0.01) this.turning.delete(o);
    });
    if (this.talkStep) {
      const k = Math.min(1, dt * 2.5);
      this.playerPosition.x += (this.talkStep.x - this.playerPosition.x) * k;
      this.playerPosition.z += (this.talkStep.z - this.playerPosition.z) * k;
      if (Math.hypot(this.talkStep.x - this.playerPosition.x, this.talkStep.z - this.playerPosition.z) < 0.03 || !this.talkTarget) this.talkStep = null;
    }
    if (this.talkTarget && !this.rite) {
      const d = this.talkTarget.clone().sub(this.camera.position);
      let dy = Math.atan2(-d.x, -d.z) - this.playerRotationY;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const k = Math.min(1, dt * 2.5);
      this.playerRotationY += dy * k;
      this.playerPitch += (Math.atan2(d.y, Math.hypot(d.x, d.z)) - 0.03 - this.playerPitch) * k;
    }
    if (this.faceTarget && this.rite) {
      const d = this.faceTarget.clone().sub(this.camera.position);
      const yaw = Math.atan2(-d.x, -d.z);
      const pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      let dy = yaw - this.playerRotationY;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const k = Math.min(1, dt * 3);
      this.playerRotationY += dy * k;
      this.playerPitch += (pitch - this.playerPitch) * k;
    }
    if (this.rite) {
      this.rite.update(dt, this.elapsed);
      if (this.rite.finished) {
        this.rite = null;
        this.faceTarget = null;
        this.kneelTarget = 0;
      }
    }
    this.planted = this.planted.filter((p) => {
      p.t += dt;
      if (p.t > 180) {
        this.scene.remove(p.g);
        return false;
      }
      return true;
    });
  }

  /* ---------------- the living temple ---------------- */
  private firefly: Firefly | null = null;
  private visitors: Visitors | null = null;
  private residents: Residents | null = null;
  private arrival: Arrival | null = null;
  private arrivalLook = new THREE.Vector3();
  private departing: { t: number; from: THREE.Vector3; onGone: () => void; sat?: boolean; faded?: boolean } | null = null;
  /** walk down to the landing and take the boat home: the visit ends on the water */
  public leaveByBoat(onGone: () => void) {
    if (!this.arrival || this.departing) return;
    this.cancelRite();
    this.releasePointer();
    this.hands?.pose('hidden');
    this.departing = { t: 0, from: this.camera.position.clone(), onGone };
  }
  public get arriving() {
    return !!this.arrival && !this.arrival.done;
  }
  /** open on a boat drifting up the river to the landing */
  public playArrival() {
    this.arrival?.dispose();
    this.arrival = new Arrival(this.scene);
    this.arrival.land.set(0, EYE + this.ground(0, 64), 64);
    this.arrival.onSplash = () => soundService.playPaddle();
    this.arrival.onStep = () => soundService.playFootstep();
    this.playerRotationY = 0;
    this.playerPitch = 0;
  }
  public skipArrival() {
    if (this.arriving) this.fadeTo(0x000000, 1, 0.3, () => this.finishArrival(true));
  }
  private finishArrival(fadeBack = false) {
    if (!this.arrival) return;
    this.arrival.done = true;
    this.hands?.pose('hidden');
    this.playerPosition.set(0, EYE + this.ground(0, 64), 64);
    this.playerRotationY = 0;
    this.playerPitch = 0;
    if (fadeBack) this.fadeTo(0x000000, 0, 0.6);
    this.callbacks.onArrivalEnd?.();
  }
  /* ---------------- the lunar calendar's days ---------------- */
  private festival: FestivalDecor | null = null;
  private star: THREE.Group | null = null;
  /** put up (or take down) the decorations for today's festival */
  public setFestival(kind: Decor | null, crowd = false) {
    if (this.festival) {
      this.scene.remove(this.festival.group);
      this.festival = null;
    }
    if (kind && kind !== 'quiet' && this.kitForEncounters) {
      this.festival = buildFestivalDecor(kind, this.kitForEncounters.vk, this.ground);
      this.scene.add(this.festival.group);
    }
    this.visitors?.setCrowd(true || crowd);
  }
  public releaseCarp() {
    this.festival?.releaseCarp?.();
    soundService.playSplash();
  }
  /* ---------------- the hầu đồng in the hall ---------------- */
  private ceremony: Ceremony | null = null;
  public setCeremony(on: boolean) {
    if (on && !this.ceremony) {
      this.ceremony = new Ceremony(this.scene, this.ground);
      soundService.setChauVanVolume(0);
      soundService.startChauVan();
    } else if (!on && this.ceremony) {
      this.ceremony.dispose(this.scene);
      this.ceremony = null;
      soundService.stopChauVan();
    }
  }

  /** sit on the mat and watch: the camera settles into a seated view of the medium */
  private watching: { from: THREE.Vector3; t: number } | null = null;
  public startWatching() {
    if (!this.ceremony) return null;
    this.ceremony.watching = true;
    this.watching = { from: this.camera.position.clone(), t: 0 };
    this.releasePointer();
    const c = this.ceremony;
    return {
      setGia: (i: number, look: GiaLook) => c.setWatchGia(i, look),
      setEnergy: (e: number) => c.setEnergy(e),
      burst: () => c.burst(),
      scatterLoc: () => c.scatterLoc(),
    };
  }
  public stopWatching() {
    if (this.ceremony) this.ceremony.watching = false;
    this.watching = null;
  }

  /* ---------------- thanh đồng: inside the medium ---------------- */
  private possession: Possession | null = null;
  private touches = 0;
  private touchAt = -99;
  private fogSave: { c: THREE.Color; d: number } | null = null;
  /** a click on the medium: the first time it stops and stares; the second time, you are taken */
  public touchMedium(clientX?: number, clientY?: number): boolean {
    if (!this.ceremony || this.possession || this.enc || this.arriving) return false;
    if (clientX === undefined || clientY === undefined) this._ndc.set(0, 0);
    else {
      const r = this.renderer.domElement.getBoundingClientRect();
      this._ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    }
    this._raycaster.setFromCamera(this._ndc, this.camera);
    if (!this.ceremony.hit(this._raycaster)) return false;
    if (this.elapsed - this.touchAt > 25) this.touches = 0;
    this.touchAt = this.elapsed;
    this.touches++;
    if (this.touches === 1) {
      this.ceremony.stareAt(this.camera.position, 4.5);
      soundService.whisper(5, Math.random() < 0.5 ? -0.6 : 0.6);
      this.callbacks.onPossess?.({ type: 'touch' });
    } else this.possess();
    return true;
  }
  private resNow = 1;
  private resBase = 1;
  private setRes(r: number) {
    if (r === this.resNow) return;
    if (this.resNow === 1) this.resBase = this.renderer.getPixelRatio();
    this.resNow = r;
    this.renderer.setPixelRatio(this.resBase * r);
    this.onWindowResize();
  }
  /** slip into the medium's body */
  public possess() {
    if (!this.ceremony || !this.hands || this.possession) return;
    this.touches = 0;
    this.cancelRite();
    if (this.watching) this.stopWatching();
    this.releasePointer();
    const f = this.scene.fog as THREE.FogExp2;
    this.fogSave = { c: f.color.clone(), d: f.density };
    soundService.setChauVanVolume(0);
    this.possession = new Possession(this.scene, this.camera, this.ceremony, this.hands, this.ground(0, -11), (e) => this.callbacks.onPossess?.(e));
  }
  public skipPossession() {
    this.possession?.skip();
  }
  public get possessed() {
    return !!this.possession;
  }
  /** wake on the mat at the side of the hall, the medium dancing on as if nothing happened */
  private wake() {
    this.possession?.dispose();
    this.possession = null;
    this.renderer.toneMappingExposure = 0.95;
    if (this.fogSave) {
      const f = this.scene.fog as THREE.FogExp2;
      f.color.copy(this.fogSave.c);
      f.density = this.fogSave.d;
      this.fogSave = null;
    }
    const x = 1.6, z = -7.2;
    this.playerPosition.set(x, EYE + this.ground(x, z), z);
    this.playerRotationY = Math.atan2(x, z + 11);
    this.playerPitch = 0.08;
    this.kneelTarget = 0.75;
    setTimeout(() => (this.kneelTarget = 0), 3200);
    this.callbacks.onPossess?.({ type: 'phase', phase: 'done' });
  }

  /* ---------------- múa rối nước ---------------- */
  private puppets: PuppetShow | null = null;
  private puppetSeat: { from: THREE.Vector3; to: THREE.Vector3; fromLook: THREE.Vector3; look: THREE.Vector3; t: number } | null = null;
  /** sit on the bank and watch a water-puppet show */
  public startPuppets(): boolean {
    const stage = this.scene.getObjectByName('thuyDinh');
    if (!stage || this.puppets || this.enc) return false;
    this.cancelRite();
    this.releasePointer();
    (stage.userData.puppets as THREE.Object3D).visible = false;
    this.puppets = new PuppetShow(stage, (e) => this.callbacks.onPuppet?.(e));
    stage.updateMatrixWorld(true);
    // low on the bank, close to the water, the stage filling the view
    const to = stage.localToWorld(new THREE.Vector3(0, 0, 8.4));
    to.y = 0.75;
    const look = stage.localToWorld(new THREE.Vector3(0, 0.45, 3.4));
    this.camera.getWorldDirection(this._fwd);
    this.puppetSeat = { from: this.camera.position.clone(), to, fromLook: this.camera.position.clone().add(this._fwd), look, t: 0 };
    soundService.setChauVanVolume(0);
    return true;
  }
  public stopPuppets() {
    const stage = this.scene.getObjectByName('thuyDinh');
    this.puppets?.dispose();
    this.puppets = null;
    if (stage) (stage.userData.puppets as THREE.Object3D).visible = true;
    if (this.puppetSeat) {
      // stand up where you sat, still facing the stage
      // back on the path at the edge of the pond
      const p = this.puppetSeat.from;
      this.playerPosition.set(p.x, EYE + this.ground(p.x, p.z), p.z);
      const d = this.puppetSeat.look.clone().sub(p);
      this.playerRotationY = Math.atan2(-d.x, -d.z);
      this.playerPitch = -0.05;
    }
    this.puppetSeat = null;
  }
  public get watchingPuppets() {
    return !!this.puppets;
  }

  /** carry a Mid-Autumn star lantern */
  public carryStar(on: boolean) {
    if (on && !this.star) {
      this.star = heldStar();
      this.camera.add(this.star);
    } else if (!on && this.star) {
      this.camera.remove(this.star);
      this.star = null;
    }
  }
  /** put the visitor back where they left off */
  public placePlayer(x: number, z: number, yaw: number) {
    if (this.walkable && !this.walkable(x, z)) return;
    this.playerPosition.set(x, EYE + this.ground(x, z), z);
    this.playerRotationY = yaw;
  }

  /** the firefly flies ahead to (x, z) */
  public guideTo(x: number, z: number) {
    this.firefly?.guide(x, z);
  }
  private hall: HallAtmosphere | null = null;
  private gazeT = 0;
  private gazeLevel = 0;
  private gazePeak = 0;
  private scapeT = 0;
  private _fwd = new THREE.Vector3();
  private _vel = new THREE.Vector3();
  private aboutFace = 0;
  private _want = new THREE.Vector3();
  private _to = new THREE.Vector3();
  /** night: look up into a Mother's face long enough and the world begins to ripple */
  private updateGaze(dt: number) {
    let looking = false;
    if (this.hall && this.timeOfDay === 'night' && !this.enc && !this.watching && !this.arriving) {
      this.camera.getWorldDirection(this._fwd);
      for (const f of this.hall.faces) {
        this._to.copy(f).sub(this.camera.position);
        const d = this._to.length();
        if (d < 15 && this._fwd.angleTo(this._to.normalize()) < 0.26 && this.playerPitch > 0.05) looking = true;
      }
    }
    this.gazeT = looking ? this.gazeT + dt : Math.max(0, this.gazeT - dt * 2.2);
    const lvl = Math.max(0, Math.min(1, (this.gazeT - 1.4) / 2.8));
    if (Math.abs(lvl - this.gazeLevel) > 0.03 || (lvl === 0 && this.gazeLevel !== 0)) {
      this.gazeLevel = lvl;
      this.callbacks.onGaze?.(lvl);
    }
    this.gazePeak = lvl >= 1 ? this.gazePeak + dt : 0;
    if (this.gazePeak > 1.4) {
      this.gazePeak = 0;
      this.gazeT = 0;
      this.playerPitch = -0.12;
      this.callbacks.onVision?.();
    }
  }
  /** the soundscape follows you: tea by the keeper, birds in the banyan, a lute practising, the night drum */
  private updateScape(dt: number) {
    this.scapeT += dt;
    if (this.scapeT < 0.25) return;
    this.scapeT = 0;
    const p = this.playerPosition;
    const near = (x: number, z: number, r: number) => Math.max(0, Math.min(1, 1 - Math.hypot(p.x - x, p.z - z) / r));
    const tod = this.timeOfDay;
    const away = !!this.enc;
    const hallNear = near(0, -12, 34);
    soundService.setScape({
      tea: away || tod === 'night' ? 0 : near(1.2, 20.2, 16),
      birds: away || tod === 'night' ? 0 : near(WORLD.BANYAN.x, WORLD.BANYAN.z, 30) * (tod === 'day' ? 1 : 0.5),
      lute: away || tod === 'night' || this.ceremony ? 0 : 0.35 + hallNear * 0.5,
      drum: away || tod !== 'night' ? 0 : 0.25 + hallNear * 0.75,
      trance: this.gazeLevel,
    });
  }

  private updateLiving(dt: number) {
    const t = this.elapsed;
    this.updateRite(dt);
    this.hall?.update(t, dt);
    this.updateGaze(dt);
    this.updateScape(dt);
    const outside = !this.enc;
    this.firefly?.update(dt, t, this.playerPosition, this.playerRotationY, outside && !this.arriving && !this.isCinematicMode && !this.watching);
    this.visitors?.update(dt, t, this.playerPosition, outside);
    this.residents?.update(dt, t, this.playerPosition, this.timeOfDay === 'night', outside);
    this.festival?.update(t, dt);
    if (this.ceremony) {
      this.ceremony.update(t, dt);
      // the music carries from the hall: loud inside, faint at the gate, silent in the realms
      const d = Math.hypot(this.playerPosition.x, this.playerPosition.z + 10);
      soundService.setChauVanVolume(this.enc || this.watching ? 0 : Math.max(0, Math.min(1, 1.15 - d / 38)));
    }
    if (this.arrival?.done && !this.departing) this.arrival.moor(t);
  }

  /* ---------------- the secret trail ---------------- */
  private activeSecret: string | null = null;
  private shimmer: THREE.Group | null = null;
  /** Only this secret can be found right now; a faint shimmer shows where it is when you're close */
  public setActiveSecret(id: string | null, alreadyFound: string[] = []) {
    alreadyFound.forEach((f) => this.secretsFound.add(f));
    this.activeSecret = id;
    const d = this.secrets.find((x) => x.id === id);
    if (!this.shimmer) {
      const g = new THREE.Group();
      const n = 40;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 0.9;
        pos.set([Math.cos(a) * r, Math.random() * 2.2, Math.sin(a) * r], i * 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const dot = document.createElement('canvas');
      dot.width = dot.height = 32;
      const dg = dot.getContext('2d')!;
      const grad = dg.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,230,160,0.8)');
      grad.addColorStop(1, 'rgba(255,200,90,0)');
      dg.fillStyle = grad;
      dg.fillRect(0, 0, 32, 32);
      const map = new THREE.CanvasTexture(dot);
      g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe08a, map, size: 0.16, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })));
      const glow = new THREE.PointLight(0xffd27a, 0, 6, 2);
      glow.position.y = 1;
      g.add(glow);
      g.userData.glow = glow;
      this.scene.add(g);
      this.shimmer = g;
    }
    if (d) this.shimmer.position.set(d.at[0], this.ground(d.at[0], d.at[1]), d.at[1]);
    this.shimmer.visible = false;
  }
  /** metres to the active secret (null if none / inside a realm) */
  /** which way the waking secret lies from where you're facing: ahead, behind, left or right */
  public get activeSecretDir(): string | null {
    const d = this.secrets.find((x) => x.id === this.activeSecret);
    if (!d || this.enc) return null;
    const dx = d.at[0] - this.playerPosition.x, dz = d.at[1] - this.playerPosition.z;
    let a = Math.atan2(-dx, -dz) - this.playerRotationY;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    if (Math.abs(a) < Math.PI / 4) return 'ahead';
    if (Math.abs(a) > (3 * Math.PI) / 4) return 'behind you';
    return a > 0 ? 'to your left' : 'to your right';
  }
  public get activeSecretDistance(): number | null {
    const d = this.secrets.find((x) => x.id === this.activeSecret);
    if (!d || this.enc) return null;
    return Math.hypot(this.playerPosition.x - d.at[0], this.playerPosition.z - d.at[1]);
  }
  private updateShimmer() {
    const g = this.shimmer;
    if (!g) return;
    const d = this.secrets.find((x) => x.id === this.activeSecret);
    const near = d && !this.enc ? Math.hypot(this.playerPosition.x - d.at[0], this.playerPosition.z - d.at[1]) : 99;
    const ok = d && !this.secretsFound.has(d.id) && (d.trigger !== 'night' || this.timeOfDay === 'night');
    g.visible = !!ok && near < 16;
    if (!g.visible) return;
    const k = Math.max(0, 1 - near / 16);
    g.rotation.y = this.elapsed * 0.4;
    const pts = g.children[0] as THREE.Points;
    (pts.material as THREE.PointsMaterial).opacity = (0.35 + Math.sin(this.elapsed * 2.4) * 0.15) * (0.4 + k);
    (g.userData.glow as THREE.PointLight).intensity = 1.5 * k;
  }

  /* ---------------- floating markers over things you can use ---------------- */
  private markers: { spot: SpotDef; g: THREE.Group; baseY: number }[] = [];
  private buildMarkers() {
    const label = (vi: string, en: string) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 160;
      const g = c.getContext('2d')!;
      g.fillStyle = 'rgba(42,20,16,0.78)';
      const r = 40;
      g.beginPath();
      g.roundRect(8, 8, 496, 144, r);
      g.fill();
      g.fillStyle = '#ffe2a0';
      g.textAlign = 'center';
      g.font = '600 62px "Be Vietnam Pro", system-ui, sans-serif';
      g.fillText(vi, 256, 80);
      g.fillStyle = '#f3e3c3';
      g.font = '400 38px "Be Vietnam Pro", system-ui, sans-serif';
      g.fillText(en, 256, 128);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const heights: Partial<Record<string, number>> = { altar: 4.2, bell: 4.6, fortune: 2.9, keeper: 2.6, river: 1.8, stall: 3.6 };
    for (const spot of this.spots) {
      if (spot.type === 'view') continue;
      const g = new THREE.Group();
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: 0.9 }));
      gem.scale.y = 1.5;
      g.add(gem);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: label(spot.vi, spot.name), transparent: true, depthWrite: false, depthTest: false }));
      sp.scale.set(1.9, 0.6, 1);
      sp.position.y = 0.62;
      sp.renderOrder = 10;
      g.add(sp);
      const lx = (spot.at[0] + spot.look[0]) / 2, lz = (spot.at[1] + spot.look[1]) / 2;
      const baseY = this.ground(lx, lz) + (heights[spot.type] ?? 2.6);
      g.position.set(lx, baseY, lz);
      g.visible = false;
      this.scene.add(g);
      this.markers.push({ spot, g, baseY });
    }
  }
  private updateMarkers() {
    for (const m of this.markers) {
      const d = Math.hypot(this.playerPosition.x - m.g.position.x, this.playerPosition.z - m.g.position.z);
      const show = !this.enc && !this.isCinematicMode && !this.arriving && !this.watching && !this.puppets && d > 3.8 && d < 20;
      m.g.visible = show;
      if (!show) continue;
      m.g.position.y = m.baseY + Math.sin(this.elapsed * 2 + m.g.position.x) * 0.08;
      m.g.children[0].rotation.y = this.elapsed * 1.5;
      const fade = Math.min(1, (20 - d) / 5) * Math.min(1, (d - 3.8) / 2);
      ((m.g.children[1] as THREE.Sprite).material as THREE.SpriteMaterial).opacity = fade;
      ((m.g.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * fade;
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
      // secrets wake up one at a time
      if (d.id !== this.activeSecret) continue;
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
    soundService.setRain(0);
    this.setCeremony(false);
    soundService.stopScape();
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
