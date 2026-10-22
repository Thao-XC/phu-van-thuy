import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet } from './ui/Sheet';
import { LocArt } from './LocArt';
import { soundService } from '../services/soundService';
import { XAM, XAM_TIER, QUE, LOC, LOC_ORDER, type QueResult, type Xam, type LocKind } from '../data/rituals';

/* ------------------------------------------------------------------ */
/* shared bits                                                         */
/* ------------------------------------------------------------------ */
const Header: React.FC<{ vi: string; title: string; sub?: string }> = ({ vi, title, sub }) => (
  <div className="text-center pr-6 sm:pr-0">
    <span className="text-xs uppercase tracking-[0.18em] text-[#8e1b1b] font-semibold">{vi}</span>
    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#2a1d14] mt-0.5">{title}</h2>
    {sub && <p className="text-[13px] text-[#5a4837] mt-1 max-w-md mx-auto">{sub}</p>}
  </div>
);

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'red' | 'plain' | 'gold' }> = ({ tone = 'red', className = '', ...p }) => (
  <button
    {...p}
    className={`px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      tone === 'red' ? 'bg-[#8e1b1b] hover:bg-[#7a1515] text-[#fff4dc]' : tone === 'gold' ? 'bg-[#c99212] hover:bg-[#b38010] text-[#2a1410]' : 'bg-[#ece2cf] hover:bg-[#e2d5bd] text-[#2a1d14]'
    } ${className}`}
  />
);

/** Two old coins tossed together: one up, one down means "yes" */
export function tossCoins(): QueResult {
  const a = Math.random() < 0.5, b = Math.random() < 0.5;
  return a !== b ? 'thanh' : a ? 'duong' : 'am';
}

const Coin: React.FC<{ up: boolean; spin: number; delay?: number }> = ({ up, spin, delay = 0 }) => (
  <div key={spin} className={spin ? 'coin-flip' : ''} style={{ animationDelay: `${delay}ms` }}>
    <svg viewBox="0 0 40 40" width="58" height="58" aria-hidden>
      <circle cx="20" cy="20" r="18" fill={up ? '#e0b23a' : '#9a7a2a'} stroke="#6b4500" strokeWidth="2" />
      <rect x="15" y="15" width="10" height="10" fill="#fbf3e2" stroke="#6b4500" strokeWidth="1.4" />
      {up && (
        <text x="20" y="11" textAnchor="middle" fontSize="6" fontWeight="700" fill="#6b4500" fontFamily="'Noto Serif TC', serif">
          通寶
        </text>
      )}
    </svg>
  </div>
);

