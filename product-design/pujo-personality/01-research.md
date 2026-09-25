# A. Research

What comparable products, Kolkata's own Pujo landscape and the relevant science say, before a single archetype was designed.

Research date: 25 September 2026. Sources are numbered and listed in §9. Anything that could have changed since (API terms, government rules, app features) should be re-checked before build.

**How to read the labels**

- **[D] Documented.** A mechanic or number published by the company, a government body, a peer-reviewed paper or a reputable news outlet. Always cited.
- **[I] Interpretation.** Our reading of what the documented facts mean for MyKolkata.
- **[A] Assumption.** Something we believe but have not verified. Each one has a way to test it in §8.

---

## 1. The headline findings

1. **Nobody in the Pujo market is doing identity.** Every Pujo product found (the police guide maps, the tourism app, the pandal-hopping apps, the AI route planners) answers *where*. None answers *which Pujo is yours*. [D: §3.4] [I]
2. **Spotify cannot be the foundation, and in the form the brief imagined, it isn't allowed.** Since February 2026 a new Spotify app is capped at five users and its owner must pay for Premium [1][2][3]. Unlimited access requires a registered business with at least 250,000 monthly active users [3]. And Spotify's Developer Policy forbids analysing Spotify content to build "profiles of users" or "derived listenership metrics" [7]. The full analysis is in [`05-music-and-spotify.md`](05-music-and-spotify.md). [D]
3. **The biggest identity product in the world just pivoted from AI to social.** Spotify Wrapped 2025 dropped the 2024 AI podcast, added Clubs, roles, Listening Age and a live multiplayer "Wrapped Party", and reached 200 million users in 24 hours (19% up) with 500 million shares (41% up) [11][12][13]. Group identity and comparison beat clever generation. [D]
4. **Dating science says compatibility scores are mostly fiction.** Pre-meeting traits and preferences could not predict which specific pairs would be attracted to each other [73]; a major review found "no compelling evidence that any online dating matching algorithm actually works" [74]. The honest product is "you'd enjoy the same Pujo night", not "91% soulmate". [D]
5. **Kolkata already pairs Pujo with romance, and says so.** In a Tinder-commissioned survey, 43% of Kolkata's Gen Z respondents said festivals are the ideal time to introduce a date to friends and family, and one in three had used Tinder to find a date during a festival [34]. (Sample caveat in §4.6.) [D]
6. **The festival is enormous, and it belongs to everyone.** UNESCO inscribed "Durga Puja in Kolkata" in 2021, praising its inclusion across religion, gender and economic strata [40]. The British Council valued the creative economy around it at ₹32,377 crore, or 2.58% of West Bengal's GDP, in 2019 [41]. Around 3,000 community pujos run in Kolkata alone [44]. [D]
7. **Pujo 2026 is three weeks away, and the rules changed this year.** Mahalaya is Saturday 10 October; Shashthi to Dashami runs 17 to 21 October [42]. The new state government has barred inaugurations before Mahalaya, banned DJs, cancelled the Red Road carnival and set 24 October as the last day for immersion [43]. [D]

## 2. Method

- **Products studied:** Spotify (Wrapped, Daylist, Blend, Clubs), Instafest, Letterboxd, Beli, Goodreads, Strava, Duolingo, BeReal, Instagram, Snapchat, 16Personalities, Hinge, Tinder, OkCupid, Bumble, Timeleft, District, Zomato, Swiggy.
- **Kolkata and India:** official Pujo guidance, every pandal-hopping product that appeared in search, the 2025 and 2026 news coverage of Pujo, Kolkata's music, food and fashion scenes, and the Digital Personal Data Protection framework.
- **Science:** social identity, personality measurement reliability, music and personality, inference of sensitive traits, and the prediction of attraction.
- **Limits:** desk research only. No user interviews yet (§8 has the plan). Several app pages were JavaScript-rendered and could only be read through search snippets; those are marked.

---

## 3. Product teardown

### 3.1 Identity reveals built from data

**Spotify Wrapped** is the reference point for the whole genre.

- [D] Began as "Year in Review" in 2013 and became Wrapped in 2016, when it moved to Instagram-Story-shaped cards that users could share [15].
- [D] 2022 introduced a "Listening Personality": sixteen types built from four axes (familiarity against exploration, loyalty against variety, timelessness against newness, commonality against uniqueness), openly modelled on Myers–Briggs, with heroic names such as "The Adventurer" and "The Early Adopter" [14].
- [D] 2023 added "Sound Town", matching each user to a city whose listening resembled theirs, and "Me in 2023" characters [15].
- [D] 2025 sorted users into one of six **Clubs** by the emotional qualities of their listening ("Cloud State Society", "Grit Collective", "Club Serotonin", "Full Charge Crew", "Cosmic Stereo Club", "Soft Hearts Club"), then gave each person a **role** within their club based on how they behave relative to other members: Leader, Scout, Archivist, Curator, Collector, Recruiter, Loyalist, Supporter, Broadcaster, Specialist [12]. It also added **Listening Age** (from the release years of the music you play most), a **Top Song Quiz**, a **Fan Leaderboard**, and **Wrapped Party**, its first live, multiplayer comparison [11].
- [D] Results: over 200 million engaged users in the first 24 hours (up 19%) and more than 500 million shares (up 41%). The 2024 edition took 62 hours to reach 200 million and was poorly received for its AI podcast, which 2025 dropped [13].
- [I] The 2025 design is almost exactly the structure this bible proposes: a group identity (club / archetype), a personal role inside the group (role / squad role), and live comparison with friends. Spotify arrived there after a decade of iteration. MyKolkata can start there.
- [I] Wrapped works because it is a date on the calendar. People wait for it. Mahalaya is Kolkata's own date on the calendar, with far older emotional weight.

**Spotify Daylist.**

- [D] A playlist that renames itself through the day with hyper-specific mood titles. It launched in 2023, went viral in January 2024 through an Instagram template ("don't tell me your astrology sign, post your daylist"), shared more than 600,000 times; Spotify reported searches for "daylist" up nearly 20,000% [16][17].
- [I] Specificity is shareable. "Melancholic Bangla indie Navami night" beats "you like indie music". The Pujo reveal should be specific enough to feel slightly uncanny, and funny enough to post.

**Spotify Blend.**

