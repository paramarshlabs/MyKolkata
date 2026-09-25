/* The Pujo Personality's shared types. The model's source of truth is the JSON
   in ./model (copied from product-design/pujo-personality/model, kept in sync
   by tests/pujoPersonalityModel.test.mjs). */

export type DimensionId =
  | 'night' | 'dawn' | 'roam' | 'plan' | 'crowd' | 'squad' | 'roots'
  | 'heritage' | 'art' | 'feast' | 'shaaj' | 'spotlight' | 'romance' | 'rhythm'

export type ArchetypeId =
  | 'night_owl' | 'pandal_hunter' | 'para_kid' | 'pujo_romantic' | 'pet_pujari'
  | 'art_kid' | 'addabaaz' | 'dhunuchi' | 'shiuli'

export type Vector = Record<DimensionId, number>

/* [value, weight]: where an answer places someone on a dimension, and how hard it pushes */
export type Evidence = Partial<Record<DimensionId, [number, number]>>

export type QuestionOption = {
  id: string
  text: string
  reaction?: string
  evidence?: Evidence
  flags?: string[]
}

export type QuestionBlock = 'core' | 'rapid' | 'tiebreak' | 'alternate' | 'preference'

export type Question = {
  id: string
  block: QuestionBlock
  type: 'single' | 'multi' | 'image' | 'binary'
  maxSelect?: number
  prompt: string
  visual?: string
  rationale?: string
  dim?: DimensionId
  facet?: string
  note?: string
  options: QuestionOption[]
}

export type DimensionDef = {
  id: DimensionId
  name: string
  bn: string
  measures: string
  low: string
  mid: string
  high: string
  partnerTargetable: boolean
}

export type Archetype = {
  id: ArchetypeId
  name: string
  bn: string
  tagline: string
  clock: string
  sigil: string
  cardGround: string
  cardAccent: string
  prototype: Vector
  importance: Vector
}

export type Answer = { questionId: string; optionIds: string[] }

export type Estimate = {
  value: Vector
  mass: Vector
  confidence: Vector
  flags: string[]
}

export type RankedRow = { id: ArchetypeId; distance: number; cosine: number; score: number; p: number }

export type Band = 'clear' | 'leaning' | 'close'

export type Classification = {
  primary: ArchetypeId
  secondary: ArchetypeId | null
  pure: boolean
  margin: number
  needsTiebreak: boolean
  band: Band
  ranked: RankedRow[]
}

export type Tiebreak = { dim: DimensionId; questionId: string; gain: number }

export type Because = { dim: DimensionId; weight: number; value: number }

export type PujoResult = Classification & {
  modelVersion: string
  tiebreak: Tiebreak | null
  vector: Vector
  confidence: Vector
  flags: string[]
  because: Because[]
}

export type Neutral = Record<DimensionId, { mean: number; sd: number }>
