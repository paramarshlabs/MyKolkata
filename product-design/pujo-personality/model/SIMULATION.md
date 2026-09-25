# Pujo Personality model: simulation report

Model 2026.1. 18 questions in the flow (13 core + 5 rapid-fire), plus the tie-breaker when needed. 3000 synthetic respondents per cell, fixed seed.

Synthetic respondents only. This checks that the model is coherent: every archetype is reachable, recoverable from in-character answers, and none of them is a catch-all. It does not check that real people feel seen. That is measured at launch with the "That's me" button.

## 1. Coverage: the answer each archetype would give

| Question | Night Owl | Pandal Hunter | Para Kid | Pujo Romantic | Pet Pujari | Art Kid | Addabaaz | Dhunuchi | Shiuli |
|---|---|---|---|---|---|---|---|---|---|
| q_last_pandal | a (2.27) | c* (1.60) | d* (0.90) | e (1.83) | b (1.55) | c* (0.61) | d* (2.12) | d* (0.43) | f (2.49) |
| q_mahalaya | b* (1.20) | b* (0.18) | c* (1.89) | d* (0.24) | b* (0.22) | d* (0.13) | b* (0.50) | c* (0.27) | a (3.12) |
| q_plan | e* (0.77) | a (2.52) | f (2.81) | b* (0.36) | e* (0.30) | b* (1.59) | c* (1.70) | c* (0.34) | d (2.83) |
| q_queue | f (1.35) | b* (2.11) | a* (0.38) | c* (0.43) | d (1.27) | b* (0.58) | a* (0.92) | e (1.25) | c* (2.07) |
| q_plate | b (1.42) | e* (1.08) | a* (1.58) | d (1.73) | c (1.89) | e* (0.58) | f (1.69) | e* (0.33) | a* (0.38) |
| q_ashtami_look | f* (0.89) | d* (1.74) | b* (0.76) | e (1.82) | d* (0.60) | c (0.86) | f* (0.49) | a (2.09) | b* (1.25) |
| q_theme_pandal | d* (0.35) | d* (1.98) | e* (0.41) | f (1.26) | d* (0.32) | a (1.75) | c* (0.18) | c* (1.33) | e* (1.39) |
| q_crew | b* (1.23) | b* (1.03) | d (1.64) | a (2.04) | b* (0.49) | e* (0.89) | c (1.93) | f (1.26) | e* (1.14) |
| q_soundtrack | b* (0.29) | e* (0.33) | b* (0.74) | c (1.08) | b* (0.27) | e* (0.36) | b* (0.59) | d (1.06) | a (1.70) |
| q_dhaak | f* (0.61) | f* (1.02) | b* (0.93) | b* (0.26) | e (1.00) | c (1.09) | d (1.33) | a (1.71) | b* (0.82) |
| q_love | b* (0.78) | c* (1.64) | f* (1.31) | a (1.44) | e (1.24) | c* (0.40) | b* (0.56) | d (1.44) | f* (0.17) |
| q_dashami | b* (0.30) | b* (0.35) | a (1.81) | b* (0.46) | e (1.24) | b* (0.44) | f (1.38) | c (1.48) | b* (1.29) |
| q_frame | night_owl (1.58) | pandal_hunter (2.10) | para_kid (1.58) | pujo_romantic (1.70) | pet_pujari (1.57) | art_kid (1.71) | addabaaz (1.80) | dhunuchi (2.06) | shiuli (2.30) |
| rf_metro | a* (0.70) | a* (0.11) | a* (0.18) | a* (0.13) | a* (0.16) | b* (0.12) | a* (0.37) | a* (0.11) | b* (0.77) |
| rf_theme | a* (0.09) | a* (0.15) | b* (0.17) | b* (0.13) | b* (0.08) | a* (0.46) | b* (0.06) | a* (0.07) | b* (0.46) |
| rf_photo | b* (0.10) | b* (0.14) | b* (0.06) | b* (0.16) | b* (0.06) | b* (0.42) | a* (0.11) | a* (0.54) | b* (0.24) |
| rf_crush | b* (0.05) | b* (0.10) | a* (0.07) | b* (0.11) | a* (0.03) | b* (0.21) | a* (0.21) | a* (0.16) | b* (0.35) |
| rf_para | b* (0.38) | b* (0.54) | a* (0.89) | a* (0.08) | b* (0.13) | b* (0.19) | a* (0.20) | a* (0.06) | a* (0.14) |

Cells show the option an in-character respondent picks and its alignment score. `*` means another archetype picks the same option. Strong homes (alignment above 0.6) per archetype:

Night Owl 11, Pandal Hunter 10, Para Kid 12, Pujo Romantic 8, Pet Pujari 8, Art Kid 7, Addabaaz 8, Dhunuchi 9, Shiuli 12.

## 2. Evidence budget per dimension

Maximum and average weight each dimension can receive across the flow. A dimension with a thin budget is measured weakly and should not carry an archetype on its own.

| Dimension | Max possible | Average (uniform answers) |
|---|---|---|
| night | 7.25 | 1.93 |
| dawn | 5.65 | 1.50 |
| roam | 5.75 | 1.63 |
| plan | 6.00 | 1.39 |
| crowd | 3.75 | 1.65 |
| squad | 8.00 | 2.21 |
| roots | 8.35 | 1.72 |
| heritage | 8.35 | 1.99 |
| art | 5.85 | 1.43 |
| feast | 5.90 | 1.35 |
| shaaj | 3.10 | 0.94 |
| spotlight | 6.55 | 1.59 |
| romance | 6.90 | 1.54 |
| rhythm | 4.20 | 1.08 |

