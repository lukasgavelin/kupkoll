# Integritetspolicy för Kupkoll

Senast uppdaterad: 2026-03-26

Den här integritetspolicyn beskriver hur appen Kupkoll behandlar information när du använder appen. Policyn är skriven utifrån hur appen fungerar i nuvarande version av projektet.

Kupkoll är i grunden en lokal biodlingsapp. I nuvarande MVP finns ingen användarinloggning och ingen egen backend där ditt innehåll lagras centralt av utvecklaren.

## 1. Vem policyn gäller för

Policyn gäller för personer som använder Kupkoll på mobil eller i webbläsare.

## 2. Personuppgiftsansvarig och kontakt

Kupkoll är skapad av Lukas Gavelin.

Om du har frågor om integritet eller databehandling kan du kontakta:

E-post: lukas.gavelin@gmail.com

Projektets repository finns även här:

https://github.com/lukasgavelin/kupkoll

## 3. Kort sammanfattning

- Kupkoll kräver inget konto.
- Ditt innehåll sparas i första hand lokalt på din enhet eller i din webbläsare.
- Kupkoll har i nuvarande version ingen egen server som tar emot eller lagrar ditt biodlingsinnehåll centralt.
- Om du använder platsfunktioner, väderhämtning, kartlänkar, export eller delning kan uppgifter skickas till externa tjänster eller hanteras av din enhets operativsystem.
- Kupkoll använder i nuvarande version inte egna annonstjänster eller eget analysverktyg för beteendespårning.

## 4. Vilka uppgifter som kan behandlas

### Uppgifter du själv lägger in

Kupkoll kan behandla information som du själv matar in, till exempel:

- bigårdars namn, plats, anteckningar och koordinater
- kupors namn, status, styrka, temperament, kupsystem och anteckningar
- genomgångar, observationer, väderanteckningar och fria textanteckningar
- manuella uppgifter och planerade åtgärder

### Uppgifter som skapas i appen

Appen kan också skapa eller härleda information utifrån det du registrerar, till exempel:

- rekommendationer och uppgifter som räknas fram av appens regler
- tidsstämplar för genomgångar och export
- summeringar och antal poster i exporterad backup

### Tekniska inställningar och lokal appdata

Kupkoll sparar även viss teknisk information lokalt för att appen ska fungera som tänkt, till exempel:

- lokalt apptillstånd för bigårdar, kupor, genomgångar och uppgifter
- valt tema, till exempel mörkt eller ljust läge
- status för om guidningen i appen har visats eller återställts

### Platsuppgifter

Om du väljer att använda funktionen för att hämta din plats kan Kupkoll behandla enhetens aktuella koordinater för att:

- fylla i bigårdens position
- förbättra platsanpassning av säsongslogik och råd
- hämta väder för genomgångar och säsongssignal

Platsåtkomst används bara när du aktivt väljer att använda funktionen och om du ger appen behörighet på enheten.

## 5. Varför uppgifterna behandlas

Kupkoll behandlar information för att kunna:

- spara och visa din biodlingslogg
- ge överblick över bigårdar, kupor, genomgångar och uppgifter
- räkna fram rekommendationer, varningar och uppföljning
- hämta väder kopplat till en plats när du använder den funktionen
- visa kartlänk för en sparad plats
- skapa en exportfil för backup
- komma ihåg dina lokala inställningar, som tema och guidning

## 6. Hur och var data lagras

I nuvarande version lagras Kupkolls huvudinnehåll lokalt på din enhet eller i webbläsarens lokala lagring.

Det innebär normalt att uppgifter om bigårdar, kupor, genomgångar, uppgifter och vissa inställningar ligger kvar lokalt tills du själv ändrar, raderar eller avinstallerar appen, med reservation för hur respektive plattform hanterar lokal lagring.

Kupkoll skickar inte detta innehåll till någon egen Kupkoll-server i nuvarande MVP.

## 7. Export och backup

