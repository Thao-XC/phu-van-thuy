import React, { useEffect, useRef } from 'react';
import { INK, S, L, K, circ, ell, rng } from './ink';

/**
 * Figures, animals and props drawn the Đông Hồ way: flat colour, bold key line, round serene
 * faces with slit eyes and rosy cheeks, patterned cloth, swirl-marked animals.
 * Parts that move (heads, sleeves, tails, wings, tassels) are separate groups with CSS animation.
 */

const o = (x: number, y: number) => ({ transformOrigin: `${x}px ${y}px` });

/* ------------------------------------------------------------------ */
/* people                                                               */
/* ------------------------------------------------------------------ */
export type Head = 'khan' | 'crown' | 'emperor' | 'scholar' | 'veil' | 'topknot' | 'hat' | 'boy';
export type Pose = 'joined' | 'open' | 'fans' | 'lute' | 'offer' | 'wave' | 'brush' | 'bow';

interface PersonProps {
  x?: number;
  y?: number;
  s?: number;
  robe?: string;
  accent?: string;
  sash?: string;
  head?: Head;
  pose?: Pose;
  tex?: string;
  seated?: boolean;
  flip?: boolean;
  /** extra class on the whole figure (entrances, walks) */
  className?: string;
  style?: React.CSSProperties;
  /** idle life: breathing + a slow nod */
  idle?: boolean;
  /** something held at the hands */
  children?: React.ReactNode;
  /** for the hầu đồng costume changes */
  robeClass?: string;
}

const FaceFeatures: React.FC<{ beard?: boolean; smile?: boolean }> = ({ beard, smile }) => (
  <g>
    <L d="M-19 -246q9 -6 17 -1M2 -247q8 -5 17 1" w={2.4} />
    <L d="M-18 -234q8 -5 15 0M3 -234q8 -5 15 0" w={3.4} />
    <L d="M0 -230q-3 8 1 10" w={2} />
    <S d={ell(0, smile ? -213 : -212, 5.5, smile ? 3.8 : 3)} f={INK.son} k={0} tight />
    <S d={circ(-18, -221, 6.5)} f={INK.pink} k={0} tight opacity={0.85} />
    <S d={circ(18, -221, 6.5)} f={INK.pink} k={0} tight opacity={0.85} />
    {beard && <K d="M-15 -208Q-8 -186 0 -168Q8 -186 15 -208Q8 -200 0 -202Q-8 -200 -15 -208Z" />}
    {beard && <L d="M-16 -214q-10 4 -16 -2M16 -214q10 4 16 -2" w={2.6} />}
  </g>
);

const HeadWear: React.FC<{ head: Head; accent: string }> = ({ head, accent }) => {
  switch (head) {
    case 'veil':
      return (
        <g>
          <S d="M-46 -292Q0 -304 46 -292L54 -192Q0 -180 -54 -192Z" f={INK.son} tex="tx-swirl" />
          <L d="M-50 -196l0 10M-36 -192l0 10M-22 -190l0 10M-8 -189l0 10M8 -189l0 10M22 -190l0 10M36 -192l0 10M50 -196l0 10" w={3} c={INK.gold} />
        </g>
      );
    case 'crown':
      return (
        <g>
          <S d="M-36 -250Q-39 -284 0 -290Q39 -284 36 -250Q20 -263 0 -264Q-20 -263 -36 -250Z" f={accent} />
          <S d="M-35 -262L-31 -304L-15 -292L0 -322L15 -292L31 -304L35 -262Q0 -274 -35 -262Z" f={INK.gold} />
          <S d={circ(0, -294, 6.5)} f={INK.son} k={2.5} tight />
          <S d={circ(-20, -282, 4.5)} f={INK.son} k={2} tight />
          <S d={circ(20, -282, 4.5)} f={INK.son} k={2} tight />
          <S d="M-35 -270q-32 -8 -44 -36q18 8 34 4q-6 14 10 22Z" f={INK.gold} k={3.5} />
          <S d="M35 -270q32 -8 44 -36q-18 8 -34 4q6 14 -10 22Z" f={INK.gold} k={3.5} />
          {[-1, 1].map((sd) => (
            <g key={sd} className="a-tassel" style={o(sd * 40, -262)}>
              <L d={`M${sd * 40} -262L${sd * 44} -196`} w={2} />
              {[0, 1, 2, 3].map((i) => (
                <S key={i} d={circ(sd * (40.5 + i * 1.1), -250 + i * 15, 4)} f={i % 2 ? INK.son : INK.gold} k={1.8} tight />
              ))}
            </g>
          ))}
        </g>
      );
    case 'emperor':
      return (
        <g>
          <S d="M-31 -252L-31 -288L31 -288L31 -252Q0 -260 -31 -252Z" f={INK.cham} tex="tx-dots" />
          <S d="M-56 -296L56 -296L56 -286L-56 -286Z" f={INK.key} k={3} />
          {[-48, -32, -16, 0, 16, 32, 48].map((x) => (
            <g key={x} className="a-tassel" style={o(x, -286)}>
              <L d={`M${x} -286L${x} -262`} w={1.6} />
              <S d={circ(x, -258, 3.4)} f={x % 32 ? INK.son : INK.gold} k={1.4} tight />
            </g>
          ))}
        </g>
      );
    case 'scholar':
      return (
        <g>
          <K d="M-34 -248Q-36 -278 0 -282Q36 -278 34 -248Q0 -258 -34 -248Z" />
          <L d="M-32 -262Q0 -272 32 -262" w={2} c="#6b5b4b" />
        </g>
      );
    case 'topknot':
      return (
        <g>
          <K d="M-31 -238Q-33 -272 0 -274Q33 -272 31 -238Q26 -258 0 -260Q-26 -258 -31 -238Z" />
          <K d={circ(0, -280, 11)} />
          <S d="M-31 -252Q0 -266 31 -252L30 -244Q0 -256 -30 -244Z" f={accent} k={2.5} />
        </g>
      );
    case 'hat':
      return <S d="M-70 -246L0 -296L70 -246Q0 -256 -70 -246Z" f={INK.hoeLight} tex="tx-hatch" />;
    case 'boy':
      return (
        <g>
          <K d="M-8 -270q8 -18 16 0q-8 -4 -16 0Z" />
          <K d="M-30 -250q-8 -12 2 -18q4 8 -2 18Z" />
          <K d="M30 -250q8 -12 -2 -18q-4 8 2 18Z" />
        </g>
      );
    default:
      // khăn vấn: the rolled turban of northern women
      return (
        <g>
          <K d="M-31 -236Q-30 -250 -24 -252L24 -252Q30 -250 31 -236Q26 -248 0 -250Q-26 -248 -31 -236Z" />
          <S d="M-36 -248Q-39 -282 0 -288Q39 -282 36 -248Q20 -261 0 -262Q-20 -261 -36 -248Z" f={accent} />
          <L d="M-34 -262Q0 -282 34 -262M-28 -274Q0 -290 28 -274" w={2.4} />
        </g>
      );
  }
};

