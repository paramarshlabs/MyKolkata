import dimensionsDoc from './model/dimensions.json'
import archetypesDoc from './model/archetypes.json'
import questionsDoc from './model/questions.json'
import calibrationDoc from './model/calibration.json'
import type { Archetype, ArchetypeId, DimensionDef, DimensionId, Neutral, Question } from './types'

/* Typed views over the model JSON. Everything the quiz, the reveal and the
   cards know about the model comes through here. */

export const MODEL_VERSION: string = archetypesDoc.version

export const DIMENSIONS = dimensionsDoc.dimensions as unknown as DimensionDef[]
export const DIMENSION_IDS = DIMENSIONS.map((d) => d.id) as DimensionId[]

export const DIMENSION_FAMILIES = dimensionsDoc.families as { id: string; name: string; dims: DimensionId[] }[]

export const ARCHETYPES = archetypesDoc.archetypes as unknown as Archetype[]
export const ARCHETYPE_IDS = ARCHETYPES.map((a) => a.id) as ArchetypeId[]

const pairLists = archetypesDoc.pairs as unknown as Record<'kin' | 'complement' | 'spark', [ArchetypeId, ArchetypeId][]>
export const PAIR_KINDS = { kin: pairLists.kin, complement: pairLists.complement, spark: pairLists.spark }

export const SQUAD_ROLES = archetypesDoc.squadRoles as { id: string; dim: DimensionId; name: string; line: string }[]

export const QUESTIONS = questionsDoc.questions as unknown as Question[]
export const QUESTION_INDEX: ReadonlyMap<string, Question> = new Map(QUESTIONS.map((q) => [q.id, q]))

const byId = (id: string) => {
  const q = QUESTION_INDEX.get(id)
  if (!q) throw new Error(`Unknown question ${id}`)
  return q
}

export const CORE_FLOW: Question[] = questionsDoc.flow.core.map(byId)
export const RAPID_FLOW: Question[] = questionsDoc.flow.rapid.map(byId)
export const PREFERENCE_FLOW: Question[] = questionsDoc.flow.preferences.map(byId)

export const CALIBRATION = calibrationDoc as unknown as { bias: Record<ArchetypeId, number>; neutral: Neutral }

const ARCHETYPE_INDEX = new Map(ARCHETYPES.map((a) => [a.id, a]))

export function isArchetypeId(value: unknown): value is ArchetypeId {
  return typeof value === 'string' && ARCHETYPE_INDEX.has(value as ArchetypeId)
}

export function getArchetype(id: ArchetypeId): Archetype {
  const a = ARCHETYPE_INDEX.get(id)
  if (!a) throw new Error(`Unknown archetype ${id}`)
  return a
}

export function getDimension(id: DimensionId): DimensionDef {
  const d = DIMENSIONS.find((x) => x.id === id)
  if (!d) throw new Error(`Unknown dimension ${id}`)
  return d
}
