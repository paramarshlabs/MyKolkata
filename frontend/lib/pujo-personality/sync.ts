import { CALIBRATION, getArchetype } from './config'
import type { ArchetypeId, DimensionId, Vector } from './types'

/*
 * Pujo Sync: how much of one Pujo night two people would both enjoy.
 * Not chemistry, not compatibility, not a prediction of anything else
 * (see product-design/pujo-personality/07-pujo-match.md §3).
 *
 * Five kinds of fit, each from a few dimensions. Each person's satisfaction
 * weights the dimensions their own archetype cares about; the two are combined
 * with a geometric mean so a match has to work both ways.
 */

export type SyncComponent = 'clock' | 'route' | 'plate' | 'scene' | 'company'

export const SYNC_COMPONENTS: Record<SyncComponent, { label: string; dims: DimensionId[] }> = {
  clock: { label: 'Clock', dims: ['night', 'dawn'] },
  route: { label: 'Route', dims: ['roam', 'plan', 'crowd'] },
  plate: { label: 'Plate', dims: ['feast'] },
  scene: { label: 'Scene', dims: ['art', 'heritage', 'rhythm', 'spotlight', 'shaaj'] },
  company: { label: 'Company', dims: ['squad', 'roots'] },
}

export type Person = { primary: ArchetypeId; vector: Vector }

/* How far apart two people can be on a dimension before it counts as no overlap at all. */
export const SPREAD_MULTIPLIER = 3.5

function similarity(a: Vector, b: Vector, d: DimensionId): number {
  const spread = (CALIBRATION.neutral[d]?.sd ?? 0.07) * SPREAD_MULTIPLIER
  return Math.min(1, Math.max(0, 1 - Math.abs(a[d] - b[d]) / spread))
}

function satisfaction(of: Person, other: Person, dims: DimensionId[]): number {
  const importance = getArchetype(of.primary).importance
  let num = 0
  let den = 0
  for (const d of dims) {
    num += importance[d] * similarity(of.vector, other.vector, d)
    den += importance[d]
  }
  return den > 0 ? num / den : 0
}

function mutual(a: Person, b: Person, dims: DimensionId[]): number {
  return Math.sqrt(satisfaction(a, b, dims) * satisfaction(b, a, dims))
}

const ALL: DimensionId[] = Object.values(SYNC_COMPONENTS).flatMap((c) => c.dims)

export type Sync = {
  match: number
  components: Record<SyncComponent, number>
  words: Record<SyncComponent, string>
}

/* "You" is the person reading; "they" is the friend. */
function word(component: SyncComponent, score: number, you: Vector, them: Vector): string {
  const close = score >= 0.72
  const near = score >= 0.45
  switch (component) {
    case 'clock':
      if (close) return 'The same hours.'
      if (near) return 'Close enough on the clock.'
      return you.night >= them.night ? "You're out later. They're up earlier." : "They're out later. You're up earlier."
    case 'route':
      if (close) return 'You would take the same route.'
      if (near) return 'Routes that fit together.'
      return Math.abs(you.plan - them.plan) >= Math.abs(you.roam - them.roam)
        ? (you.plan >= them.plan ? 'You plan. They drift.' : 'They plan. You drift.')
        : (you.roam >= them.roam ? 'You want forty pandals. They want four.' : 'They want forty pandals. You want four.')
    case 'plate':
      if (close) return 'The same plates.'
      if (near) return 'You would agree on dinner.'
      return you.feast >= them.feast ? 'You eat. They forget to.' : 'They eat. You forget to.'
    case 'scene':
      if (close) return 'You would stop at the same things.'
      if (near) return 'Mostly the same stops.'
      return 'Different things make you stop.'
    case 'company':
      if (close) return 'The same kind of company.'
      if (near) return 'Close on company.'
      return you.squad >= them.squad ? 'Your table is for twelve. Theirs is for two.' : 'Their table is for twelve. Yours is for two.'
  }
}

export function pujoSync(you: Person, them: Person): Sync {
  const components = {} as Record<SyncComponent, number>
  const words = {} as Record<SyncComponent, string>
  for (const [key, { dims }] of Object.entries(SYNC_COMPONENTS) as [SyncComponent, { dims: DimensionId[] }][]) {
    components[key] = mutual(you, them, dims)
    words[key] = word(key, components[key], you.vector, them.vector)
  }
  return { match: mutual(you, them, ALL), components, words }
}
