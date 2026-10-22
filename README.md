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

**Navigation.** Esc, the browser back button and Android's back gesture always step back one level.

## Run

```bash
bun install   # or npm install
bun run dev
```

Optional: set `GEMINI_API_KEY` (see `.env.example`) so the temple keeper can answer free-form questions through
`api/keeper.ts`. Without it she uses built-in answers.

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
