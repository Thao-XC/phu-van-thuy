/**
 * "The Mothers of the Four Palaces": a short narrated film about the real history and legends
 * of Đạo Mẫu, the Vietnamese worship of the Mother Goddesses.
 * Each line is narrated (English or Vietnamese voice) and shown as a bilingual subtitle.
 * Legends differ between regions and sources; this tells the most widely shared versions.
 */
export type FilmScene = 'origins' | 'palaces' | 'cup' | 'return' | 'forest' | 'haudong' | 'heritage';

export interface FilmLine {
  en: string;
  vi: string;
}

export interface FilmChapter {
  id: FilmScene;
  en: string;
  vi: string;
  lines: FilmLine[];
}

export const FILM_TITLE = { en: 'The Mothers of the Four Palaces', vi: 'Các Mẫu của Tứ phủ' };

export const FILM: FilmChapter[] = [
  {
    id: 'origins',
    en: 'Before memory',
    vi: 'Từ thuở xa xưa',
    lines: [
      {
        en: 'Long before anything was written down, the rice farmers of the Red River delta honoured the mothers of their world.',
        vi: 'Từ rất lâu trước khi có chữ viết, người trồng lúa ở đồng bằng sông Hồng đã tôn thờ những người mẹ của đất trời.',
      },
      {
        en: 'Mother Earth. The Mother of Rice. The spirits of water, of clouds, of rain and of lightning.',
        vi: 'Mẹ Đất. Mẹ Lúa. Các bà Mây, Mưa, Sấm, Chớp.',
      },
      {
        en: 'Even the oldest story of the Vietnamese people begins with a mother: Âu Cơ, a fairy of the mountains, who married Lạc Long Quân, a lord of the dragons.',
        vi: 'Ngay cả truyền thuyết cổ nhất của người Việt cũng bắt đầu từ một người mẹ: Âu Cơ, tiên nữ núi cao, kết duyên cùng Lạc Long Quân, chúa của loài rồng.',
      },
      {
        en: 'She bore a sac of one hundred eggs, and from them hatched one hundred children. Half followed her to the mountains, half followed him to the sea.',
        vi: 'Bà sinh ra một bọc trăm trứng, nở thành trăm người con. Năm mươi con theo mẹ lên núi, năm mươi con theo cha xuống biển.',
      },
    ],
  },
  {
    id: 'palaces',
    en: 'The Four Palaces',
    vi: 'Tứ phủ',
    lines: [
      {
        en: 'Over many centuries, these beliefs grew into Đạo Mẫu, the Way of the Mother.',
        vi: 'Qua nhiều thế kỷ, những niềm tin ấy kết lại thành Đạo Mẫu.',
      },
      {
        en: 'The universe is pictured as palaces, each kept by a Mother, each with its own colour.',
        vi: 'Vũ trụ được hình dung như những cung phủ, mỗi phủ có một vị Mẫu cai quản và một màu riêng.',
      },
      {
        en: 'Red for Heaven, Thiên phủ. Green for the mountains and forests, Nhạc phủ. White for the waters, Thoải phủ.',
        vi: 'Đỏ là Thiên phủ, cõi trời. Xanh là Nhạc phủ, núi rừng. Trắng là Thoải phủ, sông nước.',
      },
      {
        en: 'Together these are the Three Realms. Many temples add a fourth, yellow, for the Earth: Địa phủ.',
        vi: 'Ba cõi ấy là Tam phủ. Nhiều nơi thêm cõi thứ tư, màu vàng, là Địa phủ: cõi đất.',
      },
      {
        en: 'Beneath the Mothers serve a whole court of spirits: mandarins, ladies in waiting, princes, young ladies and little princes.',
        vi: 'Dưới các Mẫu là cả một triều đình thánh: các Quan Lớn, các Chầu, các Ông Hoàng, các Cô và các Cậu.',
      },
    ],
  },
  {
    id: 'cup',
    en: 'The broken jade cup',
    vi: 'Chén ngọc vỡ',
    lines: [
      {
        en: 'The best loved of all the Mothers is Liễu Hạnh. Her story begins in the court of heaven.',
        vi: 'Được yêu kính nhất trong các Mẫu là Mẫu Liễu Hạnh. Câu chuyện của Mẫu bắt đầu nơi thiên đình.',
      },
      {
        en: 'She was a daughter of the Jade Emperor. One day, at a heavenly feast, she let a precious jade cup slip, and it broke.',
        vi: 'Mẫu là con gái Ngọc Hoàng. Một hôm trong yến tiệc trên trời, Mẫu lỡ tay đánh vỡ chén ngọc quý.',
      },
      {
        en: 'For this, she was sent down to live as a mortal on earth.',
        vi: 'Vì lỗi ấy, Mẫu bị đày xuống trần gian làm người.',
      },
      {
        en: 'The legend says she was born in the sixteenth century, in the village of Vân Cát, in what is now Nam Định, to a family named Lê.',
        vi: 'Tương truyền Mẫu giáng sinh vào thế kỷ mười sáu, tại làng Vân Cát, nay thuộc Nam Định, trong một gia đình họ Lê.',
      },
      {
        en: 'She grew up, married and had children. Then, at only twenty one, her time on earth ended, and she was called back to heaven.',
        vi: 'Mẫu lớn lên, lấy chồng, sinh con. Rồi khi mới hai mươi mốt tuổi, hạn trần đã hết, Mẫu được gọi về trời.',
      },
    ],
  },
  {
    id: 'return',
    en: 'She came back',
    vi: 'Mẫu trở lại trần gian',
    lines: [
      {
        en: 'But she missed the world of people, and she came back. Again and again.',
        vi: 'Nhưng Mẫu nhớ cõi trần, nên Mẫu trở lại. Hết lần này đến lần khác.',
      },
      {
        en: 'In the stories she travels the country, trades poems with scholars, helps the poor and humbles the proud.',
        vi: 'Trong truyện kể, Mẫu đi khắp nơi, xướng họa thơ với các nhà nho, giúp người nghèo khó, răn kẻ kiêu căng.',
      },
      {
        en: 'She is one of the Four Immortals of Vietnamese belief, beside the mountain god Tản Viên, the boy hero Gióng, and Chử Đồng Tử.',
        vi: 'Mẫu là một trong Tứ bất tử của người Việt, cùng Tản Viên Sơn Thánh, Thánh Gióng và Chử Đồng Tử.',
      },
      {
        en: 'Her greatest temple is Phủ Dầy, in Nam Định. People say: in the eighth month, remember the Father; in the third month, remember the Mother.',
        vi: 'Nơi thờ chính của Mẫu là Phủ Dầy, Nam Định. Dân gian có câu: tháng Tám giỗ Cha, tháng Ba giỗ Mẹ.',
      },
    ],
  },
  {
    id: 'forest',
    en: 'Mothers of forest and water',
    vi: 'Mẫu Thượng Ngàn và Mẫu Thoải',
    lines: [
      {
        en: 'Mẫu Thượng Ngàn, dressed in green, rules the mountains and the forests, and everything that lives in them.',
        vi: 'Mẫu Thượng Ngàn, áo xanh, cai quản núi rừng và muôn loài nơi rừng thẳm.',
      },
      {
        en: 'Mẫu Thoải, dressed in white, is said to be a daughter of the Dragon King. She keeps the rivers, the lakes and the sea.',
        vi: 'Mẫu Thoải, áo trắng, tương truyền là con gái Vua Thủy Tề, cai quản sông hồ và biển cả.',
      },
      {
        en: 'And Mẫu Địa, in yellow, holds the earth, the harvest and the dead who rest in it.',
        vi: 'Còn Mẫu Địa, áo vàng, giữ đất đai, mùa màng và những người đã khuất.',
      },
    ],
  },
  {
    id: 'haudong',
    en: 'Hầu đồng',
    vi: 'Hầu đồng',
    lines: [
      {
        en: 'The heart of Đạo Mẫu is hầu đồng: a ceremony in which the spirits are invited to descend into a medium.',
        vi: 'Trái tim của Đạo Mẫu là hầu đồng: nghi lễ mời các vị thánh giáng vào thân người ông đồng, bà đồng.',
      },
      {
        en: 'Beneath a red veil the medium changes costume for each spirit in turn, while chầu văn musicians sing that spirit\'s story to the moon lute and drums.',
        vi: 'Dưới tấm khăn phủ diện đỏ, thanh đồng thay áo cho từng giá đồng, trong tiếng hát chầu văn, tiếng đàn nguyệt và trống phách.',
      },
      {
        en: 'The spirits dance, drink, laugh, and hand out lộc, blessed gifts, to everyone who has come.',
        vi: 'Các vị thánh múa, uống rượu, cười vui và ban lộc cho mọi người dự lễ.',
      },
      {
        en: 'The Mothers themselves are too high to dance. When they come, they come only briefly, and the veil stays on.',
        vi: 'Các Mẫu thì ngự rất cao. Khi Mẫu giáng, chỉ giáng qua rồi thăng, khăn vẫn phủ trên đầu.',
      },
    ],
  },
  {
    id: 'heritage',
    en: 'A living heritage',
    vi: 'Di sản sống',
    lines: [
      {
        en: 'For much of the twentieth century, hầu đồng was discouraged as superstition. But the songs were remembered, and the temples kept their candles lit.',
        vi: 'Trong phần lớn thế kỷ hai mươi, hầu đồng bị coi là mê tín. Nhưng lời ca vẫn được nhớ, và các đền phủ vẫn giữ lửa hương.',
      },
      {
        en: 'In 2016, UNESCO recognised the practices of the Việt beliefs in the Mother Goddesses of Three Realms as intangible cultural heritage of humanity.',
        vi: 'Năm 2016, UNESCO ghi danh Thực hành Tín ngưỡng thờ Mẫu Tam phủ của người Việt là Di sản văn hóa phi vật thể đại diện của nhân loại.',
      },
      {
        en: 'Phủ Vân Thủy is a temple from a story. But the Mothers, the music and the people who love them are real.',
        vi: 'Phủ Vân Thủy là ngôi đền trong truyện. Nhưng các Mẫu, lời ca và những người kính yêu Mẫu là thật.',
      },
      {
        en: 'Go gently. The Mothers are waiting.',
        vi: 'Hãy đi nhẹ nhàng. Các Mẫu đang đợi.',
      },
    ],
  },
];
