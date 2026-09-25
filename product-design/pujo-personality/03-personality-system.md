# C. Personality system

How answers become an identity, why the model is built this way, how it was validated, and how it learns from behaviour without losing the person.

The model is real and runnable. It lives in [`model/`](model/): the dimensions, archetypes and questions as JSON, a dependency-free scoring engine (`scoring.mjs`), a simulation (`simulate.mjs`), a calibration script (`calibrate.mjs`) and tests (`model.test.mjs`). Every number in this document comes from running them.

---

## 1. Principles

1. **Interpretable over clever.** Every answer moves named dimensions by a stated amount. Every archetype is a point in the same space with stated weights. Any result can be explained in a sentence.
2. **Playful, not psychological.** This is a cultural identity based on how someone does Pujo. The standard line wherever claims appear: *"A playful Pujo identity built from your answers. Not a psychological test."*
3. **Identity first, taste second.** The archetype is revealed once and stays. Recommendations keep learning underneath it.
4. **Fair by construction.** Someone who answers at random must not be pushed towards any archetype. That was measured and enforced (§6).
5. **Stable.** The same person should get the same result twice. Measured: 97.5% in simulation.
6. **Private by design.** The quiz scores on the phone. Nothing is stored unless the person saves, shares or signs in.

## 2. The fourteen dimensions

Each dimension describes Pujo behaviour on a 0 to 1 scale. None of them is a psychological trait: "Squad size" is how many people you do Pujo with, not extraversion.

| Family | Dimension | বাংলা | Measures | Low | High |
|---|---|---|---|---|---|
| Clock | **Night drive** | রাত | How much of your Pujo happens after 11 pm | Home by ten | Sees sunrise from the wrong side |
| Clock | **Dawn pull** | ভোর | Mahalaya at 4 am, anjali, empty pandals at 6 am | Never seen a pandal before noon | First at the bonedi bari |
| Movement | **Roaming radius** | ঘোরা | How far one Pujo day travels | One para | North, South, Salt Lake and Behala in a night |
| Movement | **Planning** | প্ল্যান | Planned route against drifting | Goes where the night goes | Spreadsheet and Metro timings |
| Movement | **Crowd appetite** | ভিড় | Whether the crush is the point or the problem | Before the crowd, or not at all | The crowd is the Pujo |
| People | **Squad size** | দল | The size of the group | One person | Fifteen and a group chat |
| People | **Roots** | শিকড় | Belonging to a home pandal and taking part in its traditions | A visitor everywhere | On the committee |
| People | **Romance lens** | প্রেম | Pujo as a love story (including romanticising the city) | "Forty pandals left" | "Why I believe in love" |
| Senses | **Food drive** | খাওয়া | How much food shapes the route | Food is fuel | Pandals chosen by the stall next door |
| Senses | **Dhaak energy** | ছন্দ | How the body answers the dhaak | Listens | Dances, asks for the dhunuchi |
| Senses | **Art eye** | শিল্প | Reading a pandal as art | "It's pretty. Next." | Knows the artist before the placard |
| Senses | **Heritage pull** | সাবেকি | Love for the old | Theme only | Crosses the city for an ek-chala protima |
| Self | **Shaaj** | সাজ | Investment in how you look | Sneakers and a tee | Five days, five looks |
| Self | **Spotlight** | আলো | Being seen: dancing, posting, being in the photo | Behind the camera | Centre of the circle |

Full behavioural anchors (low, mid, high) are in [`model/dimensions.json`](model/dimensions.json).

**Why these fourteen.** Every dimension earns its place in one of two ways: it separates at least two archetypes that would otherwise blur (Squad size separates the Night Owl from the Addabaaz; Spotlight separates the Pujo Romantic from the Dhunuchi; Night and Dawn separate the Shiuli from the Para Kid), or it drives a recommendation the product will actually make (Food drive, Crowd appetite, Roaming radius). Night and Dawn are deliberately separate rather than one axis, because some people do both and the Para Kid does a little of each.

**Two sensitive dimensions.** *Roots* includes ritual participation (anjali, arati, bhog), which is cultural practice but can hint at religion. *Romance lens* can hint at relationship status. Both are measured only from the person's own answers, never inferred from behaviour, never visible to others without consent, and never available to partners or advertisers (`partnerTargetable: false` for Roots; Romance is only ever used inside Pujo Match, which is opt-in).