const Sleeves: React.FC<{ pose: Pose; robe: string; accent: string; seated?: boolean }> = ({ pose, robe, accent }) => {
  const hand = (x: number, y: number) => <S d={circ(x, y, 10.5)} f={INK.skin} k={3} />;
  const cuff = (d: string) => <S d={d} f={accent} k={3} />;
  switch (pose) {
    case 'open':
      return (
        <g>
          <S d="M-46 -184Q-82 -150 -88 -74Q-72 -62 -54 -68Q-52 -122 -40 -162Z" f={robe} />
          <S d="M46 -184Q82 -150 88 -74Q72 -62 54 -68Q52 -122 40 -162Z" f={robe} />
          {cuff('M-88 -78Q-72 -66 -54 -72L-54 -64Q-72 -58 -88 -70Z')}
          {cuff('M88 -78Q72 -66 54 -72L54 -64Q72 -58 88 -70Z')}
          {hand(-72, -56)}
          {hand(72, -56)}
        </g>
      );
    case 'fans':
    case 'wave':
      return (
        <g>
          <g className="a-armL" style={o(-42, -178)}>
            <S d="M-44 -186Q-98 -196 -126 -248Q-112 -262 -100 -252Q-80 -218 -34 -166Z" f={robe} />
            {cuff('M-126 -248Q-112 -262 -100 -252L-96 -258Q-110 -270 -122 -258Z')}
            {hand(-118, -262)}
            {pose === 'fans' && (
              <g transform="translate(-118 -262) rotate(-30)">
                <S d="M0 0L-58 -50A76 76 0 0 1 22 -76Z" f={INK.hoe} tex="tx-hatch" />
                <L d="M0 0L-40 -64M0 0L-12 -74M0 0L10 -76" w={2} />
              </g>
            )}
          </g>
          <g className="a-armR" style={o(42, -178)}>
            <S d="M44 -186Q98 -196 126 -248Q112 -262 100 -252Q80 -218 34 -166Z" f={robe} />
            {cuff('M126 -248Q112 -262 100 -252L96 -258Q110 -270 122 -258Z')}
            {hand(118, -262)}
            {pose === 'fans' && (
              <g transform="translate(118 -262) rotate(30)">
                <S d="M0 0L58 -50A76 76 0 0 0 -22 -76Z" f={INK.hoe} tex="tx-hatch" />
                <L d="M0 0L40 -64M0 0L12 -74M0 0L-10 -76" w={2} />
              </g>
            )}
          </g>
        </g>
      );
    case 'lute':
      return (
        <g>
          <g transform="translate(-6 -112) rotate(-38)">
            <S d="M-6 -150L6 -150L5 -30L-5 -30Z" f={INK.brown} k={3} />
            <S d="M-10 -168L10 -168L8 -150L-8 -150Z" f={INK.key} k={2} />
            <S d={circ(0, 0, 46)} f={INK.hoe} tex="tx-swirl" />
            <S d={circ(0, 0, 12)} f={INK.brown} k={2.5} tight />
            <L d="M-2 -150L-2 30M2 -150L2 30" w={1.2} />
          </g>
          <S d="M-46 -184Q-90 -150 -76 -100Q-52 -92 -30 -110Q-26 -150 -30 -170Z" f={robe} />
          <S d="M46 -184Q74 -150 56 -96Q34 -96 18 -118Q30 -150 30 -170Z" f={robe} />
          <g className="a-strum" style={o(20, -112)}>
            {hand(22, -110)}
          </g>
          {hand(-56, -172)}
        </g>
      );
    case 'offer':
      return (
        <g>
          <S d="M-46 -184Q-90 -150 -80 -120Q-48 -116 -14 -128Q-18 -150 -30 -170Z" f={robe} />
          <S d="M46 -184Q90 -150 80 -120Q48 -116 14 -128Q18 -150 30 -170Z" f={robe} />
          {hand(-14, -128)}
          {hand(14, -128)}
        </g>
      );
    case 'brush':
      return (
        <g>
          <S d="M-46 -184Q-90 -150 -80 -100Q-48 -88 -14 -104Q-18 -150 -30 -170Z" f={robe} />
          <g className="a-write" style={o(40, -176)}>
            <S d="M46 -184Q100 -170 104 -132Q90 -118 76 -128Q70 -150 34 -164Z" f={robe} />
            {hand(96, -128)}
            <S d="M96 -128L108 -166L112 -164L100 -126Z" f={INK.brown} k={2} />
          </g>
          {hand(-14, -104)}
        </g>
      );
    case 'bow':
    case 'joined':
    default:
      return (
        <g>
          <S d="M-46 -184Q-88 -150 -80 -96Q-48 -84 -6 -104Q-14 -140 -30 -170Z" f={robe} />
          <S d="M46 -184Q88 -150 80 -96Q48 -84 6 -104Q14 -140 30 -170Z" f={robe} />
          {cuff('M-80 -100Q-48 -88 -6 -108L-6 -100Q-48 -80 -80 -92Z')}
          {cuff('M80 -100Q48 -88 6 -108L6 -100Q48 -80 80 -92Z')}
          <S d="M-12 -118Q0 -128 12 -118Q14 -100 0 -96Q-14 -100 -12 -118Z" f={INK.skin} k={3} />
        </g>
      );
  }
};

