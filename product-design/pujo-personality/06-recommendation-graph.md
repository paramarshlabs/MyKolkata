# F. Recommendation graph

How an identity becomes a Pujo: which pandals, plates, looks, songs, events, neighbourhoods, creators and people each archetype is shown, and why.

---

## 1. What it has to do

1. Turn "I'm a Night Owl" into a real night: a route, a roll stall that is open at 2 am, and the ghat at sunrise.
2. Explain every recommendation in the archetype's own language ("Best after 1 am, when the lights take over").
3. Keep the identity recognisable while learning what this particular person likes (see [`03-personality-system.md`](03-personality-system.md) §10).
4. Be safe: crowd-aware, night-aware and honest about what it doesn't know.
5. Keep sponsored recommendations separate, labelled and relevant ([`11-partnerships.md`](11-partnerships.md)).

## 2. Architecture

```
 Quiz answers ──► identity vector x ─┐
                                     ├─► u = λ·x + (1−λ)·y     (λ ≥ 0.5, always)
 Behaviour ─────► taste vector y ────┘
 Preference facets (diet, move, budget, turf, status, age)  ──► hard filters and ranking
 Context (Pujo day, hour, zone, rain, crowd forecast, Metro hours) ──► context fit
                                     │
                                     ▼
             Candidates by type (pandal, food, event, route, playlist, look, creator)
                                     │  filters: open at that hour, diet, age, distance, safety
                                     ▼
             Score = affinity + context fit + quality + novelty − penalties
                                     │
                                     ▼
             Diversify (MMR) and mix: 60% primary, 25% streak, 15% wildcard
                                     │
                                     ▼
             Explain ("because…")  +  one separate, labelled sponsored slot (optional)
```

The quiz is the cold start. A person who has done nothing but answer thirteen questions already gets a Pujo that fits them.

## 3. The item model

Every recommendable item carries a **trait vector** in the same fourteen dimensions as people (0 to 1, where 0.5 means "nothing special either way"), plus **facets** for filtering.

### 3.1 Pandals

| Dimension | What it means for a pandal | Example of a high value |
|---|---|---|
| Night drive | Best after midnight: lighting, atmosphere, open late | A lighting-led theme pandal in the North at 2 am |
| Dawn pull | Worth it early: opens early, quiet, morning rituals | A bonedi bari's thakur dalan at 6 am |
| Roaming radius | Out of the way, worth the trip | A small concept pujo deep in Behala |
| Planning | Needs planning: long queues, timed entry, heavy diversions | The viral replica on Saptami |
| Crowd appetite | Expected crowd | Santosh Mitra Square at 9 pm |
| Squad size | Room to gather as a group | Maddox Square's lawn |
| Roots | Open community participation: public bhog, anjali for visitors, a local feel | A para pujo that feeds everyone at 1 pm |
| Heritage pull | Old, sabeki, bonedi | Shobhabazar Rajbari (since 1757) |
| Art eye | Artistic ambition, named artist, award shortlist | A Bhabatosh Sutar theme |
| Food drive | Great food nearby | Anything near Mitra Café or Park Circus |
| Shaaj | Photogenic backdrop | A North Kolkata lane with a lit gate |
| Spotlight | Performance: dhunuchi competition, stage, arati crowd | A para known for its dhunuchi competition |
| Romance lens | Quiet corners, water, lights | College Square, lights on the pool |
| Dhaak energy | Dhaak, dhunuchi, procession energy | The arati at a sabeki pujo |

**Facets:** zone and cluster; latitude and longitude; nearest Metro station and walking minutes; type (sabeki, theme, replica, bonedi, para, community); this year's theme and artist; award shortlist flags; opening hours per Pujo day; arati times; bhog (public or not, and when); dhunuchi competition time; crowd forecast by hour; accessibility (step-free approach, barricade layout); approach safety (lit, busy, police booth); photography rules (bonedi baris set their own); committee-verified flag.

### 3.2 Food places

Food drive is always high; the other dimensions say what kind of food experience it is. Night (open late), Dawn (open early), Crowd (queue), Squad (big tables), Heritage (legacy cabin or sweet shop), Art (design-led café), Romance (date-worthy), Shaaj and Spotlight (a place to be seen), Roots (bhog or para stall).

