# D. Question bank

> Generated from [`model/questions.json`](model/questions.json) by `model/render-question-bank.mjs`. Edit the JSON, re-run the script, re-run `model/simulate.mjs`. Never edit this file by hand.

How to read the tables:

- **Evidence** is `dimension value×weight`. The value is where the answer places the person (0 to 1); the weight is how hard it pushes. The engine balances each question automatically (see `03-personality-system.md` §4), so an answer is also a small signal about the answers not chosen.
- **Archetype signal** lists the archetypes an in-character respondent would pick this answer for, strongest first. It is computed from the prototypes, not hand-labelled, so it stays honest when weights change.
- **Strength** is the answer's strongest single push: Strong (0.9 or more), Medium (0.5 or more), Light (below 0.5).

## The flow a person actually sees

| Step | Questions | Time budget |
|---|---|---|
| Core | 13 scenario questions, one per screen | about 9 seconds each, 2 minutes in total |
| Rapid-fire | 5 this-or-that swipes on one screen, skippable | about 15 seconds |
| Tie-breaker | one binary question, only when the top two archetypes are within 6 points | about 3 seconds, shown to a minority |
| After the reveal | 6 optional preference chips (never scored) | about 15 seconds |

Target: reveal in under two and a half minutes from the first tap. The rapid-fire screen is skippable and costs almost nothing when skipped (98.7% to 98.5% recovery at p = 0.75 in simulation). It exists for delight and for shareable badges (Team Sabeki, Last Metro), not for accuracy. The mirror question is the opposite: removing it costs 1 to 4 points.

Order matters. The quiz opens with the most recognisable Pujo dilemma (1:30 am, one last pandal), puts the emotional questions (love, Dashami) near the end when the person is invested, and closes on the mirror question (pick a frame) so the last thing they do is choose an image of themselves.

## Coverage by topic

The brief asked for questions across thirteen topics. Where each is covered:

| Topic | Covered by |
|---|---|
| Pujo behaviour | `q_last_pandal`, `q_plan`, `q_queue`, `q_theme_pandal` |
| Music | `q_soundtrack`, `q_dhaak`; `rf_dance` in reserve |
| Fashion | `q_ashtami_look`, `rf_photo` |
| Food | `q_plate`, plus food answers in `q_last_pandal`, `q_queue`, `q_dhaak`, `q_love`, `q_dashami`; `rf_plate` in reserve |
| Social life | `q_crew`, `q_dashami`, plus squad answers in five other questions; `rf_table` in reserve |
| Romance | `q_love`, plus romance answers in `q_last_pandal`, `q_plate`, `q_ashtami_look`, `q_theme_pandal`, `q_crew` |
| Nightlife | `q_last_pandal`, `q_queue` (the 3 am answer), `rf_metro` |
| Art | `q_theme_pandal`, `rf_theme`, plus art answers in `q_plan`, `q_dhaak`, `q_crew` |
| Tradition | `q_mahalaya`, `q_dashami`, `q_ashtami_look` (laal-paar), `q_plate` (bhog) |
| Nostalgia | `q_mahalaya`, `q_soundtrack` (old Pujo songs), `q_theme_pandal` (ek-chala); `alt_memory` in reserve |
| Exploration | `q_plan`, `rf_para`, `q_dhaak` (keep moving), `q_ashtami_look` (sneakers) |
| Budget | `pref_budget`, after the reveal. Deliberately never scored, so no archetype becomes a class marker |
| Crowd tolerance | `q_queue`, `rf_crush`, plus crowd answers in `q_plan`, `q_crew`, `q_dhaak`, `q_dashami` |

## Core questions

### `q_last_pandal`: It's 1:30 am on Saptami night. Your friends say, 'One last pandal.'

- **Visual:** A lit pandal gate at the end of an empty lane. Wet road, sodium light, one rickshaw parked.
- **Type:** single
- **Measures:** Night drive, Squad size, Planning, Roaming radius, Food drive, Dawn pull, Romance lens, Roots, Art eye, Crowd appetite
- **Why it's here:** Opens on the most recognisable Pujo dilemma. Separates night people from dawn people in one tap, and the reasons people give for staying out (food, squad, quality, romance) split four more archetypes.
- **Could music data reinforce it:** No. Listening timestamps are deliberately not used (see 05-music-and-spotify.md).

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| Obviously. The night's only getting started. | Correct. The lights look better now anyway. | Night drive 0.95×1<br>Roaming radius 0.75×0.5<br>Planning 0.25×0.4 | Night Owl | Strong |
| Only if there's a roll on the way. | Priorities, in the right order. | Food drive 0.9×0.9<br>Night drive 0.7×0.5 | Pet Pujari | Strong |
| Which one? Send the pin. I'll tell you if it's worth it. | Quality control has entered the chat. | Planning 0.9×0.8<br>Roaming radius 0.75×0.4<br>Art eye 0.65×0.4 | Pandal Hunter | Medium |
| Only if all fifteen of us are going. Nobody gets left behind at Maddox. | Head count first. Then pandal. | Squad size 0.95×1<br>Night drive 0.65×0.4<br>Crowd appetite 0.75×0.3 | Addabaaz | Strong |
| Only if it's just the two of us. | The long way home, then. | Romance lens 0.85×0.8<br>Squad size 0.1×0.6<br>Night drive 0.65×0.3 | Pujo Romantic | Medium |
| I've been asleep since eleven. Ashtami anjali is at eight. | Someone has to be awake for the best part of the morning. | Dawn pull 0.9×0.9<br>Night drive 0.05×1<br>Roots 0.7×0.5 | Shiuli | Strong |

