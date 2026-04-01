# Kupkoll

Kupkoll är en svensk Expo-app för biodlare som vill hålla ordning på bigårdar, kupor, genomgångar, händelser och uppgifter i ett enkelt arbetsflöde för mobil och webb.

Appen fungerar utan konto och sparar data lokalt.

## Dokumentation

- [Integritetspolicy](./INTEGRITETSPOLICY.md)
- [Google Play-release](./GOOGLE_PLAY_RELEASE.md)

## Plattformsstöd

Appen är byggd med React Native och Expo och stödjer **Android**, **iOS** och **webb** från samma kodbas.

| Plattform | Status       | Bundle-ID / Package                   |
|-----------|--------------|---------------------------------------|
| Android   | ✅ Live       | `com.lukasgavelin.kupkoll`            |
| iOS       | ✅ Klar för release | `com.lukasgavelin.kupkoll`     |
| Webb      | ✅ Dev/test   | Metro bundler                         |

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

## Blomningsmodell (Drag Calendar)

Bloom-funktionaliteten är nu renodlad till en modell och en service:

- `src/lib/bloom/dragCalendar.ts`: innehåller domäntyper, växtlista, CSV-parsing, zonindelning, fönsterbyggnad och prediktioner
- `src/lib/bloom/bloomService.ts`: laddar CSV-asset, bygger cachad dataset och exponerar `getLikelyBloomingPlantsNow` för UI
- `src/lib/bloom/index.ts`: publikt API för bloom-delen

Modellen utgår från:

- DOY (day-of-year) för tidsfönster
- Latitudbaserad zon (`south`, `middle`, `north`)
- Percentilbaserade blomningsfönster per art och zon
- Fallback-fönster för viktiga jordbruksväxter vid tunt underlag

Notera:

- Legacy-pipeline för bloom är borttagen för att undvika dubbla implementationer
- UI-komponenter ska importera bloom-typer från `@/lib/bloom`, inte från separat typfil

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

## iOS-release

Bygg för iOS Simulator (kräver macOS med Xcode):

```bash
npx eas build --platform ios --profile simulator
```

Bygg för TestFlight / App Store:

```bash
npx eas build --platform ios --profile production
```

Fyll i ditt Apple Developer-konto i `eas.json` → `submit.production.ios` (`appleId`, `ascAppId`, `appleTeamId`) innan du kör submit.

```bash
npx eas submit --platform ios --profile production
```