**Facets:** cuisine family (bhog and Bengali home-style; cabin snacks; Mughlai, biryani and rolls; Kolkata Chinese; street food; sweets; cafés; bars, 21+ only); signature dishes; diet options (veg, egg, Jain-friendly); price level; hours by Pujo day; distance to pandal clusters.

### 3.3 Events, routes and content

- **Events:** trait vector from the event type (a dhunuchi competition is high Spotlight and Dhaak energy; a heritage walk is high Heritage and Dawn). Facets: time, venue, ticket link, price, age limit.
- **Routes:** ordered stops with times. The trait vector is the time-weighted average of the stops, plus Roaming radius from the distance covered.
- **Playlists, looks and creators:** tagged the same way, so every piece of content can be matched to people.

### 3.4 Tagging for Pujo 2026

MyKolkata's current `Pandal` model holds a name, location, description, image and rating. It needs the fields above. For launch, three editors tag about 150 pandals, 150 food places, 50 events and 27 routes (three per archetype) in five days, using a one-page rubric with low, mid and high anchors for each dimension. Committees can claim and correct their pandal page from week two. After Pujo, community corrections through the existing contribute flow.

## 4. Scoring

For a person with blended vector *u*, primary archetype *P*, and a candidate item *i* with traits *t*:

```
affinity(i)  = Σ_d  w_d · (u_d − 0.5) · (t_id − 0.5)
               where w_d = importance of d for P, normalised (what defines them counts most)

score(i) = 1.00 · affinity(i)
         + 0.35 · timeFit(i, hour, person's clock)        best hours of the item against the person's night and dawn
         + 0.25 · distanceFit(i, zone, how they move)      walking and Metro-aware
         + 0.25 · crowdFit(i, forecast at that hour, person's crowd appetite)
         + 0.15 · quality(i)                               editorial confidence, awards, verified info
         + 0.10 · novelty(i)                               not seen, not saved
         − penalties                                       closed, diet clash, age limit, unsafe at that hour
```

Weights are starting values, tuned on saves and check-ins after launch.

**Diversity.** Lists are re-ranked with maximal marginal relevance (λ = 0.7) so eight results are never eight versions of one thing, and each list of eight includes at least one pick from the person's streak archetype and one wildcard from §6.

**Explanations.** The top contributing dimension picks the line:

| Dimension | Example reason |
|---|---|
| Night drive | "Best after 1 am, when the lights take over." |
| Dawn pull | "Doors open at 6. You'll have it to yourself." |
| Planning | "Beat the queue: go before 11 am." |
| Roaming radius | "Out of the way. Worth it." |
| Crowd appetite (low) | "Quietest before 10 am." |
| Crowd appetite (high) | "The whole city is here tonight." |
| Squad size | "Room on the lawn for your whole gang." |
| Roots | "Public bhog at 1 pm." |
| Heritage pull | "Pujo in this house since 1757." |
| Art eye | "Theme by Bhabatosh Sutar." |
| Food drive | "Mitra Café is six minutes' walk away." |
| Shaaj | "The best backdrop on this side of the city." |
| Spotlight | "Dhunuchi competition at 8:30 pm." |
| Romance lens | "Lights on the water after dark." |
| Dhaak energy | "The arati here is the loudest in the North." |

**Safety rules.**

- After 11 pm, routes use only stops and approaches editorially flagged as lit and busy, and every night route carries a "share your plan" prompt and the emergency number.
- People who prefer quiet are never sent to a pandal at its forecast peak; everyone sees crowd warnings.
- Bars and pubs are shown only to people who confirmed they are 21 or over, never as a Pujo stop, and never as sponsored inventory for night routes.
- Police diversions are loaded daily during Pujo and override routing.
- **Rain mode:** Metro-first routes, covered stops, and, for Night Owls and Art Kids, "pandals that look best wet".

## 5. The master matrix

