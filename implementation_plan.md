# Åtgärdsplan för Kupkolls Kritiska Svagheter

Här är en strategi för att lösa de tre största tekniska och konceptuella svagheterna i Kupkoll. För de två tyngsta punkterna (lagring och backup) finns det tydliga vägval beroende på hur du vill positionera appen framåt. 

> [!IMPORTANT]
> Läs igenom alternativen under Databas och Backup noggrant. De påverkar appens framtida arkitektur och affärsmodell (t.ex. kostnader för backend) markant. Välj det spår som bäst matchar din vision, så uppdaterar vi planen efter det.

---

## 1. Databas och Skalbarhet (Bort från AsyncStorage)

Att byta ut den gigantiska JSON-klumpen mot en riktig databas är prio 1 för appens livslängd.

### Vägval A: `expo-sqlite` (Rekommenderas)
Vi ersätter `AsyncStorage` med SQLite, som är det moderna och officiella sättet att bygga offline-first i Expo.
- [x] **Koduppdatering av KupkollContext**
  - **Före:** `replaceAllDataSync` körs i en `useEffect` och kraschar datan eftersom endast senaste 3 historikposterna finns i minnet.
  - **Efter:** Ta bort `useEffect`. Uppdatera `addInspection`, `addEvent`, `addHive` osv. så de anropar `saveInspectionSync`, `saveEventSync` direkt.
- [x] **Inspektionshistorik via UI**
  - **Ändring:** Uppdatera `app/hives/[id]/inspections.tsx` så den hämtar hela historiken on-demand via `useFocusEffect` istället för att använda Context.
* **Fördelar:** Skottsäkert. Ingen minnesläcka (du laddar bara kupa 1:s genomgångar när du klickar på kupa 1). Officiellt stöd via Expo. Extremt snabbt.
* **Nackdelar:** Kräver en ganska stor omskrivning av `KupkollContext.tsx` och `lib/storage.ts`. Vi måste bygga en migreringsrutin som läser befintlig JSON-data och konverterar det till rader i SQL-tabeller första gången användaren startar den nya versionen.
* **Insats:** Stor.

### Vägval B: Key-Fragmentation i AsyncStorage
Istället för att spara allt på nyckeln `kupkoll:app-state`, delar vi upp det: `kupkoll:hive:1`, `kupkoll:inspection:23` etc. 
* **Fördelar:** Mindre omskrivning. Vi slipper sätta upp SQL-tabeller. Går snabbt att bygga.
* **Nackdelar:** Fortfarande ingen riktig databas. Att rendera "Senaste genomgångar" innebär att vi måste läsa hundratals nycklar. Löser inte de grundläggande prestandaproblemen på lång sikt.
* **Insats:** Liten.

### Vägval C: WatermelonDB
En reaktiv databas ovanpå SQLite.
* **Fördelar:** Byggd specifikt för React Native och offline-synkning. Hanterar relationer (Kupa -> Genomgångar) extremt elegant.
* **Nackdelar:** En väldigt tung dependency. Kan ibland ställa till det med Expo-uppdateringar.
* **Insats:** Stor.

**Målbild:** Byta ut `lib/storage.ts` och låta `KupkollContext` hämta data reaktivt via databasen istället för tunga array-filtreringar i `useMemo`.

---

## 2. Risken för Dataförlust (Backup / Synk)

Biodlare riskerar att förlora all sin data om telefonen går sönder. Hur löser vi detta?

### Vägval A: Automatisk moln-backup via iCloud / Google Drive (Rekommenderas)
Appen är idag anonym (inget konto krävs). Vi bevarar denna känsla genom att nyttja användarens *befintliga* moln. Vi bygger en funktion som automatiskt exporterar appens databas till en dold mapp i användarens iCloud (iOS) eller Google Drive (Android) en gång i veckan.
- [x] **Bildstöd för genomgångar**
- [x] **Nytt beroende:** `npx expo install expo-image-picker`
- [x] **Domänmodell:** Utöka `Inspection` och `HiveEvent` med `imageUris?: string[]`.
- [x] **UI:** Lägg till knapp i `app/inspections/new.tsx` för att välja bild och spara URL i SQLite.
* **Fördelar:** 100% anonymt. Inga serverkostnader för dig som utvecklare. Data lever tryggt utanför telefonen.
* **Nackdelar:** Lite knepigt att sätta upp Google Drive API / iCloud Documents via Expo. 
* **Insats:** Medel.

### Vägval B: Skapa ett inlogg och Backend (Supabase / Firebase)
Vi går ifrån "offline first, inget konto" och bygger en riktig inloggning. All data synkas i realtid till en databas (t.ex. Supabase).
* **Fördelar:** Användaren kan logga in på webben och se samma data. "Modern" app-känsla. Data är alltid 100% säkrat.
* **Nackdelar:** Du får driftskostnader. Skapar en tröskel (folk måste skapa konto). Kräver nätverk (även om offline-stöd går att bygga).
* **Insats:** Mycket stor.

### Vägval C: Påtvingad lokal fil-export
Vi använder `expo-file-system` för att per automatik spara JSON-exporten till telefonens "Nedladdningar" eller "Dokument" vid varje stängning.
* **Fördelar:** Extremt enkelt.
* **Nackdelar:** Datan ligger fortfarande kvar på enheten. Tappar de enheten är datan troligtvis ändå borta om telefonen inte gör en total backup via OS:et.
* **Insats:** Liten.

---

## 3. Rigiditet i Regelsystemet (Anpassning)

Regelsystemet i `rules.ts` är statiskt. Erfarna biodlare kan bli irriterade på larm som de inte anser relevanta. Detta kan vi lösa oavsett ovanstående vägval.

### Föreslagen lösning: "Mina Inställningar"
Vi introducerar ett nytt interface i `types/domain.ts`: `UserSettings`.
1. **Tröskelvärden:** Användaren kan ställa in hur ofta de vill ha påminnelser (t.ex. "Varna för inaktiv kupa efter 14 dagar, 21 dagar eller Aldrig").
2. **Stäng av moduler:** Möjlighet att bocka ur "Varna för svärmrisk" om biodlaren använder ett system där de ignorerar detta (t.ex. vid extrem avläggar-produktion).
3. **Erfarenhetsnivå:** En snabb "toggle" under Inställningar: *Nybörjare* (alla varningar på, utförliga råd) vs *Erfaren* (bara kritiska larm).
4. Vi modifierar `decisionRules` i `rules.ts` till att acceptera `UserSettings` i sitt `RuleContext`.

---

## User Review Required

Hur ser du på vägvalen?
1. **Databas:** Vilken väg föredrar du? (Mitt råd: Vägval A, `expo-sqlite`)
2. **Backup/Synk:** Vill du behålla appen anonym och gratis i drift (Vägval A) eller vill du bygga en plattform med inlogg (Vägval B)?
3. **Inställningar:** Tycker du att "Erfarenhetsnivå"-konceptet låter bra för att tämja regelsystemet?

Svara med vilka spår du vill gå vidare med så börjar vi exekvera!
