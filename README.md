# Kupkoll

Kupkoll är en svensk Expo-app för biodlare som vill hålla ordning på bigårdar, kupor, genomgångar, händelser och uppgifter i ett enkelt arbetsflöde för mobil och webb.

Appen fungerar utan konto och sparar data lokalt.

## Dokumentation

- [Integritetspolicy](./INTEGRITETSPOLICY.md)
- [Google Play-release](./GOOGLE_PLAY_RELEASE.md)

## Det här ingår

- Hemvy som visar vad som behöver göras nu
- Bigårdar och kupor anpassade för svensk biodling
- Drottningprofil per kupa med status, årgång, märkning, ursprung och historikrader
- Genomgångar i snabb eller fördjupad form med observationer, varroakontroll, väder och uppföljning
- Händelselogg för viktiga biodlingsmoment som drottningbyte, avläggare, skattning och stödfodring
- Drottningbyten och märkning kan uppdatera kupans drottningkort och historik direkt från händelseflödet
- Historik per kupa som samlar både genomgångar och händelser i tidsordning
- Uppgifter och rekommendationer från regelmotor
- Lokal lagring, mörkt läge och JSON-export för backup av bigårdar, kupor, genomgångar, händelser och uppgifter

## Arbetsflöden

- Grundflöde: lägg till bigård, lägg sedan till kupa och fyll i aktuell drottning, logga därefter genomgångar och större händelser från kupans vy
- Snabb genomgång för ett snabbt lägesbesked direkt i bigården
- Fördjupad genomgång när du vill spara mer detaljer om varroa, åtgärder och anteckningar
- Separata händelser för sådant som ändrar samhällets säsongshistorik, särskilt drottningbyten och märkning
- Export till JSON för att kunna spara en lokal backup utanför appen

## Teknik

- Expo
- React Native
- TypeScript
- Expo Router
- AsyncStorage
- Vitest

## Projektstruktur

- `app/` skärmar och navigation
- `src/components/` UI och funktionskomponenter
- `src/store/` globalt app-state
- `src/lib/` regler, selektorer, lagring, export och väder
- `src/data/` säsongsmodell
- `src/types/` domäntyper

## Starta projektet

```bash
npm install
npm run web
```

## Vanliga kommandon

```bash
npm run start
npm run android
npm run ios
npm run web
npm run typecheck
npm test
```

## Android-release

Bygg APK för intern testning:

```bash
npx eas build --platform android --profile apk
```

Bygg release för distribution:

```bash
npx eas build --platform android --profile production
```