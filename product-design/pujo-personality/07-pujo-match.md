# G. Pujo Match: the social system

> Find someone who experiences Pujo the way you do.

Not Tinder with a Kolkata skin. A way to find your people for a night of Pujo: friends first, then groups, then strangers in groups, and only much later, carefully, one person.

Numbered sources refer to [`01-research.md`](01-research.md) §9.

---

## 1. What the research says

- **Chemistry can't be predicted from a quiz.** Models using more than a hundred pre-meeting traits and preferences could predict who is generally desired, but not which pairs would click [73]. A major review found no compelling evidence that any dating algorithm works [74]. Similarity matters most before and just after meeting, much less in a relationship [75].
- **Plans beat profiles.** Hinge's prompts outperform photos for getting to a date [29]. Tinder is testing events as the place people meet [32]. Strava reports one in five Gen Z respondents has dated someone they met through exercise [23]. Timeleft fills tables of strangers on the strength of a personality test and a fixed plan [36].
- **Groups lower the stakes.** Tinder's Double Date drew users under 29, brought back lapsed users and produced more conversation [31].
- **Kolkata already uses Pujo this way.** 43% of Kolkata Gen Z respondents see festivals as the moment to introduce a date to friends and family; one in three have used Tinder during a festival (small city sample, see §4.6 of the research) [34].
- **Overreach backfires.** Tinder's camera-roll scan drew privacy criticism the moment it was announced [33].

**Implication.** Match people on the Pujo they would enjoy together, say exactly why, lead with groups, and never claim to predict anything else.

## 2. The ladder

| Rung | What it is | Who | When |
|---|---|---|---|
| **1. Compare** | See how your Pujo fits a friend's | Friends, via a link | Launch (Pujo 2026) |
| **2. Squad** | Your group's Pujo: roles, a squad card, a squad route | Friend groups, 3 to 20 | Launch (Pujo 2026) |
| **3. Pujo Plans** | Post or join a small, capped group plan for a night of Pujo with people you don't know yet | 18+, verified | Pilot at Christmas week on Park Street 2026; full at Pujo 2027 |
| **4. Pujo Match** | One-to-one, romantic, opt-in | 18+, verified, discovery switched on | Pujo 2027 at the earliest, only if rung 3 is safe and loved |

Each rung is useful without the next, and each is a condition for the next.

## 3. Pujo Sync: the compatibility model

### 3.1 Five kinds of fit

| Component | Dimensions | The question it answers |
|---|---|---|
| **Clock** | Night drive, Dawn pull | Do you want to be out at the same hours? |
| **Route** | Roaming radius, Planning, Crowd appetite | Can you move through the city together? |
| **Plate** | Food drive (and diet, as a filter) | Will you agree on where to eat? |
| **Scene** | Art eye, Heritage pull, Dhaak energy, Spotlight, Shaaj | Will you enjoy the same stops? |
| **Company** | Squad size, Roots (and Romance lens, in rung 4 only) | Do you want the same kind of company? |

### 3.2 The maths

For people A and B with vectors *u*ᴬ and *u*ᴮ (identity blended with taste, §10 of the personality system):

```
similarity on d:     sim_d = 1 − |uᴬ_d − uᴮ_d| / spread_d        (spread_d from calibration, capped at 1)
what A cares about:  Iᴬ_d = λ of A's primary archetype on d  (+ 1.0 on any d A marked "this matters to me")
A's satisfaction:    satᴬ = Σ_d Iᴬ_d · sim_d / Σ_d Iᴬ_d
Pujo Sync:           √(satᴬ · satᴮ)                                   (a match has to work both ways)
component fit:       the same calculation restricted to the component's dimensions
```

The geometric mean is OkCupid's: two people who each find the other 50% suitable are a better match than one at 100% and one at 0% [35]. Importance comes from each person's own archetype, so a Pet Pujari cares most whether the Plate fits and a Shiuli whether the Clock does.

### 3.3 What people see