### `q_mahalaya`: Mahalaya. 4 am. Mahishasuramardini is on the radio.

- **Visual:** An old radio on a windowsill, blue pre-dawn light, a shiuli branch outside the grille.
- **Type:** single
- **Measures:** Dawn pull, Heritage pull, Roots, Night drive, Squad size, Dhaak energy
- **Why it's here:** The strongest heritage and dawn signal in Bengali culture. Includes an honest 'I hear it through the wall' answer and a newcomer answer, so nobody is forced to pretend.
- **Could music data reinforce it:** Partly. Heavy Rabindrasangeet or devotional listening would support heritage, if a music source is ever connected and cleared.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| I'm up. Eyes closed. It isn't Pujo until I hear that voice. | Birendra Krishna Bhadra, every year, since before any of us. | Dawn pull 0.95×1<br>Heritage pull 0.95×1<br>Roots 0.6×0.3 | Shiuli | Strong |
| I'm up, technically. I never went to sleep. | That counts. Barely. | Night drive 0.9×0.8<br>Dawn pull 0.4×0.3 | Night Owl | Medium |
| I'm at the para already. Someone has to set up the speakers. | The whole para wakes up because of you. | Roots 0.95×1<br>Dawn pull 0.75×0.5<br>Squad size 0.6×0.3<br>Dhaak energy 0.55×0.2 | Para Kid | Strong |
| It plays in the next room. I hear it through the wall and go back to sleep. | Honest. It still counts as hearing it. | Dawn pull 0.2×0.6<br>Heritage pull 0.55×0.3 | Night Owl | Medium |
| Mahalaya? Tell me more. | Short version: this is the morning the countdown starts. | — | None (neutral) | None |

### `q_plan`: Your Pujo plan, as it exists right now:

- **Visual:** A phone with a group chat open, a folded paper map, a Metro smart card.
- **Type:** single
- **Measures:** Planning, Roaming radius, Squad size, Crowd appetite, Roots, Dawn pull, Art eye, Heritage pull, Night drive
- **Why it's here:** Planning style is the cleanest behavioural split between Pandal Hunter, Art Kid, Addabaaz, Shiuli, Night Owl and Para Kid. Every answer is funny, so none feels like the wrong one.
- **Could music data reinforce it:** No.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| A spreadsheet. Tabs for North, South and Salt Lake. Metro timings. | Respect. And concern. | Planning 0.97×1<br>Roaming radius 0.9×0.8 | Pandal Hunter | Strong |
| A shortlist of six pandals whose themes I actually care about. | Curated, not crowded. | Art eye 0.85×0.8<br>Planning 0.7×0.5<br>Crowd appetite 0.3×0.3<br>Roaming radius 0.55×0.3 | Art Kid | Medium |
| A group chat with 23 people, 400 messages and no decisions. | It'll all be decided at 9 pm, outside a Metro station. | Squad size 0.95×0.9<br>Planning 0.25×0.4<br>Crowd appetite 0.7×0.2 | Addabaaz | Strong |
| An alarm for 5 am. The old bonedi baris, before the city wakes up. | The goddess, the thakur dalan and you. Nobody else yet. | Dawn pull 0.92×0.9<br>Heritage pull 0.9×0.8<br>Crowd appetite 0.08×0.5 | Shiuli | Strong |
| Plan? I'll know where I'm going when I get there. | The city will decide. It usually does. | Planning 0.08×0.9<br>Night drive 0.65×0.3<br>Roaming radius 0.6×0.3 | Night Owl | Strong |
| Same as every year: my para, my people, my plastic chair. | The chair has your name on it. Metaphorically. | Roots 0.95×1<br>Roaming radius 0.08×0.8<br>Squad size 0.65×0.3 | Para Kid | Strong |

### `q_queue`: This year's viral replica pandal has a two-kilometre queue.

- **Visual:** A queue curving under barricades and fairy lights, a replica facade glowing in the distance.
- **Type:** single
- **Measures:** Crowd appetite, Planning, Spotlight, Heritage pull, Food drive, Night drive, Roaming radius, Shaaj, Squad size, Dawn pull
- **Why it's here:** Crowd appetite, asked through the one situation every Kolkatan has an opinion on. Also separates strategic avoiders (Hunter), quiet seekers (Shiuli), night timers (Night Owl) and photo seekers (Dhunuchi).
- **Could music data reinforce it:** No.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| Perfect. The crush is half the fun. | You and forty thousand friends. | Crowd appetite 0.95×1<br>Squad size 0.7×0.3<br>Spotlight 0.55×0.3 | Addabaaz | Strong |
| Already done. I went at 11 am on Chaturthi. | Before the barricades went up. Of course. | Planning 0.95×0.9<br>Roaming radius 0.8×0.4<br>Crowd appetite 0.35×0.5 | Pandal Hunter | Strong |
| Hard pass. There's a bonedi bari in North Kolkata with no queue at all. | A thakur dalan and two hundred years of quiet. | Crowd appetite 0.05×1<br>Heritage pull 0.9×0.8<br>Dawn pull 0.6×0.2 | Shiuli | Strong |
| We're here for the stalls outside, not the queue. | The queue is for the pandal. The stalls are for you. | Food drive 0.9×0.8<br>Crowd appetite 0.6×0.3 | Pet Pujari | Medium |
| Worth it if there's a good photo at the end. | Lighting check. Outfit check. Queue check. | Spotlight 0.85×0.7<br>Shaaj 0.7×0.4<br>Crowd appetite 0.6×0.3 | Dhunuchi | Medium |
| I'll come back at 3 am. It'll be empty, and better. | The pandal is a different place after midnight. | Night drive 0.9×0.8<br>Crowd appetite 0.25×0.5<br>Planning 0.4×0.2 | Night Owl | Medium |