## 3. Recovery: do in-character respondents get their own archetype?

`p` is the chance a respondent answers in character on each question; otherwise they answer at random. Real people are somewhere around p = 0.6 to 0.8.

| Archetype | p = 0.9 | p = 0.75 | p = 0.6 | top-2 at 0.6 | tie-breaker shown at 0.75 | pure at 0.75 |
|---|---|---|---|---|---|---|
| Night Owl | 99.8% | 97.8% | 91.4% | 96.9% | 4.2% | 16.5% |
| Pandal Hunter | 100.0% | 99.1% | 95.4% | 98.9% | 1.1% | 1.1% |
| Para Kid | 99.9% | 99.2% | 95.5% | 99.0% | 3.2% | 1.7% |
| Pujo Romantic | 100.0% | 99.1% | 94.0% | 97.2% | 2.5% | 5.1% |
| Pet Pujari | 99.9% | 98.0% | 91.9% | 96.9% | 5.6% | 2.3% |
| Art Kid | 99.9% | 98.8% | 94.0% | 98.9% | 3.8% | 0.4% |
| Addabaaz | 100.0% | 99.2% | 95.2% | 98.3% | 1.5% | 1.2% |
| Dhunuchi | 100.0% | 98.5% | 93.3% | 96.8% | 3.8% | 4.4% |
| Shiuli | 100.0% | 99.6% | 97.4% | 99.2% | 0.8% | 23.5% |
| **All** | **99.9%** | **98.8%** | **94.2%** | **98.0%** | | |

### Confusion matrix at p = 0.75 (rows: who they are, columns: what they got)

| | Night Owl | Pandal Hunter | Para Kid | Pujo Romantic | Pet Pujari | Art Kid | Addabaaz | Dhunuchi | Shiuli |
|---|---|---|---|---|---|---|---|---|---|
| Night Owl | 97.8% | 1.5% | 0.0% | 0.1% | 0.3% | 0.3% | 0.0% | 0.0% | 0.0% |
| Pandal Hunter | 0.2% | 99.1% | 0.0% | 0.0% | 0.0% | 0.6% | 0.0% | 0.0% | 0.0% |
| Para Kid | 0.0% | 0.0% | 99.2% | 0.0% | 0.1% | 0.0% | 0.7% | 0.0% | 0.0% |
| Pujo Romantic | 0.1% | 0.0% | 0.1% | 99.1% | 0.0% | 0.4% | 0.0% | 0.0% | 0.3% |
| Pet Pujari | 1.7% | 0.2% | 0.0% | 0.0% | 98.0% | 0.0% | 0.2% | 0.0% | 0.0% |
| Art Kid | 0.0% | 1.0% | 0.0% | 0.0% | 0.0% | 98.8% | 0.0% | 0.0% | 0.1% |
| Addabaaz | 0.1% | 0.0% | 0.2% | 0.0% | 0.0% | 0.0% | 99.2% | 0.5% | 0.0% |
| Dhunuchi | 0.0% | 0.0% | 0.2% | 0.0% | 0.0% | 0.0% | 1.3% | 98.5% | 0.0% |
| Shiuli | 0.0% | 0.0% | 0.3% | 0.1% | 0.0% | 0.0% | 0.0% | 0.0% | 99.6% |

## 4. Random respondents: is any archetype a catch-all?

People who tap at random should scatter across all nine. If one archetype collects them, it is too central and needs a narrower prototype or a negative bias.

| Archetype | Share of random respondents |
|---|---|
| Night Owl | 10.6% |
| Pandal Hunter | 10.9% |
| Para Kid | 11.4% |
| Pujo Romantic | 11.3% |
| Pet Pujari | 11.7% |
| Art Kid | 10.6% |
| Addabaaz | 11.1% |
| Dhunuchi | 11.7% |
| Shiuli | 10.6% |

Tie-breaker shown to 41.0% of random respondents; 0.8% got a pure result.

## 5. Stability: same person, taken twice

Each synthetic person answers twice with independent noise at p = 0.75. Personality tests built on hard cut-offs are notorious for flipping on retest; this checks ours does not.

Same primary on retest: **97.5%**.

## 6. Blends: people who are two things at once

Half their answers come from one archetype, half from another (p = 0.85 in character). A good model puts both archetypes in the primary and secondary slots.

Primary is one of the two: **93.5%**. Both appear as primary and secondary: **53.9%**.

Hardest blends to resolve (both-slot rate):

- Pujo Romantic + Addabaaz: 5.3%
- Addabaaz + Shiuli: 8.0%
- Pet Pujari + Dhunuchi: 12.3%
- Pandal Hunter + Para Kid: 16.5%
- Art Kid + Addabaaz: 17.6%

## 7. Settings used

```json
{
  "priorMean": 0.5,
  "priorStrength": 1,
  "centerEvidence": true,
  "implicitWeight": 0.5,
  "prototypeFrame": "absolute",
  "method": "hybrid",
  "temperature": 0.12,
  "cosineTemperature": 0.6,
  "secondaryMin": 0.12,
  "tieMargin": 0.06,
  "clearMargin": 0.2,
  "bias": {
    "night_owl": -0.016,
    "pandal_hunter": 0.07,
    "para_kid": 0,
    "pujo_romantic": -0.192,
    "pet_pujari": -0.07,
    "art_kid": 0.137,
    "addabaaz": -0.092,
    "dhunuchi": 0.003,
    "shiuli": 0.159
  },
  "n": 3000
}
```
