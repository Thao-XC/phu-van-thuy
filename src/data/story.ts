import type { SecretDef } from '../three/world/types';

/**
 * The story of Phủ Vân Thủy.
 *
 * Tonight the temple should hold a hầu đồng ceremony. But the four ceremonial scarves (khăn) the
 * medium wears for each palace have been taken back into the four realms of the Tứ phủ.
 * Bà Thủ Từ, the temple keeper, asks you to go and ask for them, with a sincere heart.
 */

export type PalaceId = 'thien' | 'thuong-ngan' | 'thoai' | 'dia';

export interface Palace {
  id: PalaceId;
  vi: string;
  han: string;
  en: string;
  mother: string;
  color: string;
  colorName: string;
  /** how you get in (shown as a hint in the journal) */
  hint: string;
  /** what the realm asks of you */
  trial: string;
}

export const PALACES: Palace[] = [
  {
    id: 'thien',
    vi: 'Thiên phủ',
    han: '天府',
    en: 'Heaven Palace',
    mother: 'Mẫu Thượng Thiên',
    color: '#c0262d',
    colorName: 'red',
    hint: 'The sky answers the voice of a bell.',
    trial: 'Gather the three shards of a broken jade cup among the clouds.',
  },
  {
    id: 'thuong-ngan',
    vi: 'Nhạc phủ · Thượng Ngàn',
    han: '岳府',
    en: 'Mountain & Forest Palace',
    mother: 'Mẫu Thượng Ngàn',
    color: '#2f8a4a',
    colorName: 'green',
    hint: 'A dark mouth in the mountain, west of the hall.',
    trial: 'Follow the fireflies and bring back three gifts of the forest.',
  },
  {
    id: 'thoai',
    vi: 'Thoải phủ',
    han: '水府',
    en: 'Water Palace',
    mother: 'Mẫu Thoải',
    color: '#e9e6dc',
    colorName: 'white',
    hint: 'The half-moon pond is deeper than it looks.',
    trial: 'Find the three pearls of the Water Palace.',
  },
  {
    id: 'dia',
    vi: 'Địa phủ',
    han: '地府',
    en: 'Earth Palace',
    mother: 'Mẫu Địa',
    color: '#d9a21a',
    colorName: 'yellow',
    hint: 'Between the roots of the old banyan.',
    trial: 'Light three lanterns for those who came before.',
  },
];

export const PALACE = Object.fromEntries(PALACES.map((p) => [p.id, p])) as Record<PalaceId, Palace>;

/** What the keeper says at each point in the story */
export const KEEPER = {
  intro: [
    'Ah, a visitor at dusk. Welcome to Phủ Vân Thủy, the Cloud and Water Shrine.',
    'Tonight we should hold a hầu đồng, a ceremony where a medium dances for the Mothers and the spirits of the Four Palaces.',
    'But this morning the four scarves the medium wears for each palace were gone: red for Heaven, green for the Mountains and Forests, white for the Waters, yellow for the Earth. The realms have taken them back.',
    'They will only return them to someone who asks with a sincere heart. Will you go? Light incense first, and walk calmly. The realms are watching how you behave.',
  ],
  hints: {
    thien: 'Heaven is far above us. When the great bell speaks, the sky sometimes listens.',
    'thuong-ngan': 'The Mountain Mother keeps a grotto in the rock to the west. Step inside, if the forest lets you.',
    thoai: 'The Water Mother? Look into the half-moon pond by the gate. It goes deeper than any pond should.',
    dia: 'The banyan is older than the temple. Between its roots there is a hollow that leads into the earth.',
  } as Record<PalaceId, string>,
  ready: 'All four scarves… I can hardly believe it. Go into the hall and stand before the altar. The ceremony can begin.',
  after: 'The Mothers have been generous with you. Come back whenever your heart needs a quiet place.',
};