### `q_plate`: Pick your Pujo plate.

- **Visual:** Six plates shot from above on a steel table: sal-leaf bhog, a roll in paper, biryani with its potato, phuchka, a steel tumbler of water, a table pushed together for twelve.
- **Type:** image
- **Measures:** Food drive, Squad size, Roots, Romance lens, Night drive, Roaming radius, Heritage pull, Planning
- **Why it's here:** Food is the easiest thing to answer honestly. Each plate carries a time of day, a social setting and a food intensity, not just a cuisine.
- **Could music data reinforce it:** No.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| Khichuri bhog on a sal-leaf plate, sitting on the floor with the para. | Labra, beguni, a little payesh. Nothing tastes like it. | Roots 0.9×0.9<br>Food drive 0.65×0.4<br>Heritage pull 0.65×0.4 | Para Kid | Strong |
| An egg-chicken roll at 2 am, eaten walking. | The official food of the second half of the night. | Night drive 0.9×0.8<br>Food drive 0.7×0.5<br>Roaming radius 0.6×0.2 | Night Owl | Medium |
| A biryani pilgrimage. The aloo is non-negotiable. | Kolkata biryani, as it was meant to be. | Food drive 0.97×1<br>Roaming radius 0.55×0.3 | Pet Pujari | Strong |
| One plate of phuchka, shared. Two people, no talking. | The phuchka-kaku has seen a thousand love stories. | Romance lens 0.9×0.9<br>Food drive 0.6×0.3<br>Squad size 0.15×0.4 | Pujo Romantic | Strong |
| Whatever's closest. Food is fuel. Pandals are the point. | Efficient. Somewhere, a biryani weeps. | Food drive 0.08×0.9<br>Planning 0.75×0.4<br>Roaming radius 0.75×0.3 | Pandal Hunter | Strong |
| Anywhere with a table for twelve. | Pushing three tables together is a Pujo skill. | Squad size 0.95×0.9<br>Food drive 0.65×0.4 | Addabaaz | Strong |

### `q_ashtami_look`: Ashtami morning. What are you wearing?

- **Visual:** An open wardrobe: a saree and a panjabi on hangers, sneakers on the floor, a pair of jhumkas on the shelf.
- **Type:** single
- **Measures:** Shaaj, Romance lens, Spotlight, Heritage pull, Roaming radius, Night drive, Art eye, Roots, Planning, Squad size, Dawn pull
- **Why it's here:** Style investment without asking 'how fashionable are you'. Each outfit also signals heritage, art, roaming, romance or the night.
- **Could music data reinforce it:** No.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| A look I've planned since July. Three more for the next three days. | Five days, five looks. A campaign, not an outfit. | Shaaj 0.97×1<br>Spotlight 0.8×0.6 | Dhunuchi | Strong |
| Laal-paar white, or a crisp white panjabi. Some things you don't redesign. | The original look. It never loses. | Heritage pull 0.85×0.8<br>Roots 0.7×0.5<br>Shaaj 0.6×0.3<br>Dawn pull 0.6×0.2 | Shiuli | Medium |
| Handloom from a small label, thrifted jhumkas, one strange ring. | The strange ring is doing a lot of work. Good. | Art eye 0.75×0.6<br>Shaaj 0.65×0.5<br>Spotlight 0.3×0.3 | Art Kid | Medium |
| Sneakers. Anything I can walk twenty kilometres in. | Your feet will thank you. Your photos won't. | Roaming radius 0.85×0.8<br>Planning 0.65×0.4<br>Shaaj 0.1×0.8 | Pandal Hunter | Medium |
| Something that matches the person I'm going with. | Coordinated, but deniable. | Romance lens 0.9×0.9<br>Shaaj 0.65×0.4<br>Squad size 0.15×0.3 | Pujo Romantic | Strong |
| Black. It's a night look. | Dressed for 2 am, at 10 am. | Night drive 0.85×0.7<br>Shaaj 0.5×0.3 | Night Owl | Medium |

### `q_theme_pandal`: You walk into a pandal built entirely from clay cups. First thing you do?

