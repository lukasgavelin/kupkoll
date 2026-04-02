# Google Play-release för Kupkoll

Det här dokumentet beskriver vad som är klart i projektet, vad som återstår och hur första Android-publiceringen kan genomföras.

## Status i projektet

Följande releasegrund är nu satt i projektet:

- Android package name: `com.lukasgavelin.kupkoll`
- Android `versionCode`: `2`
- Appversion i Expo synkad till `1.2.1`
- EAS Build-konfiguration finns i `eas.json`

Det här räcker för att påbörja Android-releaseflödet, men inte för publicering i Google Play utan ytterligare material och kontokonfiguration.

## Viktiga beslut att bekräfta

Före första publika release bör ni bekräfta följande:

1. Att package name `com.lukasgavelin.kupkoll` är det ni vill behålla permanent.
2. Att appen ska släppas enbart för Android.
3. Att appversion `1.2.1` är rätt nästa releaseetikett.
4. Att Google Play-kontot ska ägas av rätt person eller företag från början.

Package name och Play-appens identitet bör ses som permanenta beslut.

## Kvar att göra före första uppladdning

### 1. Skapa grafiska release-assets

Projektet saknar just nu appbilder för release. Följande behöver tas fram:

- Appikon för Expo/Android: 1024 x 1024 px PNG
- Adaptive icon foreground: minst 1024 x 1024 px PNG med transparent bakgrund
- Adaptive icon background: solid färg eller separat bakgrundsbild
- Splash-bild: minst 1242 x 2436 px PNG eller enkel centrerad logotyp på neutral bakgrund
- Google Play app icon: 512 x 512 px PNG
- Google Play feature graphic: 1024 x 500 px PNG eller JPG
- Minst 2 till 8 mobilskärmbilder för telefonformat

När de finns bör `app.json` kompletteras med `icon`, `android.adaptiveIcon` och eventuellt `splash`.

### 2. Publicera integritetspolicyn på stabil publik URL

Nuvarande policy finns i projektet och länkas från appen, men för Play Console bör ni använda en stabil publik HTTPS-sida som policy-URL.

Bra alternativ:

- GitHub Pages för projektet
- egen domän
- enkel statisk sida hos valfri host

Undvik att använda enbart GitHub blob-vy som slutlig policy-URL i Play Console.

### 3. Skapa första signerade Android-builden

Föreslagen väg:

```bash
npm install
npx eas login
npx eas build --platform android --profile production
```

För första release ska resultatet vara en `.aab`-fil.

### 4. Sätt upp app signing

I Google Play bör ni använda Play App Signing. Om EAS får hantera credentials blir första flödet enklare. Dokumentera vem som äger nycklarna och var återställningsuppgifter sparas.

### 5. Kör Android-QA före publicering

Minimikrav innan release:

- testa på minst en mindre Android-telefon
- testa på minst en större Android-telefon
- verifiera första start utan data
- verifiera platsbehörighet tillåten och nekad
- verifiera exportflöde
- verifiera externa länkar till karta och policy
- verifiera att appen fungerar utan konto och utan backend

## Play Console-checklista

### App setup

- skapa app i Google Play Console
- språk: svenska
- appnamn: Kupkoll
- app eller spel: app
- gratis eller betald: välj strategi
- kontaktuppgifter och support-e-post

### Store listing

- kort beskrivning
- full beskrivning
- appikon 512 x 512
- feature graphic 1024 x 500
- telefon-skärmbilder
- kategori
- integritetspolicy-URL

### App content

- privacy policy
- data safety
- target audience
- ads declaration: nej, om ni inte visar annonser
- content rating
- news-app declaration: nej

### Testing and rollout

- internal testing först
- closed testing om kontot kräver det före produktion
- produktionsrelease först när testbuilden är verifierad

## Föreslagna svar för Data safety

Det här är ett arbetsunderlag, inte juridisk rådgivning. Kontrollera svaren mot den faktiska releasen innan ni skickar in.

### Data som appen hanterar

- platsdata: ja, när användaren aktivt använder platsfunktionen
- användarinnehåll: ja, eftersom användaren skriver in bigårdar, kupor, genomgångar och anteckningar
- appaktivitet: nej, inte utifrån nuvarande kodbas
- personliga identifierare: nej, ingen inloggning eller kontoidentitet finns i nuvarande MVP
- ekonomisk information: nej
- hälsoinformation: nej
- meddelanden: nej

### Delas data med tredje part

Troligen ja, i begränsad funktionell mening, eftersom koordinater eller platsparametrar kan skickas till externa tjänster när användaren använder väder- eller platsfunktioner.

Berörda tjänster i nuvarande kod:

- SMHI
- Open-Meteo
- enhetens plats- eller geokodningstjänster
- OpenStreetMap via öppnade länkar

### Samlas data in

Ja, men mycket av appens innehåll lagras lokalt på användarens enhet och skickas inte till egen backend. I formuläret behöver ni beskriva att vissa datapunkter används för appfunktionalitet och att huvuddatan lagras lokalt.

### Är data krypterad under överföring

Ja, externa väder- och webblänkar använder HTTPS i nuvarande implementation.

### Kan användaren begära radering

Praktiskt ja på enhetsnivå, eftersom data lagras lokalt och kan tas bort genom att radera innehåll, rensa appdata eller avinstallera appen.

## Föreslagna svar för App content

### Target audience

- inte särskilt riktad till barn
- lämplig för allmän vuxen målgrupp med biodlingsintresse

### Ads

- nej, appen visar inte annonser i nuvarande version

### User generated content

- ja, användaren skriver in eget innehåll lokalt
- ingen publik delning eller social feed finns

### Permissions

Motivering för plats:

- används för att spara bigårdens position
- används för platsanpassad säsongsbedömning
- används för att hämta väder kopplat till bigårdens plats

## Förslag på första store listing-text

### Kort beskrivning

Kupkoll hjälper biodlare att hålla ordning på kupor, genomgångar, uppgifter och säsongsläge direkt i mobilen.

### Full beskrivning

Kupkoll är en svensk app för biodlare som vill samla bigårdar, kupor, genomgångar och uppgifter på ett ställe.

Appen är byggd för att fungera snabbt ute i bigården och hjälpa dig att se vad som behöver göras nu, vad som bör följas upp snart och hur säsongen utvecklas där dina kupor står.

Med Kupkoll kan du:

- spara bigårdar med plats och position
- hålla ordning på kupor och deras status
- registrera genomgångar direkt i mobilen
- få hjälp att prioritera uppgifter
- se råd utifrån säsong, plats och senaste observationer
- exportera din data som JSON-backup

Kupkoll fungerar utan konto och lagrar i nuvarande version huvuddelen av innehållet lokalt på din enhet.

## Releaseordning

1. Bekräfta package name och Play-kontoägare.
2. Ta fram icon, adaptive icon, splash och Play-grafik.
3. Publicera integritetspolicyn på publik URL.
4. Bygg första Android AAB med EAS.
5. Ladda upp till internal testing.
6. Verifiera Data safety och App content i Play Console.
7. Kör closed testing om kontot kräver det.
8. Publicera till production.