### Preference facets (never scored)

Status (local, home for Pujo, first Pujo, far away), diet, how you get around, a daily budget band, your side of the city, and an age band. They are asked after the reveal and only filter and rank recommendations. Keeping them out of the archetype means an identity can never become a proxy for diet, class, caste or neighbourhood.

## 3. The nine archetypes as vectors

Prototype values (μ) per dimension. Signature dimensions (importance ≥ 1.25) are marked with an asterisk.

| | Night | Dawn | Roam | Plan | Crowd | Squad | Roots | Heritage | Art | Food | Shaaj | Spotlight | Romance | Dhaak |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Night Owl | **0.95\*** | 0.10 | 0.75 | 0.30 | 0.45 | 0.40 | 0.25 | 0.45 | 0.50 | 0.60 | 0.35 | 0.30 | 0.50 | 0.40 |
| Pandal Hunter | 0.55 | 0.50 | **0.95\*** | **0.95\*** | 0.40 | 0.35 | 0.15 | 0.40 | 0.55 | 0.25 | 0.15 | 0.30 | 0.10 | 0.20 |
| Para Kid | 0.60 | 0.55 | **0.10\*** | 0.45 | 0.60 | 0.80 | **0.95\*** | 0.65 | 0.25 | 0.55 | 0.45 | 0.40 | 0.35 | 0.70 |
| Pujo Romantic | 0.55 | 0.35 | 0.45 | 0.40 | 0.30 | **0.10\*** | 0.40 | 0.60 | 0.45 | 0.50 | 0.70 | 0.30 | **0.95\*** | 0.35 |
| Pet Pujari | 0.60 | 0.30 | 0.60 | 0.55 | 0.55 | 0.55 | 0.35 | 0.40 | 0.15 | **0.97\*** | 0.20 | 0.25 | 0.30 | 0.30 |
| Art Kid | 0.40 | 0.45 | 0.65 | 0.65 | 0.20 | 0.25 | 0.15 | 0.45 | **0.97\*** | 0.25 | 0.50 | 0.20 | 0.30 | 0.25 |
| Addabaaz | 0.75 | 0.15 | 0.30 | 0.40 | 0.80 | **0.97\*** | 0.45 | 0.35 | 0.20 | 0.60 | 0.55 | 0.55 | 0.40 | 0.55 |
| Dhunuchi | 0.55 | 0.30 | 0.45 | 0.50 | 0.70 | 0.60 | 0.50 | 0.40 | 0.35 | 0.30 | **0.97\*** | **0.97\*** | 0.50 | 0.85 |
| Shiuli | **0.10\*** | **0.95\*** | 0.40 | 0.55 | 0.10 | 0.20 | 0.50 | **0.95\*** | 0.50 | 0.40 | 0.45 | 0.10 | 0.40 | 0.35 |

Each archetype also has an importance weight (λ) per dimension, from 0.25 (incidental) to 1.75 (defining). Importance lets each archetype be judged mainly on what makes it itself: the Pet Pujari is judged overwhelmingly on food, the Shiuli on dawn, night, heritage and crowds. Full values: [`model/archetypes.json`](model/archetypes.json).

## 4. From answers to a vector

### 4.1 Evidence

Every answer option carries evidence: for each dimension it speaks to, a value (where the answer places the person) and a weight (how strongly). "Obviously. The night's only getting started." is `night 0.95×1.0, roam 0.75×0.5, plan 0.25×0.4`. Authors write evidence in plain, absolute terms in [`model/questions.json`](model/questions.json).

### 4.2 Balanced evidence

The first simulation exposed a structural bias. Quiz answers mostly describe things people *do* ("I dance", "I plan", "I eat"), so nearly every option pushes some dimension upward. A person tapping at random drifted to about 0.6 to 0.7 on every dimension, and whichever archetypes had mid-to-high prototypes collected them: Para Kid took 27% of random respondents, Pujo Romantic 21%, Pandal Hunter 1.6%.

The fix treats each question as a choice. Choosing one answer is also a small signal about the answers not chosen. For each question *q* and each dimension *d* the question talks about:

```
for options that don't mention d:   value = 0.5,  weight = ι × (strongest weight on d in q),   ι = 0.5
shift_qd = Σ_o w_od (v_od − 0.5) / Σ_o w_od
v'_od    = clip(v_od − shift_qd, 0, 1)
```