- **Visual:** A wall of thousands of bhaar cups lit from behind; a small placard with an artist's name.
- **Type:** single
- **Measures:** Art eye, Spotlight, Planning, Heritage pull, Romance lens, Roaming radius, Shaaj, Squad size, Dawn pull
- **Why it's here:** The theme-pandal moment is where the Art Kid, the Dhunuchi, the Hunter, the Shiuli and the Romantic visibly behave differently in the same room.
- **Could music data reinforce it:** No.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| Find the placard. Who made this, and why? | The artist would like to meet you. | Art eye 0.95×1<br>Planning 0.5×0.2 | Art Kid | Strong |
| Find the angle nobody has shot yet. | Somewhere near the floor, probably. | Art eye 0.8×0.7<br>Spotlight 0.2×0.4 | Art Kid | Medium |
| Selfie with it behind me. Content is content. | The cups are the backdrop. You're the point. | Spotlight 0.92×0.9<br>Shaaj 0.6×0.3 | Dhunuchi | Strong |
| Check the time. Eleven more on the list. | Admired, at walking pace. | Planning 0.9×0.8<br>Roaming radius 0.9×0.6<br>Art eye 0.35×0.3 | Pandal Hunter | Medium |
| Honestly? I miss the old ek-chala thakur. | Beautiful, but not the same. You're allowed to say it. | Heritage pull 0.92×0.9<br>Art eye 0.4×0.3<br>Dawn pull 0.55×0.2 | Shiuli | Strong |
| Look for the person I came with. They'd love this. | Seeing it through their eyes. Very you. | Romance lens 0.85×0.8<br>Squad size 0.2×0.3 | Pujo Romantic | Medium |

### `q_crew`: Your ideal Pujo crew:

- **Visual:** Silhouettes at the same pandal gate: one person, a pair, a crowd, a family, a person with a camera.
- **Type:** single
- **Measures:** Squad size, Roots, Dhaak energy, Romance lens, Crowd appetite, Night drive, Roaming radius, Spotlight, Art eye, Dawn pull, Heritage pull
- **Why it's here:** Squad size is the main axis that separates Night Owl from Addabaaz and Romantic from everyone. Family is offered as its own answer so the Para Kid is not mistaken for a party person.
- **Could music data reinforce it:** No.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| One person. The right one. | Pujo for two. | Squad size 0.08×1<br>Romance lens 0.85×0.7 | Pujo Romantic | Strong |
| Two or three who can walk all night without complaining. | A small crew with strong knees. | Squad size 0.35×0.8<br>Night drive 0.7×0.5<br>Roaming radius 0.75×0.5 | Night Owl, Pandal Hunter | Medium |
| The whole gang. Fifteen minimum. Someone always gets lost. | It isn't Pujo until someone's phone dies at Gariahat. | Squad size 0.97×1<br>Crowd appetite 0.7×0.3 | Addabaaz | Strong |
| Family, cousins, and the para aunties who watched me grow up. | They still ask about your exams. You still go. | Roots 0.92×0.9<br>Squad size 0.7×0.4<br>Heritage pull 0.6×0.3 | Para Kid | Strong |
| Just me and my camera, early, before anyone else is up. | The city, before it belongs to anyone. | Squad size 0.05×0.9<br>Art eye 0.65×0.4<br>Dawn pull 0.7×0.4<br>Crowd appetite 0.1×0.3 | Pujo Romantic, Shiuli, Art Kid | Strong |
| Whoever's dancing. I'll find them. | Follow the dhaak. Find your people. | Dhaak energy 0.9×0.8<br>Spotlight 0.75×0.5<br>Squad size 0.7×0.3 | Dhunuchi | Medium |

### `q_soundtrack`: Pick your Pujo soundtrack. Up to two.

- **Visual:** Six cassette-spine tiles, hand-lettered, each with a small sound-wave strip. Optional ten-second preview on tap.
- **Type:** multi, up to 2
- **Measures:** Heritage pull, Dhaak energy, Romance lens, Night drive, Dawn pull, Spotlight, Art eye, Squad size, Crowd appetite
- **Why it's here:** The in-quiz music signal. It replaces a Spotify connection at launch, works for YouTube Music and JioSaavn listeners, and gives the music block of the reveal something real to say.
- **Could music data reinforce it:** Yes. This is the question a connected music source would reinforce, if one is ever cleared. Until then, self-report is the signal.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| Mahishasuramardini, then Rabindrasangeet. | The dawn setting. | Heritage pull 0.95×0.8<br>Dawn pull 0.75×0.5<br>Dhaak energy 0.3×0.2 | Shiuli | Medium |
| Bangla band, loud. Fossils, Chandrabindoo, Cactus. | Loud enough for the whole para. | Squad size 0.7×0.3<br>Night drive 0.6×0.3<br>Dhaak energy 0.65×0.4<br>Heritage pull 0.5×0.2 | Para Kid, Addabaaz | Light |
| The Pujo-y prem playlist. Anupam Roy, Arijit's Bangla songs. | Songs for the walk back. | Romance lens 0.9×0.8 | Pujo Romantic | Medium |
| Dhaak remixes and every Bollywood Pujo song ever made. | Dola re dola, on loop. | Dhaak energy 0.95×0.8<br>Spotlight 0.65×0.4<br>Crowd appetite 0.65×0.3 | Dhunuchi | Medium |
| Whatever's new in Bangla indie and hip-hop. | You'll have a new favourite by Navami. | Art eye 0.65×0.4<br>Night drive 0.65×0.3<br>Heritage pull 0.2×0.3 | Art Kid, Pandal Hunter, Night Owl | Light |
| Old Pujo songs. Hemanta, Manna Dey, R.D. Burman's Bangla albums. | Pujor gaan, the way it used to arrive every year. | Heritage pull 0.9×0.7<br>Romance lens 0.6×0.4 | Shiuli | Medium |

