import { SeasonLabel } from '@/types/domain';

export type SwedishRegion = 'Södra Sverige' | 'Mellansverige' | 'Norra Sverige' | 'Sverige';

export type SeasonProfile = {
  season: SeasonLabel;
  phaseLabel: string;
  summary: string;
  focusItems: string[];
  watchItems: string[];
};

export const monthLabels = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'] as const;
export const regionalOrder: Array<Exclude<SwedishRegion, 'Sverige'>> = ['Södra Sverige', 'Mellansverige', 'Norra Sverige'];

export const seasonProfiles: SeasonProfile[] = [
  {
    season: 'Vintertillsyn',
    phaseLabel: 'midvinter',
    summary: 'Januari handlar mest om lugn tillsyn i bigården och att säkra att kuporna klarar vinterväder utan störningar.',
    focusItems: ['kontrollera fluster och håll öppet från snö och skräp', 'använd flusterskydd eller fågelskydd vid behov', 'gå igenom ramar, kupor och honungsmaterial inför våren'],
    watchItems: ['håll uppsikt efter talgoxar eller andra fåglar som pickar vid flustret', 'säkra tak, spännband och grenar efter blåst och snöfall', 'planera vaxhantering, honungsupptappning och kursstart innan säsongen drar igång'],
  },
  {
    season: 'Vintertillsyn',
    phaseLabel: 'vinterslut',
    summary: 'I februari är foderläget och lugnet i kupan det viktigaste när bina fortfarande sitter i vinterklot.',
    focusItems: ['lyssna vid flustret och följ om samhället låter lugnt', 'kontrollera foderreserv och stödfodra med honungsramar vid behov', 'förbered kupor, ramar och utrustning i god tid'],
    watchItems: ['ett högt oroligt brus kan tyda på störning, utsot eller akut foderbrist', 'skrapa ut nedfall från botten om det behövs utan att störa mer än nödvändigt', 'beställ material och etiketter nu i stället för att vänta till sommarens köer'],
  },
  {
    season: 'Vårutveckling',
    phaseLabel: 'första vårkollen',
    summary: 'Mars kan skifta snabbt och vårundersökningen ska bara göras när värmen verkligen tillåter det.',
    focusItems: ['gör vårundersökning när temperaturen tillåter flygväder', 'säkerställ cirka fyra fulla foderramar eller stödfodra vid behov', 'byt till rena bottnar och kontrollera varroanedfall på vinterns bottnar'],
    watchItems: ['håll flusterskydd kvar länge om snö och stark vårsol riskerar att locka ut bina för tidigt', 'var uppmärksam på större stackmyror nära bigården', 'mars är sista bra månaden att skicka vax och ramar till vaxrenseri'],
  },
  {
    season: 'Vårutveckling',
    phaseLabel: 'vårarbete',
    summary: 'I april ska vårundersökningen vara gjord och samhällena få rätt foder, vatten och plats för fortsatt utveckling.',
    focusItems: ['gör eller avsluta vårundersökningen och rengör bottnar', 'kontrollera att samhällena har pollen och honung nära ynglet', 'ordna vatten nära bigården och förbered utökning när sälgen blommar'],
    watchItems: ['milda vårar kan ge tryck från stackmyror och i vissa lägen även grävling', 'utöka med rätt typ av låda utifrån bistyrka och hur långt våren kommit', 'håll fortsatt koll på fodret eftersom vinterförrådet går åt snabbt i april'],
  },
  {
    season: 'Svärmperiod',
    phaseLabel: 'försommardrag',
    summary: 'Maj är ofta den lugna höjdpunkten före den intensiva svärmtiden, med starkt drag och behov av första skattlådan.',
    focusItems: ['sätt första skattlådan och placera spärrgaller under om du använder det', 'kontrollera svärmtryck och om det finns svärmceller', 'ha ramar och mellanväggar färdiga för snabb utökning'],
    watchItems: ['lägg gärna in en blandning av utbyggda ramar och mellanväggar i skattlådan', 'gör avläggare om samhällen bygger upp tydligt svärmtryck', 'smält gamla ramar och håll materialvården i gång medan blomningen är stark'],
  },
  {
    season: 'Svärmperiod',
    phaseLabel: 'svärmtid',
    summary: 'Juni är månaden då samhällena expanderar snabbt, svärmar går och avläggare behöver byggas upp rätt.',
    focusItems: ['bedöm behov av en extra skattlåda eller andra skattlådan', 'kontrollera svärmtryck tätt och fånga svärmar som går', 'gör avläggare och stödfodra dem om dragbina saknas'],
    watchItems: ['placera avläggare några meter från modersamhället och gärna med annat flusterväderstreck', 'låt drottningceller finnas kvar i avläggaren men gallra ner till de bästa vid behov', 'utöka i tid så att gamla samhället tappar svärmlusten och kan fortsätta samla'],
  },
  {
    season: 'Drag och skattning',
    phaseLabel: 'första skattningen',
    summary: 'I juli går fokus över till första honungsskörden, fortsatt drag och att få avläggare starka inför vintern.',
    focusItems: ['skatta och slunga första honungen utan att ta allt från bina', 'ersätt skattade lådor med tomma eller utslungade ramar nära yngelrummet', 'kontrollera avläggare och att ny drottning är parad'],
    watchItems: ['skatta gärna med bitömmare för att minska stress och röveririsk', 'stödfodra och utöka avläggare så att de hinner bli tillräckligt starka', 'håll koll på hur draget från hallon, klöver, lind och rallarros utvecklas'],
  },
  {
    season: 'Drag och skattning',
    phaseLabel: 'sensommardrag',
    summary: 'Augusti växlar mellan sensommarskörd, beslut om invintring och tydligare fokus på drottningläge och bihälsa.',
    focusItems: ['skatta och slunga sensommarhonung när den är mogen', 'börja ge vinterfoder om draget avtagit i området', 'kontrollera att samhället har en äggläggande drottning och rimlig styrka'],
    watchItems: ['bygg inte på med fler lådor sent på säsongen utan låt bina sitta trängre när nätterna blir kyliga', 'förena svaga samhällen eller avläggare som inte hinner bli starka nog', 'påbörja varroabekämpning först när slutskattning och invintring är klara'],
  },
  {
    season: 'Invintring',
    phaseLabel: 'slutskörd och invintring',
    summary: 'September är den mest krävande höstmånaden med slutskattning, invintring, fodring och beslut om vilka samhällen som ska övervintra.',
    focusItems: ['slutskatta och invintra med minst 16 kilo vinterfoder per samhälle', 'säkra att varje samhälle har en äggläggande drottning eller förena det', 'förnya vaxbygget och ta bort gamla mörka yngelramar'],
    watchItems: ['arbeta snabbt och tätt för att minska röveri vid slutskattning och fodring', 'slutskatta ljung- och bladhonung för säkrare övervintring', 'varroabekämpa med tymol nu om den metoden används och behov finns'],
  },
  {
    season: 'Invintring',
    phaseLabel: 'höstbehandling',
    summary: 'Oktober är tiden för att avsluta honungshanteringen och göra de sista höstinsatserna innan vinterläget tar över.',
    focusItems: ['varroabekämpa med oxalsyra när bina gått ur yngel eller enligt vald metod', 'montera musskydd och säkra bottenlösning för vinterläge', 'sortera ramar och skicka utsorterat vax till ursmältning eller rensning'],
    watchItems: ['spara någon honungsram per samhälle som reserv för vårens stödfodring', 'kontrollera kvalsternedfall efter behandling', 'rapportera säsongen till förening och avsluta burkning, märkning och lagring av honung'],
  },
  {
    season: 'Vinterro',
    phaseLabel: 'vinterförberedelser',
    summary: 'November ska vara lugnare i bigården, men skydd mot skadedjur och uppföljning av årets resultat är fortfarande viktigt.',
    focusItems: ['montera musskydd och eventuellt fågelnät där det behövs', 'varroabekämpa eller räkna kvalsternedfall om det återstår', 'summera årets skötselkort och förbered nästa säsongs underlag'],
    watchItems: ['håll extra koll på grävling eller andra skadegörare i utsatta bigårdar', 'sortera och smält ur gamla ramar om det inte gjordes tidigare', 'använd lugnare period till försäljning, bivaxarbete och recept med honung'],
  },
  {
    season: 'Vinterro',
    phaseLabel: 'vinterro',
    summary: 'December är vintertillsyn, skydd mot väder och skadedjur samt en bra månad för rengöring, ordning och vinterarbete inomhus.',
    focusItems: ['gör en runda efter snöfall eller oväder och håll flustren öppna', 'skydda kupor mot fallande grenar, fåglar och stöldrisk där det behövs', 'rengör biredskap, städa biboden och säkra vinterlagrade ramar'],
    watchItems: ['oxalsyraförångning kan fortfarande vara aktuell vid plusgrader om behandling missats', 'märk utrustning och använd kamera eller spårning i obevakade bigårdar vid behov', 'använd lugnet till bivaxljus, hudprodukter, honungsrecept och planering inför våren'],
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