After this, a uniformly random choice averages to the neutral point on every dimension (checked by a test for every question). Authors still write intuitive values; the engine balances them once.

Example, *night drive* in "It's 1:30 am on Saptami night…", as written and after balancing:

| Answer | As written | Balanced |
|---|---|---|
| a. Obviously. The night's only getting started. | 0.95 × 1.0 | 0.89 × 1.0 |
| b. Only if there's a roll on the way. | 0.70 × 0.5 | 0.64 × 0.5 |
| c. Which one? Send the pin… | (not mentioned) | 0.44 × 0.5 |
| d. Only if all fifteen of us are going… | 0.65 × 0.4 | 0.59 × 0.4 |
| e. Only if it's just the two of us. | 0.65 × 0.3 | 0.59 × 0.3 |
| f. I've been asleep since eleven… | 0.05 × 1.0 | 0.00 × 1.0 |

The planner who answers "send the pin" now nudges *night* slightly below neutral, which is exactly the information that answer contains.

### 4.3 The estimate

Each dimension starts at a neutral prior and moves with the weighted evidence:

```
x_d = (α · 0.5 + Σ w · v) / (α + Σ w)          α = 1 (one answer's worth of prior)
c_d = W_d / (W_d + α)                           confidence: how much evidence d received
```

A multi-select answer (the soundtrack question allows two) splits one answer's weight across the chosen options, so choosing two never counts double.

Because the evidence is balanced, estimates sit around 0.5 for a typical person and move outward with a clear pattern of answers. The strongly nocturnal worked example below ends with night drive at 0.69, which is almost three spreads above typical (the neutral spread per dimension is recorded in `model/calibration.json`).

## 5. From a vector to an archetype

### 5.1 Two views of closeness

**Weighted distance** (is the person near this archetype?):

```
D_k = Σ_d λ_kd c_d (x_d − μ_kd)²  /  Σ_d λ_kd c_d
```

