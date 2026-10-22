# Phủ Vân Thủy

A 3D, first-person visit to a fictional Vietnamese Mother Goddess temple (Đạo Mẫu, the Four Palaces).
Works on phone and PC.

**Story.** Tonight the temple should hold a *hầu đồng* ceremony, but the four sacred scarves have vanished
into the Four Palaces. Talk to Bà Thủ Từ, the temple keeper, then find your way into each realm:

| Palace | Colour | Way in | Trial |
| --- | --- | --- | --- |
| Thiên phủ (Heaven) | red | strike the great bell | gather the shards of Liễu Hạnh's jade cup |
| Nhạc phủ / Thượng Ngàn (Mountains & Forests) | green | the grotto west of the hall | follow the fireflies to three forest gifts |
| Thoải phủ (Water) | white | the half-moon lotus pond | find three pearls |
| Địa phủ (Earth) | yellow | between the banyan's roots | light three lanterns for the ancestors |

Bring all four home and the hầu đồng begins at the altar.

**Rituals.** Thắp hương (incense, odd numbers), khấn and gieo quẻ âm dương (two coins), xin xăm (fortune sticks),
viết & hóa sớ (write and burn a petition), thỉnh bùa / nhận lộc (charms and blessed gifts).

**Phúc.** Real temple etiquette counts: side gates and doors (the centre is for the gods), stepping over thresholds,
walking calmly, odd-numbered incense, not hoarding lộc. Good manners and discoveries build phúc, which tilts the fortune sticks.

**On PC.** ↑ ↓ walk, ← → turn (or WASD), Shift to hurry, PgUp/PgDn to look up and down. Click the view to capture
the mouse and look around freely (Esc releases it). Click a golden marker to travel there; E or Enter uses what's in front
of you. B to vái, J journal, T secret trail, F the legend film, M minimap, ? for all keys. Settings: mouse sensitivity,
invert Y, field of view, graphics quality, minimap.

**The secret trail.** Twelve secrets of the grounds wake one at a time. The tracker (top left) shows the current riddle
and a warmth meter; a golden shimmer appears when you're close. Two secrets only show themselves at night.

**The legend film.** At the water-puppet pavilion (thủy đình) on the lotus pond, or from the landing page and the journal:
a ~5-minute film drawn as Đông Hồ woodblock prints (colour blocks pressed one pigment at a time, printed title cards, camera moves, pentatonic score) about the real history and legends of the Mother Goddesses, from the old
mother cults and Âu Cơ to Liễu Hạnh, hầu đồng and UNESCO's 2016 recognition. Narrated by the browser's synthesized
voice in English or Vietnamese (where a Vietnamese voice is installed), with bilingual subtitles.

**Language.** All signs, couplets and plaques are in Vietnamese (quốc ngữ), with English alongside in the interface.

**Floating lanterns.** At the river landing you can set a lotus lantern (đèn hoa đăng) on the water with a wish,
and watch it drift away. Lovelier at night.

**Living temple.** You arrive by boat up the misty river (Space skips). A firefly drifts beside you: press G (or "Guide me") and it flies ahead to your next step or the current secret. Other visitors walk the grounds and pray; the soundscape follows the time of day.

**A living temple on the real calendar.** Day, dusk and night follow the visitor's own clock ("Live" in the Time tab;
choosing a time by hand turns it off). The temple keeps the Vietnamese lunar calendar (computed for UTC+7): the date
chip shows today's âm lịch date, and on festival days the grounds change, with Tết peach blossoms and lanterns,
Rằm tháng Giêng lanterns, Giỗ Mẫu five-colour flags, Vu Lan lights on the river, Trung Thu star lanterns, carp for
Ông Công Ông Táo, and busier courtyards on every new and full moon. Each festival has one activity (once per year, for
phúc). Preview any day with `?date=YYYY-MM-DD`, e.g. `?date=2026-02-17` for Tết.

**Afternoon and night in the hall.** By day, golden shafts of sun and drifting dust come through the open doors onto
crimson silk, brass plates and banana-leaf offerings; teacups clink at the keeper's table, birds sing in the banyan and
someone practises the moon lute. At night the world beyond the doors goes black; red altar candles pulse, a low oil lamp
sways, the Mothers' statues throw towering shadows up the back wall, and a trống văn heartbeat echoes off the stone.
Look up into a Mother's face for too long at night and the edges of the world begin to blur and ripple.

**Hầu đồng.** Held in the main hall on a real schedule (mornings, evenings, longer on the 1st/15th, in the spring and
autumn seasons, and all day on great festivals; see the calendar). Kneel on the mat inside the hall to watch it in 3D:
five spirits in turn, each with their own costume, props, dance and coloured aura; keep the beat with the phách to make
the aura bloom, or just watch.

**Thanh đồng.** Touch the medium during a hầu đồng and they stop and turn to you. Touch them again and you are inside:
the red veil over your eyes, the hall dark and muffled, your own heart too loud, shapes with candle eyes gathering round
the mat and whispering. A voice tells you to breathe with the drum (hold Space or the mouse) and let Her in. Then the veil
is thrown off, you spin through the spirit's dance and scatter lộc to the shapes, now kneeling, until She leaves all at
once and you wake on the mat. Nothing can be failed, and Esc wakes you at any time.

**Rituals by hand.** Incense: pick sticks from the vase, hold them in the candle flame, raise and bow three times, plant
them in the ash. Fortune sticks: shake the tube (drag or ← →) until a stick falls, then ask the coins.

**Saving.** Everything saves automatically in the browser, including where you stood. Returning visitors reappear
where they left off; first-time visitors arrive by boat.

**Navigation.** Esc, the browser back button and Android's back gesture always step back one level.

## Run

```bash
bun install   # or npm install
bun run dev
```

Optional: set `GEMINI_API_KEY` (see `.env.example`) so the temple keeper can answer free-form questions through
`api/keeper.ts`. Without it she uses built-in answers. On Vercel it runs as a serverless function; in `dev`, Vite
serves the same handler at `/api/keeper` (export the key in your shell first, e.g. `GEMINI_API_KEY=… bun run dev`).
The itch.io build has no server: point it at your Vercel deployment with `VITE_KEEPER_URL=https://…/api/keeper`.

Phủ Vân Thủy is fictional, made with respect for Đạo Mẫu, whose rituals UNESCO recognised as Intangible Cultural Heritage in 2016.

## Publishing on itch.io

1. `npm run build:itch` (or `npm run build` and zip the *contents* of `dist/`, with `index.html` at the top level).
2. On itch.io: **Create new project** → Kind of project: **HTML** → upload `phu-van-thuy-itch.zip` →
   tick **This file will be played in the browser**.
3. Embed options: viewport **1280 × 720**, tick **Fullscreen button** and **Click to launch in fullscreen**
   (recommended for mouse-look), and **Mobile friendly** if you want phones too.
4. The temple keeper's AI replies need the Vercel API. To use it from itch, build with
   `VITE_KEEPER_URL=https://<your-vercel-app>/api/keeper npm run build:itch`; without it she answers from her
   built-in knowledge. Progress is saved in the player's browser (itch's game domain).