export const Person: React.FC<PersonProps> = ({
  x = 0,
  y = 0,
  s = 1,
  robe = INK.son,
  accent = INK.hoe,
  sash = INK.son,
  head = 'khan',
  pose = 'joined',
  tex = 'tx-rings',
  seated,
  flip,
  className,
  style,
  idle = true,
  children,
  robeClass,
}) => {
  const body = seated ? 'M-96 0Q-90 -64 -52 -112Q-44 -188 0 -194Q44 -188 52 -112Q90 -64 96 0Z' : 'M-58 0Q-66 -70 -50 -150Q-42 -188 0 -194Q42 -188 50 -150Q66 -70 58 0Z';
  const hem = seated ? 'M-96 0Q-98 -14 -94 -24Q0 -40 94 -24Q98 -14 96 0Z' : 'M-58 0Q-60 -12 -59 -22Q0 -32 59 -22Q60 -12 58 0Z';
  const faceless = head === 'veil';
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <g className={className} style={style}>
        <g className={idle ? 'a-breathe' : undefined} style={o(0, 0)}>
          <g className={robeClass}>
            <S d={body} f={robe} tex={tex} />
            <S d={hem} f={accent} tex="tx-hatch" />
            <S d="M-26 -191L6 -140L14 -146L-14 -192Z" f={accent} k={3.5} />
            <L d="M26 -191L-2 -150" w={3.5} />
            <S d="M-50 -126Q0 -116 50 -126L49 -112Q0 -102 -49 -112Z" f={sash} k={3.5} />
            <S d="M-6 -110Q-14 -70 -22 -36L-12 -34Q-4 -70 2 -108Z" f={sash} k={3} />
            <S d="M6 -110Q14 -66 26 -40L16 -36Q6 -70 0 -108Z" f={sash} k={3} />
          </g>
          {pose !== 'fans' && pose !== 'wave' && <Sleeves pose={pose} robe={robe} accent={accent} />}
          <g className={idle ? 'a-nod' : undefined} style={o(0, -200)}>
            <S d="M-10 -204L-10 -190L10 -190L10 -204Z" f={INK.skin} k={3} />
            {!faceless && (
              <>
                <S d={ell(-30, -230, 6, 9)} f={INK.skin} k={3} />
                <S d={ell(30, -230, 6, 9)} f={INK.skin} k={3} />
                <S d={ell(0, -230, 30, 34)} f={INK.skin} k={4} />
                <FaceFeatures beard={head === 'emperor' || head === 'scholar'} smile={pose === 'fans'} />
                {head !== 'boy' && head !== 'scholar' && head !== 'topknot' && <K d="M-31 -236Q-33 -268 0 -270Q33 -268 31 -236Q26 -254 0 -256Q-26 -254 -31 -236Z" />}
              </>
            )}
            <HeadWear head={head} accent={accent} />
          </g>
          {(pose === 'fans' || pose === 'wave') && <Sleeves pose={pose} robe={robe} accent={accent} />}
          {children && <g transform="translate(0 -122)">{children}</g>}
        </g>
      </g>
    </g>
  );
};

/** a chubby Đông Hồ child: shaved head with three tufts, red bib, gold bangles */
export const Child: React.FC<{ x?: number; y?: number; s?: number; bib?: string; arms?: 'up' | 'hold' | 'flute' | 'side'; flip?: boolean; className?: string; style?: React.CSSProperties }> = ({
  x = 0,
  y = 0,
  s = 1,
  bib = INK.son,
  arms = 'side',
  flip,
  className,
  style,
}) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <g className={className} style={style}>
      <S d={ell(-16, -12, 13, 14)} f={INK.skin} k={3.5} />
      <S d={ell(16, -12, 13, 14)} f={INK.skin} k={3.5} />
      <S d={ell(0, -54, 38, 42)} f={INK.skin} k={4} />
      <S d="M0 -92L28 -58L0 -22L-28 -58Z" f={bib} tex="tx-dots" />
      {arms === 'up' && (
        <g className="a-cheer" style={o(0, -80)}>
          <S d={ell(-40, -104, 10, 24)} f={INK.skin} k={3.5} />
          <S d={ell(40, -104, 10, 24)} f={INK.skin} k={3.5} />
        </g>
      )}
      {arms === 'side' && (
        <>
          <S d={ell(-38, -60, 10, 22)} f={INK.skin} k={3.5} />
          <S d={ell(38, -60, 10, 22)} f={INK.skin} k={3.5} />
        </>
      )}
      {(arms === 'hold' || arms === 'flute') && (
        <>
          <S d={ell(-26, -72, 18, 9)} f={INK.skin} k={3.5} />
          <S d={ell(26, -72, 18, 9)} f={INK.skin} k={3.5} />
        </>
      )}
      <S d={ell(0, -118, 36, 34)} f={INK.skin} k={4} />
      <L d="M-16 -122q7 -5 13 0M3 -122q7 -5 13 0" w={3} />
      <S d={ell(0, -102, 4, 2.6)} f={INK.son} k={0} tight />
      <S d={circ(-17, -108, 5.5)} f={INK.pink} k={0} tight opacity={0.85} />
      <S d={circ(17, -108, 5.5)} f={INK.pink} k={0} tight opacity={0.85} />
      <K d="M-7 -152q7 -16 14 0q-7 -4 -14 0Z" />
      <K d="M-30 -134q-9 -10 0 -18q5 8 0 18Z" />
      <K d="M30 -134q9 -10 0 -18q-5 8 0 18Z" />
      {arms === 'flute' && <S d="M-10 -100L70 -112L71 -106L-9 -94Z" f={INK.brown} k={2.5} />}
    </g>
  </g>
);

