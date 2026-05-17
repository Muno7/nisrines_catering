# Backend-planering

Det här dokumentet beskriver hur jag planerade backenddelen av projektet från
start till färdig backendstruktur. Syftet är inte bara att beskriva vilka filer som
finns, utan också varför backenden delades upp på det sättet och hur jag tänkte
när jag byggde den steg för steg.

## Projektets mål och startpunkt

Målet med backenden var att skapa en tydlig grund för Nisrine's Catering där den
publika hemsidan kan läsa menydata, bilder och subscriptionplaner, medan en
inloggad admin kan hantera innehållet. Jag ville separera den publika delen från
adminpanelen så att vanliga användare bara får read-only API-endpoints, medan
alla skrivande actions skyddas bakom admininloggning.

Själva frontenden som användare besöker där public data hämtas, ingår inte i denna del, detta för att den skapades i förväg till backenden. Efter en önskan från kunden för produkthantering skapades denna del av projektet.

Från början planerade jag backenden som tre huvuddelar:

- en Flask-app som startar projektet, laddar konfiguration och registrerar
  blueprints
- ett publikt API under `/api` som returnerar JSON till frontend
- en adminyta under `/admin` där innehåll kan skapas, ändras, sorteras och tas
  bort

Det gjorde att jag kunde bygga projektet feature för feature utan att blanda
ihop frontendens publika behov med adminpanelens mer känsliga funktioner.

## Planeringsmetod och AI-arbete

Jag använde AI som stöd i planeringen och implementationen, men inte som något
som automatiskt fick bestämma slutresultatet. Min metod var att först tänka ut
vilken feature som behövdes, låta AI hjälpa till att föreslå en första lösning
eller prototyp, och sedan granska koden kritiskt innan jag gick vidare genom att till exempel föreslå själv vad jag tyckte hade funkat eller vad jag tycker hade funkat bättre eller om något ser fel ut i mina ögon som den kunde förklara.

Admin-UI:t planerades med inspiration från admin dashboards jag sökte fram via
Google. Jag tittade på hur professionella dashboards ofta organiserar tabeller,
filter, actions, statusmärken, formulär och bekräftelser. Utifrån det tog jag
fram en AI-stödd prototyp för adminpanelen, men jag behövde fortfarande anpassa
den till projektets verkliga backendflöden, datamodeller och validering.

Jag arbetade därför i små steg:

- definiera vilken feature som behövdes
- generera eller skissa en första lösning med AI
- läsa igenom koden själv och kontrollera om den följde projektets struktur
- flytta affärslogik till service-lagret istället för att lägga allt i routes
- lägga validering i modeller och services där det passade bättre
- testa route-flöden och edge cases
- refaktorera tills koden var mer läsbar, konsekvent och strukturerad

Poängen var att AI kunde hjälpa mig framåt snabbare, men att jag själv hela
tiden behövde bedöma om lösningen var säker, begriplig och rätt för projektet.

## Backend-arkitektur

Jag planerade Flask-appen med en app factory i `app/__init__.py`. Den ansvarar
för att skapa Flask-instansen, ladda config, starta extensions och registrera
blueprints. Det gjorde projektet lättare att testa eftersom testmiljön kan skapa
appen med en annan config än produktion eller utveckling.

Jag valde att dela upp routes efter ansvar:

- `app/public/routes.py` för publika API-endpoints
- `app/admin/routes/` för adminflöden
- `app/services/` för databasnära affärslogik
- `app/models.py` för SQLAlchemy-modeller och modellvalidering
- `app/s3.py` för själva S3-uppladdningen

Den här uppdelningen var viktig eftersom routes annars snabbt hade blivit för
stora. Routes ska mest läsa request-data, kalla rätt service och returnera rätt
svar eller template. Services får ta hand om affärslogiken och regler som kräver databasen, som
konfliktkontroller, sorteringsordning, bulk updates och rollback vid fel.