export const CoinToss: React.FC<{ onResult?: (r: QueResult) => void; label?: string }> = ({ onResult, label = 'Toss the coins' }) => {
  const [spin, setSpin] = useState(0);
  const [res, setRes] = useState<QueResult | null>(null);
  const [busy, setBusy] = useState(false);
  const faces = res === 'thanh' ? [true, false] : res === 'duong' ? [true, true] : res === 'am' ? [false, false] : [true, false];
  const toss = () => {
    setBusy(true);
    setRes(null);
    setSpin((s) => s + 1);
    soundService.playCoinToss();
    const r = tossCoins();
    setTimeout(() => {
      setRes(r);
      setBusy(false);
      onResult?.(r);
    }, 950);
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-6 h-[70px] items-end" style={{ perspective: 400 }}>
        <Coin up={faces[0]} spin={spin} />
        <Coin up={faces[1]} spin={spin} delay={80} />
      </div>
      {res && (
        <div className="text-center sheet-fade">
          <div className="font-display font-bold text-lg text-[#8e1b1b]">
            {QUE[res].vi} · {QUE[res].en}
          </div>
          <div className="text-[13px] text-[#4a3c2e]">{QUE[res].meaning}</div>
        </div>
      )}
      <Btn onClick={toss} disabled={busy} tone="gold">
        {busy ? 'Tossing…' : res ? 'Toss again' : label}
      </Btn>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Thắp hương: incense                                                 */
/* ------------------------------------------------------------------ */
export const IncenseModal: React.FC<{ onClose: () => void; onDone: (sticks: number) => void }> = ({ onClose, onDone }) => {
  const [n, setN] = useState(3);
  const [step, setStep] = useState<'choose' | 'lit' | 'done'>('choose');
  const [bows, setBows] = useState(0);
  return (
    <Sheet onClose={onClose} size="md" label="Incense" className="px-5 sm:px-7 pt-3 sm:pt-6">
      <Header vi="Thắp hương" title="Light incense" sub="Incense carries your respect, and your wishes, up to the gods. Light it here at the great burner, outside the hall." />
      {/* burner */}
      <div className="mt-5 flex justify-center">
        <svg viewBox="0 0 160 120" width="220" height="165" aria-hidden>
          <ellipse cx="80" cy="108" rx="58" ry="7" fill="#00000018" />
          <path d="M30 62Q30 100 80 100Q130 100 130 62Z" fill="#5a4a32" stroke="#3a2e1e" strokeWidth="2" />
          <rect x="26" y="56" width="108" height="9" rx="3" fill="#7a6442" />
          <path d="M40 100L34 112M120 100L126 112M80 100V113" stroke="#3a2e1e" strokeWidth="5" strokeLinecap="round" />
          {Array.from({ length: n }).map((_, i) => {
            const x = 80 + (i - (n - 1) / 2) * 9;
            return (
              <g key={i}>
                <line x1={x} y1="58" x2={x} y2={step === 'choose' ? 22 : 18} stroke="#b5332a" strokeWidth="2.4" />
                {step !== 'choose' && (
                  <>
                    <circle cx={x} cy="17" r="2.6" fill="#ff7a2a" />
                    <path d={`M${x} 14Q${x - 6} 4 ${x + 2} -6`} stroke="#d8d4cc" strokeWidth="1.4" fill="none" opacity="0.8" />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {step === 'choose' && (
        <div className="mt-2 space-y-4">
          <div>
            <div className="text-sm font-semibold text-[#2a1d14] mb-2 text-center">How many sticks?</div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((k) => (
                <button
                  key={k}
                  onClick={() => setN(k)}
                  aria-pressed={n === k}
                  className={`w-12 h-12 rounded-xl border text-base font-bold cursor-pointer ${n === k ? 'bg-[#8e1b1b] border-[#8e1b1b] text-white' : 'bg-[#fffaf0] border-[#e0d2ba] text-[#2a1d14]'}`}
                >
                  {k}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-[#5a4837] mt-2">Hint: think about what number feels right for an offering.</p>
          </div>
          <Btn
            className="w-full"
            onClick={() => {
              soundService.playPaperBurn();
              setStep('lit');
            }}
          >
            Light {n} stick{n > 1 ? 's' : ''}
          </Btn>
        </div>
      )}
      {step === 'lit' && (
        <div className="mt-2 text-center space-y-3">
          <p className="text-sm text-[#2a1d14]">Hold the incense at your forehead, hands together, and vái three times.</p>
          <div className="flex justify-center gap-2" aria-label={`${bows} of 3 bows`}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={`w-3 h-3 rounded-full ${i < bows ? 'bg-[#8e1b1b]' : 'bg-[#e0d2ba]'}`} />
            ))}
          </div>
          <Btn
            className="w-full"
            onClick={() => {
              soundService.playMo();
              const b = bows + 1;
              setBows(b);
              if (b >= 3) {
                setStep('done');
                onDone(n);
              }
            }}
          >
            🙏 Vái ({bows}/3)
          </Btn>
        </div>
      )}
      {step === 'done' && (
        <div className="mt-2 text-center space-y-3 pb-1">
          <p className="text-sm text-[#2a1d14]">
            {n % 2 === 1
              ? `You place the ${n} stick${n > 1 ? 's' : ''} in the ash, one at a time. The smoke rises straight up.`
              : 'You place the sticks in the ash. An old woman nearby smiles: "Odd numbers, dear: one, three or five. Even numbers are kept for mourning."'}
          </p>
          <Btn tone="plain" onClick={onClose}>
            Done
          </Btn>
        </div>
      )}
    </Sheet>
  );
};

/* ------------------------------------------------------------------ */
/* Ban thờ: pray at the altar, ask a yes/no question, begin the ceremony */
/* ------------------------------------------------------------------ */
export const AltarModal: React.FC<{
  onClose: () => void;
  onPrayed: () => void;
  incenseDone: boolean;
  ready: boolean;
  onBegin: () => void;
}> = ({ onClose, onPrayed, incenseDone, ready, onBegin }) => {
  const [tab, setTab] = useState<'pray' | 'ask'>('pray');
  const [wish, setWish] = useState('');
  const [bows, setBows] = useState(0);
  const [prayed, setPrayed] = useState(false);
  return (
    <Sheet onClose={onClose} size="md" label="Altar" className="px-5 sm:px-7 pt-3 sm:pt-6">
      <Header vi="Ban thờ Tứ phủ" title="The altar of the Four Palaces" sub="The Three Mothers sit at the top: red for Heaven, green for the Mountains and Forests, white for the Waters." />
      {ready && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#8e1b1b] to-[#5a1010] text-[#fff4dc] text-center">
          <div className="font-display font-bold text-lg">All four scarves are home</div>
          <p className="text-[13px] opacity-90 mt-1">The musicians are tuning their moon lutes. The ceremony can begin.</p>
          <Btn tone="gold" className="mt-3" onClick={onBegin}>
            Begin the hầu đồng
          </Btn>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#ece2cf]" role="tablist">
        {(
          [
            ['pray', 'Khấn · Pray'],
            ['ask', 'Gieo quẻ · Ask'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`py-2 rounded-lg text-sm font-semibold cursor-pointer ${tab === k ? 'bg-[#fffaf0] text-[#8e1b1b] shadow-sm' : 'text-[#5a4837]'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'pray' ? (
        <div className="mt-4 space-y-3 pb-1">
          {!incenseDone && <p className="text-[13px] text-[#8a5a00] bg-[#fdf3d8] border border-[#ecd9a0] rounded-lg px-3 py-2">The keeper would tell you to light incense at the great burner outside first. You can still pray.</p>}
          {!prayed ? (
            <>
              <label className="block">
                <span className="text-sm font-semibold text-[#2a1d14]">Your prayer</span>
                <span className="block text-xs text-[#5a4837]">Silent and private. Nothing you write here is saved or sent anywhere.</span>
                <textarea value={wish} onChange={(e) => setWish(e.target.value.slice(0, 300))} rows={3} placeholder="Peace for my family, courage for the exam…" className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-[#fffaf0] border border-[#e0d2ba] text-sm focus:outline-none focus:border-[#8e1b1b]" />
              </label>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5" aria-label={`${bows} of 3 bows`}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`w-3 h-3 rounded-full ${i < bows ? 'bg-[#8e1b1b]' : 'bg-[#e0d2ba]'}`} />
                  ))}
                </div>
                <Btn
                  className="flex-1"
                  onClick={() => {
                    soundService.playMo();
                    const b = bows + 1;
                    setBows(b);
                    if (b >= 3) {
                      setPrayed(true);
                      soundService.playGreatBell();
                      onPrayed();
                    }
                  }}
                >
                  🙏 Vái ({bows}/3)
                </Btn>
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-[#2a1d14] py-3">Your prayer rises with the incense smoke. The candles flicker, once.</p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3 pb-1">
          <p className="text-[13px] text-[#4a3c2e]">Hold a yes-or-no question in your mind, then toss the two coins on the altar tray.</p>
          <CoinToss />
        </div>
      )}
    </Sheet>
  );
};

/* ------------------------------------------------------------------ */
/* Xin xăm: fortune sticks                                             */
/* ------------------------------------------------------------------ */
const TIER_RANK = { 'thuong-thuong': 0, thuong: 1, trung: 2, ha: 3 } as const;
function drawXam(phuc: number): Xam {
  const tilt = (phuc - 50) / 50;
  const weights = XAM.map((x) => Math.exp(tilt * (1.5 - TIER_RANK[x.tier]) * 0.8));
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < XAM.length; i++) {
    r -= weights[i];
    if (r <= 0) return XAM[i];
  }
  return XAM[0];
}

export const XamSlip: React.FC<{ x: Xam }> = ({ x }) => {
  const t = XAM_TIER[x.tier];
  return (
    <div className="rounded-2xl border-2 border-[#c99212] bg-[#fffaf0] p-4 sm:p-5 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-[#2a1d14]">Quẻ số {x.n}</span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: t.color }}>
          {t.vi} · {t.en}
        </span>
      </div>
      <div className="mt-2 text-sm font-semibold text-[#8e1b1b]">{x.image}</div>
      <p className="mt-2 font-display italic text-[15px] leading-relaxed text-[#2a1d14]">
        {x.verse[0]}
        <br />
        {x.verse[1]}
      </p>
      <p className="mt-3 text-[13px] text-[#2a1d14]">{x.reading}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
        {(
          [
            ['Love', x.love],
            ['Work', x.work],
            ['Health', x.health],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="p-2 rounded-lg bg-[#f6eedf]">
            <dt className="font-semibold text-[#8e1b1b]">{k}</dt>
            <dd className="text-[#3d3124] leading-snug">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export const XamModal: React.FC<{ onClose: () => void; phuc: number; onDrawn: (n: number) => void }> = ({ onClose, phuc, onDrawn }) => {
  const [step, setStep] = useState<'think' | 'shake' | 'stick' | 'confirm' | 'slip'>('think');
  const [x, setX] = useState<Xam | null>(null);
  const [res, setRes] = useState<QueResult | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const shake = () => {
    setStep('shake');
    const id = window.setInterval(() => soundService.playOmikujiShake(), 400);
    timer.current = window.setTimeout(() => {
      clearInterval(id);
      setX(drawXam(phuc));
      setStep('stick');
    }, 1800);
  };
  return (
    <Sheet onClose={onClose} size="md" label="Fortune sticks" className="px-5 sm:px-7 pt-3 sm:pt-6">
      <Header vi="Xin xăm" title="Ask the fortune sticks" sub="Kneel, think of your question, and shake the bamboo tube until one stick falls out. Then ask the coins if it is truly your answer." />
      <div className="mt-5 flex justify-center h-[150px] items-end">
        <svg viewBox="0 0 80 140" width="88" height="154" className={step === 'shake' ? 'shake-tube' : ''} aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <rect key={i} x={24 + i * 3.6} y={16 + (i % 3) * 3} width="2.4" height="60" rx="1" fill="#c8a06a" stroke="#8a6a3a" strokeWidth="0.4" />
          ))}
          <rect x="20" y="40" width="40" height="92" rx="6" fill="#7a5a2a" stroke="#4a3418" strokeWidth="2" />
          <rect x="20" y="56" width="40" height="5" fill="#c99212" />
          <rect x="20" y="112" width="40" height="5" fill="#c99212" />
          <text x="40" y="92" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fbe7b0" fontFamily="'Noto Serif TC', serif">
            籤
          </text>
          {(step === 'stick' || step === 'confirm') && (
            <g className="stick-out">
              <rect x="44" y="10" width="3.2" height="66" rx="1" fill="#d8b47a" stroke="#8a6a3a" strokeWidth="0.5" />
              <text x="45.6" y="22" textAnchor="middle" fontSize="5" fontWeight="700" fill="#8e1b1b">
                {x?.n}
              </text>
            </g>
          )}
        </svg>
      </div>
      {step === 'think' && <Btn className="w-full mt-4" onClick={shake}>Shake the tube</Btn>}
      {step === 'shake' && <p className="text-center text-sm text-[#5a4837] mt-4">Shaking… keep your question in mind.</p>}
      {step === 'stick' && x && (
        <div className="mt-4 text-center space-y-3">
          <p className="text-sm text-[#2a1d14]">
            Stick number <b>{x.n}</b> falls out. Toss the coins: is this your answer?
          </p>
          <CoinToss
            label="Ask with the coins"
            onResult={(r) => {
              setRes(r);
              if (r === 'thanh') {
                setTimeout(() => {
                  setStep('slip');
                  soundService.playBellChime();
                  onDrawn(x.n);
                }, 1300);
              }
            }}
          />
          {res && res !== 'thanh' && (
            <Btn tone="plain" onClick={() => { setRes(null); shake(); }}>
              Shake again
            </Btn>
          )}
        </div>
      )}
      {step === 'slip' && x && (
        <div className="mt-4 space-y-3 pb-1">
          <XamSlip x={x} />
          <p className="text-xs text-center text-[#5a4837]">Saved to your journal. Original verses written for this temple.</p>
          <div className="flex gap-2">
            <Btn tone="plain" className="flex-1" onClick={() => { setRes(null); setX(null); setStep('think'); }}>
              Ask another question
            </Btn>
            <Btn className="flex-1" onClick={onClose}>
              Done
            </Btn>
          </div>
        </div>
      )}
    </Sheet>
  );
};

/* ------------------------------------------------------------------ */
/* Viết sớ & hóa sớ: write a petition and burn it                      */
/* ------------------------------------------------------------------ */
export const PetitionModal: React.FC<{ onClose: () => void; onBurned: (name: string, wish: string) => void }> = ({ onClose, onBurned }) => {
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [step, setStep] = useState<'write' | 'burning' | 'done'>('write');
  const date = useMemo(() => new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' }), []);
  return (
    <Sheet onClose={onClose} size="md" label="Petition" className="px-5 sm:px-7 pt-3 sm:pt-6">
      <Header vi="Viết sớ · Hóa sớ" title="Write a petition, then burn it" sub="A sớ is a formal letter to the gods. Burned in the furnace, its words rise with the smoke." />
      {step === 'write' && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-[#2a1d14]">Your name <span className="font-normal text-[#5a4837]">(optional)</span></span>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="Tín chủ…" className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#fffaf0] border border-[#e0d2ba] text-sm focus:outline-none focus:border-[#8e1b1b]" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-[#2a1d14]">Your wish</span>
            <textarea value={wish} onChange={(e) => setWish(e.target.value.slice(0, 220))} rows={3} placeholder="For my mother's health, and a peaceful year…" className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#fffaf0] border border-[#e0d2ba] text-sm focus:outline-none focus:border-[#8e1b1b]" />
          </label>
        </div>
      )}
      {/* the petition itself */}
      <div className={`mt-4 rounded-xl border-[3px] border-double border-[#b91c1c] bg-[#f8edd0] p-4 text-[#3a1a10] font-display ${step === 'burning' ? 'burn' : ''} ${step === 'done' ? 'hidden' : ''}`}>
        <div className="text-center font-bold text-[#8e1b1b] tracking-wide">Sớ cầu an</div>
        <p className="mt-2 text-[13px] leading-relaxed">
          Kính lạy Tứ phủ Thánh Mẫu. Con là <b>{name.trim() || 'tín chủ'}</b>, hôm nay ngày {date}, thành tâm dâng sớ, xin:
        </p>
        <p className="mt-1 text-[14px] italic min-h-[2.5em]">{wish.trim() || '…'}</p>
        <p className="mt-2 text-[12px] text-right">Con xin đa tạ.</p>
        <p className="mt-2 text-[11px] text-[#6b4426] font-sans">"To the Holy Mothers of the Four Palaces: today I humbly offer this petition, asking for the above. With gratitude."</p>
      </div>
      {step === 'write' && (
        <Btn
          className="w-full mt-4"
          disabled={!wish.trim()}
          onClick={() => {
            setStep('burning');
            soundService.playPaperBurn();
            setTimeout(() => {
              setStep('done');
              onBurned(name.trim(), wish.trim());
            }, 2700);
          }}
        >
          🔥 Burn it in the furnace (hóa sớ)
        </Btn>
      )}
      {step === 'done' && (
        <div className="text-center py-6 space-y-3">
          <div className="text-4xl drift" aria-hidden>
            ☁️
          </div>
          <p className="text-sm text-[#2a1d14]">The paper curls and turns to light ash. A thread of smoke climbs past the eaves and disappears into the evening.</p>
          <Btn tone="plain" onClick={onClose}>
            Done
          </Btn>
        </div>
      )}
    </Sheet>
  );
};

/* ------------------------------------------------------------------ */
/* Bàn lộc: receive an amulet or lộc                                   */
/* ------------------------------------------------------------------ */
export const StallModal: React.FC<{ onClose: () => void; onReceive: (k: LocKind, forWhom?: string) => void }> = ({ onClose, onReceive }) => {
  const [k, setK] = useState<LocKind>('binh-an');
  const [forWhom, setForWhom] = useState('');
  const [got, setGot] = useState<LocKind | null>(null);
  const it = LOC[k];
  return (
    <Sheet onClose={onClose} size="lg" label="Lộc table" className="px-5 sm:px-7 pt-3 sm:pt-6">
      <Header vi="Thỉnh bùa · Nhận lộc" title="The lộc table" sub="Lộc are small blessed gifts, and bùa are charms. You don't buy them: you receive them respectfully (thỉnh), and take only what you need." />
      {!got ? (
        <div className="mt-4 grid sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] gap-5 items-start">
          <div className="flex sm:flex-col items-center gap-4 p-3 sm:p-0 rounded-2xl bg-[#f6eedf] sm:bg-transparent">
            <div className="omamori-swing">
              <LocArt kind={k} size={88} title={it.vi} />
            </div>
            <div className="sm:text-center">
              <div className="font-display font-bold text-[#2a1d14]">{it.vi}</div>
              <div className="text-sm font-semibold" style={{ color: it.color }}>
                {it.en}
              </div>
              <p className="text-xs text-[#3d3124] mt-1 leading-relaxed">{it.blurb}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Lộc and charms">
              {LOC_ORDER.map((kk) => (
                <button
                  key={kk}
                  role="radio"
                  aria-checked={k === kk}
                  onClick={() => {
                    setK(kk);
                    soundService.playLute(392 + LOC_ORDER.indexOf(kk) * 44);
                  }}
                  className={`flex flex-col items-center gap-1 pt-3 pb-2 px-1 rounded-2xl border cursor-pointer transition-all ${k === kk ? 'bg-[#fbeedd] border-[#8e1b1b] shadow-sm' : 'bg-[#fffaf0] border-[#e0d2ba] hover:-translate-y-0.5'}`}
                >
                  <LocArt kind={kk} size={38} />
                  <span className="text-[12px] font-semibold text-[#2a1d14] text-center leading-tight">{LOC[kk].vi}</span>
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-xs font-semibold text-[#2a1d14]">
                For whom? <span className="font-normal text-[#5a4837]">(optional)</span>
              </span>
              <input value={forWhom} onChange={(e) => setForWhom(e.target.value.slice(0, 24))} placeholder="Me, Mẹ, my little brother…" className="mt-1 w-full px-3 py-2.5 rounded-xl bg-[#fffaf0] border border-[#e0d2ba] text-sm focus:outline-none focus:border-[#8e1b1b]" />
            </label>
            <Btn
              className="w-full"
              onClick={() => {
                soundService.playBellChime();
                onReceive(k, forWhom.trim() || undefined);
                setGot(k);
              }}
            >
              Thỉnh {it.vi}
            </Btn>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center text-center gap-3 pb-1">
          <div className="omamori-swing">
            <LocArt kind={got} size={110} />
          </div>
          <div className="font-display font-bold text-lg">{LOC[got].vi} is in your pouch</div>
          <p className="text-sm text-[#3d3124] max-w-sm">Keep it close for a year, then bring it back to a temple to be respectfully burned.</p>
          <div className="flex gap-2">
            <Btn tone="plain" onClick={() => setGot(null)}>
              Another
            </Btn>
            <Btn onClick={onClose}>Done</Btn>
          </div>
        </div>
      )}
    </Sheet>
  );
};