### `q_dhaak`: The dhaak starts. You:

- **Visual:** Close-up of a dhaaki's hands mid-strike, the white plume blurred with motion.
- **Type:** single
- **Measures:** Dhaak energy, Art eye, Squad size, Spotlight, Food drive, Heritage pull, Roots, Roaming radius, Planning, Crowd appetite
- **Why it's here:** The body's answer to the dhaak separates the Dhunuchi (performs), the Para Kid (belongs), the Art Kid (observes), the Addabaaz (gathers), the Pet Pujari (keeps eating) and the Hunter (moves on).
- **Could music data reinforce it:** Partly. Dance-heavy listening would support Dhaak energy, if a music source is ever connected and cleared.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| Dance. Immediately. Somebody hand me a dhunuchi. | Smoke, rhythm, spotlight. You were made for this part. | Dhaak energy 0.97×1<br>Spotlight 0.85×0.7<br>Crowd appetite 0.7×0.2 | Dhunuchi | Strong |
| Stand close. That sound is my whole childhood. | Some sounds are a place. | Heritage pull 0.8×0.6<br>Roots 0.75×0.6<br>Dhaak energy 0.6×0.3 | Para Kid, Shiuli | Medium |
| Film the dhaaki's hands. That's the shot. | The hands, the plume, the blur. Yes. | Art eye 0.85×0.8<br>Dhaak energy 0.45×0.2 | Art Kid | Medium |
| Pull my friends into the circle. | Nobody stands at the edge on your watch. | Squad size 0.9×0.8<br>Dhaak energy 0.8×0.5 | Addabaaz | Medium |
| Keep eating. Nod along. | Multitasking, Pujo-style. | Food drive 0.85×0.7<br>Dhaak energy 0.35×0.3 | Pet Pujari | Medium |
| Two minutes, then keep moving. The city's big. | The dhaak will follow you to the next one anyway. | Roaming radius 0.85×0.6<br>Planning 0.65×0.3<br>Dhaak energy 0.3×0.3 | Pandal Hunter | Medium |

### `q_love`: Pujo and love. Be honest.

- **Visual:** Deliberately ambiguous: two silhouettes against pandal light, or one person alone at a ghat.
- **Type:** single
- **Measures:** Romance lens, Spotlight, Food drive, Roots, Night drive, Planning, Shaaj, Heritage pull, Roaming radius, Squad size
- **Why it's here:** Measures whether Pujo is experienced as a love story, including romanticising the city itself, without asking about relationship status. Every answer is dignified, including 'not interested'.
- **Could music data reinforce it:** Partly, and display-only. Romantic listening can flavour the reveal text; it is never used to infer relationship status or orientation.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| Pujo is literally why I believe in love. | Five days a year, the whole city agrees with you. | Romance lens 0.97×1 | Pujo Romantic | Strong |
| I romanticise the city, not people. The lights, the rain, 3 am. | The city is the love story. Fair. | Night drive 0.75×0.6<br>Romance lens 0.55×0.4<br>Heritage pull 0.55×0.3 | Night Owl, Addabaaz | Medium |
| Love is a distraction. There are forty pandals left. | Focused. Admirable. Slightly terrifying. | Romance lens 0.05×0.9<br>Planning 0.85×0.6<br>Roaming radius 0.8×0.3 | Pandal Hunter | Strong |
| I'm here to be seen. Whatever happens after is a bonus. | Main character energy, Kolkata edition. | Spotlight 0.9×0.8<br>Shaaj 0.75×0.4<br>Romance lens 0.55×0.3 | Dhunuchi | Medium |
| My love language is sharing food. | Half a roll is a declaration. | Food drive 0.9×0.8<br>Romance lens 0.55×0.3 | Pet Pujari | Medium |
| Pujo is for my people. The para is my love story. | Maybe the truest one. | Roots 0.9×0.8<br>Squad size 0.65×0.3<br>Romance lens 0.35×0.3 | Para Kid | Medium |

### `q_dashami`: Dashami. The goddess leaves. Where are you?

- **Visual:** Dusk at the ghat: sindoor-red hands, the water, a procession blurred by motion.
- **Type:** single
- **Measures:** Roots, Spotlight, Squad size, Heritage pull, Crowd appetite, Dhaak energy, Food drive, Shaaj, Night drive, Romance lens, Dawn pull
- **Why it's here:** The emotional close of the quiz. How someone says goodbye to Pujo is one of the most identity-revealing moments of the festival.
- **Could music data reinforce it:** No.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| At the para. Sindoor khela, Bijoya hugs, crying a little. | Asche bochor abar hobe. | Roots 0.95×1<br>Heritage pull 0.65×0.3<br>Squad size 0.65×0.3 | Para Kid | Strong |
| At the ghat, watching the immersion in silence. | The quietest moment of the loudest week. | Heritage pull 0.85×0.7<br>Crowd appetite 0.25×0.5<br>Romance lens 0.5×0.2<br>Dawn pull 0.55×0.2 | Shiuli | Medium |
| In the bhasan procession, dancing like there's no tomorrow. | Every bhasan needs someone like you at the front. | Dhaak energy 0.95×0.9<br>Spotlight 0.8×0.5<br>Crowd appetite 0.85×0.5 | Dhunuchi | Strong |
| Posting the Pujo dump. Twenty slides, captions drafted since Saptami. | Slide 14 is the one. You know it. | Spotlight 0.9×0.8<br>Shaaj 0.7×0.4 | Dhunuchi | Medium |
| Doing the Bijoya rounds. Every relative, every plate of mishti. | Nimki, narkel naru, and one more rosogolla to be polite. | Food drive 0.9×0.8<br>Roots 0.65×0.4 | Pet Pujari | Medium |
| Wherever the gang is. The last night together counts. | Group photo, blurry, perfect. | Squad size 0.9×0.8<br>Night drive 0.65×0.3 | Addabaaz | Medium |