## Databasplanering

Databasen planerades runt de saker admin faktiskt behöver hantera:

- `Admin` för inloggade administratörer
- `Product` för maträtter och menyprodukter
- `Category` för produktgrupper och sortering
- `SlideshowImage` för bilder på startsidan
- `CateringMenuImage` för cateringmenyer
- `SubscriptionPlan` för abonnemang
- `Setting` för enkla inställningar som kan behövas senare

Jag ville att modellerna inte bara skulle vara passiva tabeller. Därför fick
flera modeller egna setter-metoder, till exempel `set_name`, `set_status`,
`set_price_single` och `set_day`. På så sätt ligger grundläggande regler nära
datat. Exempelvis kan en produkt inte få negativt pris, och status måste vara
`active` eller `inactive`.

Jag planerade också relationen mellan produkter och kategorier försiktigt.
Produkter kan sakna kategori, men om de har en kategori används relationen för
att visa rätt slug i public API. Kategorier tas inte bort automatiskt med sina
produkter, eftersom det hade varit riskabelt för admin. I stället blockerar
servicen borttagning av en kategori om produkter fortfarande använder den.

## Public API

Det publika API:t planerades som read-only. Frontenden ska kunna hämta data,
men inte ändra något. Därför ligger public routes under `/api` och returnerar
JSON med ett stabilt format:

- `GET /api/products`
- `GET /api/categories`
- `GET /api/slideshow`
- `GET /api/catering-menus`
- `GET /api/subscriptions`

Jag ville hålla API-kontraktet stabilt eftersom frontend bygger på de fälten.
Det gäller särskilt produktpriserna, där single-price produkter fortfarande
returnerar `priceCents`, medan produkter med familjepris returnerar ett nested
`price`-objekt. Det är inte den mest normaliserade formen, men den bevarar
kompatibilitet med frontend vilket kommer att uppdateras i framtiden.

CORS planerades också för public API. Backenden lägger bara CORS headers på
requests som börjar med `/api/`. Om frontendens origin finns i
`CORS_ALLOW_ORIGINS` får webbläsaren läsa svaret. Om en annan origin försöker
läsa API-svaret från browser-JavaScript blockeras svaret av webbläsaren. Det är
inte samma sak som autentisering, men det är rätt skyddsnivå för publika
browser-requests.

## Adminflöden

Adminflödena planerades annorlunda än public API eftersom de ändrar data.
Allt under admin ska skyddas med Flask-Login, och formulär ska skyddas med CSRF.
Jag började med inloggningen eftersom resten av adminpanelen behövde bygga på
en säker session.

För produkter planerade jag ett komplett CRUD-liknande flöde:

- lista produkter med filter
- skapa ny produkt
- redigera befintlig produkt
- ändra status
- duplicera produkt
- ta bort produkt
- bulk-uppdatera flera produkter

Produktflödet blev det viktigaste adminflödet eftersom det täcker de flesta
mönster som även används på andra delar: formulärvalidering, bilduppladdning,
service-anrop, databas-commit, rollback vid fel och flash-meddelanden tillbaka
till admin.

Kategorier planerades för att ge admin kontroll över menystrukturen. Jag ville
kunna skapa, uppdatera, sortera och aktivera/inaktivera kategorier. Inaktiva
kategorier döljer sina produkter i public API, vilket gör att admin kan pausa
en hel grupp utan att radera data.

Slideshow och catering planerades som enklare mediaflöden. De använder samma
uppladdningslogik som produktbilder, men har egna modeller och sorteringsflöden.
Det gjorde att jag kunde återanvända `ImageService` utan att blanda ihop olika
typer av innehåll.

Subscriptions planerades som en egen del eftersom datat har andra regler än
produkter. Där behövde jag hantera målgrupp, antal dagar per månad och två
prisfält. Jag lade konfliktkontroller i `SubscriptionService` så att samma
kombination av målgrupp och dagar inte kan skapas flera gånger.

