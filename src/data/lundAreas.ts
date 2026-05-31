export interface LundArea {
  id: string;
  name: string;
  description: string;
  distanceToCentrum: string;
  characteristics: string[];
  priceRange: string;
  popularity: 'high' | 'medium' | 'low';
  studentFriendly: boolean;
}

export const LUND_AREAS: LundArea[] = [
  {
    id: 'centrum',
    name: 'Centrum',
    description: 'Stadskärnan – nära allt, men dyrare och ofta lite bullrigt.',
    distanceToCentrum: '0 min',
    characteristics: ['Nära handel & restauranger', 'Bra kollektivtrafik', 'Universitetsnära', 'Kulturliv'],
    priceRange: '8 000–15 000 kr/mån',
    popularity: 'high',
    studentFriendly: true,
  },
  {
    id: 'professorsstaden',
    name: 'Professorsstaden',
    description: 'Lugnt och fint villaområde strax norr om centrum, populärt bland universitetsanställda.',
    distanceToCentrum: '10 min (promenad)',
    characteristics: ['Lugnt & grönt', 'Nära LTH', 'Fina villor & äldre hus', 'Familjevänligt'],
    priceRange: '9 000–16 000 kr/mån',
    popularity: 'high',
    studentFriendly: false,
  },
  {
    id: 'norrby',
    name: 'Norrby',
    description: 'Mångkulturell stadsdel norr om centrum med blandade lägenheter och nära service.',
    distanceToCentrum: '15 min (promenad)',
    characteristics: ['Prisvärt', 'Mångkulturellt', 'Nära Stadsparken', 'Bra busskommunikation'],
    priceRange: '6 500–10 000 kr/mån',
    popularity: 'medium',
    studentFriendly: true,
  },
  {
    id: 'linero',
    name: 'Linero',
    description: 'Modernare område öster om centrum, trygg miljö och goda kommunikationer.',
    distanceToCentrum: '20 min (buss/cykel)',
    characteristics: ['Prisvärt', 'Moderna lägenheter', 'Bra för familjer', 'Nära Vipeholm'],
    priceRange: '6 000–9 500 kr/mån',
    popularity: 'medium',
    studentFriendly: true,
  },
  {
    id: 'klostergarden',
    name: 'Klostergården',
    description: 'Miljonprogramsområde söder om centrum med låg hyra och blandad befolkning.',
    distanceToCentrum: '20 min (buss)',
    characteristics: ['Lägst hyra', 'LKF-dominerat', 'Renoverat på senaste år', 'Natur nära'],
    priceRange: '5 500–8 500 kr/mån',
    popularity: 'medium',
    studentFriendly: true,
  },
  {
    id: 'ostra_torn',
    name: 'Östra Torn',
    description: 'Lugnt bostadsområde öster om centrum med bra skolor och grönska.',
    distanceToCentrum: '25 min (buss)',
    characteristics: ['Lugnt', 'Familjevänligt', 'Bra skolor', 'Blandade hustyper'],
    priceRange: '7 000–11 000 kr/mån',
    popularity: 'medium',
    studentFriendly: false,
  },
  {
    id: 'kobjer',
    name: 'Kobjer/Åkerlund',
    description: 'Lite längre från centrum, men prisvärda hyresrätter och lugn miljö.',
    distanceToCentrum: '25 min (buss)',
    characteristics: ['Prisvärt', 'Lugnt', 'Grönområden', 'Äldre bebyggelse'],
    priceRange: '5 500–8 000 kr/mån',
    popularity: 'low',
    studentFriendly: true,
  },
  {
    id: 'brunnshog',
    name: 'Brunnshög',
    description: 'Nytt modernt område i nordöst med MAX IV och ESS-laboratorier. Växer snabbt.',
    distanceToCentrum: '30 min (buss/cykel)',
    characteristics: ['Nybyggt', 'Modernt', 'Nära forskningsmiljö', 'Spårväg planeras'],
    priceRange: '9 000–14 000 kr/mån',
    popularity: 'medium',
    studentFriendly: true,
  },
  {
    id: 'jarnaakra',
    name: 'Järnåkra',
    description: 'Sydlig stadsdel med blandad bebyggelse och nära naturreservat.',
    distanceToCentrum: '20 min (buss)',
    characteristics: ['Natur nära', 'Blandat utbud', 'Lugnt', 'Bra för cyklister'],
    priceRange: '6 500–10 000 kr/mån',
    popularity: 'low',
    studentFriendly: false,
  },
  {
    id: 'lunds_s',
    name: 'Södra Lund',
    description: 'Nyare bebyggelse söder om centrum, nära motorväg och köpcentrum.',
    distanceToCentrum: '20 min (buss)',
    characteristics: ['Nyare hus', 'Nära Mobilia', 'Tillgängligt', 'Familjevänligt'],
    priceRange: '7 500–12 000 kr/mån',
    popularity: 'medium',
    studentFriendly: false,
  },
];

export const AREA_NAMES = LUND_AREAS.map((a) => a.name);
