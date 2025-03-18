import { Building, Reference, Visit, SocialMedia } from '@/types/building';

// Sample references for Tokyo International Forum
const tokyoForumReferences: Reference[] = [
  {
    id: 'ref-tokyo-forum-1',
    type: 'book',
    title: '建築家ラファエル・ヴィニオリ作品集',
    author: 'ラファエル・ヴィニオリ',
    publisher: '鹿島出版会',
    year: 2005,
    description: 'ラファエル・ヴィニオリの代表作品を収録した作品集。東京国際フォーラムの設計コンセプトや詳細図面が掲載されている。',
  },
  {
    id: 'ref-tokyo-forum-2',
    type: 'article',
    title: '東京国際フォーラム：都市と建築の対話',
    author: '隈研吾',
    publisher: '新建築',
    year: 1997,
    description: '東京国際フォーラムの建築的特徴と都市空間における意義について解説した記事。',
  },
  {
    id: 'ref-tokyo-forum-3',
    type: 'video',
    title: '東京国際フォーラムの建築的魅力',
    url: 'https://www.youtube.com/watch?v=example1',
    description: '建築家による東京国際フォーラムの解説ツアー映像。',
  },
];

// Sample visits for Tokyo International Forum
const tokyoForumVisits: Visit[] = [
  {
    id: 'visit-tokyo-forum-1',
    source: 'note',
    title: '東京国際フォーラム訪問記',
    author: '建築学生A',
    url: 'https://note.com/example1',
    date: '2022-05-15',
    excerpt: '光と影のコントラストが美しい空間。特にガラスホールの天井から差し込む光の表現が印象的でした。',
  },
  {
    id: 'visit-tokyo-forum-2',
    source: 'blog',
    title: '建築巡礼：東京国際フォーラム',
    author: '建築ブロガーB',
    url: 'https://blog.example.com/tokyo-forum',
    date: '2021-11-03',
    excerpt: '構造美と機能性が融合した現代建築の傑作。特に吹き抜け空間の大胆さに圧倒されました。',
  },
];

// Sample social media for Tokyo International Forum
const tokyoForumSocialMedia: SocialMedia[] = [
  {
    id: 'social-tokyo-forum-1',
    platform: 'twitter',
    url: 'https://twitter.com/example/status/123456789',
    author: '@architecture_jp',
    date: '2023-01-20',
    content: '東京国際フォーラムの曲線美。#建築 #東京国際フォーラム #ヴィニオリ',
  },
  {
    id: 'social-tokyo-forum-2',
    platform: 'instagram',
    url: 'https://instagram.com/p/example1',
    author: '@tokyo_architecture_photos',
    date: '2022-09-05',
    content: '朝日に照らされる東京国際フォーラムのガラスホール。',
  },
];

// Sample references for Sumida Hokusai Museum
const hokusaiMuseumReferences: Reference[] = [
  {
    id: 'ref-hokusai-1',
    type: 'book',
    title: '妹島和世+西沢立衛/SANAA作品集',
    author: '妹島和世, 西沢立衛',
    publisher: 'TOTO出版',
    year: 2016,
    description: 'SANAAの作品集。すみだ北斎美術館の設計プロセスと完成写真が掲載されている。',
  },
  {
    id: 'ref-hokusai-2',
    type: 'article',
    title: 'すみだ北斎美術館：アルミの箱が生み出す新たな都市風景',
    author: '五十嵐太郎',
    publisher: '建築雑誌',
    year: 2017,
    description: 'すみだ北斎美術館の建築的特徴と周辺環境との関係性について考察した記事。',
  },
  {
    id: 'ref-hokusai-3',
    type: 'website',
    title: 'すみだ北斎美術館 公式サイト',
    url: 'https://hokusai-museum.jp/',
    description: '美術館の公式サイト。展示情報や建築概要が掲載されている。',
  },
];