/* ------------------------------------------------------------------ */
/* animals                                                              */
/* ------------------------------------------------------------------ */
export const Buffalo: React.FC<{ x?: number; y?: number; s?: number; flip?: boolean; className?: string; children?: React.ReactNode }> = ({ x = 0, y = 0, s = 1, flip, className, children }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <g className={className}>
      <g className="a-tail" style={o(-148, -128)}>
        <L d="M-148 -128Q-170 -90 -160 -46" w={4} />
        <K d="M-166 -52q6 -4 12 2q-2 14 -8 18q-6 -8 -4 -20Z" />
      </g>
      {[-112, -78, 92, 124].map((lx, i) => (
        <S key={lx} d={`M${lx - 12} -60L${lx - 10} -4L${lx + 10} -4L${lx + 12} -60Z`} f={INK.gray} k={4} className={i % 2 ? 'a-legA' : 'a-legB'} style={o(lx, -60)} />
      ))}
      <S d="M-150 -70Q-162 -150 -60 -162Q60 -172 128 -144Q168 -124 160 -76Q150 -46 118 -46L-118 -46Q-146 -46 -150 -70Z" f={INK.gray} />
      <L d="M-90 -128q20 -20 40 0q-20 20 -40 0zM20 -140q22 -14 40 4M40 -96q30 6 52 -10M-60 -86q24 10 46 0" w={3} />
      <g className="a-nod" style={o(150, -130)}>
        <S d="M146 -144Q200 -156 216 -112Q222 -80 196 -70Q168 -68 156 -96Z" f={INK.gray} />
        <S d="M164 -148Q140 -204 194 -212Q170 -190 182 -152Z" f={INK.diep} k={4} />
        <S d="M190 -144Q214 -196 250 -178Q222 -170 204 -138Z" f={INK.diep} k={4} />
        <K d={circ(186, -118, 4.5)} />
        <L d="M206 -84q6 -2 8 4" w={2.5} />
      </g>
      {children}
    </g>
  </g>
);

export const Crane: React.FC<{ x?: number; y?: number; s?: number; flip?: boolean; className?: string; style?: React.CSSProperties }> = ({ x = 0, y = 0, s = 1, flip, className, style }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <g className={className} style={style}>
      <g className="a-flapB" style={o(-6, -4)}>
        <S d="M-10 -6Q-40 -70 -110 -60Q-70 -40 -40 2Z" f={INK.diep} tex="tx-hatch" />
        <K d="M-110 -60Q-96 -44 -84 -38L-92 -52Z" />
      </g>
      <S d="M-60 4Q-20 -16 30 -6Q50 0 40 10Q0 24 -60 4Z" f={INK.diep} />
      <K d="M-60 4L-92 -6L-80 12Z" />
      <L d="M34 -4Q60 -30 74 -32" w={6} />
      <L d="M34 -4Q60 -30 74 -32" w={3} c={INK.diep} />
      <S d={circ(78, -34, 8)} f={INK.diep} k={3} />
      <S d={circ(80, -40, 4)} f={INK.son} k={0} tight />
      <S d="M84 -34L112 -30L84 -28Z" f={INK.hoe} k={2} />
      <L d="M-40 10L-80 24M-36 12L-74 30" w={3} />
      <g className="a-flapA" style={o(-6, -4)}>
        <S d="M-4 -8Q-20 -90 -90 -100Q-50 -70 -30 0Z" f={INK.diep} tex="tx-hatch" />
        <K d="M-90 -100Q-74 -86 -64 -76L-70 -90Z" />
      </g>
    </g>
  </g>
);

export const Carp: React.FC<{ x?: number; y?: number; s?: number; c?: string; flip?: boolean; className?: string; style?: React.CSSProperties }> = ({ x = 0, y = 0, s = 1, c = INK.son, flip, className, style }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <g className={className} style={style}>
      <g className="a-tailwag" style={o(-66, 0)}>
        <S d="M-66 0L-114 -36Q-98 0 -114 36Z" f={c} tex="tx-hatch" />
      </g>
      <S d="M-72 0Q-40 -42 32 -32Q74 -20 84 0Q74 20 32 32Q-40 42 -72 0Z" f={INK.hoe} tex="tx-scales" />
      <S d="M-10 -36Q10 -60 30 -32Z" f={c} k={3} />
      <S d="M0 26Q10 44 26 30Z" f={c} k={3} />
      <S d={circ(58, -6, 7)} f={INK.diep} k={3} />
      <K d={circ(59, -6, 3)} />
      <L d="M80 6q16 8 22 24" w={2.5} />
    </g>
  </g>
);