När du använder exportfunktionen skapar Kupkoll en JSON-fil som innehåller:

- bigårdar
- kupor
- genomgångar
- manuella uppgifter
- metadata som exporttid, schema-version och antal poster

Exportfilen är avsedd som backup. När filen har laddats ner, sparats eller delats utanför appen ansvarar du själv för hur den hanteras.

Observera att exportfilen är läsbar JSON-data och inte en krypterad backup. Dela eller lagra därför filen med samma försiktighet som andra anteckningar eller dokument med känsligt innehåll.

## 8. Externa tjänster och mottagare

Kupkoll använder eller länkar i vissa fall till externa tjänster när du själv aktiverar en funktion.

### Vädertjänster

För väderhämtning använder appen i första hand SMHI och i andra hand Open-Meteo. När den funktionen används kan koordinater eller platsrelaterade parametrar skickas till respektive vädertjänst för att hämta aktuell väderinformation.

### Karttjänster

När du öppnar karta från appen används länkar till OpenStreetMap. Om du använder funktionen kan platsnamn eller koordinater ingå i länken som öppnas.

### Enhetens plats- och geokodningstjänster

När du hämtar din aktuella plats använder Kupkoll enhetens platsbehörighet. Om appen försöker översätta koordinater till en läsbar adress kan det ske via operativsystemets eller plattformens geokodningstjänster.

### Delning, filer och webbläsare

Vid export kan din enhets delningsfunktion, filhantering eller webbläsarens nedladdningsfunktion användas. Hur dessa funktioner hanterar data styrs av respektive plattform eller tjänst.

Kupkoll ansvarar inte för integritetspolicyer hos externa tjänster som du väljer att använda från appen.

## 9. Rättslig grund

Om och i den mån dataskyddslagstiftning kräver rättslig grund behandlas uppgifter huvudsakligen för att tillhandahålla de funktioner som du själv använder i appen.

För platsuppgifter sker behandling normalt med stöd av ditt samtycke via enhetens behörighetsinställningar och ditt aktiva val att använda platsfunktionen.

## 10. Lagringstid

Kupkoll sparar uppgifter lokalt tills något av följande sker:

- du raderar enskilda poster i appen
- du rensar lokal appdata eller webbläsardata
- du avinstallerar appen, i den mån plattformen då tar bort lokal lagring

Exporterade filer sparas tills du själv tar bort dem från den plats där du har sparat eller delat dem.

## 11. Dina val och rättigheter

Du kan normalt:

- använda appen utan konto
- neka platsbehörighet och i stället skriva in plats manuellt
- ändra eller radera innehåll som du har lagt in i appen
- exportera dina uppgifter som backup
- ta bort lokalt lagrad data genom att rensa appen eller avinstallera den, beroende på plattform

Om dataskyddslagstiftning som GDPR är tillämplig kan du också ha rättigheter som rätt till information, rättelse, radering och begränsning. I en lokal app utan centralt konto eller server utövas dessa rättigheter i praktiken i första hand på din egen enhet, men du kan fortfarande kontakta projektägaren med frågor.

## 12. Säkerhet

Kupkoll är utformad för att minimera onödig central datalagring genom att huvuddelen av informationen lagras lokalt. Det minskar vissa integritetsrisker men innebär inte att all risk försvinner.

Du bör särskilt tänka på att:

- skydda din enhet med rimliga säkerhetsinställningar
- hantera exportfiler varsamt
- tänka på att anteckningar och koordinater kan vara känsliga beroende på hur du använder appen

## 13. Barn

Kupkoll är inte särskilt riktad till barn. Om appen skulle börja användas i sammanhang där särskilda skyddsregler gäller för barn behöver policyn uppdateras.

## 14. Ändringar i policyn

Den här integritetspolicyn kan uppdateras om appens funktioner, datalagring eller externa integrationer ändras. Den senaste versionen bör alltid finnas i projektets dokumentation.
