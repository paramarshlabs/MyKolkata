import { track } from '@vercel/analytics'

/*
 * The Pujo Personality's analytics events (13-product-spec.md §24). Pseudonymous:
 * no names, no free text, no location, no share tokens. Everything stops once
 * someone says they are under 18; page views stay, as aggregate counts only.
 * Vercel records the event; Google Analytics does too, when it is configured.
 */

export type PujoEvent =
  | 'pujo_landing_viewed' | 'pujo_quiz_started' | 'pujo_question_answered' | 'pujo_question_back'
  | 'pujo_quiz_abandoned' | 'pujo_rapidfire_completed' | 'pujo_rapidfire_skipped'
  | 'pujo_tiebreaker_shown' | 'pujo_tiebreaker_answered' | 'pujo_result_revealed' | 'pujo_result_feedback'
  | 'pujo_lore_viewed' | 'pujo_dna_opened' | 'pujo_preferences_set' | 'pujo_age_band_set'
  | 'pujo_share_opened' | 'pujo_share_completed' | 'pujo_invite_created' | 'pujo_invite_opened'
  | 'pujo_compare_viewed' | 'pujo_guess_resolved' | 'pujo_rec_opened' | 'pujo_route_started'
  | 'pujo_signup_from_result' | 'pujo_retake_started' | 'pujo_data_deleted' | 'pujo_archetype_viewed'

type Value = string | number | boolean | null

let silenced = false

/* Called with true once the age answer is under 18, and on load if it was. */
export function silencePujoAnalytics(on: boolean) {
  silenced = on
}

export function trackPujo(event: PujoEvent, props: Record<string, Value> = {}) {
  if (silenced || typeof window === 'undefined') return
  try {
    track(event, props)
  } catch {
    /* analytics never breaks the quiz */
  }
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
  try {
    gtag?.('event', event, props)
  } catch {
    /* as above */
  }
}

/* Share links carry a result; page views record the route, not the result. */
export function redactPujoUrl(url: string): string {
  return url.replace(/\/pujo\/(you|guess)\/[A-Za-z0-9_-]+/, '/pujo/$1/[card]')
}
