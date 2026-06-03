export type IntegrationStatus =
  | 'live'       // Fully connected, live data
  | 'mock'       // Demo/placeholder data only
  | 'planned'    // On roadmap, not yet built
  | 'manual';    // Manual link-out, no auto-import

export interface RentalSource {
  id: string;
  name: string;
  url: string;
  type: 'portal' | 'queue' | 'social' | 'direct';
  description: string;
  searchUrl: string;
  hasApi: boolean;
  apiNotes?: string;
  updateFrequency: string;
  tips: string[];
  integration: IntegrationStatus;
  integrationNote?: string; // What's needed to go live
}

export const RENTAL_SOURCES: RentalSource[] = [
  {
    id: 'blocket',
    name: 'Blocket Bostad',
    url: 'https://www.blocket.se/bostad',
    type: 'portal',
    description: 'Sveriges största annonsmarknad. Många privata hyresvärdar och mäklare lägger ut hyresrätter här.',
    searchUrl: 'https://www.blocket.se/bostad/uthyres/lagenheter?area=skane&q=lund',
    hasApi: true,
    apiNotes: 'Inofficiell API via scraping möjlig, ingen officiell öppen API.',
    updateFrequency: 'Flera gånger dagligen',
    tips: [
      'Sätt upp en bevakningssökning och få e-post direkt',
      'Agera snabbt – populära annonser försvinner på timmar',
      'Privata värdar kontaktas direkt via annons',
    ],
    integration: 'mock',
    integrationNote: 'Blocket hänvisar nu till Qasa för hyresrätter. Blocket.se/bostad är kvar men renderar client-side (kräver Playwright). Kolla Qasa-källan istället.',
  },
  {
    id: 'bostadsportal',
    name: 'Bostadsportal',
    url: 'https://www.bostadsportal.se',
    type: 'portal',
    description: 'Dedikerad hyresrättsportal med tusentals annonser. Bra filter för Lund.',
    searchUrl: 'https://www.bostadsportal.se/lediga-lagenheter/lund',
    hasApi: false,
    updateFrequency: 'Dagligen',
    tips: [
      'Aktivera "sökvakt" för automatiska notiser',
      'Bra utbud från medelstora privata fastighetsbolag',
    ],
    integration: 'mock',
    integrationNote: 'Scraper skapad (Playwright) men CSS-selektorer behöver kalibrering mot live-sida. Hanterar 301-redirect från www → non-www URL.',
  },
  {
    id: 'qasa',
    name: 'Qasa',
    url: 'https://qasa.se',
    type: 'portal',
    description: 'Modern plattform med trygg betalning och hyresavtal. Blandar privata och professionella.',
    searchUrl: 'https://qasa.se/se/find/lund',
    hasApi: false,
    updateFrequency: 'Dagligen',
    tips: [
      'Säkra betalningar via Qasa-systemet',
      'Profiler för hyresvärdar skapar trygghet',
    ],
    integration: 'live',
    integrationNote: 'LIVE via Qasa GraphQL API. Hämtar ~216 Lund-annonser var 15:e minut med areaIdentifier="se/lund". Ingen API-nyckel krävs.',
  },
  {
    id: 'hyresratter',
    name: 'Hyresrätter.se',
    url: 'https://www.hyresratter.se',
    type: 'portal',
    description: 'Specialiserad på hyresrätter. Enkel sökning med bra filter.',
    searchUrl: 'https://www.hyresratter.se/hyreslagenheter/lund',
    hasApi: false,
    updateFrequency: 'Dagligen',
    tips: ['Bra för att hitta annonser från mindre fastighetsbolag'],
    integration: 'mock',
    integrationNote: 'Scraper skapad (Playwright) med SSL-certifikat-felhantering. CSS-selektorer behöver kalibrering mot live-sida för att hitta annonser.',
  },
  {
    id: 'lkf',
    name: 'LKF (Lunds Kommuns Fastighets AB)',
    url: 'https://www.lkf.se',
    type: 'queue',
    description: 'Kommunalt bostadsbolag i Lund med ~6 000 lägenheter. Kö krävs men detta är det tryggaste alternativet.',
    searchUrl: 'https://www.lkf.se/lediga-lagenheter',
    hasApi: false,
    updateFrequency: 'Varje timme',
    tips: [
      'Registrera sig i kön OMEDELBART – köpoäng samlas löpande',
      'Kötiden kan vara 2–5 år men kortar sig med fler poäng',
      'Lediga lägenheter läggs ut torsdagar',
      'Gratis att stå i kön',
    ],
    integration: 'live',
    integrationNote: 'LIVE via Playwright scraper: Vitec Arena SPA med CSS-selektor .object-preview-headline-cc. Hämtar ~9+ lägenheter från LKF ledigt-sida. Pagination implementerad.',
  },
  {
    id: 'afbostader',
    name: 'AF Bostäder',
    url: 'https://www.afbostader.se',
    type: 'queue',
    description: 'Studentbostäder i Lund. ~6 000 lägenheter för studenter vid LU och LTH.',
    searchUrl: 'https://www.afbostader.se/lediga-bostader',
    hasApi: false,
    updateFrequency: 'Veckovis',
    tips: [
      'Kräver studentstatus vid Lunds Universitet eller LTH',
      'Novisch-kön för nya studenter (lottning i juli)',
      'Anmäl till kön INNAN antagningsbesked i juli',
      'Förnya köplatsen varje år',
    ],
    integration: 'live',
    integrationNote: 'LIVE via REST API: afbostader.se/DiremoApi/redimo/rest/vacantproducts?lang=sv_SE&type=1. Returnerar ~81 lediga bostäder i Lund. Ingen auth krävs.',
  },
  {
    id: 'lundafastigheter',
    name: 'Lundafastigheter',
    url: 'https://www.lundafastigheter.se',
    type: 'direct',
    description: 'Privat fastighetsbolag med flera hyresfastigheter i Lund.',
    searchUrl: 'https://www.lundafastigheter.se/lediga-lagenheter',
    hasApi: false,
    updateFrequency: 'Vid behov',
    tips: ['Kontakta direkt för att anmäla intresse'],
    integration: 'manual',
    integrationNote: 'Länk direkt till webbplatsen – inga annonser importeras automatiskt.',
  },
  {
    id: 'facebook_lund',
    name: 'Facebook: Lund Hyres & Bostad',
    url: 'https://www.facebook.com/groups/',
    type: 'social',
    description: 'Flera Facebook-grupper med privata uthyrningar i Lund. Snabb omsättning.',
    searchUrl: 'https://www.facebook.com/groups/search/lund+bostad',
    hasApi: false,
    updateFrequency: 'Flera gånger dagligen',
    tips: [
      '"Lund Accommodation" – stor grupp för hyra/andrahand',
      '"Uthyres i Lund" – privata annonser',
      '"Lund International Student Housing" – internationell grupp',
      'Agera snabbt, svara direkt i kommentar + PM',
      'Var beredd med personlig presentation om dig/er',
    ],
    integration: 'mock',
    integrationNote: 'Facebook tillåter inte scraping/API för grupper. Annonser måste läggas in manuellt eller via tredjepartsverktyg.',
  },
  {
    id: 'andrahand',
    name: 'Andrahandskontrakt',
    url: 'https://www.andrahand.se',
    type: 'portal',
    description: 'Specialiserad på andrahandsuthyrning. Bra vid mer kortsiktiga behov.',
    searchUrl: 'https://www.andrahand.se/hyra/lund',
    hasApi: false,
    updateFrequency: 'Dagligen',
    tips: [
      'Andrahand = hyresgäst hyr ut i andra hand',
      'Kortare kontrakt vanliga (3–12 månader)',
      'Kolla att hyresvärden godkänt uthyrningen',
    ],
    integration: 'planned',
    integrationNote: 'Scraping planerad – RSS-feed finns via rss.app.',
  },
];

// Queue-specific information
export const QUEUE_INFO = {
  lkf: {
    name: 'LKF-kön',
    registrationUrl: 'https://www.lkf.se/bostadsko',
    cost: 'Gratis',
    notes: 'Poäng samlas per månad i kön. Lediga lägenheter annonseras torsdagar på lkf.se.',
  },
  afbostader: {
    name: 'AF Bostäder-kön',
    registrationUrl: 'https://www.afbostader.se/registrera',
    cost: '100 kr/år',
    notes: 'Novisch-systemet lottar ut lägenheter till nya studenter varje höst.',
  },
};