- [D] Two or more users (up to ten) get a shared playlist and a "taste match" percentage, presented as a mini Story [18].
- [I] A single match percentage between friends is harmless when the stakes are low (music overlap). It becomes misleading when applied to romance (§4.6). MyKolkata's compare feature borrows the format for friends, and labels the number for what it is.

**Instafest.**

- [D] A student-built web app that turned a user's top Spotify artists into a festival poster; it went viral in November 2022, days before Wrapped [19][20].
- [I] A beautiful artefact built from something personal spreads by itself. Also a cautionary tale: products like it depended on API access that is now restricted for new developers (§5 of the Spotify document).

**Swiggy "How India Swiggy'd".**

- [D] An annual data story. 2025: 93 million biryani orders, the tenth year biryani topped the list [39].
- [I] City-level statistics are shareable when they are funny and local. "Kolkata is 31% Night Owl" is the same genre, but only with enough real data behind it (§6.7 of the growth document).

### 3.2 Identity displays and taste communities

**Letterboxd.**

- [D] More than 27 million users by early 2025, having added about 9 million in a year; its "Four Favorites" profile feature became a cultural reference, asked of celebrities on red carpets [21].
- [I] Four chosen items say more about identity than any score. MyKolkata's equivalent is **My Pujo Four**: four pandals, plates or moments that define your Pujo, shown on the profile and shareable as a card.

**Beli.**

- [D] A restaurant app that asks users to compare a new place against ones they've been to, building a personal ranked list via Elo-style pairwise comparisons; it runs citywide and campus leaderboards (linking student IDs) and nudges streaks; about 80% of users are under 35 and join through referrals [22].
- [I] Pairwise "this or that" is a fast, enjoyable way to learn preferences, and it produces a ranked list people like to share. It is the right mechanic for a post-Pujo **Pandal Diary** and **Pujo Plate** rankings. The campus leaderboard is also a proven growth loop for this age group.

**Strava.**

- [D] Strava's 2024 Year in Sport reported running clubs up 59%, one in five Gen Z respondents having dated someone met through exercise, and 66% of Gen Z making friends through fitness [23].
- [D] In 2018 Strava's public global heatmap revealed the locations of military bases, a now-classic lesson in how aggregated location data leaks.
- [I] Gen Z is choosing shared activities over profiles as the way to meet people. That supports "plans first, people second" in Pujo Match. The heatmap lesson shapes the location rules (never live location, only coarse zones and time windows).

**Duolingo.**

- [D, secondary source] Widely reported figures claim users who reach a seven-day streak are several times more likely to stay engaged, and that the Streak Freeze reduced churn among at-risk users [24]. These come from industry analyses, not from Duolingo's own publications, so treat them as indicative.
- [I] Streaks suit daily habits. Pujo is five days a year, so a streak mechanic would be artificial. The equivalent is an annual ritual: the quiz at Mahalaya, the recap at Dashami, *asche bochor abar hobe* as the promise to return.

**Goodreads.**

- [I] The yearly reading challenge (set a goal, track it, share the year in books) is another annual identity ritual. For MyKolkata it is a reminder that a personal goal can be private and still motivating, which is how the Pandal Hunter's count is designed.

### 3.3 Personality systems, astrology and quizzes

**16Personalities and the Myers–Briggs model.**

