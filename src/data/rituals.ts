/**
 * Rituals of the temple: fortune sticks (xăm), the two-coin answer (âm dương),
 * and the lộc and amulets you can receive at the table.
 */

export type XamTier = 'thuong-thuong' | 'thuong' | 'trung' | 'ha';

export const XAM_TIER: Record<XamTier, { vi: string; en: string; color: string }> = {
  'thuong-thuong': { vi: 'Thượng thượng', en: 'Excellent', color: '#b91c1c' },
  thuong: { vi: 'Thượng', en: 'Good', color: '#c2410c' },
  trung: { vi: 'Trung bình', en: 'Middling', color: '#a16207' },
  ha: { vi: 'Hạ', en: 'Wait and be patient', color: '#475569' },
};

export interface Xam {
  n: number;
  tier: XamTier;
  image: string;
  verse: [string, string];
  reading: string;
  love: string;
  work: string;
  health: string;
}

/** Original verses written for this temple, in the spirit of temple fortune sticks */
export const XAM: Xam[] = [
  { n: 1, tier: 'thuong-thuong', image: 'The moon rises over the river', verse: ['The moon climbs clear above the river bend,', 'and every boat finds its way home.'], reading: 'What has been unclear becomes bright. A good time to begin.', love: 'A meeting turns into something lasting.', work: 'Your effort is finally seen.', health: 'Strong and calm.' },
  { n: 2, tier: 'thuong', image: 'A carp leaps the falls', verse: ['The carp tries the falls a hundred times;', 'on the hundred-and-first, it flies.'], reading: 'Persistence pays. Do not stop one step before success.', love: 'Keep showing up; patience is noticed.', work: 'An exam or test goes your way.', health: 'Build strength little by little.' },
  { n: 3, tier: 'trung', image: 'Rice in the nursery bed', verse: ['Young rice waits in the nursery bed,', 'not yet ready for the open field.'], reading: 'Prepare now; your time to be planted out will come.', love: 'Do not hurry it.', work: 'Learn more before you leap.', health: 'Rest well this season.' },
  { n: 4, tier: 'thuong-thuong', image: 'Lotus above the mud', verse: ['Out of black mud, a clean white flower;', 'what is pure is not stained by where it grows.'], reading: 'Your honesty protects you. Hard surroundings will not change you.', love: 'Someone sees your true heart.', work: 'Integrity wins the day.', health: 'Recovery is near.' },
  { n: 5, tier: 'ha', image: 'Clouds over the mountain pass', verse: ['Thick clouds sit on the mountain pass;', 'the traveller waits at the inn.'], reading: 'Not the moment to cross. Wait for the weather to clear.', love: 'Leave room for misunderstandings to settle.', work: 'Delay a big decision.', health: 'Do not overwork; sleep.' },
  { n: 6, tier: 'thuong', image: 'Swallows return in spring', verse: ['The swallows come back to the old eaves,', 'and the house is glad again.'], reading: 'What left you will return, or something better in its place.', love: 'An old bond is renewed.', work: 'A former connection opens a door.', health: 'Spirits lift with the season.' },
  { n: 7, tier: 'trung', image: 'A boat against the current', verse: ['Rowing upstream is slow and hard,', 'but the far bank does come closer.'], reading: 'Progress is slow but real. Pace yourself.', love: 'Small gestures count.', work: 'Steady work, slow reward.', health: 'Mind your back and shoulders.' },
  { n: 8, tier: 'thuong-thuong', image: 'Phoenix on the parasol tree', verse: ['The phoenix settles on the parasol tree:', 'a sign that peace has come.'], reading: 'A very good sign. Harmony at home and luck abroad.', love: 'A match blessed by both families.', work: 'Promotion or recognition.', health: 'Excellent.' },
  { n: 9, tier: 'ha', image: 'A lantern in the wind', verse: ['A paper lantern in the wind', 'flickers, but has not gone out.'], reading: 'Things are fragile. Protect what matters most.', love: 'Speak gently; words can wound now.', work: 'Double-check before signing.', health: 'Keep warm, avoid excess.' },
  { n: 10, tier: 'thuong', image: 'Betel and areca', verse: ['A betel leaf, an areca nut:', 'small things that begin every conversation.'], reading: 'Start with courtesy and the rest follows.', love: 'Be the first to reach out.', work: 'A friendly word opens a deal.', health: 'Good, if you eat simply.' },
  { n: 11, tier: 'trung', image: 'The banyan in the dry season', verse: ['In the dry season the banyan drops its leaves', 'and keeps its roots deep.'], reading: 'Let go of what is not needed. Your roots are fine.', love: 'Simplify; what is real remains.', work: 'Cut what drains you.', health: 'Drink water, rest.' },
  { n: 12, tier: 'thuong-thuong', image: 'Golden rice at harvest', verse: ['The fields turn gold from edge to edge;', 'every hand is full at harvest.'], reading: 'The work you planted earlier is ready to be gathered.', love: 'A happy announcement.', work: 'Reward arrives.', health: 'Full of energy.' },
  { n: 13, tier: 'ha', image: 'Crossing the river at night', verse: ['No moon, and the ferryman is asleep:', 'do not cross the river tonight.'], reading: 'Avoid risks for now. Morning brings a better boat.', love: 'Wait before deciding.', work: 'Do not gamble.', health: 'Be careful on the road.' },
  { n: 14, tier: 'thuong', image: 'The bell of a distant pagoda', verse: ['A bell from a far-off pagoda', 'reaches the field and the worker stands straight.'], reading: 'Guidance is coming from an unexpected place. Listen.', love: 'Advice from an elder helps.', work: 'A mentor appears.', health: 'Peace of mind restores the body.' },
  { n: 15, tier: 'trung', image: 'The half-moon pond', verse: ['Half the moon lies in the pond,', 'half still hangs in the sky.'], reading: 'You have half of what you want. Be grateful, and keep going.', love: 'Meet each other halfway.', work: 'Half done is not done.', health: 'Balance work and rest.' },
  { n: 16, tier: 'thuong-thuong', image: 'Dragon over the water', verse: ['The dragon rises from the deep water', 'and rain falls on every field.'], reading: 'Great energy and wide benefit. Act generously.', love: 'Bold and sincere wins.', work: 'Lead, and others follow.', health: 'Vigorous.' },
  { n: 17, tier: 'ha', image: 'A broken jade cup', verse: ['A jade cup falls and breaks;', 'but the one who broke it learns something new.'], reading: 'A loss now becomes a lesson and a new beginning.', love: 'Apologise first.', work: 'Admit the mistake and fix it.', health: 'Slow down after a scare.' },
  { n: 18, tier: 'thuong', image: 'Fireflies in the bamboo', verse: ['In the bamboo grove at night,', 'small lights show the path.'], reading: 'Many small helps add up. Accept them.', love: 'Little kindnesses matter.', work: 'Teamwork, not solo.', health: 'Improving gradually.' },
  { n: 19, tier: 'trung', image: 'The kite and the string', verse: ['The kite climbs high only', 'because someone holds the string.'], reading: 'Freedom and support go together. Thank who holds your string.', love: 'Trust and space, both.', work: 'Remember your foundations.', health: 'Fine; do not overstretch.' },
  { n: 20, tier: 'thuong-thuong', image: 'Lanterns lit for the ancestors', verse: ['Lanterns lit for those before us', 'light the road for those after.'], reading: 'Blessings from your family line. Honour them and they guide you.', love: 'Family approval comes easily.', work: 'An inherited skill shines.', health: 'Good, and long.' },
  { n: 21, tier: 'ha', image: 'Rain on the festival day', verse: ['Rain falls on the festival day;', 'the drums play on under the eaves.'], reading: 'Plans change, joy remains. Adapt.', love: 'A date moves; the feeling does not.', work: 'Plan B is fine.', health: 'Catch no chills.' },
  { n: 22, tier: 'thuong', image: 'Tea for a guest', verse: ['The water boils, the tea is poured:', 'the guest who came is a friend.'], reading: 'A visitor or message brings good news.', love: 'A new acquaintance matters.', work: 'An offer arrives.', health: 'Calm and warm.' },
  { n: 23, tier: 'trung', image: 'The ferry midstream', verse: ['Halfway across the river,', 'neither bank seems close.'], reading: 'You are in the middle of a change. Keep rowing.', love: 'In transition; be patient.', work: 'Finish what you started.', health: 'Tired but fine.' },
  { n: 24, tier: 'thuong-thuong', image: 'Scarves of four colours', verse: ['Red, green, white and yellow:', 'all four palaces smile on you.'], reading: 'A rare, complete blessing. Share your luck.', love: 'Deep happiness.', work: 'Everything aligns.', health: 'Whole and well.' },
];

