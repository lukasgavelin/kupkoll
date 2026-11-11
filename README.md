# Kupkoll

Kupkoll är en svensk Expo-app (React Native) för biodlare som vill hålla ordning på bigårdar, kupor, genomgångar, händelser och uppgifter direkt i mobilen ute i fält.

Appen är byggd med filosofin **Local-first / Offline-first**: den fungerar helt utan konto eller extern backend, och all data sparas lokalt i en inbäddad SQLite-databas.

---

## Dokumentation

- [Integritetspolicy](./INTEGRITETSPOLICY.md)
- [Licens (PolyForm Noncommercial 1.0.0)](./LICENSE)

---

## Plattformsstatus

Appen är byggd med React Native och Expo SDK 55 och hanteras från en gemensam kodbas:

| Plattform | Status | Bundle-ID / Package | Kommentar |
| :--- | :--- | :--- | :--- |
| **Android** | Klar för release | `com.lukasgavelin.kupkoll` | Byggbar som installerbar APK eller `.aab` för Google Play via EAS Build. |
| **iOS** | Klar för release | `com.lukasgavelin.kupkoll` | Stödjer iPhone & iPad, redo för TestFlight/App Store via EAS Build. |
| **Webb** | Dev/test | Metro bundler (`npm run web`) | Fungerar för utveckling och UI-förhandsgranskning. Ej produktionsklar PWA (kräver anpassat webblagringslager för SQLite). |

---

## Vad som finns i appen idag

### 1. Bigårdar och kupor
- Registrera bigårdar med namn, beskrivning och automatisk GPS-position via enhetens platsfunktion (`expo-location`).
- Automatisk koppling till svensk kommun och geografisk zon för säsongsanpassning.
- Stöd för svenska kupsystem: **Lågnormal**, **Svea**, **Langstroth** och **Dadant**.
- Kupstatus: *Stabilt*, *Under uppbyggnad* eller *Behöver åtgärd*.

### 2. Drottningprofil och historik
- Status per kupa: *Bekräftad*, *Osäker* eller *Behöver följas upp*.
- Internationell färgkodning efter årgång: Vit, Gul, Röd, Grön, Blå samt Omärkt.
- Drottningens härstamning och årtal.
- Automatisk drottninghistorik som loggar drottningbyten och märkningar över tid.

### 3. Genomgångar (Snabb & Fördjupad)
- **Snabb genomgång**: Snabb inmatning i fält av yngelstatus (ägg, öppet yngel, täckt yngel), drottningobservation, foderläge, temperament och svärmceller.
- **Fördjupad genomgång**: Detaljerade noteringar om varroa, specifika åtgärder, fria anteckningar och uppföljningsdatum.
- **Kamera- och bildstöd**: Fota ramar direkt med telefonens kamera eller bifoga foton från bildbiblioteket (`expo-image-picker`). Bilderna visas i kupans historik.
- **Automatisk väderloggning**: Hämtar temperatur, vind och väderlek automatiskt vid genomgång via SMHI (sekundär fallback till Open-Meteo).

### 4. Händelselogg
- Separata poster för större ingrepp i samhället:
  - Drottningbyte & Märkning (uppdaterar automatiskt kupans profil och drottninghistorik).
  - Avläggare (samhällsdelning).
  - Skattning (honungsskörd).
  - Stödfodring och invintring.
  - Varroabehandling.
- Fullständig tidslinje som samlar både genomgångar och händelser i datumordning.

### 5. Varroahantering & Trendanalys
- Stöd för kontrollmetoder: naturligt nedfall, florsockermetod, alkoholtvätt, drönarutskärning, oxalsyra, tymol och myrsyra.
- Trendvy (`app/hives/[id]/trends.tsx`) med visuella grafer över varroatryck och tillsynsfrekvens.

### 6. Dragkalender & Fenologisk blomningsmodell
- Precomputed regressionsmodell (`assets/bloomRegression.json`) baserad på 15+ års svenska observationer.
- Zonindelning (Syd, Mellan, Nord) och glidande latitudberäkning.
- **Temperaturfenologi (GDD)**: Blomningsfönstren justeras automatiskt framåt eller bakåt baserat på aktuell säsongs värmeackumulering.
- **Flygeffektivitetsindex**: Beräknar bins dragförutsättningar just nu utifrån temperatur, vindstyrka och nederbörd.
- Direktlänkar till Wikipedia för identifiering av dragväxter.

### 7. Regelmotor & Smarta rekommendationer
- Deterministisk regelmotor (`src/lib/rules.ts`) som analyserar:
  - utebliven drottningobservation över tid
  - förhöjt eller stigande varroatryck
  - svärmrisk i förhållande till säsong
  - genomgångstakt (cadence) baserat på säsong och region
  - tillsynsbehov efter dåligt flygväder
- Genererar prioriterade uppgifter i uppgiftslistan och varningar på hemskärmen.

### 8. Erfarenhetsanpassning (Inställningar)
- **Erfaren biodlare (standard)**: Rent gränssnitt utan hjälptexter, snabb inmatning och glesare påminnelsekadens.
- **Nybörjarläge**: Pedagogiska förklaringskort under genomgångar (yngelcykel, foderbehov, svärmceller), hjälptexter vid kupskapande och tätare kontrollintervall.