/** Secrets of the temple grounds */
export const SECRETS: SecretDef[] = [
  {
    id: 'ngu-ho',
    at: [0, -13.6],
    r: 1.6,
    trigger: 'linger',
    seconds: 3,
    hint: 'Something watches you from under the altar…',
    luck: 3,
    card: {
      title: 'The Five Tigers',
      jp: 'Ngũ Hổ · 五虎',
      body: [
        'Under the altars of Mother Goddess temples crouch five tigers in five colours: the Ngũ Hổ, guardians of the five directions.',
        'Yellow for the centre, red for the south, white for the west, black for the north and green for the east, following the five elements (ngũ hành).',
        'They protect the temple and chase away evil spirits. Many temples leave a small offering for them on the floor, below the altar.',
      ],
      ending: 'Five pairs of painted eyes. For a moment you are sure one of them blinked.',
    },
  },
  {
    id: 'ong-lot',
    at: [-6.6, -8.4],
    r: 1.5,
    trigger: 'linger',
    seconds: 3,
    hint: 'Look closely at the pillars.',
    luck: 3,
    card: {
      title: 'The two snakes',
      jp: 'Ông Lốt',
      body: [
        'A green snake and a white snake coil up the pillars in front of the altar. People call them Ông Lốt, and treat them with great respect.',
        'Snakes have long been spirits of rivers and water in the Red River Delta. In Mother Goddess temples they guard the altar and serve the Four Palaces, and many people see them as messengers of the Water Palace.',
      ],
      ending: 'The green snake\'s carved scales catch the candlelight, as if it had just moved.',
    },
  },
  {
    id: 'cay-da',
    at: [-10, 24.5],
    r: 2.6,
    trigger: 'night',
    hint: 'The banyan feels different after dark.',
    luck: 3,
    card: {
      title: 'The banyan at night',
      jp: 'Thần cây đa',
      body: [
        '"Thần cây đa, ma cây gạo, cú cáo cây đề": banyans have their gods, kapok trees their ghosts, and fig trees their owls and foxes. So goes an old Vietnamese saying.',
        'A great banyan beside the temple or the village well is one of the oldest images of the Vietnamese countryside. People tie red cloth around the trunk and light incense at the roots for the spirit who lives in it.',
      ],
      ending: 'The aerial roots sway though there is no wind, and the leaves whisper something you can\'t quite hear.',
    },
  },
  {
    id: 'rua-da',
    at: [12.4, 54.6],
    r: 1.6,
    trigger: 'linger',
    seconds: 4,
    hint: 'A stone turtle, its head worn smooth.',
    luck: 3,
    card: {
      title: 'The stone turtle',
      jp: 'Rùa đá đội bia',
      body: [
        'Turtles stand for long life and steadiness, so in Vietnam the stone steles that record a temple\'s history are carried on turtles\' backs.',
        'The most famous are at the Temple of Literature in Hà Nội: 82 steles naming the doctoral graduates of 1442–1779. Students once rubbed the turtles\' heads for luck in exams, until the steles had to be fenced off to protect them.',
      ],
      ending: 'You wanted to rub its head for luck. You didn\'t. Somehow that feels luckier.',
    },
  },
  {
    id: 'sen',
    at: [-15, 59],
    r: 1.8,
    trigger: 'linger',
    seconds: 4,
    hint: 'Sit by the lotus for a while.',
    luck: 3,
    card: {
      title: 'The lotus in the mud',
      jp: 'Hoa sen',
      body: [
        'Trong đầm gì đẹp bằng sen / Lá xanh bông trắng lại chen nhị vàng / Nhị vàng bông trắng lá xanh / Gần bùn mà chẳng hôi tanh mùi bùn.',
        '"What in the pond is lovelier than the lotus? Green leaves, white petals, golden stamens. It grows in the mud, yet never smells of mud." This old folk verse (ca dao) is how many Vietnamese children first learn about the lotus.',
        'Half-moon ponds (hồ bán nguyệt) in front of temples and communal houses are often planted with lotus, and believed to gather good fortune.',
      ],
      ending: 'A dragonfly lands on a pad, then lifts off again.',
    },
  },
];

/** Everything that can be discovered: secrets, the four realms and the ceremony */
export const LEGEND_INDEX: { id: string; title: string; kind: 'secret' | 'realm' | 'ceremony'; hint: string }[] = [
  ...PALACES.map((p) => ({ id: `realm-${p.id}`, title: `${p.vi}: the ${p.en}`, kind: 'realm' as const, hint: p.hint })),
  { id: 'haudong', title: 'Hầu đồng: the ceremony', kind: 'ceremony', hint: 'Bring all four scarves home.' },
  ...SECRETS.map((s) => ({ id: s.id, title: s.card.title, kind: 'secret' as const, hint: s.hint ?? '' })),
];

export const TOTAL_DISCOVERIES = LEGEND_INDEX.length;
