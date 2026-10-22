import * as THREE from 'three';
import { AMBIENT_GIA, type Ceremony } from './living';
import type { Hands } from './fpv';
import { soundService } from '../services/soundService';

/**
 * Thanh đồng: touch the medium twice during a hầu đồng and you are inside them.
 *
 *  taken  – the world rushes in through the eyes of the medium; the red veil drops
 *  veil   – dark, muffled, your heart too loud. Shapes gather around the mat with candle eyes.
 *           A voice. Hold Space (or the mouse) and breathe with the drum to let Her in.
 *  lift   – the veil is thrown off; the spirit arrives in colour
 *  dance  – you spin with the spirit's dance and scatter lộc to the shapes, who now kneel
 *  leave  – She goes, all at once. Black. "Go back."
 *  wake   – on the mat, the medium still dancing as if nothing happened
 *
 * Nothing can be failed: not breathing only makes the shapes come closer, and after a while
 * She comes in anyway. Esc wakes you at any time.
 */
export type PossessPhase = 'taken' | 'veil' | 'lift' | 'dance' | 'leave' | 'wake' | 'done';
export type PossessEvent =
  | { type: 'phase'; phase: PossessPhase; aura?: string }
  | { type: 'line'; vi: string; en: string; who: 'mau' | 'them' | 'you' }
  | { type: 'prompt'; text: string | null }
  | { type: 'breath'; v: number };

const THEM: [string, string][] = [
  ['Nó không phải đồng.', 'This one is not a medium.'],
  ['Trả lại thân xác đi.', 'Give the body back.'],
  ['Nó thở sai rồi.', 'It is breathing wrong.'],
  ['Ai cho nó ngồi đây?', 'Who let it sit here?'],
  ['Lại gần nữa…', 'Closer…'],
  ['Nó nghe thấy chúng ta.', 'It can hear us.'],
];
const GREET: [string, string][] = [
  ['', ''],
  ['Ta từ Thoải Cung, dưới nước sâu.', 'I come from the Water Palace, from deep water.'],
  ['Ta từ rừng xanh, nơi chưa ai đặt chân.', 'I come from the green forest, where no one walks.'],
  ['Ta đi qua nghìn năm để uống chén rượu này.', 'I crossed a thousand years for this cup.'],
  ['Ta mang hoa từ bản xa về.', 'I bring flowers from the far hills.'],
];

interface Shade {
  g: THREE.Group;
  body: THREE.Mesh;
  eyes: THREE.Group;
  a: number;
  r: number;
  born: number;
  sway: number;
}

export class Possession {
  phase: PossessPhase = 'taken';
  private t = 0;
  private g = new THREE.Group();
  private shades: Shade[] = [];
  private holding = false;
  private breath = 0;
  private heart = 128;
  private lookYaw = 0;
  private lookPitch = 0;
  private spin = 0;
  private spinV = 0;
  private from: { p: THREE.Vector3; q: THREE.Quaternion };
  private said = new Set<string>();
  private themT = 3;
  private gia = 1;
  private scattered = 0;
  /** how bright the world is (tone-mapping exposure) and how close the dark comes */
  exposure = 0.95;
  /** render resolution: through the veil's cloth the world is soft and smeared */
  get res() {
    return this.phase === 'veil' || this.phase === 'taken' ? (this.phase === 'taken' && this.t < 1.2 ? 1 : 0.28) : 1;
  }
  fog = { color: new THREE.Color(0x030306), density: 0.03 };
  private _head = new THREE.Vector3();
  private _fwd = new THREE.Vector3();

  constructor(
    private scene: THREE.Scene,
    private cam: THREE.PerspectiveCamera,
    private cer: Ceremony,
    private hands: Hands,
    private y0: number,
    private emit: (e: PossessEvent) => void,
  ) {
    this.from = { p: cam.position.clone(), q: cam.quaternion.clone() };
    scene.add(this.g);
    this.cer.apply(AMBIENT_GIA[0]);
    this.cer.setPossessed(true);
    this.hands.setSleeve(AMBIENT_GIA[0].robe);
    this.gia = 1 + Math.floor(Math.random() * 4);
    emit({ type: 'phase', phase: 'taken' });
    soundService.playTempleGong();
  }