- **Components as words, not numbers.** "Same clock." "Different routes, same plates." "They'll plan; you'll drift."
- **The relationship kind** from the archetype pairs: *same Pujo* (kin), *good fit* (complement), *spark* (opposites), *crossover*.
- **A plan**, always. The point of a match is a night out.
- **A number only between friends, and labelled.** In Compare and Squad: *"Plan match 82%: how much of one Pujo day you'd both enjoy, based on your answers."* In Pujo Plans and Pujo Match there is no percentage at all, because a number next to a stranger's face reads as a verdict on them.

### 3.4 The compare card

The brief's example, rebuilt within the design system (no emoji; words and emblems instead):

```
┌─────────────────────────────────────────────┐
│  রাতজাগা                      পেটপুজারি       │
│  Night Owl                    Pet Pujari     │
│  with a Pet Pujari streak     with a Night Owl streak
│                                             │
│  Same Pujo, different order.                │
│                                             │
│  Clock     the same: after midnight         │
│  Route     you drift, they plan the stops    │
│  Plate     identical, dangerously           │
│  Scene     you want lights, they want stalls │
│                                             │
│  Plan match 88%                             │
│  How much of one Pujo night you'd enjoy.    │
│                                             │
│  Your night                                 │
│  Tala Prattoy, the Shyambazar roll,         │
│  Bagbazar, Kumartuli, sunrise at the ghat   │
│                                             │
│  Which Pujo are you?                        │
│  {domain}/pujo                              │
└─────────────────────────────────────────────┘
```

## 4. Rung 1: Compare

1. After the reveal, "Compare with a friend" makes a link (`/pujo/compare/{code}`) for WhatsApp or Instagram.
2. The friend sees "{Name} is a Night Owl. What's your Pujo?", takes the quiz, gets their own result first (never gated), then the comparison.
3. Both get the compare card and one suggested plan.
4. **Guess my Pujo:** before comparing, the sender can guess the friend's archetype. After the friend's reveal: "You said Pandal Hunter. They're an Art Kid." This is the mild-offence engine the brief asked for, and it makes people want to prove the guess wrong.

Consent: comparison shows only the two archetypes, streaks and component words. Never answers, never the Romance lens.

## 5. Rung 2: Squad

- **Start a squad** (a link; 3 to 20 members). Each member takes the quiz; the squad card fills in as they arrive.
- **Squad archetype:** the archetype with the highest summed probability across members ("Your squad's Pujo: Addabaaz").
- **Squad mix:** "3 Night Owls, 2 Pet Pujaris, 1 Shiuli (who will be asleep)." Percentages appear only at five or more members.
- **Roles:** each member gets one of fourteen roles, one per dimension (Navigator, Night Shift, Early Alarm, Snack Minister, Lens, Hype, Anchor, Glue, Heart, Stylist, Wanderer, Archivist, Crowd Surfer, Drummer). Assigned greedily: repeatedly give the member who stands furthest above the squad's average on a dimension that dimension's role, until everyone has one. Lines are in [`model/archetypes.json`](model/archetypes.json): "Lens: took every photo of the group. Is in none of them."
- **Squad route:** a route built from the squad's average vector, with each member's "must-have" stop included.
- **Squad card:** the mix, the roles and the route, as a Story.

## 6. The pair copy deck

Forty-five pairings: nine same-archetype pairs and thirty-six cross pairs. Every compare card and squad insight draws from this deck. Lines name the archetypes rather than saying "you" and "they", because either person can be reading the card.

### 6.1 Same archetype

| Pair | Headline | Line | Plan |
|---|---|---|---|
| Night Owl + Night Owl | Two Night Owls. Nobody's going home. | You'll both say "one last pandal" and both mean four. | North after midnight; sunrise at Bagbazar ghat |
| Pandal Hunter + Pandal Hunter | Two spreadsheets. One route. | Merge your lists and the city is cleared by Saptami. | The Chaturthi sweep, split by zone |
| Para Kid + Para Kid | Two paras. One argument. | Each of you thinks yours is the best. Visit both. Say nothing. | Ashtami at one para, Navami at the other |
| Pujo Romantic + Pujo Romantic | Two Romantics. Someone has to be practical. | Neither of you will choose the restaurant. | The dusk route and College Square's lights |
| Pet Pujari + Pet Pujari | Two Pet Pujaris. Order everything. | Don't share. Order two of each. | Bhog to Biryani |
| Art Kid + Art Kid | Two Art Kids. Forty minutes per pandal. | You'll read the placards to each other. | The theme trail at 4 pm |
| Addabaaz + Addabaaz | Two Addabaaz. The group chat just doubled. | Between you, you know half of Maddox. | Maddox base camp |
| Dhunuchi + Dhunuchi | Two Dhunuchis. One circle isn't enough. | Coordinate the Ashtami looks, or it's war. | The arati circuit |
| Shiuli + Shiuli | Two Shiulis. The alarm is set. | You'll reach the bonedi bari before the priest. | *Bhor* |

