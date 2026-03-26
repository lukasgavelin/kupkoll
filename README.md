# Kupkoll

Kupkoll är en svensk Expo-app för biodlare som vill hålla ordning på bigårdar, kupor, genomgångar och uppgifter i ett enkelt arbetsflöde för mobil och webb.

Appen fungerar utan konto och sparar data lokalt.

## Dokumentation

- [Integritetspolicy](./INTEGRITETSPOLICY.md)
- [Google Play-release](./GOOGLE_PLAY_RELEASE.md)

## Det här ingår

- Hemvy som visar vad som behöver göras nu
- Bigårdar och kupor anpassade för svensk biodling
- Genomgångar med observationer, väder och uppföljning
- Uppgifter och rekommendationer från regelmotor
- Lokal lagring, mörkt läge och JSON-export för backup

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