/** Two coins: one up, one down is "yes" */
export type QueResult = 'thanh' | 'duong' | 'am';
export const QUE: Record<QueResult, { vi: string; en: string; meaning: string }> = {
  thanh: { vi: 'Quẻ Thánh', en: 'Yes', meaning: 'One face up, one face down: the gods agree.' },
  duong: { vi: 'Quẻ Dương', en: 'Ask again', meaning: 'Both faces up: the gods are smiling. Ask more clearly, then toss again.' },
  am: { vi: 'Quẻ Âm', en: 'Not now', meaning: 'Both faces down: the answer is no, or not yet.' },
};

/* ------------------------------------------------------------------ */
/* Lộc and amulets at the table                                        */
/* ------------------------------------------------------------------ */
export type LocKind = 'binh-an' | 'tai-loc' | 'chi-do' | 'dong-tien' | 'the-sen' | 'quat';

export const LOC: Record<LocKind, { vi: string; en: string; blurb: string; color: string }> = {
  'binh-an': { vi: 'Bùa bình an', en: 'Peace & safety charm', blurb: 'A red cloth pouch with the word “an” (peace), for safe days and safe travels.', color: '#c0262d' },
  'tai-loc': { vi: 'Túi gấm tài lộc', en: 'Brocade pouch of fortune', blurb: 'Gold brocade with a tassel, for prosperity and good business.', color: '#c99212' },
  'chi-do': { vi: 'Vòng chỉ đỏ', en: 'Red thread bracelet', blurb: 'The red thread of Ông Tơ Bà Nguyệt, the old couple in the moon who tie together people meant to meet.', color: '#d6364b' },
  'dong-tien': { vi: 'Đồng tiền may mắn', en: 'Lucky coin', blurb: 'An old round coin with a square hole, on a red string. Round for heaven, square for earth.', color: '#a37c00' },
  'the-sen': { vi: 'Thẻ bài sen', en: 'Lotus tablet', blurb: 'A little wooden tablet carved with a lotus, for a calm and clear mind.', color: '#7a5230' },
  quat: { vi: 'Quạt Mẫu', en: 'Mother\'s fan', blurb: 'A tiny fan like the ones the medium dances with in hầu đồng. For courage and a cool head.', color: '#2f8a4a' },
};

export const LOC_ORDER = Object.keys(LOC) as LocKind[];