**Centred cosine** (does the person lean in this archetype's direction?):

```
C_k = Σ_d λ_kd c_d (x_d − ½)(μ_kd − ½)  /  √(Σ λ c (x_d − ½)²) · √(Σ λ c (μ_kd − ½)²)
```

Both weight each dimension by the archetype's importance (λ) and by how much evidence the dimension actually received (c). A dimension nobody answered about cannot decide anything.

### 5.2 Score and probability

```
s_k = −D_k / 0.12  +  C_k / 0.6  +  b_k           b_k: calibration offset (§6.3)
P_k = exp(s_k) / Σ_j exp(s_j)
```

Distance rewards being close; cosine rewards leaning the right way; together they recover in-character respondents and avoid the catch-all problem that either one showed alone (§6.2).

### 5.3 The result

| Output | Rule |
|---|---|
| **Primary** | Highest probability |
| **Streak (secondary)** | Second highest, shown when P₂ ≥ 0.12 |
| **Pure** | No secondary above 0.12. Rare; a badge |
| **Band: clear** | P₁ − P₂ ≥ 0.20 |
| **Band: leaning** | Between |
| **Band: close** | P₁ − P₂ < 0.06: trigger the tie-breaker |
| **Because** | The three dimensions that pulled hardest towards the primary: λ × c × closeness to the prototype |

### 5.4 The tie-breaker

When two archetypes are within six points, the engine asks one more question about the dimension that best separates them and that it knows least about:

```
d* = argmax_d  max(λ_1d, λ_2d) · (μ_1d − μ_2d)² · (1 − ½ c_d)
```

Each dimension has one binary tie-breaker (for example `tb_art`: "Read the placard, or skip it?"). On screen it is drama rather than doubt: *"It's close. One more."*

### 5.5 Worked example 1: a clear result with a streak

Answers: the roll on the way (1:30 am); up at Mahalaya because they never slept; no plan; back at 3 am for the queue; the 2 am roll; black for Ashtami; the angle nobody has shot; two or three walkers; Bangla indie and Bangla band; keep eating when the dhaak starts; love language is sharing food; Dashami wherever the gang is; the 3 am lane. Rapid-fire: last Metro, theme, taking the photo, the quiet, the whole city.

| Archetype | Probability | Distance | Cosine |
|---|---|---|---|
| **Night Owl** | **0.438** | 0.034 | 0.89 |
| Pet Pujari | 0.232 | 0.063 | 0.68 |
| Art Kid | 0.099 | 0.091 | 0.19 |
| Addabaaz | 0.083 | 0.086 | 0.19 |
| Pandal Hunter | 0.048 | 0.122 | −0.05 |
| Pujo Romantic | 0.043 | 0.094 | −0.09 |
| Para Kid | 0.029 | 0.113 | −0.36 |
| Shiuli | 0.016 | 0.180 | −0.48 |
| Dhunuchi | 0.013 | 0.154 | −0.65 |

Result: **Night Owl, with a Pet Pujari streak.** Margin 0.205, band *clear*. Because: night drive (0.69), roaming radius, planning (low, 0.35). Reveal copy: "You're a Night Owl, with a Pet Pujari streak. You go where the night goes, and the night goes past a roll stall."

### 5.6 Worked example 2: a close call

Answers: "send the pin"; Mahalaya through the wall; the shortlist of six themes; done on Chaturthi; food is fuel; handloom and a strange ring; eleven more on the list; me and my camera, early; Bangla indie; film the dhaaki's hands; love is a distraction; the ghat on Dashami; the map with forty pins.

Pandal Hunter 0.399, Art Kid 0.387: margin 0.012, band *close*. The engine picks `art` (the dimension that separates them most and is least known) and asks: **"Read the placard, or skip it?"** "Read it" makes this person an Art Kid with a Pandal Hunter streak; "Skip it" makes them a Pandal Hunter with an Art Kid streak. Either way they get both names, in the order they chose.

## 6. Why this model, and how it was validated

### 6.1 Alternatives considered

| Approach | Verdict |
|---|---|
| Direct points per archetype (the BuzzFeed method) | Simple, but produces no vector, so nothing for recommendations, compatibility or learning to build on. |
| Distance to prototypes only | Tested. Without balancing, Para Kid collected 27% of random respondents and Shiuli was recovered only half the time. |
| Cosine only | Tested. Ignores magnitude; before balancing it pushed up to half of random respondents into one archetype. |
| A trained classifier | No labelled data exists, it would be opaque, and it can't be explained to a user. Rejected on principle. |
| **Hybrid distance and cosine, balanced evidence, neutral calibration** | Chosen. Numbers below. |

### 6.2 Simulation results

Synthetic respondents only. The full report, with the coverage matrix, evidence budgets and confusion matrix, is [`model/SIMULATION.md`](model/SIMULATION.md). *p* is the chance a respondent answers in character on each question; otherwise they answer at random. Real people are probably between 0.6 and 0.8.

| Check | Result |
|---|---|
| Recovery at p = 0.9 / 0.75 / 0.6 | 99.9% / 98.8% / 94.2% |
| Weakest archetype at p = 0.6 | Night Owl, 91.4% |
| True archetype in the top two at p = 0.6 | 98.0% |
| Random respondents per archetype | 10.6% to 11.7% (even would be 11.1%) |
| Same primary on retest (p = 0.75) | 97.5% |
| Two-archetype blends: primary is one of the two | 93.5% |
| Two-archetype blends: both surface as primary and streak | 53.9% (lowest for opposites, such as Pujo Romantic + Addabaaz) |
| Tie-breaker shown at p = 0.75 / 0.6 / 0.5 | 3% / 9% / 15% |
| Skipping the rapid-fire round | 98.7% → 98.5% recovery (negligible) |
| Removing the mirror question | 98.7% → 97.7% (p = 0.75); 93.8% → 91.0% (p = 0.6) |

What this proves: the model is coherent. Every archetype is reachable, recoverable and not a catch-all, and results are stable. What it does not prove: that real people feel seen. That is measured at launch (§8).

### 6.3 Calibration

`model/calibrate.mjs` fits a small offset per archetype so that random answering lands evenly across all nine. The offsets are small (−0.19 to +0.16 in score units), and in-character respondents are barely affected. This is a fairness floor, not a target: if the real city turns out to be 20% Night Owl, the model should say so.

## 7. Uncertainty, in words people understand

| Band | What the reveal says |
|---|---|
| Clear, pure | "Pure Shiuli. Not a trace of anything else." |
| Clear, with streak | "You're a Night Owl, with a Pet Pujari streak." |
| Leaning | "You're a Night Owl, and there's a lot of Pet Pujari in you." |
| Close (after the tie-breaker, still close) | "Half Night Owl, half Pet Pujari. Which one is the real you?" The person chooses; the choice is recorded as self-verification. |

A small "How sure we are" line sits under the DNA: *very sure*, *pretty sure*, or *it was close*. No percentages on the identity itself.

The Pujo DNA (the alpona-petal chart of fourteen dimensions) draws each dimension relative to a typical respondent, because balanced estimates cluster around 0.5 and raw values would look timid. `dnaPetals()` in `scoring.mjs` maps each value to a petal length using the neutral mean and spread in `calibration.json`; after 2,000 real results those are replaced by city statistics.

## 8. After launch

| Signal | Use |
|---|---|
| "That's me / Mostly / Not me" after the reveal | The main accuracy measure. Target ≥ 80% "That's me" or "Mostly" overall and ≥ 70% for every archetype. |
| "Not me, I'm more of…" (optional pick) | Shows which archetypes get confused in real life. Feeds prototype adjustments. |
| Distribution | Guardrail: if any archetype exceeds 22% or falls below 5% after 2,000 results, investigate before adjusting. |
| Retake rate and flips | If more than 15% retake, or retakes flip more than 20% of the time, the questions are ambiguous. |
| Close-band share | Real people are messier than simulations; expect 10–20% tie-breakers. Above 25% means the archetypes overlap too much in practice. |

Changes follow one process: edit the JSON, run `simulate.mjs`, run the tests, re-run `calibrate.mjs`, bump the model version, and record why. Results store the model version that produced them.

## 9. Stability and retakes

- The revealed identity is sticky for the season. It changes only when the person retakes the quiz and chooses to keep the new result, or accepts an "evolution" at the end of the season (§10.4).
- Retake: allowed, with the question "Has your Pujo changed?". If the result is the same: "Still a Night Owl." If different: "Last time: Night Owl. Now: Pet Pujari. Keep which?" The history is kept privately.
- Every Mahalaya, returning people are invited to retake: a yearly ritual, like Wrapped.

## 10. Learning from behaviour without losing the person

### 10.1 Two vectors

- **Identity vector *x*** from the quiz. Fixed unless the person retakes or accepts an evolution.
- **Taste vector *y*** from behaviour: what they save, plan, check in at and skip.

Recommendations use a blend. The archetype, the card and the lore always use *x*.

### 10.2 Events

Each item in the recommendation graph (pandal, place, event, route) has a trait vector *t* in the same fourteen dimensions (see [`06-recommendation-graph.md`](06-recommendation-graph.md) §3).

| Event | Weight |
|---|---|
| Checked in | +2.0 |
| Added to a route | +1.5 |
| Saved | +1.0 |
| Shared | +0.8 |
| Won a this-or-that comparison | +0.6 |
| Liked | +0.5 |
| Opened | +0.2 |
| Lost a this-or-that comparison | −0.2 |
| Swiped away in Pandal Swipe | −0.3 |
| Dismissed | −0.5 |
| "Not for me" (with a reason) | −1.0 |

### 10.3 The update

```
y_d = 0.5 + Σ_e w_e · decay(age_e) · (t_{i(e),d} − 0.5)  /  (κ + Σ_e |w_e| · decay(age_e))       κ = 5
decay: half-life 3 days during Pujo, 30 days after
u   = λ · x + (1 − λ) · y
λ   = max(0.5, n₀ / (n₀ + n_eff))                 n₀ = 20, n_eff = Σ |w_e| · decay
```

Identity never falls below half of the recommendation vector. Roots and Romance in *y* move only from explicit actions (saving a bhog listing, adding a date-night route), never from dwell time or clicks.

### 10.4 Evolution, never drift

If behaviour consistently points to a different archetype (the taste vector classifies differently, with a clear margin, over at least thirty meaningful events), MyKolkata doesn't silently change anyone. At the end of the season, in the Pujo recap: *"You came in a Night Owl. You ate like a Pet Pujari. Keep Night Owl, switch, or wear both?"* The person decides.

## 11. What the model will never do

- Use listening timestamps, contacts, the camera roll, location history or anything else the person didn't knowingly give.
- Infer religion, caste, community, sexual orientation, politics, health or sleep patterns.
- Use Roots or Romance for advertising or partner targeting.
- Use any Spotify-derived signal for recommendations of commercial offers (Spotify Developer Terms and Policy; see [`05-music-and-spotify.md`](05-music-and-spotify.md)).
- Claim scientific validity, or show a percentage on someone's identity.
