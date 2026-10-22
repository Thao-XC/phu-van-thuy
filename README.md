# Phủ Vân Thủy 雲水府

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

**On PC.** Click the view to capture the mouse and look around freely (Esc releases it). WASD to walk, E to use,
B to vái, J for the journal, M for the minimap, ? for all keys. Settings: mouse sensitivity, invert Y, field of view,
graphics quality, minimap.

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