// Sample references for TOTO Gallery Ma
const totoGalleryReferences: Reference[] = [
  {
    id: 'ref-toto-1',
    type: 'book',
    title: '伊東豊雄建築作品集',
    author: '伊東豊雄',
    publisher: '鹿島出版会',
    year: 2013,
    description: '伊東豊雄の代表作品を収録した作品集。TOTOギャラリー・間の設計コンセプトや詳細図面が掲載されている。',
  },
  {
    id: 'ref-toto-2',
    type: 'video',
    title: '伊東豊雄インタビュー：TOTOギャラリー・間について',
    url: 'https://www.youtube.com/watch?v=example3',
    description: '伊東豊雄によるTOTOギャラリー・間の設計意図についてのインタビュー映像。',
  },
];

// Sample buildings data
export const buildingsData: Building[] = [
  {
    id: 'tokyo-international-forum',
    name: '東京国際フォーラム',
    architect: 'ラファエル・ヴィニオリ',
    year: 1997,
    prefecture: '東京都',
    city: '千代田区丸の内',
    address: '東京都千代田区丸の内3-5-1',
    latitude: 35.6784,
    longitude: 139.7649,
    description:
      '東京国際フォーラムは、国際会議場、展示場、劇場などの複合文化施設。特徴的なガラスホールは、船の形状を模した巨大なアトリウム空間となっている。鉄骨トラス構造による大胆な曲面が特徴的で、日本の現代建築を代表する作品の一つ。',
    images: [
      '/images/buildings/tokyo-forum-1.jpg',
      '/images/buildings/tokyo-forum-2.jpg',
    ],
    references: tokyoForumReferences,
    visits: tokyoForumVisits,
    socialMedia: tokyoForumSocialMedia,
  },
  {
    id: 'sumida-hokusai-museum',
    name: 'すみだ北斎美術館',
    architect: '妹島和世',
    year: 2016,
    prefecture: '東京都',
    city: '墨田区',
    address: '東京都墨田区亀沢2-7-2',
    latitude: 35.7096,
    longitude: 139.8009,
    description:
      'すみだ北斎美術館は、葛飾北斎の作品を展示する美術館。アルミパネルで覆われた特徴的な外観を持ち、内部には北斎の作品を展示するギャラリーや、ワークショップスペースなどが配置されている。妹島和世による繊細な空間構成が特徴的。',
    images: [
      '/images/buildings/hokusai-museum-1.jpg',
      '/images/buildings/hokusai-museum-2.jpg',
    ],
    references: hokusaiMuseumReferences,
  },
  {
    id: 'toyoito-museum',
    name: 'TOTOギャラリー・間',
    architect: '伊東豊雄',
    year: 1985,
    prefecture: '東京都',
    city: '港区',
    address: '東京都港区南青山1-24-3 TOTO乃木坂ビル3F',
    latitude: 35.6713,
    longitude: 139.7236,
    description:
      'TOTOギャラリー・間は、建築と文化をテーマにした展示を行うギャラリー。伊東豊雄の設計により、シンプルながらも洗練された空間となっている。建築家の個展や企画展が定期的に開催され、日本の建築文化の発信地となっている。',
    images: [
      '/images/buildings/toto-gallery-1.jpg',
      '/images/buildings/toto-gallery-2.jpg',
    ],
    references: totoGalleryReferences,
  },
  {
    id: 'moriyama-house',
    name: '森山邸',
    architect: '西沢立衛',
    year: 2005,
    prefecture: '東京都',
    city: '大田区',
    latitude: 35.5657,
    longitude: 139.7173,
    description:
      '森山邸は、複数の小さな箱型の建物が集合した住宅。それぞれの箱は独立した機能を持ち、その間の屋外空間も含めて一つの住宅として機能している。都市における新しい住まい方を提案した作品として国際的に高く評価されている。',
    images: [
      '/images/buildings/moriyama-house-1.jpg',
      '/images/buildings/moriyama-house-2.jpg',
    ],
  },
  {
    id: 'church-of-light',
    name: '光の教会',
    architect: '安藤忠雄',
    year: 1989,
    prefecture: '大阪府',
    city: '茨木市',
    address: '大阪府茨木市西福井',
    latitude: 34.8141,
    longitude: 135.5577,
    description:
      '光の教会は、コンクリートの壁に十字架の形に切り取られた開口部から光が差し込む、シンプルながらも象徴的な教会建築。安藤忠雄の代表作の一つで、コンクリートと光の対比による精神性の高い空間を実現している。',
    images: [
      '/images/buildings/church-of-light-1.jpg',
      '/images/buildings/church-of-light-2.jpg',
    ],
  },
  {
    id: 'naoshima-contemporary-art-museum',
    name: '地中美術館',
    architect: '安藤忠雄',
    year: 2004,
    prefecture: '香川県',
    city: '直島町',
    address: '香川県香川郡直島町3449-1',
    latitude: 34.4479,
    longitude: 133.9937,
    description:
      '地中美術館は、その名の通り建物の大部分が地中に埋められた美術館。クロード・モネの「睡蓮」などの作品を永久展示するために設計された空間で、自然光を取り入れた展示室が特徴的。建築と芸術と自然が融合した空間となっている。',
    images: [
      '/images/buildings/chichu-museum-1.jpg',
      '/images/buildings/chichu-museum-2.jpg',
    ],
  },
  {
    id: 'sendai-mediatheque',
    name: 'せんだいメディアテーク',
    architect: '伊東豊雄',
    year: 2001,
    prefecture: '宮城県',
    city: '仙台市',
    address: '宮城県仙台市青葉区春日町2-1',
    latitude: 38.2682,
    longitude: 140.8694,
    description:
      'せんだいメディアテークは、図書館、ギャラリー、映像メディアセンターなどの機能を持つ複合文化施設。特徴的な「チューブ」と呼ばれる構造体が建物を支え、また設備や動線としても機能している。透明性と流動性を持つ新しい公共建築として国際的に高く評価されている。',
    images: [
      '/images/buildings/sendai-mediatheque-1.jpg',
      '/images/buildings/sendai-mediatheque-2.jpg',
    ],
  },
  {
    id: 'katsura-imperial-villa',
    name: '桂離宮',
    architect: '不明（江戸時代初期の作）',
    year: 1624,
    prefecture: '京都府',
    city: '京都市',
    address: '京都府京都市西京区桂御園',
    latitude: 34.9833,
    longitude: 135.6833,
    description:
      '桂離宮は、17世紀初頭に造営された皇族の別荘。書院造と数寄屋造を融合させた建築様式と、周囲の庭園との調和が特徴的。日本建築の美の極致として、近代建築にも大きな影響を与えた。',
    images: [
      '/images/buildings/katsura-villa-1.jpg',
      '/images/buildings/katsura-villa-2.jpg',
    ],
  },
  {
    id: 'tokyo-skytree',
    name: '東京スカイツリー',
    architect: '日建設計',
    year: 2012,
    prefecture: '東京都',
    city: '墨田区',
    address: '東京都墨田区押上1-1-2',
    latitude: 35.7101,
    longitude: 139.8107,
    description:
      '東京スカイツリーは、高さ634mの電波塔。日本の伝統的な技術である「そり」と「むくり」を取り入れた設計で、地震に強い新しい構造システムを採用している。また、江戸の伝統色である「粋」と「雅」をイメージした2種類のライトアップが行われている。',
    images: [
      '/images/buildings/skytree-1.jpg',
      '/images/buildings/skytree-2.jpg',
    ],
  },
  {
    id: 'yokohama-international-passenger-terminal',
    name: '横浜国際客船ターミナル',
    architect: 'FOA（フォーリン・オフィス・アーキテクツ）',
    year: 2002,
    prefecture: '神奈川県',
    city: '横浜市',
    address: '神奈川県横浜市中区大さん橋町1',
    latitude: 35.4495,
    longitude: 139.6489,
    description:
      '横浜国際客船ターミナルは、波のような起伏を持つ屋上デッキが特徴的な港湾施設。建物自体が公園のような機能を持ち、市民に開かれた公共空間となっている。構造と形態が一体化したデザインが国際的に高く評価されている。',
    images: [
      '/images/buildings/yokohama-terminal-1.jpg',
      '/images/buildings/yokohama-terminal-2.jpg',
    ],
  },
];