- [D] Roughly half of people who retake the Myers–Briggs indicator within five weeks receive a different four-letter type (Pittenger's reviews) [70].
- [I] Type systems built on hard cut-offs flip on retest, and a person who gets a different identity the second time stops believing the first. MyKolkata's model was tested for this: 97.5% of simulated respondents got the same primary archetype on retest ([`model/SIMULATION.md`](model/SIMULATION.md)). Results are also kept "sticky" once revealed (§7 of the personality system).

**Snapchat astrological profiles.**

- [D] Launched in November 2020, with compatibility between friends shown in the Charms section across Attraction, Intensity, Tension, Support and Harmony [27].
- [I] Friend compatibility is entertainment, and people enjoy it as long as it is framed as play. Snapchat framed it as astrology; MyKolkata frames it as Pujo.

**Tinder's Astrology Mode.**

- [D] Announced in 2026; Tinder reported a nearly 20% increase in likes sent by women among those using it [32].
- [I] Identity systems work in social products as conversation starters, whether or not they predict anything. That is the only claim MyKolkata should make for archetypes in Pujo Match.

**Personality quizzes and data harvesting.**

- [D] The "thisisyourdigitallife" personality quiz was installed by about 300,000 people but harvested data on up to 87 million Facebook users through their friend networks, data later used by Cambridge Analytica for political profiling; the FTC pursued Cambridge Analytica for deceptive practices [76].
- [I] "Personality quiz" still carries this history. The product must be conspicuously clean: no social-login data grabs, no friend-graph access, answers stored only when the user chooses, and a visible "delete everything" button.

### 3.4 Dating and social products

**Hinge.**

- [D] First major dating app to use profile prompts (2016); in 2024, likes on text prompts were 47% more likely to lead to a date than likes on photos [29].
- [D] "Most Compatible" uses the Gale–Shapley stable-matching algorithm on preferences learnt from likes and passes; Hinge reported it made dates eight times more likely in trials [28].
- [D] 2025 added Prompt Feedback, psychologist-designed "Your World" prompts, and Match Note (privately sharing identity details or needs before chatting), plus "Are You Sure?" and comment filters for safety [30].
- [I] Prompts turn identity into conversation. The Pujo equivalent is plan-shaped: "My perfect Navami night ends at…", "The pandal I'd take you to first…". Matching should learn from behaviour, not only from quiz answers.

**Tinder.**

- [D] Double Date (June 2025): friends pair up and match with other pairs. In tests, nearly 90% of Double Date profiles came from users under 29; about 15% of people accepting an invite were new or returning users; double-date chats saw almost 25% more messages per match [31].
- [D] Tinder Sparks 2026 announced Music Mode (prioritising shared music taste), Astrology Mode, an Events beta in Los Angeles showing which singles plan to attend local events, Chemistry (an AI layer using Q&A and, optionally, a scan of the camera roll), and mandatory Face Check liveness verification continuing to expand [32][33].
- [D] Tinder India's survey: 43% of Kolkata Gen Z respondents see festivals as the ideal time to introduce a date to family and friends; one in three young Kolkata singles had used Tinder to find a date during a festival. The study covered 1,000 18 to 25-year-olds across ten cities (OnePoll for Tinder, April–May 2023) [34].
- [I] Three lessons. Groups lower the pressure and raise engagement (Double Date). Events are becoming the matching surface (Events beta), which is exactly what a Pujo route is. And AI that reaches into private data (camera roll) makes headlines for the wrong reasons; MyKolkata should not do anything like it.

**OkCupid.**

- [D] Match percentage comes from questions answered by both people, each person stating which answers they'd accept from a partner and how important the question is (weights of 0, 1, 10, 50 and 250). Each person's satisfaction is computed and the two are combined with a geometric mean, so a match must work both ways [35].
- [I] The geometric mean is the right way to combine two people's satisfaction, and it is used in the Pujo Sync formula. The importance weights are also a good pattern: letting people say "this matters to me" (for example, "I only want a crowd-free Pujo") is more honest than inferring it.

**Timeleft.**

- [D] Matches groups of strangers for dinner using a personality test (questions about family, spirituality, challenge, humour), keeping ages within about ten years at a table; reported in over 300 cities across 60 countries, and present in Mumbai and Delhi NCR [36].
- [I] Strangers will meet in small groups on the strength of a playful personality match, especially when the venue and the plan are fixed. That is the model for **Pujo Plans** (Phase 2): small, capped groups on a fixed route.

**Bumble.**

- [I] Bumble's lasting contribution is controls over who can start a conversation, and a separate product for friendship (Bumble For Friends). Both inform the consent design in Pujo Match.

### 3.5 Social mechanics

**Instagram Add Yours.**

- [D] Launched globally on 1 November 2021 after tests in Japan and Indonesia: a sticker that starts a public chain of Stories responding to the same prompt, with every contributor visible from the sticker [26].
- [I] The ideal seeding mechanic for launch: creators start "What's your Pujo?" chains with their own result card, and every response links to the next.

**BeReal.**

- [D] Grew fast in 2022 with a once-a-day, dual-camera "authentic" photo prompt; daily active users fell about 61% between October 2022 and March 2023; acquired by Voodoo in June 2024 for about €500 million, after which in-app advertising was introduced [25].
- [I] A novel mechanic creates a spike. Lasting value keeps people. The quiz is the spike; the recommendations, the squad and the year-round identity have to be the lasting value, or MyKolkata will repeat BeReal's curve.

### 3.6 India's going-out and food platforms

**District (Zomato / Eternal).**

- [D] Launched November 2024 as a single app for dining, events and movies, following Zomato's acquisition of Paytm's ticketing business [37]. It lists Pujo experiences such as a Kolkata heritage Durga Puja parikrama [38].
- [I] District sells tickets. It does not know who you are at Pujo. MyKolkata can send bookings to District and similar platforms (affiliate revenue) rather than compete with them.

---

## 4. Kolkata and Pujo: the landscape

### 4.1 Scale and significance

- [D] UNESCO inscribed "Durga Puja in Kolkata" on the Representative List of the Intangible Cultural Heritage of Humanity in December 2021, describing it as a homecoming and praising its inclusion across religion, gender and economic strata [40].
- [D] The British Council's 2019 study (with Queen Mary University of London and IIT Kharagpur) valued the creative industries around Durga Puja in West Bengal at ₹32,377 crore, about 2.58% of the state's GDP [41].
- [D] About 3,000 community pujos in Kolkata and more than 45,000 across West Bengal received the state grant in 2025 [44].
- [I] This is a scale at which a cultural identity layer can matter commercially (the partnerships document builds on it), and the inclusion the UNESCO dossier praised is a design requirement, not a nice-to-have.

### 4.2 The 2026 season

- [D] Mahalaya: Saturday 10 October 2026 (Bisuddha Siddhanta Panjika; amavasya from 9:37 pm on 9 October to 9:20 pm on 10 October) [42].
- [D] Shashthi 17 October, Saptami 18, Ashtami 19, Navami 20, Dashami 21 October (Bengal reckoning) [42].
- [D] Policy announced on 7 September 2026 by Chief Minister Suvendu Adhikari's government: a grant of ₹1 lakh per committee (down from ₹1.10 lakh), a full electricity-charge waiver, fire-clearance fees waived, the Red Road carnival cancelled, a complete ban on DJs, no inaugurations before Mahalaya, 24 October as the final immersion date, and the Sharad Samman awards continuing with independent judges [43].
- [I] Four product consequences. Launch on or just before Mahalaya, since nothing opens earlier. No "Pujo party" framing that depends on DJs. The dhaak is back at the centre, which suits the lore. And Pujo is politically sensitive this year, so MyKolkata stays strictly non-partisan (no politician-linked promotion, no commentary on grants).
- [D] The repo's `frontend/lib/pujo.ts` sets Mahalaya to 11 October 2026. The panjika gives 10 October. The Pujo days in the same file (17 to 21 October) are correct.

### 4.3 Mobility, safety and weather

- [D] In 2025 the Kolkata Metro ran all night for the first time on Saptami, Ashtami and Navami: the Blue Line from 1 pm to about 4 am, the Green Line to about 4:18 am [45]. (2026 timings not yet announced at the time of writing.)
- [D] In August 2024, after the rape and murder of a trainee doctor at RG Kar Medical College, the "Reclaim the Night" protests brought thousands of women onto Kolkata's streets at midnight, and the case shaped that year's Pujo themes and slogans [46].
- [D] On 23 September 2025, days before Pujo, a cloudburst flooded the city [47].
- [I] Night is the Night Owl's whole identity, and night safety is a live civic issue in this city. The product must support night Pujo responsibly (lit, busy routes; group-first; share-my-plan; an SOS path) and must never glamorise being alone and unsafe. Rain needs a real "rain mode" in recommendations.

### 4.4 Existing Pujo digital products

| Product | What it does | Type |
|---|---|---|
| Kolkata Traffic Police Puja guide map [48] | Official route and diversion map each year | Utility |
| Puja Bandhu [48] | Play Store app describing pandal maps, crowd updates, schedules and emergency contacts (verify the publisher before referring to it as official) | Utility |
| Howrah City Police Puja Guide [48] | The same for Howrah | Utility |
| West Bengal Tourism app [48] | Announced to help find pandals, routes and hotels | Utility |
| Durga Puja Pandal Hopper [49] | 140+ photographed, located pandals on a map with ratings | Directory |
| Pujo Planner [49] | Routes, live maps and itineraries | Planner |
| Dugga App [49] | AI-generated routes, food discovery, offline map | Planner |
| DurgaPujoPandals.com [49] | 500+ pandals, crowd status, Metro guides | Directory |
| Kolkata Durgotsav [49] | Road maps and pandal pages | Directory |
| The Pujo Company [49] | Pujo map | Directory |
| District [38] | Tickets for Pujo tours and events | Commerce |

- [I] Every one of these answers "where". None answers "who". None has a reason for anyone to share it, and none knows anything about the person using it, so none can personalise. That is the gap.
- [I] MyKolkata already has an explore map, places data and a Pujo page. Adding identity on top of utility is the moat: the utility makes the identity useful, and the identity makes the utility personal and shareable.

### 4.5 Music listening in India

- [D] An EY and Indian Music Industry report found YouTube the most-used music platform (32% of respondents), with Spotify at 31%, Amazon Music 17%, JioSaavn 16%, Gaana 11% and Apple Music 8% [50]. India had about 14.4 million paid music subscriptions in 2025 [50].
- [I] Roughly two in three listeners are not primarily on Spotify. A Spotify-dependent quiz would exclude most of the audience before policy is even considered.

### 4.6 Kolkata culture (facts the lore relies on)

- [D] **Adda at Maddox Square.** The Maddox Square Pujo began in 1935 and moved to the park in 1936; South Kolkata friend groups treat Ashtami night there as an unofficial reunion [52].
- [D] **Bonedi baris.** Shobhabazar Rajbari's Pujo dates to 1757 and is credited with *daaker saaj* ornamentation; the Daw family of Jorasanko began theirs in 1840 [53].
- [D] **Theme pujos and awards.** Theme pandals rose from the 1990s; the Asian Paints Sharad Shamman began in 1985 and marked its 40th year in 2025 [54]. The 2025 standouts are documented in [55].
- [D] **Artists.** Bhabatosh Sutar, a Government College of Art & Craft graduate, has created more than fifty theme pujos, including Tala Prattoy's 2025 centenary theme; Sanatan Dinda is a painter and idol-maker with a long Pujo record [65].
- [D] **Mahishasuramardini.** Broadcast every Mahalaya since the 1930s; in 1976 All India Radio replaced it with *Durga Durgatiharini* starring Uttam Kumar, the public protested, and the original returned [56].
- [D] **Dhaakis.** Drummers from districts across Bengal gather at Sealdah station (and Shobhabazar) around Panchami, where committees hire them [57].
- [D] **Chandannagar light artists.** The town's lighting artisans (Ashim De introduced LEDs in 1988) light festivals across Bengal and beyond [58].
- [D] **Pujo romance.** Kolkata writing has long described Pujo as the season of crushes, dates and "*bikele dekha hobe*" [59].
- [D] **Sindoor khela.** Traditionally limited to married women; a campaign from 2017 (#NoConditionsApply) pushed for widows, unmarried women and trans women to take part, and some pujos now welcome all women [60].
- [D] **Live music.** Kolkata's 2025 scene: live music most nights at venues including Tavern-Behind-Trincas (Bengali sets, and the Cypher Projekt hip-hop night hosted by Cizzy), Skinny Mo's Jazz Club, Park Street Social and Someplace Else; a growing Bengali hip-hop scene (Cizzy, Banglar Thek); indie acts from The Ganesh Talkies to Parekh & Singh [51].
- [D] **Cafés and cabins.** Gen Z's design-led cafés cluster around Hindustan Park and Southern Avenue (Sienna, Roastery Coffee House) [61]; the old cabins (Mitra Café since 1920, Anadi Cabin since 1925, Niranjan Agar and its egg devil, Allen's Kitchen) remain institutions [62].
- [D] **Fashion.** The Gen Z Pujo look pairs a light saree with a bold blouse and white sneakers; pre-draped sarees are growing fast [63]; Kolkata handloom labels (Prathaa) and the state's Tantuja carry Pujo collections [64].
- [D] **Galleries.** Experimenter (Hindustan Road since 2009, Ballygunge Place since 2018, and a space at the Alipore Museum) and Emami Art at the Kolkata Centre for Creativity [66].

---

## 5. What the science says

### 5.1 Why a group identity sticks

- [D] Brewer's optimal distinctiveness theory (1991): people hold two competing needs, inclusion and differentiation, and identify most strongly with groups that satisfy both, i.e. moderately inclusive groups [68].
- [I] Nine archetypes at roughly 11% each sits in that band. Layers (a secondary streak, a squad role, badges) add differentiation without inventing more groups.

### 5.2 Why specificity matters

- [D] Forer (1949): students given an identical, generic "personality profile" rated its accuracy 4.26 out of 5 on average [69].
- [I] Generic descriptions are accepted easily, which means acceptance alone proves nothing. Two consequences: the lore must be specific enough to be falsifiable (it names places, hours and dishes, so a person can genuinely say "not me"), and the "That's me" feedback must be measured per archetype, to catch results that are merely flattering.

### 5.3 Why results must be stable

- [D] Around half of Myers–Briggs retakers get a different type within five weeks [70].
- [I] The model was designed and tested for stability (97.5% same primary on simulated retest), and the product treats the revealed identity as sticky.

### 5.4 What music does and doesn't say

- [D] A study of 356,649 people in 53 countries found links between personality traits and musical preferences that hold across cultures, for example extraversion with upbeat, danceable music [71].
- [I] The links are real but modest at the individual level; music is a playful signal, not a measurement. Even where policy allowed it, music would only season the result.

### 5.5 Why sensitive inference is off-limits

- [D] Kosinski, Stillwell and Graepel (2013) showed Facebook likes could predict sexual orientation, ethnicity, religious and political views, and more [72].
- [I] Anything that looks like behavioural data can leak sensitive traits. MyKolkata never infers or stores religion, caste, orientation, politics, health or sleep patterns, and it treats ritual participation (the "roots" dimension) as excluded from any advertising or partner targeting.

### 5.6 What attraction science says about matching

- [D] Joel, Eastwick and Finkel (2017): machine-learning models using more than 100 self-reported traits and preferences could predict how much a person desired others in general, and how much they were desired, but could not predict the attraction between specific pairs [73].
- [D] Finkel and colleagues (2012), reviewing the online dating industry: "no compelling evidence that any online dating matching algorithm actually works" [74].
- [D] Montoya, Horton and Kirchner (2008), a meta-analysis of 313 studies: actual similarity predicts attraction when people haven't interacted or have only briefly, but not in existing relationships; perceived similarity matters throughout [75].
- [I] Similarity helps people decide to meet, which is exactly the job of a Pujo plan. Nobody should promise chemistry. The Pujo Match design follows from this: match on the plan and the vibe, show why, never claim a soulmate score.

### 5.7 Why things get shared

- [I] Jonah Berger's *Contagious* (2013) frames sharing through social currency, triggers, emotion, public visibility, practical value and stories. The Pujo reveal has all six: a flattering identity (social currency), Mahalaya and the Pujo days (triggers), nostalgia and belonging (emotion), a Story card (public), routes and plates (practical value), and a lore piece that reads like a story about you.

---

## 6. The research questions, answered

**1. What mechanics create sharing?**
[D] Story-shaped cards (Wrapped since 2016) [15]; uncannily specific labels (Daylist) [16][17]; artefacts made from personal data (Instafest) [19]; chains that invite a reply (Add Yours) [26]; comparison with friends (Blend, Wrapped Party, Snapchat compatibility) [11][18][27].
[I] A shareable result is flattering and specific, looks native in a 9:16 Story, asks a question back ("what's yours?"), compares, and arrives on a date people are waiting for.

**2. What makes people identify with an archetype?**
[D] Optimal distinctiveness [68]; the ease of accepting generic profiles [69]; group plus role (Spotify Clubs) [12]; curated taste as identity (Letterboxd) [21].
[I] Specificity, an admitted flaw, a group worth belonging to, a role inside it, and the feeling of having chosen it (the mirror question).

**3. What makes a profile aspirational?**
[D] Spotify gave its sixteen listening types heroic names [14].
[I] Show the person at their best in a real situation, give them competence ("knows which stall is open at 3 am"), and make sure the people they admire wear the same badge. Replace any label that sounds like an insult when a friend says it ("Socialite" became "Addabaaz"; "Main Character" became "Dhunuchi").

**4. How do products turn identity into recommendations?**
[D] Tinder's Music Mode ranks by shared taste [32]; Hinge learns preferences from likes and passes [28]; Blend turns overlap into a playlist [18]; Beli turns pairwise choices into a ranked list and suggestions [22].
[I] Treat the identity as a prior and behaviour as evidence, and use the identity to explain each recommendation. That is the design in [`06-recommendation-graph.md`](06-recommendation-graph.md).

**5. How do products get people to invite friends?**
[D] Double Date brought in new and returning users (15% of invite accepters) and more conversation [31]; Wrapped Party lets up to nine friends compare live [11]; Beli grows through referrals and campus leaderboards [22].
[I] The feature must need the friend to exist: a comparison, a squad card, a guess. Paying people to invite (cash, coupons) is weaker and cheaper-looking.

**6. How do dating apps use personality and preferences?**
[D] Questions with importance weights and a mutual (geometric mean) score (OkCupid) [35]; prompts as conversation (Hinge) [29]; stable matching on learnt preferences (Hinge) [28]; AI Q&A and camera-roll analysis (Tinder Chemistry) [33]; personality tests for group dinners (Timeleft) [36]; astrology as a mode (Tinder) [32].
[I] Personality works as a filter and a conversation starter. It does not predict chemistry [73][74].

**7. How do Wrapped-style experiences create social currency?**
[D] 200 million users in a day and 500 million shares for Wrapped 2025, after it added clubs, roles, Listening Age and a live party [11][12][13].
[I] Rare, specific data about me, a group identity, comparison, and a fixed annual date. MyKolkata has the date: Mahalaya for the reveal, Dashami for the recap.

**8. How do platforms turn users into communities around an identity?**
[D] Club and role inside it (Spotify) [12]; a shared ritual question ("four favourites?") [21]; run clubs as social life (Strava) [23]; campus leaderboards (Beli) [22].
[I] A practice, a language, a ritual and a place. Every archetype bible ends with those four: events, a channel, vocabulary and merch.

**9. What makes an identity feel authentic rather than algorithmic?**
[D] BeReal's authenticity mechanic peaked and fell [25]; Tinder's camera-roll scan drew privacy criticism [33]; Daylist's oddly specific titles delighted people [17].
[I] Authentic: culturally specific, self-authored, explainable, stable, and built from things the person knowingly told you. Algorithmic: generic praise, invisible data, results that flip, and reaching into places the person didn't open.

**10. What should MyKolkata borrow?** See §7.

**11. What should MyKolkata explicitly avoid?** See §7.

## 7. Borrow and avoid

| From | Borrow | Avoid |
|---|---|---|
| Spotify Wrapped | Story cards; a fixed annual date; group plus role; live comparison; a recap at the end of the season | Novelty features that replace the core (the 2024 AI podcast); personality derived from data people didn't knowingly give |
| Spotify Daylist | Uncanny specificity in the words | Vagueness dressed up as insight |
| Spotify Blend | Friend match as a Story, clearly labelled as overlap | Applying a single percentage to romance |
| Instafest | A beautiful artefact made from something personal | Building on an API you don't control |
| Letterboxd | "My Pujo Four" on the profile | — |
| Beli | Pairwise "this or that" for a Pandal Diary and Pujo Plate rankings; campus loops | Public leaderboards that reward rushing (the Hunter's count stays private) |
| Hinge | Prompts; learning from behaviour; safety features ("Are You Sure?") | Dating-first positioning |
| Tinder | Double Date's group-first design; events as the matching surface; liveness verification | Swipe mechanics for people; camera-roll analysis |
| OkCupid | Importance weights; geometric mean for mutual fit | Presenting a percentage as a prediction |
| Timeleft | Small capped groups of strangers on a fixed plan | — |
| Snapchat | Friend compatibility as play; location privacy controls | Live location sharing |
| Strava | Clubs and group activity as social life | Public location traces (the heatmap lesson) |
| Instagram | Add Yours chains; link sticker; Stories as distribution | Gating results behind a share |
| BeReal | The courage to ask for one specific moment | Relying on a novelty mechanic for retention |
| 16Personalities | Named, heroic types | Instability; claims of psychological validity |
| District / Swiggy | Bookings through partners; funny city statistics | Statistics without enough real data |

## 8. Assumptions to validate

| # | Assumption | Test | Target |
|---|---|---|---|
| A1 | Kolkata Gen Z will recognise themselves in the nine archetypes | "That's me" button after the reveal | ≥ 80% "That's me" or "Mostly", no archetype below 70% |
| A2 | The archetype names read as proud, not insulting | 12 short interviews in week 1 (mixed gender, community, North/South, one non-Bengali, one homecomer) | No name rejected by more than 2 of 12 |
| A3 | People will share the card | Share rate among completers in the soft launch | ≥ 25% |
| A4 | The quiz can be finished in under 2.5 minutes on a mid-range Android phone over congested mobile data | Timed sessions, field test near a big pandal | Median ≤ 150 s, completion ≥ 70% |
| A5 | The distribution in the real city is not dominated by one archetype | Launch data after 2,000 results | No archetype above 22% |
| A6 | Committees will keep their pandal pages accurate if given a free, simple tool | Outreach to 30 committees before Shashthi | 10 claimed pages |
| A7 | Friend comparison is the strongest invite | Invite conversion by type (compare, squad, guess) | Compare ≥ 30% accepted |
| A8 | Non-Bengali and non-Hindu Kolkatans feel included | Segment the "That's me" rate by self-described background, opt-in only | Within 10 points of the overall rate |

## 9. Sources

1. Spotify for Developers, "Update on Developer Access and Platform Security" (6 Feb 2026). https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
2. Spotify for Developers, "February 2026 Web API Dev Mode Changes: Migration Guide". https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
3. Spotify for Developers, "Quota modes". https://developer.spotify.com/documentation/web-api/concepts/quota-modes
4. Spotify for Developers, "Scopes". https://developer.spotify.com/documentation/web-api/concepts/scopes
5. Spotify for Developers, "Get User's Top Items". https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
6. Spotify for Developers, "Get Recently Played Tracks". https://developer.spotify.com/documentation/web-api/reference/get-recently-played
7. Spotify Developer Policy (effective 15 May 2025). https://developer.spotify.com/policy
8. Spotify Developer Terms. https://developer.spotify.com/terms
9. TechCrunch, "Spotify changes developer mode API to require Premium accounts, limits test users" (6 Feb 2026). https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/
10. Music Ally, "Spotify removes features from Web API citing security issues" (28 Nov 2024). https://musically.com/2024/11/28/spotify-removes-features-from-web-api-citing-security-issues/
11. Spotify Newsroom, "2025 Wrapped Is Here…" (3 Dec 2025). https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/
12. Spotify Newsroom, "Join Your Wrapped Club" (3 Dec 2025). https://newsroom.spotify.com/2025-12-03/wrapped-clubs-overview/
13. TechCrunch, "Spotify says Wrapped 2025 is its biggest yet with 200M users in its first day" (4 Dec 2025). https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day
14. Spotify Newsroom, "Get to Know Your Music Listening Personality from 2022 Wrapped" (30 Nov 2022). https://newsroom.spotify.com/2022-11-30/get-to-know-your-music-listening-personality-from-2022-wrapped/
15. Spotify Newsroom, "Commemorating a Decade of Spotify Wrapped" (4 Dec 2024). https://newsroom.spotify.com/2024-12-04/10-years-spotify-wrapped/
16. Axios, "Spotify launches viral 'daylist' feature globally" (4 Sep 2024). https://www.axios.com/2024/09/04/spotify-daylist-feature-globally-viral
17. Yahoo News, "Spotify's astrology-like Daylists go viral…" https://www.yahoo.com/news/spotify-astrology-daylists-viral-micro-225242082.html; Kill The DJ, "Daylists see 20,000% surge". https://killthedj.com/spotify-daylists-see-huge-surge/
18. Screen Rant, "This Spotify feature reveals if you're musically compatible with someone". https://screenrant.com/spotify-blend-valentines-day-explained-music-compatibility/
19. TechCrunch, "Instafest app lets you create your own festival lineup from Spotify" (28 Nov 2022). https://techcrunch.com/2022/11/28/instafest-app-lets-you-create-your-own-festival-lineup-from-spotify
20. SFGate, "20-year-old Calif. student makes viral Spotify Instafest app". https://www.sfgate.com/tech/article/california-student-creates-spotify-instafest-17618861.php
21. Wikipedia, "Letterboxd". https://en.wikipedia.org/wiki/Letterboxd; Young Hollywood, "How Letterboxd Became Gen Z's Personality Test". https://younghollywood.com/scene/letterboxd-gen-z-personality-test.html
22. Wikipedia, "Beli (app)". https://en.wikipedia.org/wiki/Beli_(app); Taste, "Beli Invites the Loneliest Generation to Dine Out". https://tastecooking.com/beli-invites-the-loneliest-generation-to-dine-out/
23. GearJunkie, "Strava 2024 Year in Sport". https://gearjunkie.com/endurance/strava-year-in-sport-trend-report-2024; Men's Journal. https://www.mensjournal.com/news/run-clubs-strava-year-in-sport-report
24. Deconstructor of Fun, "Duolingo Streaks" (industry analysis, secondary). https://duolingo.deconstructoroffun.com/mechanics/streaks
25. Tubefilter, "Voodoo acquires BeReal for €500 million" (12 Jun 2024). https://www.tubefilter.com/2024/06/12/game-company-voodoo-acquires-bereal-500-million/; Wikipedia, "BeReal". https://en.wikipedia.org/wiki/BeReal
26. TechCrunch, "Instagram rolls out an 'Add Yours' sticker in Stories" (1 Nov 2021). https://techcrunch.com/2021/11/01/instagram-rolls-out-an-add-yours-sticker-in-stories-to-create-threads-users-can-respond-to/
27. Snap Newsroom, "See How the Stars and Your Friendships Align with Snapchat Astrology". https://newsroom.snap.com/snapchat-astrology
28. TechCrunch, "Hinge employs new algorithm to find your 'most compatible' match" (11 Jul 2018). https://techcrunch.com/2018/07/11/hinge-employs-new-algorithm-to-find-your-most-compatible-match-for-you/
29. Hinge Newsroom, "Prompt Feedback". https://hinge.co/newsroom/prompt-feedback
30. Hinge Newsroom, "Evolving Together: How Daters Helped Shape Hinge in 2025". https://hinge.co/newsroom/hinge-2025-product-evolution
31. Tinder Press Room, "Tinder Launches Double Date" (17 Jun 2025). https://www.tinderpressroom.com/2025-06-17-Tinder-Launches-Double-Date-The-New-Way-to-Make-Connections-with-Your-Bestie
32. Tinder Press Room, "Tinder Sparks 2026" (12 Mar 2026). https://www.tinderpressroom.com/2026-03-12-Tinder-Debuts-Inaugural-Product-Keynote-Tinder-Sparks-2026-Start-Something-New
33. TechCrunch, "Tinder to use AI to get to know users, tap into their Camera Roll photos" (5 Nov 2025). https://techcrunch.com/2025/11/05/tinder-to-use-ai-to-get-to-know-users-tap-into-their-camera-roll-photos/
34. Tinder India Press Room, "Durga Puja: 43% of Gen Z in Kolkata choose festivals to introduce dates" (10 Jan 2024). https://in.tinderpressroom.com/2024-01-10-kolkata-durga-pujo-first-date
35. AMS Graduate Student Blog, "OKCupid: The Math Behind Online Dating" (2016). https://blogs.ams.org/mathgradblog/2016/06/08/okcupid-math-online-dating/
36. The Week, "How Timeleft app fosters real-life connections" (13 Sep 2025). https://www.theweek.in/theweek/leisure/2025/09/13/timeleft-app-experience-irl-social-networking-dinner.html; Timeleft, "Timeleft algorithm". https://timeleft.com/post/timeleft-algorithm-the-maestro-of-your-dinners/
37. Business Today, "Zomato launches District app" (16 Nov 2024). https://www.businesstoday.in/technology/news/story/zomato-launches-district-app-for-dining-and-live-events-experiences-see-details-454001-2024-11-16
38. District, "Kolkata Heritage Durga Puja Parikrama 2025". https://www.district.in/events/kolkata-heritage-durga-puja-parikrama-2025-sep29-2025-buy-tickets
39. Business Standard, "India ordered 93 million biryanis in 2025, Swiggy report shows". https://www.business-standard.com/industry/news/india-ordered-93-million-biryanis-in-2025-swiggy-report-shows-trends-125122301337_1.html
40. UNESCO, "Durga Puja in Kolkata". https://ich.unesco.org/en/RL/durga-puja-in-kolkata-00703
41. British Council, "Mapping the Creative Economy around Durga Puja". https://www.britishcouncil.in/programmes/arts/Mapping-Creative-Economy-around-DurgaPuja (report PDF: https://www.britishcouncil.in/sites/default/files/mapping_the_creative_economy_around_durga_puja_sept_2021.pdf)
42. MyAstrology, "Mahalaya 2026 Date" (Bisuddha Siddhanta). https://myastrology.in/en/utsab/mahalaya; Divine Hindu, "Durga Puja 2026 Dates: Shashthi 17 Oct to Dashami 21 Oct". https://www.divinehindu.in/blogs/news/durga-puja-2026-dates-sandhi-puja-rituals
43. ThePrint, "Bengal govt announces Rs 1 lakh Durga Puja grant…" (7 Sep 2026). https://theprint.in/india/bengal-govt-announces-rs-1-lakh-durga-puja-grant-appeals-to-big-budget-committees-to-forgo-aid/3036149/
44. India TV News, "West Bengal hikes Durga Puja grant to Rs 1.10 lakh" (31 Jul 2025). https://www.indiatvnews.com/west-bengal/news-mamata-banerjee-big-pre-poll-push-west-bengal-hikes-durga-puja-grant-to-rs-1-10-lakh-offers-80-power-bill-rebate-ahead-of-2026-assembly-elections-2025-07-31-1001431
45. News24, "Kolkata Metro to run night-long services till 4 AM for Durga Puja". https://news24online.com/cities/kolkata/kolkata-metro-to-run-night-long-services-till-4-am-for-durga-puja-commuters/640291/
46. Deccan Herald, "Reclaim the Night" coverage (Aug 2024). https://www.deccanherald.com/india/west-bengal/kolkata-r-g-kar-hospital-rape-murder-women-protests-reclaim-the-night-west-bengal-police-doctors-3151014; Wikipedia, "Rimjhim Sinha". https://en.wikipedia.org/wiki/Rimjhim_Sinha
47. Wikipedia, "September 2025 Kolkata cloudburst". https://en.wikipedia.org/wiki/September_2025_Kolkata_cloudburst
48. Kolkata Traffic Police, Puja guide map. https://kolkatatrafficpolice.gov.in/pujaguidemap.html; Puja Bandhu (Play Store). https://play.google.com/store/apps/details?id=com.indranilvyoma.boltexponativewind; Howrah City Police Puja Guide (Play Store). https://play.google.com/store/apps/details?id=com.howrahcitypolice.app; The CSR Journal, West Bengal Tourism app. https://thecsrjournal.in/west-bengal-tourism-department-launch-app-durga-puja-pandal-hopping/
49. Durga Puja Pandal Hopper (Play Store). https://play.google.com/store/apps/details?id=com.pandalhop.pandalhopper; Pujo Planner. https://www.pujoplanner.com/; Dugga App. https://www.duggaapp.com/; DurgaPujoPandals.com. https://www.durgapujopandals.com/home/; Kolkata Durgotsav. https://www.kolkatadurgotsav.com/kolkata-durga-puja-road-maps; The Pujo Company. https://www.thepujo.com/pujo-map
50. BestMediaInfo, "YouTube edges Spotify in India's music streaming race: EY-IMI". https://bestmediainfo.com/insights/youtube-spotify-india-music-streaming-platform-competition-ey-imi-12200559; Music Business Worldwide, "India… 14.4m paid subscriptions". https://www.musicbusinessworldwide.com/india-added-nearly-4m-paid-music-streaming-subscriptions-in-2025-taking-its-total-to-14-4m-according-to-new-report/
51. Rolling Stone India, "The Kolkata Music Map" (21 Jun 2025). https://rollingstoneindia.com/kolkata-live-music-jazz-metal-indie/
52. LBB, "Adda at Maddox Square". https://lbb.in/kolkata/adda-at-maddox-square-eb3cfc/; Kolkata Durgotsav, "Maddox Square Durga Puja". https://www.kolkatadurgotsav.com/maddox-square-durga-puja-ballygunge.html
53. Wikipedia, "Shobhabazar Rajbari". https://en.wikipedia.org/wiki/Shobhabazar_Rajbari; Orange Wayfarer, "Bonedi Barir Durga Puja of Kolkata". https://www.orangewayfarer.com/bonedi-barir-durga-puja-of-kolkata-photo-walk/
54. Wikipedia, "Asian Paints Sharad Shamman". https://en.wikipedia.org/wiki/Asian_Paints_Sharad_Shamman; Adgully, "40 years of Sharad Shamman". https://www.adgully.com/post/6962/asian-paints-celebrates-40-years-of-sharad-shamman-with-choltey-choltey-chollish-tribute-to-kolkata
55. LBB, "15 Most Creative Durga Puja Pandals of 2025". https://lbb.in/kolkata/unique-theme-pandals-for-durga-pujo/
56. Wikipedia, "Mahisasuramardini (radio programme)". https://en.wikipedia.org/wiki/Mahisasuramardini_(radio_programme); Wikipedia, "Durga Durgatiharini". https://en.wikipedia.org/wiki/Durga_Durgatiharini
57. The Statesman, "Dhakis face bleak times as Puja nears". https://www.thestatesman.com/bengal/dhakis-face-bleak-times-as-puja-nears-1503002867.html
58. ETV Bharat, "Chandannagar's iconic lighting". https://www.etvbharat.com/en/!state/west-bengal-chandannagar-jagaddhatri-puja-lighting-puja-pandal-enn24110901801
59. Outlook, "Love in the Time of Puja". https://outlookindia.com/website/story/love-in-the-time-of-puja/213538; ScoopWhoop, "Love in the Time of Pujo". https://www.scoopwhoop.com/culture/love-during-durga-pujo-bengali-valentines-day-kolkata-dhaak/
60. Wikipedia, "Sindur Khela". https://en.wikipedia.org/wiki/Sindur_Khela; Campaigns of the World, "#NoConditionsApply". https://campaignsoftheworld.com/digital-campaigns/noconditionsapply-inclusion-of-women-in-the-bengali-ritual-of-sindoor-khela/
61. t2 Online, "Five aesthetic cafés in Kolkata". https://t2online.in/goodlife/food-beverage/five-aesthetic-caf-C3-A9s-in-kolkata-perfect-for-your-next-instagram-photodump/1517296
62. Orange Wayfarer, "Cabin Restaurants of Calcutta". https://www.orangewayfarer.com/kolkata-food-cabin-restaurants/; Slurrp, "Heritage cabins". https://www.slurrp.com/article/dipped-in-history-these-cabins-have-kolkatas-culinary-graph-1638883611191
63. Editorialge, "Puja Fashion 2025: Sarees, Sneakers and Smart Wearables". https://editorialge.com/puja-fashion-2025/
64. Prathaa, Pujo collection. https://prathaa.in/collections/pujo-2024/3000-4000; Wikipedia, "Tantuja". https://en.wikipedia.org/wiki/Tantuja
65. Culture Today, "Bhabatosh Sutar". https://culturetoday.in/bhabatosh-sutar-durga-puja-artist/; Wikipedia, "Sanatan Dinda". https://en.wikipedia.org/wiki/Sanatan_Dinda
66. Wikipedia, "Experimenter Gallery". https://en.wikipedia.org/wiki/Experimenter_Gallery; Emami Art. https://www.emamiart.com/
67. (Kaash season) Stock and Flickr documentation of kaash fields along the Rajarhat and New Town roads, e.g. https://www.flickr.com/photos/tags/kash%20phool/
68. Brewer, M. B. (1991). "The Social Self: On Being the Same and Different at the Same Time." *Personality and Social Psychology Bulletin* 17(5). https://journals.sagepub.com/doi/10.1177/0146167291175001
69. Wikipedia, "Barnum effect" (Forer 1949). https://en.wikipedia.org/wiki/Barnum_effect
70. Pittenger, D. J. (2005). "Cautionary comments regarding the Myers-Briggs Type Indicator." *Consulting Psychology Journal*; summary: https://mbtiusa.com/blog/mbti-test-retest-reliability
71. ScienceDaily, "Musical preferences unite personalities worldwide" (Greenberg et al., *JPSP*, 2022). https://www.sciencedaily.com/releases/2022/02/220209093441.htm
72. Kosinski, M., Stillwell, D., Graepel, T. (2013). "Private traits and attributes are predictable from digital records of human behavior." *PNAS*. https://www.pnas.org/doi/full/10.1073/pnas.1218772110
73. Joel, S., Eastwick, P. W., Finkel, E. J. (2017). "Is Romantic Desire Predictable?" *Psychological Science*. https://journals.sagepub.com/doi/abs/10.1177/0956797617714580
74. Finkel, E. J., et al. (2012). "Online Dating: A Critical Analysis From the Perspective of Psychological Science." *Psychological Science in the Public Interest*. https://journals.sagepub.com/doi/abs/10.1177/1529100612436522
75. Montoya, R. M., Horton, R. S., Kirchner, J. (2008). "Is actual similarity necessary for attraction?" *Journal of Social and Personal Relationships*. https://journals.sagepub.com/doi/10.1177/0265407508096700
76. US Federal Trade Commission, administrative complaint against Cambridge Analytica (2019). https://www.ftc.gov/system/files/documents/cases/182_3107_cambridge_analytica_administrative_complaint_7-24-19.pdf; CNN, "Facebook is cracking down on personality quizzes" (2019). https://www.cnn.com/2019/04/25/tech/facebook-personality-quizzes
77. Wikipedia, "Digital Personal Data Protection Rules, 2025". https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Rules,_2025; ORF, "DPDP Rules and the Future of Child Data Safety". https://www.orfonline.org/expert-speak/dpdp-rules-and-the-future-of-child-data-safety
78. ASCI, influencer advertising guidelines. https://www.ascionline.in/social/
79. Apple Developer, "Get Recently Played Tracks" (Apple Music API). https://developer.apple.com/documentation/applemusicapi/get-v1-me-recent-played-tracks
80. Kali Puja and Jagaddhatri Puja 2026 dates. https://myastrology.in/en/utsab/kali-puja-diwali; https://www.calendarlabs.com/holidays/sikh/kali-puja.php