export const Deer: React.FC<{ x?: number; y?: number; s?: number; flip?: boolean; className?: string }> = ({ x = 0, y = 0, s = 1, flip, className }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <g className={className}>
      {[-50, -30, 40, 60].map((lx, i) => (
        <S key={lx} d={`M${lx - 5} -60L${lx - 4} -2L${lx + 4} -2L${lx + 5} -60Z`} f={INK.brown} k={3} className={i % 2 ? 'a-legA' : 'a-legB'} style={o(lx, -60)} />
      ))}
      <S d="M-70 -70Q-74 -110 -20 -112Q50 -116 76 -96Q86 -64 60 -56L-56 -56Q-70 -58 -70 -70Z" f={INK.brown} />
      {[-40, -10, 20, 46, -24, 8, 34].map((sx, i) => (
        <S key={i} d={circ(sx, i < 4 ? -96 : -76, 5)} f={INK.diep} k={0} tight />
      ))}
      <S d="M-70 -86q-12 -6 -10 -18q10 4 14 12Z" f={INK.diep} k={3} />
      <g className="a-graze" style={o(66, -100)}>
        <S d="M60 -100Q74 -150 94 -164L110 -150Q92 -130 84 -94Z" f={INK.brown} k={4} />
        <S d="M92 -168Q116 -176 128 -156Q120 -140 104 -144Z" f={INK.brown} k={4} />
        <K d={circ(108, -160, 3)} />
        <L d="M98 -170Q90 -200 104 -220M96 -196q-12 -8 -16 -20M100 -210q10 -6 12 -18M104 -172Q118 -196 140 -204M120 -190q4 -12 0 -22" w={3.4} />
      </g>
    </g>
  </g>
);

/**
 * A living dragon: the spine is a travelling wave, redrawn every frame.
 * Body = key outline + colour + scale-dash; fins and the head follow the spine.
 */