### 6.2 Kin: the same Pujo

| Pair | Headline | Line | Plan |
|---|---|---|---|
| Night Owl + Addabaaz | The adda ends. The walk begins. | You meet at Maddox at one, when the Addabaaz's adda breaks and the Night Owl's night starts. | Maddox at midnight, then the South on foot |
| Night Owl + Pet Pujari | Same clock, better food. | The Pet Pujari knows which roll stall is still frying at three. | North after midnight, with stops |
| Pandal Hunter + Art Kid | Forty pandals, or six done properly. | One keeps time, one keeps looking. Split the difference: twelve. | The theme shortlist by Metro |
| Para Kid + Shiuli | Anjali together, then separate ways. | You both love the old Pujo. One wants the para; one wants the silence. | Dawn at a bonedi bari, anjali at the para |
| Para Kid + Dhunuchi | The para's arati has a star. | The Para Kid brings the dhaaki; the Dhunuchi brings the circle. | Sandhya arati at the para, then the competition |
| Pujo Romantic + Shiuli | Sunrise at the ghat. Nobody else there. | The two quietest Pujos in the city, together. | Kumartuli at dawn, the ghat, cha |
| Addabaaz + Dhunuchi | The party has a centre. | One gathers everyone; the other gets them dancing. | Maddox, then the nearest arati |
| Pet Pujari + Addabaaz | A table for twelve, ordered properly. | One books the table; the other orders for it. | Biryani for the group, then Maddox |

### 6.3 Complement: different strengths that fit

| Pair | Headline | Line | Plan |
|---|---|---|---|
| Pandal Hunter + Pet Pujari | One plans the pandals. One plans the stops. | The most efficient Pujo in Kolkata, and nobody goes hungry. | North by Metro, with cabins in between |
| Art Kid + Dhunuchi | The muse and the lens. | One of you is in every photo. The other took them all. | Golden hour in Kumartuli's doorways, then arati |
| Night Owl + Pandal Hunter | The map, and the night to use it. | The Hunter plans it; the Night Owl stretches it past three. | The Hunter's route, extended to sunrise |
| Para Kid + Pet Pujari | Bhog, treated with the respect it deserves. | One serves it; the other understands it. | Bhog at the para, then the Bijoya rounds |
| Pujo Romantic + Art Kid | Beauty, and the name of who made it. | You'll both stop in front of the same thing. | The theme trail at dusk |
| Shiuli + Art Kid | The shola crown, discussed at length. | Craft, old and new, before the crowds. | Kumartuli at sunrise, then the bonedi baris |
| Pujo Romantic + Night Owl | The city, romanticised, after dark. | One loves the lights; the other loves who's under them. | College Square at midnight, the long way home |
| Addabaaz + Para Kid | The para, as a venue. | The Addabaaz brings the friends; the Para Kid brings the chairs. | The para's function, then adda on the plastic chairs |

### 6.4 Spark: opposites worth the story