### `q_frame`: One frame from your Pujo. Pick it.

- **Visual:** Nine photographs in a 3 by 3 grid, one per archetype, shot in the house grade. No text on the images.
- **Type:** image
- **Measures:** Squad size, Crowd appetite, Night drive, Food drive, Art eye, Roaming radius, Planning, Roots, Dhaak energy, Romance lens, Spotlight, Dawn pull, Heritage pull, Shaaj
- **Why it's here:** The self-verification question. People accept results that match how they see themselves. It is weighted like any other question (not a veto), so a person's behaviour elsewhere in the quiz can still overrule the frame they picked.
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| An empty lane at 3 am, one pandal still glowing. | Night drive 0.95×0.8<br>Crowd appetite 0.3×0.3<br>Roaming radius 0.7×0.3 | Night Owl | Medium |
| A map with forty pins, and a Metro card. | Planning 0.95×0.8<br>Roaming radius 0.95×0.6 | Pandal Hunter | Medium |
| Plastic chairs, the para pandal, the dhaaki who comes every year. | Roots 0.95×0.8<br>Dhaak energy 0.65×0.3<br>Squad size 0.7×0.3 | Para Kid | Medium |
| Two hands, one plate of phuchka, a rickshaw at dusk. | Romance lens 0.95×0.8<br>Squad size 0.1×0.4 | Pujo Romantic | Medium |
| A table: biryani, a roll, a box of mishti. | Food drive 0.97×0.9 | Pet Pujari | Strong |
| A jute installation, and the artist's name on a placard. | Art eye 0.95×0.9<br>Crowd appetite 0.25×0.3 | Art Kid | Strong |
| Fifteen friends on the grass at Maddox, midnight. | Squad size 0.97×0.8<br>Night drive 0.7×0.3<br>Crowd appetite 0.75×0.3 | Addabaaz | Medium |
| Dhunuchi smoke, a dancer mid-turn, everyone filming. | Spotlight 0.95×0.8<br>Dhaak energy 0.9×0.5<br>Shaaj 0.85×0.4 | Dhunuchi | Medium |
| Shiuli on wet grass, a radio, 5 am. | Dawn pull 0.95×0.8<br>Heritage pull 0.9×0.6<br>Crowd appetite 0.08×0.3 | Shiuli | Medium |

## Rapid-fire (shown)

One screen, five swipes, reusing the swipe interaction that already exists on the `/tinder` page. Each swipe carries about a third of a core question's weight.

### `rf_metro`: Last Metro or first Metro?

- **Type:** binary
- **Measures:** Night drive, Dawn pull
- **Why it's here:** Chronotype, in two words.
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| Last | Night drive 0.85×0.35<br>Dawn pull 0.2×0.35 | Night Owl | Light |
| First | Dawn pull 0.85×0.35<br>Night drive 0.2×0.35 | Shiuli | Light |

### `rf_theme`: Theme or sabeki?

- **Type:** binary
- **Measures:** Heritage pull, Art eye
- **Why it's here:** Kolkata's oldest Pujo argument. Also a shareable badge.
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| Theme | Art eye 0.8×0.35<br>Heritage pull 0.25×0.35 | Art Kid | Light |
| Sabeki | Heritage pull 0.85×0.35<br>Art eye 0.4×0.2 | Shiuli | Light |

### `rf_photo`: In the photo, or taking it?

- **Type:** binary
- **Measures:** Spotlight, Shaaj, Art eye
- **Why it's here:** Separates the Dhunuchi (in front of the lens) from the Art Kid (behind it).
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| In it | Spotlight 0.85×0.35<br>Shaaj 0.7×0.2 | Dhunuchi | Light |
| Taking it | Spotlight 0.2×0.35<br>Art eye 0.7×0.2 | Art Kid | Light |

### `rf_crush`: The crush or the quiet?

- **Type:** binary
- **Measures:** Crowd appetite
- **Why it's here:** A second crowd reading, since only one core question measures it directly.
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| The crush | Crowd appetite 0.9×0.35 | Addabaaz, Dhunuchi | Light |
| The quiet | Crowd appetite 0.1×0.35 | Shiuli | Light |

### `rf_para`: Your para, or the whole city?

- **Type:** binary
- **Measures:** Roaming radius, Roots
- **Why it's here:** Roots against roaming.
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| My para | Roots 0.85×0.35<br>Roaming radius 0.15×0.35 | Para Kid | Light |
| The whole city | Roaming radius 0.85×0.35<br>Roots 0.25×0.2 | Pandal Hunter, Night Owl | Light |

## Rapid-fire (in reserve)

Swap in for A/B tests, or next season to keep the quiz fresh for people retaking it.