## Bilduppladdning och S3

Bildflödet planerades som en separat service eftersom flera features behöver
ladda upp bilder. `ImageService` fungerar som ett tunt lager mellan routes och
`app/s3.py`. Själva S3-filen ansvarar för att validera filtyp, kontrollera
storlek, skapa en hash-baserad filnyckel och ladda upp till S3.

Jag ville att bilduppladdning skulle vara säker nog för adminanvändning:

- bara tillåtna bildformat accepteras
- MIME type och filändelse kontrolleras
- för stora filer stoppas innan uppladdning för mindre belastning på servern
- S3 bucket måste vara konfigurerad
- samma bild kan återanvända samma hash-baserade nyckel för mindre lagring

Routes behöver därför bara fråga `ImageService.upload(file)` och sedan spara den
publika URL:en på rätt modell. Det gör produkt-, slideshow- och cateringflödena
mer konsekventa.

## Felhantering och säkerhet

Jag planerade felhanteringen för att vara tydlig för admin men inte läcka
onödig information. Vid login används samma felmeddelande för fel användarnamn
och fel lösenord, så att man inte kan avgöra vilka användarnamn som finns.

För skrivande databasoperationer använder services `try/except` runt commit.
Om SQLAlchemy ger fel görs rollback och felet skickas vidare till routen, som
visar ett kontrollerat flash-meddelande. Det gör att databasen inte lämnas i ett
halvt uppdaterat läge.

Jag planerade också att validering skulle ske på flera nivåer:

- formulär kontrollerar att admin skickar rimliga fält
- modeller kontrollerar grundregler för datat
- services kontrollerar regler som kräver databasfrågor
- routes översätter fel till rätt HTTP-svar, redirect eller flash-meddelande

Det gör backenden mer robust eftersom samma regler inte behöver dupliceras i
varje route.

## Tester, tillgänglighet och användartester

Jag planerade testerna runt de viktigaste riskerna i backenden. Service-tester
kontrollerar affärsregler och databasoperationer. Admin route-tester kontrollerar
inloggning, skyddade routes, formulärflöden och felhantering. Public route-tester
kontrollerar JSON-kontraktet som frontend är beroende av. S3-tester mockar
externa anrop så att testsviten inte behöver riktig nätverksåtkomst.

Tillgänglighetstesterna är främst manuella eftersom admin-UI:t är template- och
CSS-baserat. Jag planerade att kontrollera tangentbordsnavigering, synliga
focus states, tydliga labels, valideringsfel och läsbar kontrast. Det är viktigt
eftersom adminpanelen ska kunna användas effektivt, inte bara se färdig ut.

Användartesterna planerades runt huvudflödena:

- en publik användare ska kunna ladda menydata via frontend
- admin ska kunna logga in
- admin ska kunna skapa och redigera produkter
- admin ska kunna ladda upp bilder
- admin ska kunna förstå och rätta formulärfel
- admin ska kunna hantera kategorier, media och abonnemang utan att data tappas

På detta vis kunde varje större feature  granskas både tekniskt och praktiskt
innan den räknades som färdig.

## Slutlig reflektion

Backenden byggdes stegvis för att undvika att projektet blev för stort på en
gång med AI. Jag började med strukturen, gick vidare till datamodeller och services,
och byggde sedan adminflöden och public API ovanpå det. AI hjälpte mig att
snabbare ta fram prototyper och kodförslag, men det viktigaste arbetet var att
granska, förenkla, testa och anpassa koden tills den följde en tydlig standard och struktur som jag var nöjd med som jag kunde lätt navigera i och förstå.

Resultatet blev en backend där public API, admin routes, services, modeller,
bilduppladdning och tester har tydliga ansvar. Det gör projektet lättare att
förstå, lättare att vidareutveckla och mindre riskabelt att ändra feature för
feature.