  /** a figure of shadow with two candle-flame eyes */
  private shade(i: number): Shade {
    const g = new THREE.Group();
    const black = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
    const h = 1.05 + Math.random() * 0.35;
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.38, h, 10, 1, true), black);
    body.position.y = h / 2;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), black);
    body.add(head);
    head.position.y = h / 2 + 0.08;
    const eyes = new THREE.Group();
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffa040, toneMapped: false, fog: false });
    [-1, 1].forEach((sd) => {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), eyeMat);
      e.position.set(sd * 0.06, 0, 0.165);
      eyes.add(e);
    });
    eyes.position.y = h / 2 + 0.1;
    body.add(eyes);
    g.add(body);
    // most sit in front of the mat, a few behind you
    const front = i % 5 !== 4;
    const a = front ? Math.PI / 2 + (Math.random() - 0.5) * 2.4 : -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
    const s: Shade = { g, body, eyes, a, r: 3.2 + Math.random() * 1.6, born: this.t, sway: Math.random() * 6 };
    g.scale.set(1, 0.01, 1);
    this.g.add(g);
    return s;
  }

  press(down: boolean) {
    this.holding = down;
    if (down && this.phase === 'dance') {
      this._fwd.set(0, 0, -1).applyQuaternion(this.cam.quaternion).setY(0).normalize();
      this.cer.scatterLoc(9, this._fwd);
      soundService.playCoinToss();
      this.scattered++;
    }
  }
  look(dx: number, dy: number) {
    this.lookYaw -= dx * 0.003;
    this.lookPitch -= dy * 0.003;
    const lim = this.phase === 'veil' ? 0.7 : 1.2;
    this.lookYaw = Math.max(-lim, Math.min(lim, this.lookYaw));
    this.lookPitch = Math.max(-0.7, Math.min(0.5, this.lookPitch));
  }
  /** Esc: wake now */
  skip() {
    if (this.phase === 'leave' || this.phase === 'wake' || this.phase === 'done') return;
    this.go('leave');
  }

  private go(p: PossessPhase) {
    this.phase = p;
    this.t = 0;
    this.said.clear();
    const look = AMBIENT_GIA[this.gia];
    if (p === 'veil') {
      soundService.startPossession();
      soundService.setPossession({ muffle: 1, heart: 128, ring: 1, drone: 1, drum: 76 });
      this.hands.pose('veil');
    } else if (p === 'lift') {
      soundService.veilLift();
      this.emit({ type: 'prompt', text: null });
      this.hands.pose('joined');
    } else if (p === 'dance') {
      this.cer.apply(look);
      this.cer.setEnergy(1);
      this.hands.setSleeve(look.robe);
      this.hands.pose('spread');
      soundService.setPossession({ muffle: 0, heart: 96, ring: 0, drone: 0.3, drum: 112 });
      this.shades.forEach((s) => (s.r = Math.max(2.4, s.r)));
    } else if (p === 'leave') {
      soundService.stopPossession();
      this.hands.pose('hidden');
      this.emit({ type: 'prompt', text: null });
    }
    this.emit({ type: 'phase', phase: p, aura: '#' + look.aura.toString(16).padStart(6, '0') });
  }
  private once(key: string, at: number, fn: () => void) {
    if (this.t >= at && !this.said.has(key)) {
      this.said.add(key);
      fn();
    }
  }
  private line(who: 'mau' | 'them' | 'you', vi: string, en: string) {
    this.emit({ type: 'line', who, vi, en });
    if (who !== 'you') soundService.whisper(vi.split(' ').length + 2, who === 'them' ? (Math.random() < 0.5 ? -0.8 : 0.8) : 0);
  }

  /** moves the camera; returns false once it is over */
  update(dt: number, elapsed: number): boolean {
    this.t += dt;
    const t = this.t;
    const head = this.cer.head(this._head);
    const near = (a: number, b: number) => a + (b - a) * Math.min(1, dt * 1.5);

    if (this.phase === 'taken') {
      // pulled forward into the medium's eyes
      const k = Math.min(1, t / 2.2);
      const e = k * k * k;
      this.cam.position.lerpVectors(this.from.p, head, e);
      const want = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.15, 0, 0, 'YXZ'));
      want.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI));
      this.cam.quaternion.slerpQuaternions(this.from.q, want, e);
      this.exposure = near(this.exposure, 0.35);
      if (t > 2.2) this.go('veil');
      return true;
    }

    // you are the medium now: sit at its head, facing the congregation (+z)
    const bob = this.phase === 'dance' ? Math.abs(Math.sin(elapsed * 5.5)) * 0.05 : Math.sin(elapsed * (this.heart / 60) * Math.PI) * 0.004;
    this.cam.position.set(head.x, head.y + bob - (this.phase === 'veil' ? 0.1 : 0), head.z);
    if (this.phase === 'dance') {
      this.spinV = near(this.spinV, Math.min(3.2, 0.6 + t * 0.2));
      this.spin += this.spinV * dt;
    }
    const drift = this.phase === 'veil' ? Math.sin(elapsed * 0.4) * 0.05 : 0;
    this.cam.quaternion.setFromEuler(new THREE.Euler(-0.12 + this.lookPitch + drift, Math.PI + this.lookYaw + this.spin, this.phase === 'dance' ? Math.sin(this.spin * 2) * 0.08 : drift * 0.4, 'YXZ'));
    this.hands.offset.set(Math.sin(elapsed * 31) * 0.003, Math.sin(elapsed * 23) * 0.003, 0).multiplyScalar(this.phase === 'veil' ? 1 + (this.heart - 76) / 20 : 0);

    // the shades: rise out of the floor, lean in when you lose your breath, kneel when She comes
    this.shades.forEach((s, i) => {
      const age = elapsed - s.born;
      const kneel = this.phase === 'dance' || this.phase === 'lift' ? 1 : 0;
      const sy = Math.min(1, age * 0.6) * (1 - kneel * 0.45);
      s.g.scale.y = near(s.g.scale.y, sy);
      const restless = this.phase === 'veil' && !this.holding ? 1 : 0;
      s.r = Math.max(1.5, s.r - restless * dt * 0.07);
      s.g.position.set(head.x + Math.cos(s.a) * s.r, this.y0, -11 + Math.sin(s.a) * s.r);
      s.g.lookAt(head.x, this.y0, -11);
      s.body.rotation.x = kneel ? 0.45 : Math.sin(elapsed * 0.7 + s.sway) * 0.05 + restless * 0.12;
      s.body.rotation.z = Math.sin(elapsed * 0.5 + i) * 0.04;
      // blink, now and then
      s.eyes.scale.y = Math.sin(elapsed * 0.9 + s.sway * 3) > 0.985 ? 0.1 : 1;
    });

    if (this.phase === 'veil') {
      this.exposure = near(this.exposure, 0.22);
      this.fog.color.lerp(new THREE.Color(0x120202), Math.min(1, dt));
      this.fog.density = near(this.fog.density, 0.11);
      this.once('a', 1.5, () => this.line('mau', '…ai gọi con?', '…who called you?'));
      this.once('b', 6.5, () => this.line('mau', 'Con không được chọn. Vậy mà con đến.', 'You were not chosen. Yet you came.'));
      this.once('c', 12, () => this.line('mau', 'Đừng mở mắt. Họ đang ngồi quanh con.', 'Do not open your eyes. They are sitting all around you.'));
      this.once('d', 17, () => {
        this.line('mau', 'Thở theo tiếng trống. Để ta vào.', 'Breathe with the drum. Let me in.');
        this.emit({ type: 'prompt', text: 'Hold Space or the mouse · breathe with the drum' });
      });
      // the shades gather
      if (t > 5 && this.shades.length < 16 && t > 5 + this.shades.length * 0.9) this.shades.push(this.shade(this.shades.length));
      if (t > 17) {
        if (this.holding) {
          this.breath = Math.min(1, this.breath + dt / 9);
          this.heart = Math.max(76, this.heart - dt * 9);
        } else {
          this.heart = Math.min(150, this.heart + dt * 4);
          this.themT -= dt;
          if (this.themT <= 0) {
            this.themT = 4 + Math.random() * 3;
            const [vi, en] = THEM[Math.floor(Math.random() * THEM.length)];
            this.line('them', vi, en);
          }
        }
        soundService.setPossession({ heart: this.heart });
        this.emit({ type: 'breath', v: this.breath });
        if (this.breath > 0.5) this.once('e', 0, () => this.line('mau', 'Chậm thôi… chậm thôi…', 'Slowly… slowly…'));
        // no failing: after a long while She comes in regardless
        if (this.breath >= 1 || t > 60) this.go('lift');
      }
      return true;
    }
    if (this.phase === 'lift') {
      this.once('a', 1.85, () => {
        this.cer.apply(AMBIENT_GIA[this.gia]);
        this.exposure = 1.3;
      });
      if (t > 1.85) {
        this.exposure = near(this.exposure, 0.95);
        this.fog.density = near(this.fog.density, 0.03);
        this.fog.color.lerp(new THREE.Color(AMBIENT_GIA[this.gia].aura).multiplyScalar(0.15), Math.min(1, dt));
      }
      if (t > 2.6) this.go('dance');
      return true;
    }
    if (this.phase === 'dance') {
      this.once('a', 0.6, () => this.line('mau', ...GREET[this.gia]));
      this.once('b', 4, () => {
        this.line('mau', 'Ban lộc cho họ, con.', 'Give them blessings, child.');
        this.emit({ type: 'prompt', text: 'Space or click · scatter lộc' });
      });
      this.once('c', 11, () => this.line('mau', 'Họ cúi đầu trước ta. Không phải trước con.', 'They bow to me. Not to you.'));
      this.once('d', 16, () => {
        this.line('mau', 'Đủ rồi.', 'Enough.');
        this.emit({ type: 'prompt', text: null });
      });
      if (t > 18) this.go('leave');
      return true;
    }
    if (this.phase === 'leave') {
      this.exposure = 0.95;
      this.once('a', 1.4, () => this.line('mau', 'Về đi.', 'Go back.'));
      if (t > 3.6) {
        this.phase = 'wake';
        this.t = 0;
        this.emit({ type: 'phase', phase: 'wake' });
        return false;
      }
      return true;
    }
    return false;
  }

  get scatters() {
    return this.scattered;
  }
  dispose() {
    this.scene.remove(this.g);
    this.cer.setPossessed(false);
    this.cer.setEnergy(0.35);
    this.hands.offset.set(0, 0, 0);
    this.hands.pose('hidden');
    this.hands.setSleeve(0x5a3a26);
    soundService.stopPossession();
  }
}
