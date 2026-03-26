# Kupkoll

Kupkoll är en svensk Expo-app för biodlare som vill få ordning på arbetet ute i bigården utan att behöva växla mellan anteckningar, minneslistor och separata väderappar. Appen är byggd för att vara snabb i fält, tydlig på mobilen och anpassad till svenska säsonger och arbetsmönster.

Syftet är inte bara att lagra data. Kupkoll ska hjälpa användaren att förstå tre saker samtidigt:

- vad som bör göras nu
- vad som bör följas upp snart
- vad som är normalt för säsongen där bigården står

Appen startar utan förifylld data och fungerar som en lokal personlig biodlingslogg utan krav på konto.

## Vad appen är till för

Kupkoll kombinerar journalföring, överblick och vägledning i samma arbetsyta.

- Bigårdar samlar plats, läge och eventuella koordinater.
- Kupor samlar status för varje samhälle.
- Genomgångar sparar observationer ute i fält.
- Uppgifter håller ihop arbetslistan.
- Hem prioriterar vad användaren bör börja med.

Det innebär att appen inte bara visar det som redan har matats in, utan också försöker göra informationen användbar direkt i nästa beslut.

## Flöde i appen

Appens huvudflikar har olika ansvar.

- Hem: visar nästa steg, närmaste uppgifter, sådant att hålla ögonen på, senaste genomgångar, säsongsläge och en kompakt översikt.
- Bigårdar: samlar platserna där kuporna står och gör det lätt att gå vidare till rätt bigård.
- Kupor: visar varje kupa med status, senaste genomgång och fortsatt uppföljning.
- Uppgifter: fungerar som arbetslista och grupperar sådant som är bråttom nu, snart på tur och längre fram.
- Inställningar: innehåller mörkt läge, backup och guidning.

Det här upplägget är valt för att användaren först ska mötas av handling och därefter av bakgrund och sammanhang.

## Hur appen är byggd

Kupkoll är en Expo- och React Native-app med TypeScript och Expo Router.

- Root layout laddar typsnitt, läser lokalt sparad data och startar appen först när det finns ett initialt state.
- Navigationen är uppdelad i tabbar för huvudflödet och modala vyer för att lägga till eller redigera bigårdar, kupor och genomgångar.
- Appens tillstånd ligger i en central context-provider som håller både grunddata och härledda vyer som dashboard, uppgifter och rekommendationer.
- Data sparas lokalt i AsyncStorage och migreras från tidigare lagringsformat när det behövs.
- Temat växlar mellan ljust och mörkt läge och användarens val sparas lokalt.
- Export skapar en JSON-fil med schema-version, metadata och hela användarens sparade innehåll.
- Aktuell väderdata hämtas i första hand från SMHI och faller tillbaka till Open-Meteo om det behövs.

Det finns ingen backend och ingen inloggning i nuvarande MVP.

## Regler och härledd logik

En viktig del av Kupkoll är att rekommendationer och arbetsuppgifter inte skrivs in för hand i första hand, utan härleds från det användaren registrerar.

Regelmotorn väger samman flera signaler:

- senaste genomgången för kupan
- historik från tidigare genomgångar
- kupans styrka och status
- säsong för bigårdens geografiska läge
- rekommenderad genomgångstakt för aktuell period
- väderförhållanden vid genomgången

Exempel på regler som finns i appen just nu:

- återkommande utebliven drottningobservation ger varning och uppföljningsuppgift
- förhöjt eller högt varroatryck ger rekommendation och prioriterad åtgärd
- stigande varroatrend över flera genomgångar fångas upp
- svärmrisk under svärmperiod lyfts bara när förhållandena faktiskt varit tillräckligt bra för en rättvis bedömning
- kyligt, blåsigt eller regnigt väder vid genomgång kan skapa en påminnelse om att följa upp i bättre flygväder
- för lång tid sedan senaste genomgång skapar påminnelse utifrån säsong och region

Rekommendationer grupperas i fyra typer: akuta signaler, säsongsråd, påminnelser och lägesbild.

## Säsongslogik

Säsongsstödet bygger på appens egen modell för svensk biodling, inte på fasta kalenderdatum rakt av.

- Sverige delas upp i södra, mellersta och norra Sverige.
- Varje region har en egen månadsmatris för hur säsongen normalt förskjuts.
- Varje säsongsfas har egen sammanfattning, fokuslista och rekommenderad kontrolltakt.
- Aktuell vädersignal kan skjuta tolkningen något framåt eller bakåt när utvecklingen går tidigare eller senare än normalt.

Det gör att samma datum kan tolkas olika beroende på var bigården ligger och hur vädret faktiskt ser ut.

## Data som sparas

Kupkoll sparar följande lokalt på enheten eller i webbläsaren:

- bigårdar
- kupor
- genomgångar
- manuella uppgifter

Exporten innehåller samma datamängd tillsammans med antal objekt, tidsstämpel och schema-version.

## Funktioner i nuvarande MVP

- lokal lagring utan konto
- förstastart utan förifylld data
- bigårdar med plats, anteckningar, koordinater och kartlänk
- kupor med status, drottningläge, styrka, temperament och kupsystem
- snabb registrering av genomgångar på svenska
- automatisk och manuellt justerbar väderloggning vid genomgång
- hemskärm som prioriterar nästa steg före bakgrundsinformation
- uppgiftsflik med tydlig arbetsordning
- regelmotor för härledda rekommendationer och uppgifter
- JSON-export för backup
- mörkt läge via Inställningar
- tester för selektorer, regler, lagring, export, väder och tutorials

## Starta projektet

```bash
npm install
npm run web
```

För andra mål används vanliga Expo-skript enligt nedan.

## Vanliga kommandon

```bash
npm run start
npm run android
npm run ios
npm run web
npm run typecheck
npm test
```

## Teknik

- Expo
- React Native
- TypeScript
- Expo Router
- Expo Location
- AsyncStorage
- Vitest
- @expo-google-fonts/manrope
- @expo-google-fonts/newsreader

## Projektstruktur i korthet

- app/: skärmar och navigation med Expo Router
- src/components/: återanvändbara UI-komponenter och funktionsspecifika kort/formulär
- src/store/: central app-state via context
- src/lib/: selektorer, regelmotor, väder, export och lagring
- src/data/: säsongsmodell och regional timing
- src/types/: domäntyper för bigårdar, kupor, genomgångar, uppgifter och rekommendationer

## Designriktning

- Skandinavisk och lågmäld visuell ton.
- Mjuk naturpalett med hög läsbarhet i dagsljus.
- Mörkt läge med samma lugna formspråk för kvällsarbete och svagare ljus.
- Luftig layout med tydlig rytm mellan sektioner och kort.
- Premiumkänsla genom typografi, rundade ytor och avskalad navigation.
- Svenska biodlingstermer, säsonger och arbetsmoment i hela gränssnittet.

## Nästa steg

- import av exporterad data
- fler regler för historiska mönster och uppföljning över tid
- tydligare stöd för planerade säsongsinsatser per region
- eventuell framtida synk mellan enheter