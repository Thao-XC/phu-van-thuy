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

/** Secrets of the temple grounds, found one at a time in this order (the secret trail) */
export const SECRETS: (SecretDef & { riddle: string })[] = [
  {
    id: 'rua-da',
    riddle: 'Begin where the river ends. Someone old and patient carries a stone on its back.',
    at: [12.4, 54.6],
    r: 1.8,
    trigger: 'linger',
    seconds: 3,
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
    riddle: 'Sit for a while beside what grows clean out of the mud.',
    at: [-15, 59],
    r: 2,
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
  {
    id: 'cau-doi',
    riddle: 'Before you pass the gate, read it. Two lines answer each other across the doorway.',
    at: [0, 44],
    r: 2,
    trigger: 'linger',
    seconds: 3,
    hint: 'Look up at the red boards beside the central gate.',
    luck: 3,
    card: {
      title: 'The gate couplet',
      jp: 'Câu đối · the gate couplet',
      body: [
        'Red boards with golden letters hang either side of temple doors. A câu đối is a pair of lines with the same number of words, matching meaning against meaning and tone against tone.',
        'This gate says "Núi mây ngàn năm đẹp", cloud mountains, beautiful for a thousand years, and "Trăng nước vạn thuở trong", moon on the water, clear for ten thousand ages. Between them they hold the two halves of the temple\'s name: Vân, cloud, and Thủy, water.',
        'Older temples often wrote them in the classical script. Today many hang couplets in the Vietnamese alphabet instead, brushed as calligraphy so everyone who visits can read them.',
      ],
      ending: 'Cloud on one side, water on the other, and you standing in the gap between them.',
    },
  },
  {
    id: 'trau-cau',
    riddle: 'In the east corner of the courtyard, a tall slim tree remembers a sad love story.',
    at: [26.6, 31.2],
    r: 2,
    trigger: 'linger',
    seconds: 3,
    hint: 'An areca palm, its trunk wrapped in a betel vine.',
    luck: 3,
    card: {
      title: 'The legend of betel and areca',
      jp: 'Sự tích trầu cau',
      body: [
        'Two devoted brothers, Tân and Lang, loved the same girl, who married the elder. A misunderstanding broke the younger\'s heart. He wandered off and died by a stream, turning into a limestone rock. His brother came looking and died beside him, becoming an areca palm. The wife followed, and became a betel vine wrapped around the tree.',
        'When a king heard their story he chewed a betel leaf with areca nut and lime from the rock, and saw it turn a deep red, like loyalty. Ever since, betel and areca have been offered at weddings and on altars.',
        '"Miếng trầu là đầu câu chuyện": a quid of betel begins every conversation.',
      ],
      ending: 'The vine still holds the palm tight, the way it always has.',
    },
  },
  {
    id: 'gieng',
    riddle: 'Every Vietnamese village has a banyan, a courtyard and one more thing. Find it in this courtyard.',
    at: [22, 18.6],
    r: 1.8,
    trigger: 'linger',
    seconds: 3,
    hint: 'An old stone well.',
    luck: 3,
    card: {
      title: 'The temple well',
      jp: 'Giếng nước',
      body: [
        '"Cây đa, giếng nước, sân đình": the banyan, the well and the communal-house yard. These three are the oldest picture of a Vietnamese village, painted, sung about and missed by everyone who left one.',
        'Temple wells give the water for offerings and for cleaning the altars. Many people believe the water of an old temple well carries a little of its blessing.',
      ],
      ending: 'Far down, the circle of sky trembles on the water.',
    },
  },
  {
    id: 'ngua-giay',
    riddle: 'Beside the fire that eats paper, a horse waits to be sent to the other world.',
    at: [17.6, 12.6],
    r: 1.8,
    trigger: 'linger',
    seconds: 3,
    hint: 'A paper horse, painted bright.',
    luck: 3,
    card: {
      title: 'The paper horse',
      jp: 'Ngựa giấy · vàng mã',
      body: [
        'Vàng mã are votive offerings made of paper: money, clothes, houses, horses. They are burned so that they reach the spirits and the ancestors. In the Mother Goddess religion, splendid paper horses and boats are offered to the princes of the Four Palaces.',
        'Burning a lot of it is expensive and fills the air with smoke, and many temples, along with Vietnam\'s Buddhist Sangha, now ask people to offer less, or none, and to give with a sincere heart instead.',
      ],
      ending: 'The horse\'s painted eye seems to follow you as you walk away.',
    },
  },
  {
    id: 'hoanh-phi',
    riddle: 'Stand before the main hall and look up at the four golden words.',
    at: [0, -2.8],
    r: 1.8,
    trigger: 'linger',
    seconds: 3,
    hint: 'Look up at the golden board above the doors.',
    luck: 3,
    card: {
      title: 'Mẫu nghi thiên hạ',
      jp: 'The Mother, model for all under heaven',
      body: [
        'Horizontal lacquered boards (hoành phi) hang above temple doors, and the vertical boards beside them carry phrases about the gods within.',
        'Mẫu nghi thiên hạ is one of the phrases most often seen in Mother Goddess temples. It means "the Mother is the model for everyone under heaven", and calls the Mother both the protector and the example of the whole world.',
      ],
      ending: 'Gold on red, slightly worn, polished by a century of incense smoke.',
    },
  },
  {
    id: 'ong-lot',
    riddle: 'Inside the hall, something green has wrapped itself around a pillar.',
    at: [-6.6, -8.4],
    r: 1.6,
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
    id: 'ngu-ho',
    riddle: 'Five pairs of eyes watch from under the altar. Come close and look down (but never climb up).',
    at: [0, -13.6],
    r: 1.6,
    trigger: 'linger',
    seconds: 3,
    hint: 'Something watches you from under the altar…',
    luck: 3,
    card: {
      title: 'The Five Tigers',
      jp: 'Ngũ Hổ · the Five Tigers',
      body: [
        'Under the altars of Mother Goddess temples crouch five tigers in five colours: the Ngũ Hổ, guardians of the five directions.',
        'Yellow for the centre, red for the south, white for the west, black for the north and green for the east, following the five elements (ngũ hành).',
        'They protect the temple and chase away evil spirits. Many temples leave a small offering for them on the floor, below the altar.',
      ],
      ending: 'Five pairs of painted eyes. For a moment you are sure one of them blinked.',
    },
  },
  {
    id: 'chuong',
    riddle: 'A voice of bronze sleeps in the east tower. Stand beneath it and listen.',
    at: [18.6, -6.2],
    r: 1.8,
    trigger: 'linger',
    seconds: 4,
    hint: 'Characters are cast into the bell\'s bronze.',
    luck: 3,
    card: {
      title: 'The voice of the bell',
      jp: 'Tiếng chuông',
      body: [
        'Gió đưa cành trúc la đà / Tiếng chuông Trấn Vũ, canh gà Thọ Xương: "the wind sways the bamboo, the bell of Trấn Vũ rings, the cocks of Thọ Xương crow." This old Hà Nội folk song is about a temple bell heard across the city before dawn.',
        'Temple bells are rung at dawn and dusk. Their bronze is cast with inscriptions (minh văn) recording when the bell was made and the names of the villagers who gave money for it.',
      ],
      ending: 'You touch the cold bronze. It hums, very faintly, though no one struck it.',
    },
  },
  {
    id: 'cay-da',
    riddle: 'When the lanterns are lit, visit the old banyan.',
    at: [-10, 24.5],
    r: 2.8,
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
      ending: 'The aerial roots sway though there is no wind. The saying has two more trees in it…',
    },
  },
  {
    id: 'cay-gao',
    riddle: 'The saying has a second tree. At night, by the river, its red flowers hold the last secret.',
    at: [-24.5, 58.5],
    r: 2.6,
    trigger: 'night',
    hint: 'A kapok tree, red flowers on bare branches.',
    luck: 5,
    card: {
      title: 'The kapok tree by the river',
      jp: 'Ma cây gạo',
      body: [
        'Kapok trees (cây gạo) grow tall by rivers and village gates in the north. In early spring they drop their leaves and burn with big red flowers, and later their pods release white cotton that drifts like snow.',
        'Because they stand so tall and alone, people said wandering spirits liked to gather in them at night: "ma cây gạo", the ghosts of the kapok. Children were told not to linger under one after dark.',
        'You have found every secret of Phủ Vân Thủy. The Mothers, it seems, have nothing left to hide from you.',
      ],
      ending: 'A red flower falls into the river and floats away, between the lanterns.',
    },
  },
];

/** The secret that is awake right now (the first one not yet found), or null when all are found */
export const nextSecret = (found: string[]) => SECRETS.find((s) => !found.includes(s.id)) ?? null;

/** Everything that can be discovered: secrets, the four realms and the ceremony */
export const LEGEND_INDEX: { id: string; title: string; kind: 'secret' | 'realm' | 'ceremony'; hint: string }[] = [
  ...PALACES.map((p) => ({ id: `realm-${p.id}`, title: `${p.vi}: the ${p.en}`, kind: 'realm' as const, hint: p.hint })),
  { id: 'haudong', title: 'Hầu đồng: the ceremony', kind: 'ceremony', hint: 'Bring all four scarves home.' },
  ...SECRETS.map((s) => ({ id: s.id, title: s.card.title, kind: 'secret' as const, hint: s.hint ?? '' })),
];

export const TOTAL_DISCOVERIES = LEGEND_INDEX.length;