| | Pandal | Food | Fashion | Music | Events | Neighbourhoods | Creators | People | Brand categories |
|---|---|---|---|---|---|---|---|---|---|
| **Night Owl** | Lighting-led and atmospheric, after 1 am; the famous ones once the queues fold | 2 am rolls, 4 am cha, 5 am kochuri | Black cotton, oxidised silver, a gamcha | *Nabami Nishi*: Bangla indie, hip-hop, city songs | Night walks, midnight photowalks, the Chandannagar lights | North Kolkata lanes, Shyambazar, the river | Night photographers, city historians | Pet Pujari, Addabaaz; the Shiuli at dawn | Transit, late-night food, night-mode cameras |
| **Pandal Hunter** | Everything, clustered by Metro; replicas before Shashthi; award shortlists; hidden gems | Fuel on the move: jhalmuri, cutlets | Sneakers, cap, crossbody | *Porer Ta*: walking tempo | Parikrama tours, award announcements | All of them, by cluster | Theme-reveal pages, pandal photographers | Art Kid, Pet Pujari | Footwear, power banks, data, maps |
| **Para Kid** | Their own para first; sabeki community pujos | Bhog, the para stall, Bijoya sweets | New clothes daily, laal-paar, committee tee | *Amader Para*: dhaak and old Pujo songs | The para's function, dhunuchi competitions, blood donation camps, Bijoya Sammilani | Home | Para pages, bhog cooks | Shiuli, Dhunuchi, Pet Pujari | Tea and biscuits for committees, sweet shops |
| **Pujo Romantic** | Water and lights (College Square), quiet corners, sabeki pujos at dusk | Shared phuchka, sherbet, mishti doi, a proper table | Laal-paar, alta, flowers, coordinated but deniable | *Ei Path*: Bengali love songs across seventy years | Dusk walks, concerts, the Kojagari full moon | North lanes, College Street, Hindustan Park, the river | Film photographers, poetry and cinema pages | Shiuli, Art Kid, Night Owl | Jewellery, handloom, film labs, dessert |
| **Pet Pujari** | Chosen by what's next door: near cabins, stalls and bhog | The full day: bhog, cabins, biryani, kebabs, rolls, Bijoya | Loose cotton, a tote for sweet boxes | *Pet Pujo* | Food walks, the Bhog Map, food festivals | Chitpur, Park Circus, Esplanade, Tangra, Gariahat | Food reels, legacy-eatery series, home cooks | Night Owl, Addabaaz, Pandal Hunter | Delivery, restaurants, sweet shops |
| **Art Kid** | Theme pujos by named artists; award shortlists; off-peak hours | Café lunches; forgets the rest | Handloom, thrift, one strange ring | *Placard*: indie, post-rock, Ray's scores | Kumartuli walks, artist talks, galleries | Kumartuli, Ballygunge, Behala, Salt Lake | Artists, process videos, design history | Pandal Hunter, Dhunuchi, Romantic | Paints, art supplies, cameras, galleries |
| **Addabaaz** | A base camp with room to sit (Maddox) and the cluster around it | A table for twelve | Squad colours | *Maddox O'Clock*: singalongs | Quiz nights, antakshari, Bijoya Sammilani | Ballygunge, Gariahat, College Street | Bengali comedy, football banter | Night Owl, Dhunuchi, Para Kid | Tea, group data, group rides home |
| **Dhunuchi** | Arati and dhunuchi competitions; the best backdrops; the bhasan | Light and quick, photo first | Five looks: jamdani, Garad, Baluchari, dhuti-panjabi | *Dhunuchi*: dhaak remixes, Bollywood Pujo songs | Dhunuchi competitions, draping workshops, concerts | North lanes for shoots, South for the scene | Lookbooks, drapers, textile creators | Addabaaz, Para Kid, Art Kid | Handloom, beauty, jewellery, salons |
| **Shiuli** | Bonedi baris and sabeki pujos at dawn; Kumartuli at sunrise | Dawn kochuri, Tiretta Bazaar breakfast, heritage sweets | White with a red border, tant, dhuti-panjabi | *Bhor*: Agamani, autumn Rabindrasangeet, morning ragas | Bonedi walks, heritage parikramas, morning concerts | Shobhabazar, Jorasanko, Bagbazar, Belur | Heritage archives, history podcasts | Para Kid, Romantic, Art Kid | Heritage tourism, handloom, tea, publishers |

## 6. Unexpected but believable

The connections that make a recommendation feel like it came from a friend who knows the city.