export const Dragon: React.FC<{ x?: number; y?: number; s?: number; len?: number; amp?: number; color?: string; flip?: boolean; speed?: number }> = ({
  x = 0,
  y = 0,
  s = 1,
  len = 620,
  amp = 36,
  color = INK.green,
  flip,
  speed = 1,
}) => {
  const outer = useRef<SVGPathElement>(null);
  const inner = useRef<SVGPathElement>(null);
  const scales = useRef<SVGPathElement>(null);
  const fins = useRef<SVGPathElement>(null);
  const head = useRef<SVGGElement>(null);
  const legs = useRef<SVGPathElement>(null);
  useEffect(() => {
    let raf = 0;
    const N = 36;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = ((now - t0) / 1000) * speed;
      const pts: [number, number][] = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const px = -len / 2 + u * len;
        const taper = 0.35 + 0.65 * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.5);
        pts.push([px, Math.sin(u * 7.2 - t * 2.6) * amp * taper]);
      }
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        d += `Q${pts[i][0]} ${pts[i][1]} ${mx} ${my}`;
      }
      outer.current?.setAttribute('d', d);
      inner.current?.setAttribute('d', d);
      scales.current?.setAttribute('d', d);
      let f = '';
      for (let i = 3; i < N - 2; i += 2) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        const ang = Math.atan2(by - ay, bx - ax);
        const nx = Math.sin(ang), ny = -Math.cos(ang);
        const w = 14 + 8 * Math.sin((i / N) * Math.PI);
        f += `M${ax + nx * w} ${ay + ny * w}L${(ax + bx) / 2 + nx * (w + 22)} ${(ay + by) / 2 + ny * (w + 22)}L${bx + nx * w} ${by + ny * w}Z`;
      }
      fins.current?.setAttribute('d', f);
      let lg = '';
      [9, 25].forEach((i) => {
        const [ax, ay] = pts[i];
        const sw = Math.sin(t * 2.6 + i) * 10;
        lg += `M${ax - 8} ${ay + 10}Q${ax - 4 + sw} ${ay + 40} ${ax + 14 + sw} ${ay + 52}l8 -6l2 10l8 -4`;
      });
      legs.current?.setAttribute('d', lg);
      const [hx, hy] = pts[N];
      const [px, py] = pts[N - 2];
      const ang = (Math.atan2(hy - py, hx - px) * 180) / Math.PI;
      head.current?.setAttribute('transform', `translate(${hx} ${hy}) rotate(${ang})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [len, amp, speed]);
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path ref={legs} fill="none" stroke={INK.key} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" className="ink ink-p4" />
      <path ref={fins} fill={INK.son} stroke={INK.key} strokeWidth={3.5} strokeLinejoin="round" className="ink ink-p1" />
      <path ref={outer} fill="none" stroke={INK.key} strokeWidth={44} strokeLinecap="round" className="ink ink-p4" />
      <path ref={inner} fill="none" stroke={color} strokeWidth={34} strokeLinecap="round" className="ink ink-p2" />
      <path ref={scales} fill="none" stroke={INK.key} strokeWidth={22} strokeDasharray="3 13" strokeLinecap="round" opacity={0.55} className="ink ink-p4" />
      <g ref={head}>
        <S d="M-14 -26Q30 -40 58 -18L70 -6L56 8Q30 30 -14 24Z" f={color} />
        <S d="M50 -2L84 4L62 18Z" f={INK.son} k={3} />
        <S d={circ(30, -12, 8)} f={INK.diep} k={3} />
        <K d={circ(32, -12, 3.6)} />
        <L d="M10 -26Q0 -64 26 -76M24 -30Q24 -60 50 -64" w={4} />
        <S d="M-12 -24Q-30 -50 -6 -60Q-4 -40 8 -30Z" f={INK.son} k={3} />
        <L d="M64 8q24 14 30 40M60 -12q30 -8 48 -30" w={3} className="a-whisker" />
        <S d="M88 -24a10 10 0 1 1 0.1 0Z" f={INK.diep} k={3} className="a-pearl" />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* nature                                                               */
/* ------------------------------------------------------------------ */
/** Đông Hồ curling cloud: lobes along a base, each with a spiral, and a trailing tail */
export function cloudPaths(cx: number, cy: number, w: number, n = 4, seed = 1) {
  const r = rng(seed);
  const step = w / n;
  const base = cy + step * 0.3;
  let d = `M${cx - w / 2} ${base}`;
  let curls = '';
  for (let i = 0; i < n; i++) {
    const x1 = cx - w / 2 + (i + 1) * step;
    const rad = step * (0.58 + r() * 0.18);
    d += `A${rad} ${rad} 0 0 1 ${x1} ${base - (i === n - 1 ? 0 : step * 0.12)}`;
    const lx = cx - w / 2 + (i + 0.5) * step, ly = base - step * 0.42;
    const q = step * 0.26;
    curls += `M${lx + q} ${ly}a${q} ${q} 0 1 0 ${-q * 0.6} ${q * 0.8}a${q * 0.5} ${q * 0.5} 0 1 1 ${q * 0.3} ${-q * 0.45}`;
  }
  d += `Q${cx + w * 0.62} ${base + step * 0.2} ${cx + w * 0.6} ${base + step * 0.5}q-${step * 0.3} -${step * 0.2} -${step * 0.1} -${step * 0.4}`;
  d += `Q${cx} ${base + step * 0.28} ${cx - w / 2} ${base}Z`;
  return { d, curls };
}
export const Cloud: React.FC<{ x: number; y: number; w?: number; n?: number; seed?: number; f?: string; className?: string; style?: React.CSSProperties }> = ({
  x,
  y,
  w = 300,
  n = 4,
  seed = 1,
  f = INK.diep,
  className,
  style,
}) => {
  const c = cloudPaths(x, y, w, n, seed);
  return (
    <g className={className} style={style}>
      <S d={c.d} f={f} k={4.5} />
      <L d={c.curls} w={3.2} />
    </g>
  );
};

export const hump = (x: number, base: number, w: number, h: number) =>
  `M${x - w / 2} ${base}C${x - w / 2} ${base - h * 0.62} ${x - w * 0.24} ${base - h} ${x} ${base - h}C${x + w * 0.24} ${base - h} ${x + w / 2} ${base - h * 0.62} ${x + w / 2} ${base}Z`;
export const Mountain: React.FC<{ x: number; base: number; w: number; h: number; f?: string; trees?: boolean }> = ({ x, base, w, h, f = INK.green, trees = true }) => (
  <g>
    <S d={hump(x, base, w, h)} f={f} />
    <L d={hump(x, base + h * 0.02, w * 0.72, h * 0.74).replace(/Z$/, '')} w={2.6} />
    <L d={hump(x, base + h * 0.02, w * 0.44, h * 0.46).replace(/Z$/, '')} w={2.6} />
    {trees &&
      [-0.16, 0, 0.17].map((k, i) => (
        <g key={i} transform={`translate(${x + w * k} ${base - h * (i === 1 ? 1 : 0.9) + 2})`}>
          <S d="M-10 0Q-12 -18 0 -26Q12 -18 10 0Z" f={INK.green} k={3} />
          <L d="M0 0L0 8" w={3} />
        </g>
      ))}
  </g>
);

export const Waves: React.FC<{ x0?: number; x1?: number; y: number; h?: number; f?: string }> = ({ x0 = -200, x1 = 1800, y, h = 400, f = INK.cham }) => {
  const top = Array.from({ length: Math.ceil((x1 - x0) / 120) }, () => 'q30 -34 60 0q30 -34 60 0').join('');
  return (
    <g>
      <S d={`M${x0} ${y}${top}L${x1 + 120} ${y + h}L${x0} ${y + h}Z`} f={f} tex="tx-wave" />
      <rect x={x0} y={y + 6} width={x1 - x0} height={h} fill="url(#tx-wave-diep)" opacity={0.6} />
    </g>
  );
};

export const Sun: React.FC<{ x: number; y: number; r?: number; className?: string }> = ({ x, y, r = 70, className }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="a-spin-slow">
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 30})`}>
          <S d={`M${-8} ${-r - 8}q8 -26 0 -40q14 12 10 40Z`} f={INK.hoe} k={3} />
        </g>
      ))}
    </g>
    <S d={circ(0, 0, r)} f={INK.son} className={className} />
    <L d={`M${-r * 0.5} 0a${r * 0.5} ${r * 0.5} 0 1 1 ${r * 0.5} ${r * 0.5}a${r * 0.3} ${r * 0.3} 0 1 1 ${-r * 0.3} ${-r * 0.3}`} w={3} c="#f0b49a" />
  </g>
);

export const Moon: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 56 }) => (
  <g transform={`translate(${x} ${y})`} className="a-glow">
    <S d={`M${-r * 0.2} ${-r}a${r} ${r} 0 1 0 ${r * 0.9} ${r * 1.7}a${r * 0.82} ${r * 0.82} 0 1 1 ${-r * 0.9} ${-r * 1.7}Z`} f={INK.hoeLight} />
  </g>
);

