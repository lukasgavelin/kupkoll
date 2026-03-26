import { SeasonLabel } from '@/types/domain';

export type SwedishRegion = 'Södra Sverige' | 'Mellansverige' | 'Norra Sverige' | 'Sverige';

export type SeasonProfile = {
  season: SeasonLabel;
  phaseLabel: string;
  summary: string;
  focusItems: string[];
};

export const monthLabels = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'] as const;
export const regionalOrder: Array<Exclude<SwedishRegion, 'Sverige'>> = ['Södra Sverige', 'Mellansverige', 'Norra Sverige'];

export const seasonProfiles: SeasonProfile[] = [
  {
    season: 'Vintertillsyn',
    phaseLabel: 'midvinter',
    summary: 'Samhällena sitter stilla och ska störas så lite som möjligt.',
    focusItems: ['lyssna efter liv vid mildväder', 'håll flustren fria från is och skräp'],
  },
  {
    season: 'Vintertillsyn',
    phaseLabel: 'sen vinter',
    summary: 'Foderläget blir viktigare när vinterklotet börjar röra sig mer.',
    focusItems: ['bedöm tyngd och foderreserv', 'förbered tidiga vårinsatser'],
  },
  {
    season: 'Vårutveckling',
    phaseLabel: 'marsarbete',
    summary: 'Vädret är förrädiskt och vårundersökningen görs först när vädret verkligen tillåter det.',
    focusItems: ['gör vårundersökning om vädret tillåter', 'stödfodra eller drivfodra vid behov', 'kontrollera varroanedfall på vinterns bottnar'],
  },
  {
    season: 'Vårutveckling',
    phaseLabel: 'vårstart',
    summary: 'Yngelsättningen tar fart och vårkontrollen ska fortfarande hållas kort och praktisk.',
    focusItems: ['följ yngelsättning och drottningläge', 'säkra foder om draget hackar', 'håll vårkollen kort om det fortfarande är kyligt'],
  },
  {
    season: 'Svärmperiod',
    phaseLabel: 'försommar',
    summary: 'Försommarens starka samhällen behöver plats i tid och svärmtrycket måste kontrolleras.',
    focusItems: ['sätt första skattlådan', 'kontrollera svärmtryck och svärmceller', 'gör avläggare vid behov'],
  },
  {
    season: 'Svärmperiod',
    phaseLabel: 'junipress',
    summary: 'Utökning, andra skattlådan och tät svärmkontroll dominerar arbetet i bigården.',
    focusItems: ['bedöm behov av extra skattlåda', 'kontrollera svärmtryck och fånga svärm', 'stödfodra avläggare'],
  },
  {
    season: 'Drag och skattning',
    phaseLabel: 'högsommar',
    summary: 'Nu går fokus över till skattning, slungning och att hålla avläggare på rätt spår.',
    focusItems: ['skatta och slunga första honungen', 'kontrollera avläggare och parad drottning', 'ersätt skattade lådor med tomma ramar eller mellanväggar'],
  },
  {
    season: 'Drag och skattning',
    phaseLabel: 'sensommar',
    summary: 'Sensommaren växlar mellan drag, andra skörden och ökande fokus på bihälsa.',
    focusItems: ['planera sensommarskattning', 'följ varroaläget tätare', 'håll koll på foder när draget avtar'],
  },
  {
    season: 'Invintring',
    phaseLabel: 'septemberarbete',
    summary: 'Slutskattning, invintring och varroastrategi ska falla på plats innan kylan tar över.',
    focusItems: ['invintra med minst 16 kilo vinterfoder', 'förena svaga samhällen och säkra äggläggande drottning', 'varroabekämpa med tymol vid behov'],
  },
  {
    season: 'Invintring',
    phaseLabel: 'höststängning',
    summary: 'Samhällena ska gå lugnt mot vinter med rätt tyngd och så lite störning som möjligt.',
    focusItems: ['bekräfta vinterfoder', 'minska onödiga öppningar'],
  },
  {
    season: 'Vinterro',
    phaseLabel: 'förvinter',
    summary: 'Biodlingen går in i lugnare takt och tillsynen blir mer förebyggande än aktiv.',
    focusItems: ['kontrollera vindskydd och fukt', 'sammanfatta säsongen inför nästa år'],
  },
  {
    season: 'Vinterro',
    phaseLabel: 'vinterro',
    summary: 'Kuporna ska stå stabilt medan du planerar nästa säsong med så lite störning som möjligt.',
    focusItems: ['håll tillsynen diskret', 'förbered material och plan för våren'],
  },
];

export const regionalProfileMonthIndices: Record<Exclude<SwedishRegion, 'Sverige'>, number[]> = {
  'Södra Sverige': [0, 1, 3, 4, 5, 6, 6, 7, 8, 9, 10, 11],
  Mellansverige: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  'Norra Sverige': [0, 1, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
};

export const inspectionCadenceDaysBySeason: Record<SeasonLabel, Record<SwedishRegion, number>> = {
  'Vintertillsyn': {
    'Södra Sverige': 30,
    Mellansverige: 30,
    'Norra Sverige': 30,
    Sverige: 30,
  },
  Vårutveckling: {
    'Södra Sverige': 10,
    Mellansverige: 12,
    'Norra Sverige': 14,
    Sverige: 12,
  },
  Svärmperiod: {
    'Södra Sverige': 7,
    Mellansverige: 7,
    'Norra Sverige': 10,
    Sverige: 7,
  },
  'Drag och skattning': {
    'Södra Sverige': 10,
    Mellansverige: 10,
    'Norra Sverige': 12,
    Sverige: 10,
  },
  Invintring: {
    'Södra Sverige': 12,
    Mellansverige: 12,
    'Norra Sverige': 12,
    Sverige: 12,
  },
  Vinterro: {
    'Södra Sverige': 30,
    Mellansverige: 30,
    'Norra Sverige': 30,
    Sverige: 30,
  },
};