| Archetype | Connection | Why it's right |
|---|---|---|
| Night Owl | End every night route at the ghat for sunrise | It is the natural last stop, and it is where they meet the Shiulis |
| Night Owl | A Jagaddhatri trip to Chandannagar (16–19 Nov 2026) | The lights they walked under all Pujo, at their source |
| Night Owl | A reflective armband in the merch range | Utility that makes a safety point without a lecture |
| Pandal Hunter | Blister plasters | The new-shoes blister is the most Pujo injury there is |
| Pandal Hunter | The Purple Line to Behala | The fastest way to the South's theme cluster, and few people use it |
| Pandal Hunter | Kolkata's lesser-known museums after Pujo | The same completionist joy, all year |
| Para Kid | Blood donation camps run by pujo committees | Service is their love language |
| Para Kid | Kojagari Lokkhi Pujo recipes, five days after Dashami | Their Pujo doesn't end on Dashami |
| Pujo Romantic | Bijoya letters: stationery to write to someone after Dashami | Reviving the most romantic Pujo habit |
| Pujo Romantic | Kaash fields on the Rajarhat roads, before Pujo | The first date of the season |
| Pujo Romantic | Saraswati Pujo in February | Kolkata's own Valentine's Day |
| Pet Pujari | Tiretta Bazaar's Chinese breakfast at dawn | The best Pujo breakfast nobody talks about |
| Pet Pujari | Zakaria Street's evening food walks in Ramadan | The city's other great feast, and a reminder that its feasts belong to everyone |
| Pet Pujari | Nolen gur season in winter | What to be excited about next |
| Art Kid | Kumartuli before Mahalaya | Where the exhibition is made |
| Art Kid | Experimenter and Emami Art after Pujo | The same eye, all year |
| Art Kid | The Pandal Archive | Every year's themes and artists, credited |
| Addabaaz | The Adda Deck: conversation prompts | The adda, bottled |
| Addabaaz | A group ride home after 1 am | The last act of the glue |
| Addabaaz | Derby screenings | The one adda topic that never ends |
| Dhunuchi | Saree-draping workshops before Pujo | Look three of five doesn't drape itself |
| Dhunuchi | A day trip to the weavers of Shantipur and Phulia | Where the tant comes from |
| Dhunuchi | Saraswati Pujo's yellow sarees | The next reason to dress up |
| Shiuli | The Sharodiya: MyKolkata's Pujo annual | The Pujabarshiki tradition, continued |
| Shiuli | The Dover Lane Music Conference in January | Morning ragas, all night |
| Shiuli | Belur Math across the river at dawn | The quietest view of the season |

## 7. Pandals and routes

### 7.1 The shape of Pujo 2026

- **Before Mahalaya (to 9 Oct):** no pandal opens this year. Recommendations are content: Kumartuli, kaash fields, shopping, draping, playlists.
- **Mahalaya to Panchami (10–16 Oct):** inaugurations begin; the Hunter's sweep window; the quieter days for everyone who hates crowds.
- **Shashthi to Navami (17–20 Oct):** full routes, crowd-aware timing, night routes (and all-night Metro, if announced again).
- **Dashami (21 Oct):** sindoor khela, the bhasan, Bijoya. Immersions must be completed by 24 October.

### 7.2 One route per archetype

Starting templates. Every stop must be re-verified for 2026 (themes, timings, bonedi visiting hours, diversions) before it ships. Sunrise in Kolkata in mid-October is around 5:35 am and sunset around 5:15 pm.

**Night Owl — *Nabami Nishi*, North (Navami, 11:30 pm to 5:30 am).** Tala Prattoy → Hatibagan → the Shyambazar crossing (a roll) → Bagbazar Sarbojanin → Kumartuli Park → Ahiritola → Bagbazar ghat for first light → the Metro home. *Why:* the lights at their best, the queues gone, the river at the end.

**Pandal Hunter — *The Chaturthi Sweep*, East (Thursday 15 Oct, 10 am to 4 pm).** Sreebhumi (Lake Town) at 10 → the Dum Dum Park cluster → Salt Lake's blocks → Beleghata. *Why:* the viral ones before the barricades, in one clean loop.

**Para Kid — *Amader Para* (Ashtami).** Anjali at home → bhog duty → the neighbouring paras in the evening (to compare, and win) → one sabeki classic (Bagbazar, or Kashi Bose Lane) → back for the function. *Why:* their Pujo is where they belong, plus one reason to leave.