| Pair | Headline | Line | Plan |
|---|---|---|---|
| Night Owl + Shiuli | You'll only ever overlap at dawn. | Twenty minutes on the ghat steps, one ending, one beginning. Make them count. | Bagbazar ghat at 5 am |
| Pandal Hunter + Addabaaz | Forty pandals against one bench. | The Hunter will finish the route; the Addabaaz will still be on the grass. Meet at the end. | The Hunter's route, finishing at Maddox |
| Pet Pujari + Art Kid | The placard or the phuchka. | One reads, one eats. Take turns. | The theme trail with a cabin between every pandal |
| Dhunuchi + Shiuli | The centre of the circle, and the quiet before it. | You'll never be awake at the same time. Ashtami anjali is your one shared hour. | Anjali together; after that, separate Pujos and shared photos |
| Pujo Romantic + Addabaaz | Table for two, or table for twelve. | One of you wants a moment. The other brought nineteen people. | Maddox with the gang, then leave early, together |
| Para Kid + Pandal Hunter | Stay, or see everything. | One won't leave the para; the other won't stop. Compromise: the next para over. | Anjali at the para, then three pandals nearby |

### 6.5 Crossover

| Pair | Headline | Line | Plan |
|---|---|---|---|
| Night Owl + Para Kid | The para at 2 am. | When the para's chairs empty, the Night Owl arrives. The Para Kid knows the pandal nobody photographs. | Their para after midnight, then the walk |
| Night Owl + Art Kid | The lights, explained. | The Night Owl loves how it looks at three; the Art Kid knows who wired it. | Lighting-led pandals after midnight |
| Night Owl + Dhunuchi | After the arati, the night. | The Dhunuchi lights the pandal up at eight; the Night Owl takes over at one. | Arati, then the night walk |
| Pandal Hunter + Pujo Romantic | The efficient route, the long way home. | The Hunter plans it perfectly; the Romantic makes it slower on purpose. | The shortlist, with one sunset |
| Pandal Hunter + Dhunuchi | The best backdrops, found fast. | The Hunter knows where every photogenic pandal is. The Dhunuchi knows what to wear. | Five looks, five pandals |
| Pandal Hunter + Shiuli | Early, for different reasons. | One beats the queue; the other beats the city waking up. Start together at six. | Bonedi baris at dawn, then the sweep |
| Para Kid + Pujo Romantic | Anjali, side by side. | The para's aunties will notice. Let them. | Ashtami anjali, then the dusk route |
| Para Kid + Art Kid | The para's pandal, taken seriously. | The Art Kid will finally explain why the decorator's work is art. | The para, then one theme pandal |
| Pujo Romantic + Pet Pujari | One plate, two people, then another plate. | One shares; the other orders more. | Phuchka, sherbet, then a proper dinner |
| Pujo Romantic + Dhunuchi | Dressed up, for different audiences. | One dresses for one person, one for the whole pandal. Both of you will look incredible. | Golden-hour photos, then arati |
| Pet Pujari + Dhunuchi | Photo first, then food. | The Dhunuchi needs the shot; the Pet Pujari needs the plate. The stall outside the arati serves both. | Arati, then Park Circus |
| Pet Pujari + Shiuli | The dawn menu. | The Shiuli knows Tiretta Bazaar's breakfast. The Pet Pujari will never sleep in again. | Kochuri at six, the bonedi baris, a Chinese breakfast |
| Art Kid + Addabaaz | The placard, read aloud to nineteen people. | The Addabaaz will turn one theme into the best adda of the night. | One theme pandal, then the lawn |
| Addabaaz + Shiuli | The adda ends at one. The Shiuli's day starts at four. | You'll meet at anjali, or not at all. Worth it. | Ashtami anjali, then an early lunch |

## 7. Rung 3: Pujo Plans

**The idea.** Anyone verified and over 18 can post a plan: a day, a time window, a zone, a route template and a group size (three to six). Others with a compatible Pujo can ask to join. The host accepts. The group chat opens three hours before and closes the next day.

| Setting | Options |
|---|---|
| Who can see it | Friends of friends, verified members, or women only (visible and joinable only by women) |
| Group size | 3 to 6, including the host |
| Where | A zone and a route template, never a home address |
| Meeting point | A public, busy landmark (a pandal gate, a Metro exit), revealed to accepted members one hour before |
| Matching | Plans are ranked for each person by Pujo Sync with the host and with the members already in |

**Examples.**

