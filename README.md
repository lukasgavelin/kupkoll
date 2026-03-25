# beehaven2

beehaven2 är en svensk Expo-app för biodlare som vill få struktur i vardagsarbetet ute i bigården och samtidigt få säsongsanpassat beslutsstöd. Appen är byggd för att vara snabb i fält, tydlig på mobilen och förankrad i svensk biodlingspraxis.

Målet är att kombinera tre saker i samma arbetsyta: enkel journalföring, bra överblick över bigårdar och kupor, samt konkreta rekommendationer om vad som bör följas upp härnäst.

Appen startar utan demo- eller mockdata för att motsvara en ren nyinstallation.

## Vad appen gör nu

- Ger en hemöversikt med säsongsläge, antal kupor och bigårdar, kommande arbetsmoment, signaler att följa upp och senaste genomgångar.
- Visar ett säsongskort högst upp på startsidan med svensk säsongsfas, fokus just nu och råd som anpassas efter tid på året.
- Anpassar säsongsstöd efter var bigården ligger i Sverige genom apiary-plats, koordinater och enkel regional logik.
- Låter dig skapa och redigera bigårdar med namn, platsbeskrivning, valfri GPS-position och snabb länk till karta.
- Låter dig registrera kupor med samhällsläge, styrka, drottningstatus, kupsystem och koppling till rätt bigård.
- Ger ett snabbt kupgenomgångsflöde på svenska för mobil användning ute i fält.
- Bygger rekommendationer och uppgifter utifrån svensk säsong, senaste genomgångar och historik i kupan, till exempel drottningproblem över tid, varroatrend, svärmtryck och uteblivna kontroller.
- Prioriterar rekommendationer i tydliga grupper som akuta signaler, säsongsråd, påminnelser och lägesbild.
- Sparar data lokalt så att appen fungerar som en ren personlig biodlingslogg utan krav på konto.

## Produktidé

beehaven2 är tänkt som ett digitalt stöd för svensk biodling snarare än bara ett register. I stället för att enbart visa vad användaren matat in ska appen hjälpa biodlaren att se vad som kräver uppmärksamhet nu, vad som är normalt för säsongen och vilka mönster i kupans historik som bör tas på allvar.

Beslutsstödet lutar mot svensk praxis och säsongsråd från svenska källor, med särskilt fokus på hur arbetsbehovet skiftar mellan vårutveckling, dragperiod, svärmning, skattning och invintring.

## Funktioner i MVP:n

- Startsida med säsongsläge, nyckeltal, prioriterade rekommendationer och kommande uppgifter.
- Bigårdsvyer med platsinformation, koordinater och kartöppning.
- Kupvyer med status, historik och rekommendationer för varje samhälle.
- Snabb registrering av genomgångar med fält anpassade för biodlingsarbete.
- Regelmotor för att härleda uppgifter och rekommendationer från säsong, inspektionshistorik och kupstatus.
- Förstastart utan förifylld data.

## Starta projektet

```bash
npm install
npm run start
```

Öppna sedan appen i Expo Go, emulator eller webben beroende på din miljö.

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

## Designriktning

- Skandinavisk och lågmäld visuell ton.
- Mjuk naturpalett med hög läsbarhet i dagsljus.
- Luftig layout med tydlig rytm mellan sektioner och kort.
- Premiumkänsla genom typografi, rundade ytor och avskalad navigation.
- Svenska biodlingstermer, säsonger och arbetsmoment i hela gränssnittet.

## Nästa steg

- Offline-läge och framtida synk mellan enheter.
- Djupare platsanpassning med väder, drag och blomningsläge.
- Export och import av biodlingsdata.
- Fler beslutsstöd kopplade till svensk säsong och regionala förutsättningar.