/** Motion for the legend film. Kept in one place so the drawings stay readable. */
export const FILM_CSS = `
/* beats fade in and out with the narration */
.beat { opacity: 0; transition: opacity 1.1s ease; }
.beat.on { opacity: 1; }
.beat.slow { transition-duration: 2.2s; }

/* the woodblock press: yellow, red, green, indigo, then the black key block */
@keyframes press { 0% { opacity: 0 } 55% { opacity: .9 } 100% { opacity: 1 } }
.printing .ink-p0 { animation: press .5s .1s both; }
.printing .ink-p1 { animation: press .5s .45s both; }
.printing .ink-p2 { animation: press .5s .8s both; }
.printing .ink-p3 { animation: press .5s 1.1s both; }
.printing .ink-p4 { animation: press .55s 1.45s both; }

.titlecard { opacity: 0; transition: opacity .9s ease; }
.titlecard.on { opacity: 1; }

.glint { animation: glint 5s ease-in-out infinite alternate; }
@keyframes glint { from { opacity: .35 } to { opacity: .85 } }

.film-paused [class*="a-"] { animation-play-state: paused !important; }

/* life */
.a-breathe { animation: breathe 3.4s ease-in-out infinite alternate; }
@keyframes breathe { from { transform: scaleY(1) } to { transform: scaleY(1.014) } }
.a-nod { animation: nod 4.6s ease-in-out infinite alternate; }
@keyframes nod { from { transform: rotate(-2.2deg) } to { transform: rotate(2.2deg) } }
.a-tassel { animation: tassel 2.2s ease-in-out infinite alternate; }
@keyframes tassel { from { transform: rotate(-5deg) } to { transform: rotate(5deg) } }
.a-armL { animation: armL 1.1s ease-in-out infinite alternate; }
.a-armR { animation: armR 1.1s ease-in-out infinite alternate; animation-delay: .55s; }
@keyframes armL { from { transform: rotate(6deg) } to { transform: rotate(-16deg) } }
@keyframes armR { from { transform: rotate(-6deg) } to { transform: rotate(16deg) } }
.a-strum { animation: strum .32s ease-in-out infinite alternate; }
@keyframes strum { from { transform: rotate(-12deg) } to { transform: rotate(10deg) } }
.a-write { animation: write 1.3s ease-in-out infinite alternate; }
@keyframes write { from { transform: rotate(-7deg) } to { transform: rotate(5deg) } }
.a-tail { animation: tail 1.6s ease-in-out infinite alternate; }
@keyframes tail { from { transform: rotate(-10deg) } to { transform: rotate(14deg) } }
.a-legA { animation: leg 1.1s ease-in-out infinite alternate; }
.a-legB { animation: leg 1.1s ease-in-out infinite alternate-reverse; }
@keyframes leg { from { transform: rotate(-5deg) } to { transform: rotate(5deg) } }
.a-plod { animation: plod .55s ease-in-out infinite alternate; }
@keyframes plod { from { transform: translateY(0) } to { transform: translateY(-4px) } }
.a-flapA { animation: flapA .5s ease-in-out infinite alternate; }
.a-flapB { animation: flapB .5s ease-in-out infinite alternate; }
@keyframes flapA { from { transform: rotate(-8deg) } to { transform: rotate(34deg) } }
@keyframes flapB { from { transform: rotate(8deg) } to { transform: rotate(-26deg) } }
.a-fly { animation: fly 3.4s ease-in-out infinite alternate; }
@keyframes fly { from { transform: translate(0,0) } to { transform: translate(-70px,-26px) } }
.a-tailwag { animation: wag .45s ease-in-out infinite alternate; }
@keyframes wag { from { transform: rotate(-14deg) } to { transform: rotate(14deg) } }
.a-graze { animation: graze 3.2s ease-in-out infinite alternate; }
@keyframes graze { 0%, 30% { transform: rotate(0) } 100% { transform: rotate(34deg) } }
.a-whisker { animation: whisker 1s ease-in-out infinite alternate; }
@keyframes whisker { from { transform: translateY(-2px) } to { transform: translateY(3px) } }
.a-pearl { transform-box: fill-box; transform-origin: center; animation: pulse 1.4s ease-in-out infinite alternate; }
.a-drift { animation: drift 15s ease-in-out infinite alternate; }
.a-drift2 { animation: drift 18s ease-in-out infinite alternate-reverse; }
@keyframes drift { from { transform: translateX(-46px) } to { transform: translateX(46px) } }
.a-spin-slow { animation: spin 46s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }
.a-glow { animation: glow 2.6s ease-in-out infinite alternate; }
@keyframes glow { from { opacity: .5 } to { opacity: 1 } }
.a-sway { animation: sway 3.6s ease-in-out infinite alternate; }
@keyframes sway { from { transform: rotate(-2.4deg) } to { transform: rotate(2.4deg) } }
.a-bob { animation: bob 2.4s ease-in-out infinite alternate; }
@keyframes bob { from { transform: translateY(0) } to { transform: translateY(-6px) } }
.a-swing { animation: swing 2.8s ease-in-out infinite alternate; }
@keyframes swing { from { transform: rotate(-6deg) } to { transform: rotate(6deg) } }
.a-flame { animation: flame .42s ease-in-out infinite alternate; }
@keyframes flame { from { transform: scale(1,1) } to { transform: scale(.86,1.14) } }
.a-smoke { stroke-dasharray: 46 26; animation: smoke 3.4s linear infinite; }
@keyframes smoke { from { stroke-dashoffset: 0; opacity: .8 } to { stroke-dashoffset: -144; opacity: .5 } }
.a-flutter { animation: flutter .9s ease-in-out infinite alternate; }
@keyframes flutter { from { transform: rotate(-5deg) scaleX(1) } to { transform: rotate(4deg) scaleX(.86) } }
.a-fall { animation: fall 4.4s linear infinite both; }
@keyframes fall { from { transform: translateY(0) rotate(0) } to { transform: translateY(1020px) rotate(320deg) } }
.a-hover { animation: hover 2.8s ease-in-out infinite alternate; }
@keyframes hover { from { transform: translateY(0) } to { transform: translateY(-14px) } }
.a-rain { animation: rain .45s linear infinite; }
@keyframes rain { from { transform: translateY(0); opacity: 1 } to { transform: translateY(16px); opacity: .4 } }
.a-flash { animation: flash 2.4s steps(1) infinite; }
@keyframes flash { 0%, 50%, 100% { opacity: 1 } 25%, 70% { opacity: .15 } }
.a-drum { transform-box: fill-box; transform-origin: center; animation: pulse .45s ease-in-out infinite alternate; }
.a-drumskin { transform-box: fill-box; transform-origin: center; animation: drumskin .3s ease-in-out infinite alternate; }
@keyframes drumskin { from { transform: scaleY(1) } to { transform: scaleY(.8) } }
.a-pulse { animation: pulse 2.2s ease-in-out infinite alternate; }
@keyframes pulse { from { transform: scale(1) } to { transform: scale(1.04) } }
.a-notes text, .a-note { animation: note 3.2s ease-out infinite both; }
.a-notes text:nth-child(2) { animation-delay: 1.4s; }
.a-notes text:nth-child(3) { animation-delay: .7s; }
.a-notes text:nth-child(4) { animation-delay: 2.1s; }
@keyframes note { 0% { opacity: 0; transform: translate(0,0) } 20% { opacity: 1 } 100% { opacity: 0; transform: translate(34px,-170px) } }
.a-walkL { animation: walkL 6.3s ease-in-out infinite both; }
.a-walkR { animation: walkR 6.3s ease-in-out infinite both; }
@keyframes walkL { 0% { opacity: 0; transform: translate(0,0) } 12% { opacity: 1 } 88% { opacity: 1 } 100% { opacity: 0; transform: translate(-560px,-70px) } }
@keyframes walkR { 0% { opacity: 0; transform: translate(0,0) } 12% { opacity: 1 } 88% { opacity: 1 } 100% { opacity: 0; transform: translate(560px,40px) } }
.a-cheer { animation: cheer .5s ease-in-out infinite alternate; }
@keyframes cheer { from { transform: translateY(0) } to { transform: translateY(-8px) } }
.a-cupfall { animation: cupfall 1.8s cubic-bezier(.5,0,1,.6) .7s both; }
@keyframes cupfall { 0% { transform: translate(0,0) rotate(0) } 96% { opacity: 1 } 100% { transform: translate(-14px,104px) rotate(170deg); opacity: 0 } }
.a-burst { animation: burst .7s cubic-bezier(.2,1.6,.4,1) 2.4s both; }
@keyframes burst { from { transform: scale(0); opacity: 0 } to { transform: scale(1); opacity: 1 } }
.a-shard { animation: shard 1s ease-out 2.45s both; }
@keyframes shard { from { opacity: 0; transform: translate(0,110px) rotate(0) } to { opacity: 1; transform: translate(var(--dx), calc(110px + var(--dy))) rotate(220deg) } }
.a-descend { animation: descend 6.6s cubic-bezier(.45,.05,.4,1) .3s both; }
@keyframes descend { from { transform: translateY(0) } to { transform: translateY(1060px) } }
.a-ascend { animation: ascend 7.5s ease-in 1s both; }
@keyframes ascend { 0% { transform: translateY(0); opacity: 1 } 100% { transform: translateY(-1100px); opacity: 0 } }
.a-bowdown { animation: bowdown 2.6s ease-in-out infinite alternate; }
@keyframes bowdown { from { transform: scaleY(1) } to { transform: scaleY(.9) } }
.a-walkacross { animation: walkacross 22s linear both; }
@keyframes walkacross { from { transform: translateX(0) } to { transform: translateX(1250px) } }
.a-float { animation: float 3s ease-in-out infinite alternate; }
@keyframes float { from { transform: translateY(0) rotate(-1deg) } to { transform: translateY(-18px) rotate(2deg) } }
.a-pop { transform-box: fill-box; transform-origin: center; animation: pop .9s cubic-bezier(.2,1.5,.4,1) both; }
@keyframes pop { from { opacity: 0; transform: scale(.3) } to { opacity: 1; transform: scale(1) } }
.a-jump { animation: jump 3.4s ease-in-out infinite; }
@keyframes jump { 0%, 25% { transform: translate(0,0) rotate(0) } 55% { transform: translate(70px,-170px) rotate(-28deg) } 85%, 100% { transform: translate(150px,10px) rotate(38deg); opacity: 0 } }
.a-robes > g:first-child > path:first-child { animation: robes 6s steps(1) infinite; }
@keyframes robes { 0% { fill: #b8382b } 25% { fill: #4f8763 } 50% { fill: #f3ead6 } 75% { fill: #e2b33b } }
.a-veilspin { animation: veilspin 1.8s linear infinite; }
@keyframes veilspin { from { transform: rotate(0) scale(1) } 50% { transform: rotate(180deg) scale(1.25) } to { transform: rotate(360deg) scale(1) } }
.a-dance { animation: dance 2.4s ease-in-out infinite alternate; }
@keyframes dance { from { transform: rotate(-5deg) translateX(-26px) } to { transform: rotate(5deg) translateX(26px) } }
.a-floatx { animation: floatx 30s linear infinite both; }
@keyframes floatx { from { transform: translateX(0) } to { transform: translateX(2000px) } }
.a-rise { animation: rise 10s ease-in infinite both; }
@keyframes rise { 0% { transform: translateY(0); opacity: 0 } 10% { opacity: 1 } 100% { transform: translateY(-1150px); opacity: .25 } }

@media (prefers-reduced-motion: reduce) {
  [class*="a-"], .printing .ink { animation-duration: .01s !important; animation-iteration-count: 1 !important; }
}
`;
