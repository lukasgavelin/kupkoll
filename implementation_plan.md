# Genomförda Arkitekturförbättringar för Kupkoll

Det här dokumentet sammanfattar de genomförda arkitekturlyften som har löst appens tidigare svagheter inom lokal datalagring, backup och regelmotor.

---

## 1. Databas och Skalbarhet (Genomfört: `expo-sqlite`)

**Status:** ✅ Klart och produktionssatt i koden.

Vi har ersatt den tidigare `AsyncStorage`-lösningen (som sparade hela apptillståndet som en enda JSON-sträng) med en inbäddad SQLite-databas.

- [x] **Initiering med WAL-läge**: `PRAGMA journal_mode = WAL;` för maximal skrivprestanda och kraschsäkerhet vid fältanvändning (`src/lib/db.ts`).
- [x] **Strukturerade SQL-tabeller**: Separata tabeller för `Apiaries`, `Hives`, `Inspections`, `HiveEvents`, `Tasks` och `Settings`.
- [x] **Kaskadradering**: Radering av en bigård eller kupa raderar automatiskt underliggande genomgångar och händelser (`ON DELETE CASCADE`).
- [x] **Optimerad minnesladdning**: Vid appstart laddas endast de tre senaste genomgångarna/händelserna per kupa in i minnet för omedelbar respons på hemskärmen. Full historik hämtas on-demand när användaren öppnar kupans historikvy.

---

## 2. Bildstöd och Fotodokumentation (Genomfört)

**Status:** ✅ Klart och produktionssatt i koden.

- [x] Integrerat `expo-image-picker` med behörighetshantering för både kamera och bildgalleri.
- [x] Bildreferenser (`imageUris`) sparas i SQLite för både genomgångar och händelser.
- [x] Förhandsvisning och borttagning av bilder direkt i genomgångsformuläret (`QuickInspectionForm.tsx`).
- [x] Bildgalleri i kupans historikkort (`Cards.tsx`).

---

## 3. Backup och Dataportabilitet (Genomfört)

**Status:** ✅ Klart och produktionssatt i koden.

För att bevara appens integritet och hålla den 100 % anonym utan krav på användarkonton:
- [x] **JSON-export**: Skapar en komplett datadump av användarens bigårdar, kupor, historik och inställningar via `expo-file-system`.
- [x] **Delning via OS**: Använder `expo-sharing` så att användaren kan spara filen direkt till Google Drive, iCloud Drive, Dropbox eller skicka via e-post/AirDrop.
- [x] **JSON-import**: `expo-document-picker` och `src/lib/import.ts` möjliggör fullständig återställning av data från en tidigare sparad JSON-fil.

---

## 4. Regelmotor & Erfarenhetsanpassning (Genomfört)

**Status:** ✅ Klart och produktionssatt i koden.

- [x] `UserSettings` implementerat med `experienceLevel: 'experienced' | 'beginner'`.
- [x] **Erfaren biodlare (standard)**: Rent UI utan störande hjälptexter, snabb inmatning och glesare påminnelsekadens.
- [x] **Nybörjarläge**: Pedagogiska förklaringskort (yngel, foder, svärmtecken, varroametoder, kupsystem) och tätare kontroller.
- [x] Toggle finns tillgänglig i Inställningar.

---

## 5. Medvetna Avgränsningar i Nuvarande Version

- **Ingen backend/molnsynk i realtid**: Appen förblir medvetet offline-first och fri från serverkostnader/inloggning.
- **Inga OS-bakgrundsnotiser**: All logik och larm körs lokalt i appen vid användning.
- **Webbstöd är begränsat till Dev/test**: `expo-sqlite` körs optimalt på iOS och Android; webbläsaren saknar fullständig SQLite-persistens utan särskild WASM-anpassning.