### `rf_table`: Table for two, or table for twelve?

- **Type:** binary
- **Measures:** Squad size, Romance lens
- **Why it's here:** Squad size. Held in reserve for the rapid round.
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| Two | Squad size 0.15×0.35<br>Romance lens 0.7×0.2 | Pujo Romantic | Light |
| Twelve | Squad size 0.9×0.35 | Addabaaz | Light |

### `rf_plate`: One more pandal, or one more plate?

- **Type:** binary
- **Measures:** Food drive, Roaming radius
- **Why it's here:** Roaming against food. Held in reserve.
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| Pandal | Roaming radius 0.8×0.35<br>Food drive 0.3×0.35 | Pandal Hunter | Light |
| Plate | Food drive 0.85×0.35<br>Roaming radius 0.4×0.2 | Pet Pujari | Light |

### `rf_dance`: Dance, or watch?

- **Type:** binary
- **Measures:** Dhaak energy, Spotlight
- **Why it's here:** Dhaak energy. Held in reserve.
- **Could music data reinforce it:** Partly.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| Dance | Dhaak energy 0.9×0.35<br>Spotlight 0.7×0.2 | Dhunuchi | Light |
| Watch | Dhaak energy 0.25×0.35 | Pandal Hunter | Light |

## Tie-breakers

Shown only when the two leading archetypes are within the tie margin. The engine picks the dimension that best separates those two archetypes and that it knows least about, then asks the matching question below. On screen it is framed as drama, not doubt: "It's close. One more."

| Dimension | Question | Answers |
|---|---|---|
| Night drive | It's 2 am. Are you out, or asleep? | Out / Asleep |
| Dawn pull | Mahalaya at 4 am. Alarm on, or alarm off? | Alarm on / Alarm off |
| Roaming radius | Forty pandals, or four? | Forty / Four |
| Planning | Spreadsheet, or vibes? | Spreadsheet / Vibes |
| Crowd appetite | The crush, or the quiet? | The crush / The quiet |
| Squad size | Table for two, or table for twelve? | Two / Twelve |
| Roots | Your para, or the whole city? | My para / The whole city |
| Heritage pull | Sabeki, or theme? | Sabeki / Theme |
| Art eye | Read the placard, or skip it? | Read it / Skip it |
| Food drive | One more pandal, or one more plate? | Pandal / Plate |
| Shaaj | Outfit planned, or outfit happened? | Planned / Happened |
| Spotlight | In the photo, or behind it? | In it / Behind it |
| Romance lens | Pujo with one person, or Pujo with everyone? | One person / Everyone |
| Dhaak energy | When the dhaak starts: dance, or watch? | Dance / Watch |

## Alternates

Fully weighted replacements for rotation and A/B tests. Keep the core flow fixed for launch so every result is comparable; rotate from the second week once the calibration has real data.

### `alt_memory`: Which Pujo memory hits hardest?

- **Type:** single
- **Measures:** Heritage pull, Night drive, Squad size, Art eye, Roots, Roaming radius, Shaaj, Romance lens, Crowd appetite
- **Why it's here:** Nostalgia without asking about age. Swap in for q_mahalaya in A/B tests or next season.
- **Could music data reinforce it:** No.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| A cap-gun and a balloon from the mela. | Every para kid's first Pujo. | Heritage pull 0.8×0.6<br>Roots 0.7×0.5 | Shiuli, Para Kid | Medium |
| New shoes, and the blister by Saptami. | Pujo'r notun juto. A rite of passage. | Roaming radius 0.75×0.5<br>Shaaj 0.6×0.4 | Night Owl, Pandal Hunter | Medium |
| Navami night: the lights, not wanting to go home. | Ore Nabami nishi, na hoiyo re obosan. | Night drive 0.85×0.7<br>Romance lens 0.55×0.3 | Night Owl | Medium |
| Reading the Pujabarshiki under the fan. | Feluda, a fan, and a whole afternoon. | Heritage pull 0.9×0.8<br>Squad size 0.2×0.3<br>Crowd appetite 0.2×0.3 | Shiuli | Medium |
| The year we lost half the group at Maddox and found them at 3 am. | Legendary. Still told every year. | Squad size 0.9×0.8<br>Night drive 0.7×0.4 | Addabaaz | Medium |
| The first theme pandal that stopped me in my tracks. | The day Pujo became art. | Art eye 0.9×0.8 | Art Kid | Medium |

### `alt_rain`: It rains on Saptami. Properly.

- **Type:** single
- **Measures:** Planning, Romance lens, Roaming radius, Food drive, Shaaj, Squad size, Night drive, Art eye, Spotlight, Roots
- **Why it's here:** Pujo rain is universal and funny. Useful as a replacement for q_queue, and for the rain-mode recommendations.
- **Could music data reinforce it:** No.