### 9. Lagring, Backup och Mörkt läge
- Lokal SQLite-databas (`expo-sqlite` med Write-Ahead Logging / WAL för hög driftsäkerhet).
- **JSON-export**: Säkerhetskopiering via telefonens delningsmeny till t.ex. Google Drive, iCloud Drive, Dropbox, e-post eller lokal fil.
- **JSON-import**: Full återställning från tidigare exporterad säkerhetskopia.
- Fullt stöd för mörkt och ljust tema.

---

## Vad som inte finns i appen (Medvetna avgränsningar)

För att vara tydlig med appens nuvarande arkitektur och begränsningar:

| Område | Status i nuvarande version |
| :--- | :--- |
| **Användarkonto / Inloggning** | Finns inte. Appen kräver inget konto och samlar inga användaruppgifter. |
| **Molnsynkning i realtid** | Finns inte. Det finns ingen central backend (Firebase/Supabase). Backup sker manuellt via JSON-export. |
| **OS-pushnotiser** | Finns inte. Påminnelser och uppgifter räknas fram av regelmotorn när appen öppnas, men skickar inte bakgrundsnotiser via operativsystemet. |
| **Fleranvändarläge / Delning** | Finns inte. Flera personer kan inte redigera samma bigård i realtid från olika enheter. |
| **Produktionsklar webbversion** | Finns inte. Webbversionen är en dev/test-vy via Metro. SQLite-lagringen är inte anpassad för webbläsares IndexedDB. |

---

## Teknisk arkitektur

```
┌────────────────────────────────────────────────────────┐
│                   Expo / React Native                  │
│       app/ (Expo Router v55) & src/components/         │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    KupkollContext                      │
│        Globalt tillstånd, aktioner och mutations       │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│       Lokal Persistens      │ │     Ren Affärslogik    │
│  - SQLite (expo-sqlite WAL) │ │  - rules.ts (Regelmotor)│
│  - JSON Import / Export     │ │  - dragCalendar.ts     │
│  - expo-image-picker (Foto) │ │  - selectors.ts        │
└─────────────────────────────┘ └────────────────────────┘
```

- **Ramverk**: Expo ~55.0.9, React 19.2.0, React Native 0.83.4
- **Navigation**: Expo Router (filbaserad navigation med modaler och tabbar)
- **Databas**: SQLite via `expo-sqlite` (tabeller för Apiaries, Hives, Inspections, HiveEvents, Tasks, Settings)
- **Logik & Tester**: Plattformsoberoende TypeScript testat med Vitest

---

## Projektstruktur

```
kupkoll/
├── app/                        # Skärmar och navigation (Expo Router)
│   ├── (tabs)/                 # Huvudflikar (Hem, Bigårdar, Kupor, Uppgifter, Inställningar)
│   ├── apiaries/               # Skapa, redigera och visa bigård
│   ├── hives/                  # Skapa, redigera, historik och trender för kupa
│   ├── inspections/            # Ny genomgång (kamera, snabb- och fördjupningsformulär)
│   └── events/                 # Nya händelser (drottningbyte, skattning, avläggare etc.)
├── src/
│   ├── components/             # UI-komponenter (AppCard, PageHeader, formulär och kort)
│   ├── data/                   # Statiska modeller (säsonger, integritetspolicy)
│   ├── lib/
│   │   ├── bloom/              # Dragkalender, fenologi, väderjustering
│   │   ├── db.ts               # SQLite-initiering, queries och schemadefinition
│   │   ├── rules.ts            # Regelmotor för uppgifter och varningar
│   │   ├── selectors.ts        # Härledda sammanställningar och statistik
│   │   ├── storage.ts          # Normalisering och migrationslogik
│   │   ├── export.ts / import.ts # JSON backup/återställning
│   │   └── weather.ts          # SMHI & Open-Meteo integrationer
│   ├── store/                  # KupkollContext och ThemeContext
│   ├── theme/                  # Färger, typografi och avstånd
│   └── types/                  # Domäntyper (Apiary, Hive, Inspection, Event, Task)
└── assets/                     # Ikoner, splash screen och regressionsdata
```

---

## Starta och köra projektet

```bash
# Installera beroenden
npm install

# Starta utvecklingsservern
npm run start

# Starta direkt för Android
npm run android

# Starta direkt för iOS
npm run ios

# Starta i webbläsare (Dev/test)
npm run web

# Kör typtestning
npm run typecheck

# Kör enhetstester
npm test
```

---

## Bygga för release

### Android
```bash
# Bygg testbar APK direkt:
npx eas build --platform android --profile apk

# Bygg produktionspaket (.aab):
npx eas build --platform android --profile production
```

### iOS
```bash
# Bygg för simulator (kräver macOS):
npx eas build --platform ios --profile simulator

# Bygg produktionspaket för TestFlight / App Store:
npx eas build --platform ios --profile production
```

---

## Licens

Licensierad under [PolyForm Noncommercial License 1.0.0](./LICENSE) – fri för personligt och icke-kommersiellt bruk. Kommersiell användning kräver separat licens.
