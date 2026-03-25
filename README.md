# beehaven2

beehaven2 är en svensk Expo-app för biodling med fokus på snabb kupjournal, tydlig överblick och regelbaserat beslutsstöd ute i bigården.

Gränssnittet är utformat för att kännas skandinaviskt, lugnt och premium utan att tappa enkelhet i fält. Den nuvarande versionen använder en lågmäld naturpalett, luftig spacing, tydlig svensk text och en kombination av Manrope för brödtext och Newsreader för rubriker.

## MVP-innehåll

- Hemöversikt med antal kupor, bigårdar, kommande arbetsmoment, varningsflaggor och senaste genomgångar.
- Bigårdar med läge, dragförutsättningar och antal kupor.
- Kupor med samhällsläge, drottningstatus, styrka, kupsystem och senaste genomgång.
- Snabbt genomgångsflöde på svenska för fältbruk.
- Uppgifter och rekommendationer baserade på svenska biodlingssäsonger och senaste genomgångar.
- Förfinad UI med rundade kort, flytande tabb-navigering och mer konsekventa detaljvyer.

## Start

```bash
npm install
npm run start
```

## Vanliga kommandon

```bash
npm run android
npm run ios
npm run web
npm run typecheck
```

## Teknik

- Expo
- React Native
- TypeScript
- Expo Router
- @expo-google-fonts/manrope
- @expo-google-fonts/newsreader

## Designriktning

- Skandinavisk och lågmäld visuell ton.
- Mjuk naturpalett med hög läsbarhet i dagsljus.
- Luftig layout med tydlig rytm mellan sektioner och kort.
- Premiumkänsla genom typografi, rundade ytor och avskalad navigation.
- Svenska biodlingstermer, säsonger och arbetsmoment som vårutveckling, svärmperiod, skattning och invintring.

## Nästa steg

- Offline-läge och synk
- Väder- och dragintegration
- Export/import
- AI-bildanalys och sensordata