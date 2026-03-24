# beehaven2

beehaven2 är en svensk Expo-app för biodling med fokus på snabb kupjournal, tydlig överblick och regelbaserat beslutsstöd ute i bigården.

Gränssnittet är utformat för att kännas skandinaviskt, lugnt och premium utan att tappa enkelhet i fält. Den nuvarande versionen använder en lågmäld naturpalett, luftig spacing, tydlig svensk text och en kombination av Manrope för brödtext och Newsreader för rubriker.

## MVP-innehåll

- Hemöversikt med antal kupor, bigårdar, kommande uppgifter, varningsflaggor och senaste observationer.
- Bigårdar med plats, anteckningar och antal kupor.
- Kupor med status, drottningstatus, styrka, temperament och senaste inspektion.
- Snabbt inspektionsflöde på svenska.
- Uppgifter och rekommendationer baserade på senaste inspektioner.
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

## Nästa steg

- Offline-läge och synk
- Väder- och dragintegration
- Export/import
- AI-bildanalys och sensordata