- *Navami Nishi, North: four Night Owls, 11:30 pm from Tala Prattoy, ending at the ghat.* Shown to Night Owls, Pet Pujaris and Addabaaz with a matching clock.
- *Bhor, Ashtami: bonedi baris at 5:30 am, three places left.* Shown to Shiulis, Romantics and Art Kids.
- *The Chaturthi Sweep, East: a Hunter with a spreadsheet, 10 am from Sreebhumi.*

**Pilot outside Pujo first.** Christmas week on Park Street and the Book Fair are lower-stakes crowds for testing the safety systems before they carry the weight of Pujo 2027.

## 8. Rung 4: Pujo Match

Only if rung 3 has run safely at scale.

- **Opt-in discovery**, separate from everything else and off by default.
- **Profiles are plans:** the archetype and streak, three Pujo prompts ("My perfect Navami ends at…", "The pandal I'd take you to first…", "My Pujo song this year…"), a pasted anthem, and photos behind liveness verification.
- **No swiping on people.** A short daily set of people whose Pujo syncs with yours, each with the reason and a suggested plan. People respond to a prompt or a plan, not to a face (the lesson of Hinge's prompts [29]).
- **The first date is a plan in public:** the suggested route, starting at a busy pandal before 9 pm.
- **Romance lens is used here and nowhere else**, with explicit consent.
- **No percentage.** Components and a plan only.

## 9. Safety, consent and privacy

Night-time safety is not an abstract concern in Kolkata. The 2024 Reclaim the Night protests [46] were about exactly the streets this product will send people into. Safety is designed in from rung 1, not bolted on at rung 4.

| Area | Rule |
|---|---|
| **Age** | Rungs 3 and 4 are 18+ only, with date of birth plus a liveness selfie; ID-based verification added if abuse requires it. Under-18s never appear in any people-facing feature. |
| **Consent** | Discovery is off by default and separate for friends, plans and matching. Nothing about a person is shown to anyone they haven't connected with, except in a plan they chose to join. |
| **Location** | Never live location, never trails, never "people near you". Plans use zones and time windows; exact meeting points are revealed to accepted members one hour before and are always public landmarks. (The Strava heatmap is the cautionary tale.) |
| **Groups first** | Strangers meet in groups of three to six. One-to-one only in rung 4. |
| **Share my plan** | One tap sends the plan, the members' first names and the route to a trusted contact over WhatsApp, with an "I'm home" check-in. |
| **SOS** | One tap to call 112, India's emergency number, from any plan screen, plus the nearest police assistance booth on the route. |
| **Women's controls** | Women-only plans; who can message me; hide from people I've blocked; no photos in chat for the first 24 hours of a connection. |
| **Moderation** | Report and block on every person and message; human review within 24 hours during Pujo; auto-hide after repeated reports; "Are you sure?"-style nudges on hostile messages [30][32]. |
| **Data** | Match activity and the Romance lens are private, never used for partners or ads, and deleted when a person leaves. |
| **Crowds** | Meeting points avoid the crush zones of viral pandals at peak hours. |
| **Legal** | A grievance officer and response timelines for an intermediary under India's IT Rules; DPDP consent and minors' rules; an explicit code of conduct accepted at opt-in. |
| **Review** | Before rung 3 ships, a safety review with women users and at least one women's safety organisation in Kolkata. |

## 10. Measuring it

| Metric | Guardrail |
|---|---|
| Compare links opened per revealed identity | ≥ 0.4 |
| Friend accepts a compare invite and finishes the quiz | ≥ 30% |
| Squads with five or more members | ≥ 20% of squads |
| Pujo Plans: plans that reach three members | ≥ 50% |
| Reports per 100 plan participants | < 0.5; pause the feature above 1.0 |
| Women's rating of "felt safe" after a plan | ≥ 4.5 out of 5 |
| No-shows | < 20% |

## 11. What not to build

- Swiping on people, or star ratings of people. The existing `/tinder` page swipes on places and rates them with stars; that pattern must never be applied to humans. Rename it (for example *Swipe the City*) and reuse its swipe for the rapid-fire round and for Pandal Swipe.
- A "people near you" view, or anything that shows where a person is.
- A compatibility percentage next to a stranger.
- Matching for under-18s in any form.
- Dating-first marketing. The product is about Pujo; people are something you might find there.
