export type PrivacyPolicySubsection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type PrivacyPolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: PrivacyPolicySubsection[];
};

export const privacyPolicyLastUpdated = '2026-04-02';

export const privacyPolicyIntro = [
  'Den här integritetspolicyn beskriver hur Kupkoll behandlar information när du använder appen. Policyn utgår från hur appen fungerar i nuvarande version.',
  'Kupkoll är i grunden en lokal biodlingsapp. I nuvarande MVP finns ingen användarinloggning och ingen egen backend där ditt innehåll lagras centralt.',
];

export const privacyPolicySections: PrivacyPolicySection[] = [
  {
    title: '1. Vem policyn gäller för',
    paragraphs: [ 'Policyn gäller för personer som använder Kupkoll på mobil eller i webbläsare.' ],
  },
  {
    title: '2. Personuppgiftsansvarig och kontakt',
    paragraphs: [
      'Kupkoll är skapad av Lukas Gavelin.',
      'Om du har frågor om integritet eller databehandling kan du kontakta: lukas.gavelin@gmail.com',
      'Projektets repository: https://github.com/lukasgavelin/kupkoll',
    ],
  },
  {
    title: '3. Kort sammanfattning',
    bullets: [
      'Kupkoll kräver inget konto.',
      'Ditt innehåll sparas i första hand lokalt på din enhet eller i din webbläsare.',
      'Kupkoll har i nuvarande version ingen egen server som tar emot eller lagrar ditt biodlingsinnehåll centralt.',
      'Om du använder platsfunktioner, väderhämtning, kartlänkar, export eller delning kan uppgifter skickas till externa tjänster eller hanteras av din enhets operativsystem.',
      'Kupkoll använder i nuvarande version inte egna annonstjänster eller eget analysverktyg för beteendespårning.',
    ],
  },
  {
    title: '4. Vilka uppgifter som kan behandlas',
    subsections: [
      {
        title: 'Uppgifter du själv lägger in',
        bullets: [
          'bigårdars namn, plats, anteckningar och koordinater',
          'kupors namn, status, styrka, temperament, kupsystem och anteckningar',
          'genomgångar, händelser, observationer, väderanteckningar och fria textanteckningar',
          'manuella uppgifter och planerade åtgärder',
        ],
      },
      {
        title: 'Uppgifter som skapas i appen',
        bullets: [
          'rekommendationer och uppgifter som räknas fram av appens regler',
          'tidsstämplar för genomgångar och export',
          'summeringar och antal poster i exporterad backup',
        ],
      },
      {
        title: 'Tekniska inställningar och lokal appdata',
        bullets: [
          'lokalt apptillstånd för bigårdar, kupor, genomgångar och uppgifter',
          'valt tema, till exempel mörkt eller ljust läge',
        ],
      },
      {
        title: 'Platsuppgifter',
        paragraphs: [
          'Om du väljer att använda funktionen för att hämta din plats kan Kupkoll behandla enhetens aktuella koordinater för att fylla i bigårdens position, förbättra platsanpassning av säsongslogik och råd, samt hämta väder för genomgångar och säsongssignal.',
          'Platsåtkomst används bara när du aktivt väljer funktionen och ger appen behörighet på enheten.',
        ],
      },
    ],
  },
  {
    title: '5. Varför uppgifterna behandlas',
    bullets: [
      'spara och visa din biodlingslogg',
      'ge överblick över bigårdar, kupor, genomgångar, händelser och uppgifter',
      'räkna fram rekommendationer, varningar och uppföljning',
      'hämta väder kopplat till en plats när du använder den funktionen',
      'visa kartlänk för en sparad plats',
      'skapa en exportfil för backup',
      'komma ihåg dina lokala inställningar, som tema',
    ],
  },
  {
    title: '6. Hur och var data lagras',
    paragraphs: [
      'I nuvarande version lagras Kupkolls huvudinnehåll lokalt på din enhet eller i webbläsarens lokala lagring.',
      'Det innebär normalt att uppgifter om bigårdar, kupor, genomgångar, händelser, uppgifter och vissa inställningar ligger kvar lokalt tills du själv ändrar, raderar eller avinstallerar appen, beroende på plattformens hantering av lokal lagring.',
      'Kupkoll skickar inte detta innehåll till någon egen Kupkoll-server i nuvarande MVP.',
    ],
  },
  {
    title: '7. Export och backup',
    paragraphs: [ 'När du använder exportfunktionen skapar Kupkoll en JSON-fil som innehåller:' ],
    bullets: [ 'bigårdar', 'kupor', 'genomgångar', 'händelser', 'manuella uppgifter', 'metadata som exporttid, schema-version och antal poster' ],
    subsections: [
      {
        title: 'Viktigt om exporterad fil',
        paragraphs: [
          'Exportfilen är avsedd som backup. När filen har laddats ner, sparats eller delats utanför appen ansvarar du själv för hur den hanteras.',
          'Exportfilen är läsbar JSON-data och inte en krypterad backup. Dela eller lagra därför filen med samma försiktighet som andra anteckningar eller dokument med känsligt innehåll.',
        ],
      },
    ],
  },
  {
    title: '8. Externa tjänster och mottagare',
    paragraphs: [ 'Kupkoll använder eller länkar i vissa fall till externa tjänster när du själv aktiverar en funktion.' ],
    subsections: [
      {
        title: 'Vädertjänster',
        paragraphs: [
          'För väderhämtning använder appen i första hand SMHI och i andra hand Open-Meteo. När den funktionen används kan koordinater eller platsrelaterade parametrar skickas till respektive vädertjänst för att hämta aktuell väderinformation.',
        ],
      },
      {
        title: 'Karttjänster',
        paragraphs: [ 'När du öppnar karta från appen används länkar till OpenStreetMap. Om du använder funktionen kan platsnamn eller koordinater ingå i länken som öppnas.' ],
      },
      {
        title: 'Enhetens plats- och geokodningstjänster',
        paragraphs: [
          'När du hämtar din aktuella plats använder Kupkoll enhetens platsbehörighet. Om appen försöker översätta koordinater till en läsbar adress kan det ske via operativsystemets eller plattformens geokodningstjänster.',
        ],
      },
      {
        title: 'Delning, filer och webbläsare',
        paragraphs: [
          'Vid export kan din enhets delningsfunktion, filhantering eller webbläsarens nedladdningsfunktion användas. Hur dessa funktioner hanterar data styrs av respektive plattform eller tjänst.',
          'Kupkoll ansvarar inte för integritetspolicyer hos externa tjänster som du väljer att använda från appen.',
        ],
      },
    ],
  },
  {
    title: '9. Rättslig grund',
    paragraphs: [
      'Om och i den mån dataskyddslagstiftning kräver rättslig grund behandlas uppgifter huvudsakligen för att tillhandahålla de funktioner som du själv använder i appen.',
      'För platsuppgifter sker behandling normalt med stöd av ditt samtycke via enhetens behörighetsinställningar och ditt aktiva val att använda platsfunktionen.',
    ],
  },
  {
    title: '10. Lagringstid',
    paragraphs: [ 'Kupkoll sparar uppgifter lokalt tills något av följande sker:' ],
    bullets: [
      'du raderar enskilda poster i appen',
      'du rensar lokal appdata eller webbläsardata',
      'du avinstallerar appen, i den mån plattformen då tar bort lokal lagring',
    ],
    subsections: [
      {
        title: 'Exporterade filer',
        paragraphs: [ 'Exporterade filer sparas tills du själv tar bort dem från den plats där du har sparat eller delat dem.' ],
      },
    ],
  },
  {
    title: '11. Dina val och rättigheter',
    paragraphs: [ 'Du kan normalt:' ],
    bullets: [
      'använda appen utan konto',
      'neka platsbehörighet och i stället skriva in plats manuellt',
      'ändra eller radera innehåll som du har lagt in i appen',
      'exportera dina uppgifter som backup',
      'ta bort lokalt lagrad data genom att rensa appen eller avinstallera den, beroende på plattform',
    ],
    subsections: [
      {
        title: 'Om GDPR är tillämplig',
        paragraphs: [
          'Om dataskyddslagstiftning som GDPR är tillämplig kan du också ha rättigheter som rätt till information, rättelse, radering och begränsning.',
          'I en lokal app utan centralt konto eller server utövas dessa rättigheter i praktiken i första hand på din egen enhet, men du kan fortfarande kontakta projektägaren med frågor.',
        ],
      },
    ],
  },
  {
    title: '12. Säkerhet',
    paragraphs: [
      'Kupkoll är utformad för att minimera onödig central datalagring genom att huvuddelen av informationen lagras lokalt. Det minskar vissa integritetsrisker men innebär inte att all risk försvinner.',
      'Du bör särskilt tänka på att:',
    ],
    bullets: [
      'skydda din enhet med rimliga säkerhetsinställningar',
      'hantera exportfiler varsamt',
      'tänka på att anteckningar och koordinater kan vara känsliga beroende på hur du använder appen',
    ],
  },
  {
    title: '13. Barn',
    paragraphs: [ 'Kupkoll är inte särskilt riktad till barn. Om appen skulle börja användas i sammanhang där särskilda skyddsregler gäller för barn behöver policyn uppdateras.' ],
  },
  {
    title: '14. Ändringar i policyn',
    paragraphs: [
      'Den här integritetspolicyn kan uppdateras om appens funktioner, datalagring eller externa integrationer ändras. Den senaste versionen bör alltid finnas i projektets dokumentation.',
      'Du kan även läsa samma policy direkt i appen under Inställningar.',
    ],
  },
];