**Pujo Romantic — *Ei Path*, North (Ashtami, 4:30 to 8 pm).** The Kumartuli lanes → Bagbazar ghat for the 5:15 sunset → a rickshaw through the lanes to Shobhabazar → the Blue Line to Mahatma Gandhi Road → College Square's lights on the water → sherbet at Paramount. *Why:* dusk, water, light and one plate.

**Pet Pujari — *Bhog to Biryani*, North and Central (Saptami, 1 pm to 2 am).** A public-bhog pujo (from the Bhog Map) → Shobhabazar and Mitra Café → Ahiritola → Niranjan Agar's egg devil → College Square and Paramount → biryani on Chitpur Road → kebabs in Park Circus → the last roll. *Why:* every pandal is next to something; this route is next to everything.

**Art Kid — *Placard*, South (Saptami, 2:30 to 6:30 pm).** Hindusthan Park → Samaj Sebi → Tridhara → Santoshpur Lake Pally at golden hour → a café on Southern Avenue. The North alternative: Tala Prattoy → Kashi Bose Lane → Ahiritola. *Why:* the concept pujos, in the four o'clock light. (Stops change with the 2026 themes.)

**Addabaaz — *Maddox O'Clock*, South (Ashtami, 9 pm to 1:30 am).** Maddox Square as base camp → Ballygunge Cultural → Singhi Park → Ekdalia Evergreen → the Gariahat stalls → back to the lawn → headcount → group ride home. *Why:* one place to sit, four to show the visitors, everyone home safe.

**Dhunuchi — *Arati Circuit* (Navami, 5:30 to 10 pm; Dashami bhasan).** Golden-hour shoot in the Kumartuli doorways → sandhya arati at a para known for its dhunuchi → the dhunuchi competition → a big-theme backdrop. Dashami: the bhasan at Bagbazar or Babughat, with the crowd-safety guide. *Why:* the circle, the light and the send-off.

**Shiuli — *Bhor*, North (Ashtami, 5:30 to 9 am).** Kumartuli at sunrise → Bagbazar's sabeki protima at 6 → Shobhabazar Rajbari → the Daw Bari in Jorasanko, or Chhatu Babu–Latu Babu → kochuri and cha → home for anjali. The alternative: Tiretta Bazaar's breakfast at 6:30. *Why:* the oldest Pujo in the city, before anyone else is up.

## 8. Food, fashion, music, events

### 8.1 Food

| Family | Loved by | When |
|---|---|---|
| Bhog (khichuri, labra, beguni, payesh) | Para Kid, Pet Pujari, Shiuli | 1 pm |
| Cabins (kabiraji, cutlets, chops, egg devil, Mughlai paratha) | Pet Pujari, Night Owl, Hunter | 4 to 8 pm |
| Biryani, rezala, kebabs | Pet Pujari, Addabaaz | 8 pm to midnight |
| Rolls | Night Owl, Pet Pujari, Hunter | Any time after 11 pm |
| Phuchka, jhalmuri, telebhaja, ghugni | Everyone; Romantic (shared) | Evening |
| Kolkata Chinese (Tangra, Tiretta Bazaar) | Pet Pujari, Shiuli (breakfast), Addabaaz | Dawn or night |
| Sweets and Bijoya platters | Para Kid, Shiuli, Pet Pujari | Dashami onwards |
| Design-led cafés | Art Kid, Romantic | Afternoon |

Diet is a hard filter the person sets; every family has vegetarian routes.

### 8.2 Fashion

Fashion recommendations start as content (looks, draping guides, where to shop), not products, so the identity never feels like a sales funnel.

| Style family | Archetypes | Where Kolkata buys it |
|---|---|---|
| Laal-paar and classic Bengali (tant, Garad, dhuti-panjabi) | Shiuli, Para Kid, Romantic, Dhunuchi | Gariahat, Hatibagan, Dakshinapan's state emporiums |
| Heritage handloom (jamdani, Baluchari) | Dhunuchi, Romantic, Shiuli | Handloom labels, emporiums |
| Indie and handmade (small labels, block print, thrift) | Art Kid | Independent labels, markets |
| Night black | Night Owl | — |
| Comfort engineered | Pandal Hunter, Pet Pujari | Kolkata's footwear institutions |
| Squad colours | Addabaaz | Anywhere |
| Saree with sneakers, pre-draped, crop blouse | Dhunuchi, Addabaaz | New Market, Gariahat |