export const Bamboo: React.FC<{ x: number; base: number; h?: number; lean?: number; delay?: number }> = ({ x, base, h = 380, lean = 20, delay = 0 }) => {
  const r = rng(Math.round(x * 7 + h));
  const top = [x + lean, base - h] as const;
  return (
    <g className="a-sway" style={{ ...o(x, base), animationDelay: `${delay}s` }}>
      <S d={`M${x - 8} ${base}Q${x - 6 + lean * 0.4} ${base - h * 0.5} ${top[0] - 4} ${top[1]}L${top[0] + 4} ${top[1]}Q${x + 6 + lean * 0.4} ${base - h * 0.5} ${x + 8} ${base}Z`} f={INK.greenLight} k={3.5} />
      {Array.from({ length: 6 }, (_, i) => {
        const t = (i + 1) / 7;
        const nx = x + lean * t * t;
        return <L key={i} d={`M${nx - 8} ${base - h * t}q8 4 16 0`} w={3} />;
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const t = 0.5 + i * 0.12;
        const nx = x + lean * t * t, ny = base - h * t;
        return (
          <g key={i} transform={`translate(${nx} ${ny})`}>
            {[-150, -120, -30, 10, 40].map((a, j) => (
              <S key={j} d="M0 0q22 -7 50 2q-24 9 -50 -2Z" f={INK.green} k={2.6} style={{ transform: `rotate(${a + (r() - 0.5) * 30}deg)` }} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

export const Lotus: React.FC<{ x: number; y: number; s?: number; open?: boolean }> = ({ x, y, s = 1, open = true }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <L d="M0 0Q-6 50 4 110" w={5} c={INK.green} />
    {open ? (
      <g className="a-bob">
        {[-56, -28, 28, 56].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <S d="M0 0Q-22 -34 0 -74Q22 -34 0 0Z" f={INK.pink} k={3.5} />
            <L d="M0 -6L0 -60" w={1.8} />
          </g>
        ))}
        <S d="M0 0Q-24 -40 0 -84Q24 -40 0 0Z" f={INK.pink} k={3.5} />
        <S d="M-14 -16L14 -16L10 -4L-10 -4Z" f={INK.hoe} k={2.5} tight />
      </g>
    ) : (
      <S d="M0 0Q-20 -30 0 -62Q20 -30 0 0Z" f={INK.pink} k={3.5} />
    )}
  </g>
);

export const LotusLeaf: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 60 }) => (
  <g transform={`translate(${x} ${y})`}>
    <S d={ell(0, 0, r, r * 0.38)} f={INK.green} />
    <L d={`M0 0L${-r * 0.8} ${-r * 0.1}M0 0L${r * 0.8} ${-r * 0.1}M0 0L${-r * 0.4} ${r * 0.3}M0 0L${r * 0.4} ${r * 0.3}M0 0L0 ${-r * 0.35}`} w={2.2} />
  </g>
);

export const Pine: React.FC<{ x: number; base: number; s?: number }> = ({ x, base, s = 1 }) => (
  <g transform={`translate(${x} ${base}) scale(${s})`}>
    <S d="M-12 0Q-20 -90 6 -170Q4 -120 14 0Z" f={INK.brown} />
    {[
      [-60, -170, 90],
      [40, -150, 110],
      [-30, -110, 100],
      [50, -90, 80],
      [0, -205, 80],
    ].map(([px, py, w], i) => (
      <S key={i} d={`M${px - w / 2} ${py}Q${px} ${py - 34} ${px + w / 2} ${py}Q${px} ${py - 10} ${px - w / 2} ${py}Z`} f={INK.green} tex="tx-hatch" />
    ))}
  </g>
);

/* ------------------------------------------------------------------ */
/* things                                                               */
/* ------------------------------------------------------------------ */
export const Lantern: React.FC<{ x: number; y: number; s?: number; delay?: number; className?: string }> = ({ x, y, s = 1, delay = 0, className = 'a-swing' }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className={className} style={{ ...o(0, -60), animationDelay: `${delay}s` }}>
      <L d="M0 -60L0 -34" w={3} />
      <S d={ell(0, 0, 30, 36)} f={INK.son} />
      <L d="M-14 -32Q-24 0 -14 32M14 -32Q24 0 14 32M0 -36L0 36" w={2.4} />
      <S d="M-14 -40L14 -40L12 -32L-12 -32Z" f={INK.hoe} k={2.5} />
      <S d="M-14 32L14 32L12 40L-12 40Z" f={INK.hoe} k={2.5} />
      <L d="M-8 40l0 22M0 40l0 26M8 40l0 22" w={2.4} c={INK.hoe} />
      <circle r={44} fill="url(#glow-gold)" className="a-glow" opacity={0.55} />
    </g>
  </g>
);

export const Candle: React.FC<{ x: number; y: number; s?: number; delay?: number }> = ({ x, y, s = 1, delay = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cy={-70} r={34} fill="url(#glow-gold)" className="a-glow" />
    <S d="M-9 0L-9 -52L9 -52L9 0Z" f={INK.son} k={3} />
    <S d="M-20 0L20 0L14 8L-14 8Z" f={INK.hoe} k={3} />
    <g className="a-flame" style={{ ...o(0, -54), animationDelay: `${delay}s` }}>
      <S d="M0 -54Q-12 -66 0 -92Q12 -66 0 -54Z" f={INK.hoe} k={2.5} tight />
      <path d="M0 -58Q-5 -66 0 -78Q5 -66 0 -58Z" fill="#fff4cf" />
    </g>
  </g>
);

export const Roof: React.FC<{ x: number; y: number; w: number; h?: number; f?: string }> = ({ x, y, w, h = 70, f = INK.sonDeep }) => (
  <g transform={`translate(${x} ${y})`}>
    <S d={`M${-w / 2 - 50} 6Q${-w / 2 - 20} 22 ${-w / 2 + 10} 12L${-w / 2 + 50} ${-h}L${w / 2 - 50} ${-h}L${w / 2 - 10} 12Q${w / 2 + 20} 22 ${w / 2 + 50} 6Q${w / 2 + 14} 44 ${w / 2 - 30} 34L${-w / 2 + 30} 34Q${-w / 2 - 14} 44 ${-w / 2 - 50} 6Z`} f={f} tex="tx-scales" />
    <S d={`M${-w / 2 + 40} ${-h - 10}L${w / 2 - 40} ${-h - 10}L${w / 2 - 40} ${-h + 2}L${-w / 2 + 40} ${-h + 2}Z`} f={INK.gray} k={3.5} />
    {/* đao: the curling ridge ends */}
    <S d={`M${-w / 2 - 50} 6q-26 -18 -20 -52q12 18 30 20q-14 12 -10 32Z`} f={INK.green} k={3.5} />
    <S d={`M${w / 2 + 50} 6q26 -18 20 -52q-12 18 -30 20q14 12 10 32Z`} f={INK.green} k={3.5} />
    <S d={`M-40 ${-h - 10}q-6 -30 20 -40q-6 20 10 40Z`} f={INK.green} k={3} />
    <S d={`M40 ${-h - 10}q6 -30 -20 -40q6 20 -10 40Z`} f={INK.green} k={3} />
    <S d={circ(0, -h - 30, 16)} f={INK.son} k={3} />
  </g>
);

export const TempleFront: React.FC<{ x: number; y: number; s?: number; name?: string; doors?: number; night?: boolean }> = ({ x, y, s = 1, name, doors = 3 }) => {
  const w = 220 * doors + 80;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <S d={`M${-w / 2 - 30} 0L${w / 2 + 30} 0L${w / 2 + 30} 30L${-w / 2 - 30} 30Z`} f={INK.gray} tex="tx-hatch" />
      <S d={`M${-w / 2} 0L${-w / 2} -230L${w / 2} -230L${w / 2} 0Z`} f={INK.hoeLight} />
      {Array.from({ length: doors }, (_, i) => {
        const cx = -w / 2 + 40 + 110 + i * 220;
        return (
          <g key={i}>
            <S d={`M${cx - 70} 0L${cx - 70} -170Q${cx} -200 ${cx + 70} -170L${cx + 70} 0Z`} f={INK.son} tex="tx-rings" />
            <L d={`M${cx} 0L${cx} -184`} w={3} />
          </g>
        );
      })}
      {Array.from({ length: doors + 1 }, (_, i) => {
        const px = -w / 2 + 40 + i * 220 - 0;
        return <S key={i} d={`M${px - 14} 0L${px - 14} -236L${px + 14} -236L${px + 14} 0Z`} f={INK.sonDeep} k={3.5} />;
      })}
      <Roof x={0} y={-236} w={w + 40} h={80} />
      <Roof x={0} y={-340} w={w * 0.55} h={70} />
      <S d="M-130 -300L130 -300L130 -262L-130 -262Z" f={INK.son} k={4} />
      {name && (
        <text y={-273} textAnchor="middle" fontSize={24} fontWeight={700} fill={INK.hoeLight} fontFamily="'Noto Serif', serif" className="ink ink-p4">
          {name}
        </text>
      )}
    </g>
  );
};

/** five-element temple flags (cờ ngũ hành) on a pole, fluttering */
export const Flag: React.FC<{ x: number; base: number; h?: number; c?: string; delay?: number }> = ({ x, base, h = 260, c = INK.son, delay = 0 }) => (
  <g>
    <L d={`M${x} ${base}L${x} ${base - h}`} w={5} />
    <g className="a-flutter" style={{ ...o(x, base - h), animationDelay: `${delay}s` }}>
      <S d={`M${x} ${base - h}L${x + 90} ${base - h + 30}L${x} ${base - h + 90}Z`} f={c} tex="tx-hatch" />
      <L d={`M${x + 4} ${base - h + 90}l10 18l10 -14l10 16`} w={2.5} c={INK.hoe} />
    </g>
  </g>
);

export const Throne: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <S d="M-120 0L-120 -300Q-120 -330 -90 -330L90 -330Q120 -330 120 -300L120 0Z" f={INK.son} tex="tx-swirl" />
    <S d="M-140 -300q-20 -30 0 -60q20 10 20 40Z" f={INK.hoe} k={3.5} />
    <S d="M140 -300q20 -30 0 -60q-20 10 -20 40Z" f={INK.hoe} k={3.5} />
    <S d="M-150 0L150 0L150 30L-150 30Z" f={INK.hoe} tex="tx-hatch" />
  </g>
);

export const Envelope: React.FC<{ x: number; y: number; delay?: number; className?: string }> = ({ x, y, delay = 0, className = 'a-fall' }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className={className} style={{ animationDelay: `${delay}s` }}>
      <S d="M-14 -20L14 -20L14 20L-14 20Z" f={INK.son} k={3} />
      <S d="M-8 -6L8 -6L8 6L-8 6Z" f={INK.hoe} k={0} tight />
    </g>
  </g>
);

export const House: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <S d="M-170 0L-170 -130L170 -130L170 0Z" f={INK.hoeLight} tex="tx-hatch" />
    <S d="M-40 0L-40 -100L40 -100L40 0Z" f={INK.brown} k={4} />
    <S d="M-130 -60L-80 -60L-80 -100L-130 -100Z" f={INK.key} k={3} />
    <S d="M-220 -120L0 -250L220 -120Z" f="#a8834f" tex="tx-hatch" />
    <L d="M-220 -120L0 -250L220 -120" w={6} />
  </g>
);