| Answer | Reaction line (shown after the tap) | Evidence | Archetype signal | Strength |
|---|---|---|---|---|
| Keep going. Pandals look best wet. | Reflections everywhere. Worth the socks. | Night drive 0.7×0.4<br>Art eye 0.65×0.4<br>Roaming radius 0.7×0.4 | Night Owl, Pandal Hunter, Art Kid | Light |
| Re-route everything by Metro in ninety seconds. | Contingency plan B, activated. | Planning 0.95×0.9<br>Roaming radius 0.8×0.4 | Pandal Hunter | Strong |
| Chai and adda under the pandal until it stops. | Rain is just more adda time. | Squad size 0.85×0.7<br>Roots 0.6×0.3 | Addabaaz | Medium |
| Khichuri weather. I'm eating. | The correct response to rain, historically. | Food drive 0.9×0.8 | Pet Pujari | Medium |
| Rain, Pujo, one umbrella for two. Cinema. | You planned the rain. Admit it. | Romance lens 0.95×0.9 | Pujo Romantic | Strong |
| My hair. My outfit. My plans. | Mourned. Then re-styled. | Shaaj 0.9×0.8<br>Spotlight 0.7×0.4 | Dhunuchi | Medium |

### `alt_phone`: Your phone at the end of Navami:

- **Type:** single
- **Measures:** Spotlight, Food drive, Planning, Squad size, Night drive, Roaming radius, Roots, Art eye, Shaaj, Crowd appetite, Heritage pull
- **Why it's here:** A playful behavioural recap question. Good for the post-Pujo 'evolution' check-in.
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| 3% battery. 400 photos of lights. | Night drive 0.85×0.6<br>Art eye 0.6×0.4 | Night Owl | Medium |
| A map with 38 pins. | Planning 0.9×0.8<br>Roaming radius 0.9×0.6 | Pandal Hunter | Medium |
| Nine new numbers saved. | Squad size 0.9×0.8<br>Crowd appetite 0.7×0.3 | Addabaaz | Medium |
| Screen time: eleven minutes. I was busy being there. | Roots 0.75×0.5<br>Spotlight 0.1×0.6<br>Heritage pull 0.6×0.3 | Shiuli, Para Kid | Medium |
| One reel, fourteen drafts. | Spotlight 0.9×0.8<br>Shaaj 0.75×0.4 | Dhunuchi | Medium |
| Photos of food. Only food. | Food drive 0.95×0.9 | Pet Pujari | Strong |

### `alt_detour`: A free afternoon between pandals. Pick a detour.

- **Type:** single
- **Measures:** Heritage pull, Food drive, Roots, Romance lens, Night drive, Art eye, Squad size, Crowd appetite, Roaming radius, Planning
- **Why it's here:** Maps directly to year-round Kolkata places, so it doubles as a seed for the post-Pujo identity.
- **Could music data reinforce it:** No.

| Answer | Evidence | Archetype signal | Strength |
|---|---|---|---|
| College Street, and a table at Coffee House. | Heritage pull 0.85×0.6<br>Squad size 0.6×0.4 | Shiuli | Medium |
| Kumartuli lanes, to see where the goddess was made. | Art eye 0.85×0.7<br>Heritage pull 0.7×0.4 | Art Kid | Medium |
| Park Circus, for kebabs. | Food drive 0.95×0.9<br>Roaming radius 0.6×0.2 | Pet Pujari | Strong |
| Prinsep Ghat at sunset. Not talking. | Romance lens 0.9×0.8<br>Crowd appetite 0.3×0.3 | Pujo Romantic | Medium |
| Home, for a nap. Tonight is long. | Night drive 0.9×0.8<br>Planning 0.6×0.2 | Night Owl | Medium |
| The para. Someone needs help with the bhog. | Roots 0.95×0.9 | Para Kid | Strong |

## After the reveal: preference chips (never scored)

Asked after the person has their identity, framed as "Tune your recommendations". They filter and rank recommendations and set the status badge. They never touch the archetype, so an identity can never become a proxy for diet, budget, class or neighbourhood.

| Question | Options | Used for |
|---|---|---|
| Where are you this Pujo? | Here, like every year / Coming home for Pujo / My first Pujo in Kolkata / Far away, watching | Status badge (Homecomer, First Pujo, Far away). Homecomers get compressed routes; far-away users get the live and watch-from-anywhere layer. |
| What do you eat? | Veg / Veg, and eggs / Everything / Jain / Skip | Hard filter on food recommendations. |
| How do you get around? | On foot / Metro / Cabs / Bike or scooter / Whatever's moving | Route shape: walking clusters, Metro-first routes, or cab-friendly hops. |
| A day of Pujo, food and travel, costs you about: | Under ₹500 / ₹500 to ₹1,500 / ₹1,500 to ₹3,000 / More / Skip | Ranking only, never a hard filter unless the person asks. Optional. |
| Your side of the city: | North / Central / South / Salt Lake or New Town / Behala / Dum Dum and the north suburbs / Howrah / Somewhere else | Starting point for routes. Coarse zones only; never a precise location. |
| Your age: | Under 18 / 18 to 21 / 22 to 25 / 26 to 30 / Over 30 | Age gate. Under 18: full reveal and a downloadable card, nothing stored, no Pujo Match, no personalised ads (DPDP Act, s.9). |

## Retired during design

- **"A list of places to eat. The pandals are whatever's next door."** (from `q_plan`). The best line in the quiz, but the Pet Pujari already had six strong homes and the Shiuli had none in that question; simulation showed Shiuli collapsing into Para Kid without a dawn answer there. Use the line in Pet Pujari marketing instead.
- **"Me and my camera."** (from `q_crew`). Merged into "Just me and my camera, early, before anyone else is up." so the Shiuli and the Art Kid share a solitary answer instead of the Shiuli being forced into the family answer.