### 8.3 Music

The nine editorial playlists ([`05-music-and-spotify.md`](05-music-and-spotify.md) §5.1), each opening with the archetype's anchor tracks:

| Playlist | Anchors |
|---|---|
| *Nabami Nishi* (Night Owl) | Anjan Dutt's *Bela Bose*; Moheener Ghoraguli; Fossils; Cizzy |
| *Porer Ta* (Pandal Hunter) | Cactus; Fossils; fast Bollywood Pujo songs |
| *Amader Para* (Para Kid) | The dhaak; *Mahishasuramardini*; old Pujo songs |
| *Ei Path* (Pujo Romantic) | *Ei Path Jodi Na Shesh Hoy*; *Amake Amar Moto Thakte Dao*; *Bojhena Shey Bojhena*; *Mone Pore Ruby Roy* |
| *Pet Pujo* (Pet Pujari) | Whatever the stall plays; one cabin-radio classic |
| *Placard* (Art Kid) | Aswekeepsearching; Parekh & Singh; Satyajit Ray's scores |
| *Maddox O'Clock* (Addabaaz) | Manna Dey's *Coffee House*; *Bela Bose*; Bangla band singalongs |
| *Dhunuchi* (Dhunuchi) | *Dola Re Dola*; *Ami Je Tomar*; *Ami Shotti Bolchi*; dhaak remixes |
| *Bhor* (Shiuli) | *Bajlo Tomar Alor Benu*; Agamani songs; *Aji Sharata Tapane*; a morning raga |

### 8.4 Events

Sourced from committees (verified pages), from ticketing partners through affiliate links, and from MyKolkata's own programme (Night Owl Walks, Dawn Patrol, Kumartuli Sundays).

| Event type | Archetypes |
|---|---|
| Dhunuchi competitions, arati times | Dhunuchi, Para Kid |
| Heritage and bonedi walks | Shiuli, Art Kid, Romantic |
| Night walks, photowalks | Night Owl, Art Kid |
| Food walks, the Bhog Map | Pet Pujari |
| Concerts | Dhunuchi, Addabaaz, Romantic |
| Artist talks, gallery nights | Art Kid |
| Bijoya Sammilani, quiz and antakshari nights | Addabaaz, Para Kid |
| Draping workshops, lookbook shoots | Dhunuchi |

## 9. Neighbourhoods, creators and people

**Neighbourhoods.** North Kolkata (Bagbazar, Kumartuli, Ahiritola, Shobhabazar, Jorasanko, Hatibagan) for the Shiuli, Night Owl, Romantic and Dhunuchi. Central (College Street, Bowbazar, Esplanade, Chitpur, Park Circus) for the Pet Pujari and Addabaaz. South (Ballygunge, Gariahat, Hindustan Park, Kalighat) for the Addabaaz, Art Kid and Romantic. Behala and Salt Lake for the Art Kid and Hunter. Tangra and Tiretta Bazaar for the Pet Pujari and Shiuli. Home for the Para Kid.

**Creators.** Creator categories map to archetypes (night photography, theme-reveal pages, para pages, poetry and cinema, food reels, process videos, Bengali comedy, lookbooks, heritage archives). Individual creators are chosen for launch by the growth team, with consent and clear disclosure ([`10-growth.md`](10-growth.md) §4).

**People.** Kin, complement and spark relationships between archetypes, and how they are used for friends, squads and eventually Pujo Match: [`07-pujo-match.md`](07-pujo-match.md).

## 10. Measuring it

| Metric | Target at launch |
|---|---|
| Recommendation opens per revealed identity | ≥ 3 |
| Save rate on recommendations | ≥ 12% |
| Route starts per saved route | ≥ 30% |
| "Not for me" rate | ≤ 8% |
| Share of saves that came from the streak or wildcard slots | 15–30% (below 15%: too narrow; above 30%: the identity isn't doing its job) |
| Sponsored slot save rate relative to organic | ≥ 70% (below that, the partner isn't relevant enough) |
